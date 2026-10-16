import dotenv from 'dotenv';
dotenv.config();

export function myKey(): string {
  return process.env.CANVAS_API_KEY;
}

export default { myKey };
