import { createHash } from 'node:crypto';
import dotenv from 'dotenv';

dotenv.config();

const secretKey: string | undefined = process.env.HASH_KEY;

export function sha256(content: string | number | Buffer): Buffer {
  return createHash('sha256').update(String(content)).digest();
}

export default { sha256 };
