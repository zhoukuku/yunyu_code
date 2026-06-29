import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { CodeExecution, CodeLanguage, ExecutionStatus } from '../entities/code-execution.entity';

const EXECUTION_TIMEOUT = 30000; // 30 seconds max execution time
const MAX_OUTPUT_LENGTH = 100000; // Max 100KB of output
const MAX_CONCURRENT_EXECUTIONS = 5;

// In-memory execution queue
let currentExecutions = 0;
const executionQueue: Array<() => void> = [];

@Injectable()
export class CodeExecutionService {
  private readonly logger = new Logger(CodeExecutionService.name);

  constructor(
    @InjectRepository(CodeExecution)
    private codeExecutionRepository: Repository<CodeExecution>,
  ) {}

  private async acquireExecutionSlot(): Promise<void> {
    if (currentExecutions < MAX_CONCURRENT_EXECUTIONS) {
      currentExecutions++;
      return;
    }

    return new Promise((resolve) => {
      executionQueue.push(() => {
        currentExecutions++;
        resolve();
      });
    });
  }

  private releaseExecutionSlot(): void {
    currentExecutions--;
    const next = executionQueue.shift();
    if (next) {
      next();
    }
  }

  private cleanupTempFile(filePath: string): void {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (e) {
      this.logger.warn(`Failed to cleanup temp file: ${filePath}`);
    }
  }

