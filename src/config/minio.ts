import { Client } from 'minio';
import dotenv from 'dotenv';
dotenv.config();

export const minioClient = new Client({
  endPoint: process.env.MINIO_ENDPOINT!,
  port: parseInt(process.env.MINIO_PORT || '9000'),
  useSSL: process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ACCESS_KEY,
  secretKey: process.env.MINIO_SECRET_KEY ,
  region: process.env.MINIO_REGION,
});



export async function downloadFromMinIO(bucket: string, objectKey: string, inputPath: string): Promise<void> {
    await minioClient.fGetObject(bucket, objectKey, inputPath);
    console.log(`Downloaded ${bucket}/${objectKey} to ${inputPath}`);
}
  
export async function uploadHLSFilesToMinIO(bucket: string, objectKey: string, outputDir: string): Promise<void> {
    const fs: { promises: { readdir: (dir: string) => Promise<string[]> } } = require('fs');
    const path: { join: (...parts: string[]) => string } = require('path');
    const files: string[] = await fs.promises.readdir(outputDir);
    for (const file of files) {
        const filePath: string = path.join(outputDir, file);
        const objectName: string = `${objectKey.split('.')[0]}/${file}`;
        await minioClient.fPutObject(bucket, objectName, filePath);
    }
    console.log(`Uploaded HLS files to ${bucket}`);
}


 