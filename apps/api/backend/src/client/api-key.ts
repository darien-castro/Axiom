export function myKey(): string {
  return process.env.CANVAS_API_KEY || 'REMOVED';
}

export default { myKey };
