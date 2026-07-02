import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { CodeExecution, CodeLanguage, ExecutionStatus } from '../entities/code-execution.entity';

const EXECUTION_TIMEOUT = 30000; // 30 seconds max execution time
const MAX_OUTPUT_LENGTH = 100000; // Max 100KB of output

@Injectable()
export class CodeExecutionService {
  constructor(
    @InjectRepository(CodeExecution)
    private codeExecutionRepository: Repository<CodeExecution>,
  ) {}

  async createExecution(data: {
    userId?: number;
    language: CodeLanguage;
    code: string;
    projectId?: number;
  }): Promise<CodeExecution> {
    const execution = this.codeExecutionRepository.create({
      ...data,
      status: ExecutionStatus.PENDING,
    });
    return this.codeExecutionRepository.save(execution);
  }

  async findAll(filters?: {
    userId?: number;
    language?: CodeLanguage;
    status?: ExecutionStatus;
    page?: number;
    pageSize?: number;
  }): Promise<{ records: CodeExecution[]; total: number; current: number; size: number; pages: number }> {
    const query = this.codeExecutionRepository.createQueryBuilder('execution');

    if (filters?.userId) {
      query.andWhere('execution.userId = :userId', { userId: filters.userId });
    }
    if (filters?.language) {
      query.andWhere('execution.language = :language', { language: filters.language });
    }
    if (filters?.status !== undefined && filters.status !== null) {
      query.andWhere('execution.status = :status', { status: filters.status });
    }

    query.orderBy('execution.createdAt', 'DESC');

    const page = filters?.page || 1;
    const pageSize = filters?.pageSize || 20;
    query.skip((page - 1) * pageSize).take(pageSize);

    const [records, total] = await query.getManyAndCount();
    return {
      records,
      total,
      current: page,
      size: pageSize,
      pages: Math.ceil(total / pageSize),
    };
  }

  async findOne(id: number): Promise<CodeExecution | null> {
    return this.codeExecutionRepository.findOne({ where: { id } });
  }

  async updateExecution(id: number, data: Partial<{
    output: string;
    errorMessage: string;
    status: ExecutionStatus;
    executionTime: number;
  }>): Promise<CodeExecution | null> {
    await this.codeExecutionRepository.update(id, data);
    return this.findOne(id);
  }

  async deleteExecution(id: number): Promise<void> {
    await this.codeExecutionRepository.delete(id);
  }

  async executeCode(id: number): Promise<CodeExecution | null> {
    const execution = await this.findOne(id);
    if (!execution) return null;

    // Update status to running
    await this.updateExecution(id, { status: ExecutionStatus.RUNNING });

    const startTime = Date.now();

    try {
      let output = '';
      let errorMessage = '';
      let status = ExecutionStatus.SUCCESS;

      if (execution.language === CodeLanguage.PYTHON) {
        const result = await this.executePython(execution.code);
        output = result.output;
        errorMessage = result.errorMessage;
        status = result.errorMessage ? ExecutionStatus.ERROR : ExecutionStatus.SUCCESS;
      } else if (execution.language === CodeLanguage.CPP) {
        const result = await this.executeCpp(execution.code);
        output = result.output;
        errorMessage = result.errorMessage;
        status = result.errorMessage ? ExecutionStatus.ERROR : ExecutionStatus.SUCCESS;
      } else {
        errorMessage = 'Unsupported language';
        status = ExecutionStatus.ERROR;
      }

      const executionTime = Date.now() - startTime;

      return this.updateExecution(id, {
        output,
        errorMessage,
        status,
        executionTime,
      });
    } catch (error) {
      const executionTime = Date.now() - startTime;
      return this.updateExecution(id, {
        errorMessage: error.message || 'Execution failed',
        status: ExecutionStatus.ERROR,
        executionTime,
      });
    }
  }