  private getTempDir(): string {
    const tempDir = path.join(process.cwd(), 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    return tempDir;
  }

  async createExecution(data: {
    userId?: number;
    language: CodeLanguage;
    code: string;
    projectId?: number;
  }): Promise<CodeExecution> {
    // Validate code length
    if (!data.code || data.code.length > 50000) {
      throw new Error('Code exceeds maximum length of 50000 characters');
    }

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
    limit?: number;
  }): Promise<CodeExecution[]> {
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
    if (filters?.limit) {
      query.take(filters.limit);
    }

    query.orderBy('execution.createdAt', 'DESC');
    return query.getMany();
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

    // Wait for execution slot
    await this.acquireExecutionSlot();

    const startTime = Date.now();
    try {
      // Update status to running
      await this.updateExecution(id, { status: ExecutionStatus.RUNNING });

      let output = '';
      let errorMessage = '';
      let status = ExecutionStatus.SUCCESS;

      switch (execution.language) {
        case CodeLanguage.PYTHON:
          const pythonResult = await this.executePython(execution.code);
          output = pythonResult.output;
          errorMessage = pythonResult.errorMessage;
          status = pythonResult.errorMessage ? ExecutionStatus.ERROR : ExecutionStatus.SUCCESS;
          break;

        case CodeLanguage.CPP:
          const cppResult = await this.executeCpp(execution.code);
          output = cppResult.output;
          errorMessage = cppResult.errorMessage;
          status = cppResult.errorMessage ? ExecutionStatus.ERROR : ExecutionStatus.SUCCESS;
          break;

        case CodeLanguage.JAVASCRIPT:
          const jsResult = await this.executeJavaScript(execution.code);
          output = jsResult.output;
          errorMessage = jsResult.errorMessage;
          status = jsResult.errorMessage ? ExecutionStatus.ERROR : ExecutionStatus.SUCCESS;
          break;

        default:
          errorMessage = `Unsupported language: ${execution.language}`;
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
        errorMessage: error instanceof Error ? error.message : 'Execution failed',
        status: ExecutionStatus.ERROR,
        executionTime,
      });
    } finally {
      this.releaseExecutionSlot();
    }
  }

  private async executePython(code: string): Promise<{ output: string; errorMessage: string }> {
    const tempDir = this.getTempDir();
    const tempFile = path.join(tempDir, `python_${Date.now()}_${Math.random().toString(36).substring(7)}.py`);

    try {
      fs.writeFileSync(tempFile, code, 'utf-8');

      return new Promise((resolve) => {
        const output: string[] = [];
        const errors: string[] = [];

        // Detect Python interpreter
        const pythonCmd = this.detectPython();

        if (!pythonCmd) {
          resolve({
            output: '',
            errorMessage: 'Python interpreter not found. Please install Python 3 and add it to PATH.',
          });
          return;
        }

        const child = spawn(pythonCmd, ['-u', tempFile], {
          shell: true,
          env: { ...process.env, PYTHONUNBUFFERED: '1' },
          windowsHide: true,
        });

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
          this.cleanupTempFile(tempFile);

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
          this.cleanupTempFile(tempFile);

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
    } catch (error) {
      this.cleanupTempFile(tempFile);
      return {
        output: '',
        errorMessage: `Failed to write temp file: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  private detectPython(): string | null {
    const pythonPaths = [
      'python',
      'python3',
      'py',
      'C:\\Python311\\python.exe',
      'C:\\Python310\\python.exe',
      'C:\\Python39\\python.exe',
      'C:\\Python38\\python.exe',
      '/usr/bin/python3',
      '/usr/bin/python',
    ];

    for (const p of pythonPaths) {
      try {
        const result = spawn(p, ['--version'], { shell: true, windowsHide: true });
        // Sync check isn't ideal but works for detection
        const { code } = require('child_process').spawnSync(p, ['--version'], { shell: true });
        if (code === 0) {
          return p;
        }
      } catch {
        // Continue to next path
      }
    }
    return null;
  }

  private async executeJavaScript(code: string): Promise<{ output: string; errorMessage: string }> {
    const tempDir = this.getTempDir();
    const tempFile = path.join(tempDir, `js_${Date.now()}_${Math.random().toString(36).substring(7)}.js`);

    try {
      fs.writeFileSync(tempFile, code, 'utf-8');

      return new Promise((resolve) => {
        const output: string[] = [];
        const errors: string[] = [];

        // Try node first, then deno, then bun
        const jsCmd = this.detectJavaScriptRuntime();
        let cmd: string;
        let args: string[];

        if (!jsCmd) {
          resolve({
            output: '',
            errorMessage: 'No JavaScript runtime found. Please install Node.js, Deno, or Bun.',
          });
          return;
        } else if (jsCmd === 'node') {
          cmd = 'node';
          args = [tempFile];
        } else if (jsCmd === 'deno') {
          cmd = 'deno';
          args = ['run', '--allow-all', tempFile];
        } else {
          cmd = 'bun';
          args = [tempFile];
        }

        const child = spawn(cmd, args, {
          shell: true,
          env: process.env,
          windowsHide: true,
        });

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
          this.cleanupTempFile(tempFile);

          if (code === 0) {
            resolve({
              output: output.join(''),
              errorMessage: '',
            });
          } else {
            resolve({
              output: output.join(''),
              errorMessage: errors.join('') || `JavaScript exited with code ${code}`,
            });
          }
        });

        child.on('error', (error) => {
          clearTimeout(timeoutId);
          this.cleanupTempFile(tempFile);

          if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
            resolve({
              output: '',
              errorMessage: 'JavaScript runtime not found. Please install Node.js.',
            });
          } else {
            resolve({
              output: '',
              errorMessage: `JavaScript execution error: ${error.message}`,
            });
          }
        });
      });
    } catch (error) {
      this.cleanupTempFile(tempFile);
      return {
        output: '',
        errorMessage: `Failed to write temp file: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  private detectJavaScriptRuntime(): string | null {
    // Check Node.js first
    try {
      const nodeResult = spawn('node', ['--version'], { shell: true, windowsHide: true });
      if (nodeResult.pid) {
        return 'node';
      }
    } catch {
      // Try next
    }

    // Check Deno
    try {
      const denoResult = spawn('deno', ['--version'], { shell: true, windowsHide: true });
      if (denoResult.pid) {
        return 'deno';
      }
    } catch {
      // Try next
    }

    // Check Bun
    try {
      const bunResult = spawn('bun', ['--version'], { shell: true, windowsHide: true });
      if (bunResult.pid) {
        return 'bun';
      }
    } catch {
      // Not found
    }

    return null;
  }

  private async executeCpp(code: string): Promise<{ output: string; errorMessage: string }> {
    const compilerPaths = [
      { cmd: 'g++', args: ['--version'], name: 'g++' },
      { cmd: 'clang++', args: ['--version'], name: 'clang++' },
      { cmd: 'c++', args: ['--version'], name: 'c++' },
    ];

    let foundCompiler: string | null = null;

    for (const compiler of compilerPaths) {
      try {
        const result = await this.runCommand(compiler.cmd, compiler.args, '', 5000);
        if (result.exitCode === 0) {
          foundCompiler = compiler.cmd;
          break;
        }
      } catch {
        // Continue
      }
    }

    if (!foundCompiler) {
      return {
        output: '',
        errorMessage: 'No C++ compiler found. Please install MinGW-w64 (g++) or Visual Studio with C++ workload.',
      };
    }

    return this.compileAndRunCpp(code, foundCompiler);
  }

  private async compileAndRunCpp(
    code: string,
    compilerCmd: string,
  ): Promise<{ output: string; errorMessage: string }> {
    const tempDir = this.getTempDir();
    const id = `${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const sourceFile = path.join(tempDir, `cpp_${id}.cpp`);
    const exeFile = path.join(tempDir, `cpp_${id}.exe`);

    try {
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
        this.cleanupTempFile(sourceFile);
        return {
          output: '',
          errorMessage: `Compilation failed:\n${compileResult.stderr || compileResult.stdout}`,
        };
      }

      // Run
      const runResult = await this.runCommand(exeFile, [], '', EXECUTION_TIMEOUT);

      this.cleanupTempFile(sourceFile);
      this.cleanupTempFile(exeFile);

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
      this.cleanupTempFile(sourceFile);
      this.cleanupTempFile(exeFile);

      return {
        output: '',
        errorMessage: `C++ execution error: ${error instanceof Error ? error.message : 'Unknown error'}`,
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
        shell: true,
        windowsHide: true,
      });

      if (stdin && child.stdin) {
        try {
          child.stdin.write(stdin);
          child.stdin.end();
        } catch (e) {
          this.logger.warn('Failed to write to stdin');
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
          stdout: stdout.join(''),
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

    const executions = await query.getMany();

    const total = executions.length;
    const success = executions.filter(e => e.status === ExecutionStatus.SUCCESS).length;
    const error = executions.filter(e => e.status === ExecutionStatus.ERROR).length;
    const avgExecutionTime = total > 0
      ? executions.reduce((sum, e) => sum + (e.executionTime || 0), 0) / total
      : 0;

    return {
      total,
      success,
      error,
      avgExecutionTime: Math.round(avgExecutionTime * 100) / 100,
    };
  }

  // Clean up old execution records and temp files
  async cleanup(olderThanDays: number = 7): Promise<{ deletedRecords: number; cleanedFiles: number }> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    // Delete old execution records
    const result = await this.codeExecutionRepository
      .createQueryBuilder()
      .delete()
      .where('createdAt < :cutoffDate', { cutoffDate })
      .execute();

    // Clean temp files
    const tempDir = this.getTempDir();
    let cleanedFiles = 0;

    try {
      const files = fs.readdirSync(tempDir);
      const now = Date.now();
      const maxAge = olderThanDays * 24 * 60 * 60 * 1000;

      for (const file of files) {
        const filePath = path.join(tempDir, file);
        const stats = fs.statSync(filePath);
        if (now - stats.mtimeMs > maxAge) {
          this.cleanupTempFile(filePath);
          cleanedFiles++;
        }
      }
    } catch {
      // Ignore cleanup errors
    }

    return {
      deletedRecords: result.affected || 0,
      cleanedFiles,
    };
  }
}