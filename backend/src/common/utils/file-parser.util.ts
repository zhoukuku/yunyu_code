import * as csv from 'csv-parse';
import { BadRequestException } from '@nestjs/common';

export interface ParsedAccount {
  username: string;
  account: string;
  name?: string;
  nickname?: string;
  userType?: number;
  role?: number;
  sex?: number;
}

export async function parseCSV(buffer: Buffer): Promise<ParsedAccount[]> {
  return new Promise((resolve, reject) => {
    const records: ParsedAccount[] = [];

    csv.parse(buffer, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    })
      .on('data', (row: Record<string, string>) => {
        records.push({
          username: row.username || row.username || row.user_name || row.user || '',
          account: row.account || row.id || row.userId || row.user_id || '',
          name: row.name || row.xingming || row.姓名 || undefined,
          nickname: row.nickname || row.nc || row.nickname || row.昵称 || undefined,
          userType: row.userType ? parseInt(row.userType, 10) : row.user_type ? parseInt(row.user_type, 10) : undefined,
          role: row.role ? parseInt(row.role, 10) : row.role_id ? parseInt(row.role_id, 10) : undefined,
          sex: row.sex ? parseInt(row.sex, 10) : undefined,
        });
      })
      .on('end', () => resolve(records))
      .on('error', (err) => reject(new BadRequestException(`CSV解析失败: ${err.message}`)));
  });
}

export async function parseExcel(buffer: Buffer): Promise<ParsedAccount[]> {
  // Basic XLSX detection - for full support, install xlsx package
  // This is a fallback that tries to detect common formats
  const header = buffer.slice(0, 8);
  const isXLS = [0xd0, 0xcf, 0x11, 0xe0].every((b, i) => header[i] === b);

  if (isXLS) {
    throw new BadRequestException('Excel格式暂不支持，请使用CSV格式');
  }

  // Try UTF-8 BOM and treat as CSV
  const content = buffer.toString('utf-8');
  const lines = content.split(/\r?\n/).filter((l) => l.trim());

  if (lines.length < 2) {
    throw new BadRequestException('文件内容为空或格式不正确');
  }

  const headers = lines[0].split(',').map((h) => h.trim().replace(/^["']|["']$/g, ''));
  const records: ParsedAccount[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map((v) => v.trim().replace(/^["']|["']$/g, ''));
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx] || '';
    });

    records.push({
      username: row.username || row.user_name || row.user || '',
      account: row.account || row.id || row.userId || row.user_id || '',
      name: row.name || row.姓名 || undefined,
      nickname: row.nickname || row.昵称 || undefined,
      userType: row.userType ? parseInt(row.userType, 10) : row.user_type ? parseInt(row.user_type, 10) : undefined,
      role: row.role ? parseInt(row.role, 10) : undefined,
      sex: row.sex ? parseInt(row.sex, 10) : undefined,
    });
  }

  return records;
}

export function detectFileType(filename: string): 'csv' | 'excel' | 'unknown' {
  const ext = filename.toLowerCase().split('.').pop() || '';
  if (ext === 'csv') return 'csv';
  if (['xlsx', 'xls'].includes(ext)) return 'excel';
  return 'unknown';
}