export interface StorageProvider {
  upload(file: Buffer, path: string, mimetype: string): Promise<string>;
  delete(path: string): Promise<void>;
  getUrl(path: string): string;
  getSignedUrl(path: string, expiresInSeconds?: number): Promise<string>;
}
