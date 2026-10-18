import dotenv from 'dotenv';
dotenv.config();
export function myKey(): string {
  const apiKey = process.env.CANVAS_API_KEY;
  if (!apiKey) {
    throw new Error("Environment variable of APIKEY is missing or undefined")
  }
  return apiKey;
}

export default { myKey };
