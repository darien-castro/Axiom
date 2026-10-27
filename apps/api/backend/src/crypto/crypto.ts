import { createHash } from 'node:crypto';
import dotenv from 'dotenv';

dotenv.config();

const secretKey: string | undefined = process.env.HASH_KEY;

export function sha256(content: string | number | Buffer): Buffer {
  return createHash('sha256').update(String(content)).digest();
}

if (!process.env.ENCRYPTION_KEY) {
    throw new Error('ENCRYPTION_KEY environment variable is required');
}
const ENCRYPTION_KEY: Buffer = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');

    const iv: Buffer = crypto.randomBytes(12); 
    
    const cipher: crypto.CipherGCM = crypto.createCipheriv('aes-256-gcm', ENCRYPTION_KEY, iv);
    
    let encrypted: string = cipher.update(userId, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag: Buffer = cipher.getAuthTag();
    
    return {
        iv: iv.toString('hex'),
        ciphertext: encrypted,
        authTag: authTag.toString('hex')
    };
}

// 3. Strongly typed decryption function
export function decryptUserId(encryptedData: EncryptedUserId): string {
    const decipher: crypto.DecipherGCM = crypto.createDecipheriv(
        'aes-256-gcm', 
        ENCRYPTION_KEY, 
        Buffer.from(encryptedData.iv, 'hex')
    );
    
    decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));
    
    let decrypted: string = decipher.update(encryptedData.ciphertext, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
}