  private async executePython(code: string): Promise<{ output: string; errorMessage: string }> {
    return new Promise((resolve) => {
      const output: string[] = [];
      const errors: string[] = [];

      // Try common Python paths on Windows and Unix
      const pythonPaths = [
        'python',
        'python3',
        'C:\\Python311\\python.exe',
        'C:\\Python310\\python.exe',
        'C:\\Python39\\python.exe',
        '/usr/bin/python3',
        '/usr/bin/python',
      ];

      let pythonCmd = 'python';

      // For Windows, we need to handle paths differently
      const effectiveCmd = pythonCmd.includes(' ') && !pythonCmd.startsWith('/')
        ? `"${pythonCmd}"`
        : pythonCmd;

      const child = spawn('python', ['-u', '-c', code], {
        shell: false,
        env: { ...process.env, PYTHONUNBUFFERED: '1' },
        windowsHide: true,
      });

      // Set up timeout
      const timeoutId = setTimeout(() => {
        child.kill('SIGTERM');
        setTimeout(() => {
          if (!child.killed) {
            child.kill('SIGKILL');
          }
        }, 5000);
      }, EXECUTION_TIMEOUT);

      child.stdout.on('data', (data) => {
        const text = data.toString();
        if (output.join('').length + text.length < MAX_OUTPUT_LENGTH) {
          output.push(text);
        }
      });

      child.stderr.on('data', (data) => {
        const text = data.toString();
        if (errors.join('').length + text.length < MAX_OUTPUT_LENGTH) {
          errors.push(text);
        }
      });

      child.on('close', (code) => {
        clearTimeout(timeoutId);
        if (code === 0) {
          resolve({
            output: output.join(''),
            errorMessage: '',
          });
        } else {
          resolve({
            output: output.join(''),
            errorMessage: errors.join('') || `Python exited with code ${code}`,
          });
        }
      });

      child.on('error', (error) => {
        clearTimeout(timeoutId);
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
          resolve({
            output: '',
            errorMessage: 'Python interpreter not found. Please install Python 3.',
          });
        } else {
          resolve({
            output: '',
            errorMessage: `Python execution error: ${error.message}`,
          });
        }
      });
    });
  }

  private async executeCpp(code: string): Promise<{ output: string; errorMessage: string }> {
    // Check for available C++ compilers
    const compilerPaths = [
      { cmd: 'g++', args: ['--version'], name: 'g++' },
      { cmd: 'clang++', args: ['--version'], name: 'clang++' },
      { cmd: 'c++', args: ['--version'], name: 'c++' },
    ];

    let foundCompiler: string | null = null;
    let compilerName = '';

    for (const compiler of compilerPaths) {
      try {
        const result = await this.runCommand(compiler.cmd, compiler.args, '', 5000);
        if (result.exitCode === 0) {
          foundCompiler = compiler.cmd;
          compilerName = compiler.name;
          break;
        }
      } catch {
        // Compiler not found at this path
      }
    }

    if (!foundCompiler) {
      return {
        output: '',
        errorMessage: 'No C++ compiler found. Available options:\n' +
          '1. Install MinGW-w64 (g++) and add to PATH\n' +
          '2. Install Visual Studio with C++ workload\n' +
          '3. Install Clang for Windows\n' +
          '4. Use a cloud-based code execution service like Judge0\n\n' +
          'To install g++ via winget: winget install GCC.MinGW\n' +
          'Then restart the backend server.',
      };
    }

    // Compiler found - proceed with compilation and execution
    return this.compileAndRunCpp(code, foundCompiler);
  }

  private async compileAndRunCpp(
    code: string,
    compilerCmd: string,
  ): Promise<{ output: string; errorMessage: string }> {
    const tempDir = path.join(process.cwd(), 'temp');
    const sourceFile = path.join(tempDir, `temp_${Date.now()}.cpp`);
    const exeFile = path.join(tempDir, `temp_${Date.now()}.exe`);

    // Ensure temp directory exists
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    try {
      // Write source file
      fs.writeFileSync(sourceFile, code, 'utf-8');

      // Compile
      const compileResult = await this.runCommand(
        compilerCmd,
        [
          sourceFile,
          '-o',
          exeFile,
          '-std=c++17',
          '-O2',
          '-Wall',
          '-Wextra',
        ],
        '',
        EXECUTION_TIMEOUT,
      );

      if (compileResult.exitCode !== 0) {
        return {
          output: '',
          errorMessage: `Compilation failed:\n${compileResult.stderr || compileResult.stdout}`,
        };
      }

      // Run the compiled executable
      const runResult = await this.runCommand(exeFile, [], '', EXECUTION_TIMEOUT);

      // Clean up files
      try {
        fs.unlinkSync(sourceFile);
        fs.unlinkSync(exeFile);
      } catch {
        // Ignore cleanup errors
      }

      if (runResult.exitCode !== 0) {
        return {
          output: runResult.stdout,
          errorMessage: runResult.stderr || `Program exited with code ${runResult.exitCode}`,
        };
      }

      return {
        output: runResult.stdout,
        errorMessage: '',
      };
    } catch (error) {
      // Clean up on error
      try {
        if (fs.existsSync(sourceFile)) fs.unlinkSync(sourceFile);
        if (fs.existsSync(exeFile)) fs.unlinkSync(exeFile);
      } catch {
        // Ignore
      }

      return {
        output: '',
        errorMessage: `C++ execution error: ${error.message}`,
      };
    }
  }

  private runCommand(
    cmd: string,
    args: string[],
    stdin: string,
    timeout: number,
  ): Promise<{ stdout: string; stderr: string; exitCode: number }> {
    return new Promise((resolve) => {
      const stdout: string[] = [];
      const stderr: string[] = [];

      const child = spawn(cmd, args, {
        shell: false,
        windowsHide: true,
      });

      if (stdin && child.stdin) {
        try {
          child.stdin.write(stdin);
          child.stdin.end();
        } catch (e) {
          console.error('写入 stdin 失败:', e);
        }
      }

      child.stdout.on('data', (data) => {
        const text = data.toString();
        if (stdout.join('').length + text.length < MAX_OUTPUT_LENGTH) {
          stdout.push(text);
        }
      });

      child.stderr.on('data', (data) => {
        const text = data.toString();
        if (stderr.join('').length + text.length < MAX_OUTPUT_LENGTH) {
          stderr.push(text);
        }
      });

      child.on('close', (code) => {
        resolve({
          stdout: stdout.join(''),
          stderr: stderr.join(''),
          exitCode: code ?? 0,
        });
      });

      child.on('error', (error) => {
        resolve({
          stdout: '',
          stderr: error.message,
          exitCode: 1,
        });
      });
    });
  }

  async getExecutionStats(userId?: number): Promise<{
    total: number;
    success: number;
    error: number;
    avgExecutionTime: number;
  }> {
    const query = this.codeExecutionRepository.createQueryBuilder('execution');

    if (userId) {
      query.andWhere('execution.userId = :userId', { userId });
    }

    // Use SQL aggregation to avoid loading all rows into memory
    const stats = await query
      .select('COUNT(*)', 'total')
      .addSelect('SUM(CASE WHEN execution.status = :success THEN 1 ELSE 0 END)', 'success')
      .addSelect('SUM(CASE WHEN execution.status = :error THEN 1 ELSE 0 END)', 'error')
      .addSelect('AVG(execution.executionTime)', 'avgExecutionTime')
      .setParameter('success', ExecutionStatus.SUCCESS)
      .setParameter('error', ExecutionStatus.ERROR)
      .getRawOne();

    const total = parseInt(stats.total, 10) || 0;
    const success = parseInt(stats.success, 10) || 0;
    const error = parseInt(stats.error, 10) || 0;
    const avgExecutionTime = stats.avgExecutionTime
      ? Math.round(parseFloat(stats.avgExecutionTime) * 100) / 100
      : 0;

    return { total, success, error, avgExecutionTime };
  }
}