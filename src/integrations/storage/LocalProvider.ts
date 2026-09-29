import { StorageProvider } from './StorageProvider.js';
import fs from 'fs/promises';
import path from 'path';

export class LocalProvider implements StorageProvider {
  private basePath = path.join(process.cwd(), 'uploads');

  constructor() {
    fs.mkdir(this.basePath, { recursive: true }).catch(console.error);
  }

  async upload(file: Buffer, filePath: string, mimetype: string): Promise<string> {
    const fullPath = path.join(this.basePath, filePath);
    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.writeFile(fullPath, file);
    return `/uploads/${filePath}`;
  }

  async delete(filePath: string): Promise<void> {
    const fullPath = path.join(this.basePath, filePath);
    await fs.unlink(fullPath).catch(() => {});
  }

  getUrl(filePath: string): string {
    return `/uploads/${filePath}`;
  }

  async getSignedUrl(filePath: string): Promise<string> {
    return this.getUrl(filePath); // Local provider doesn't support signed URLs typically
  }
}
