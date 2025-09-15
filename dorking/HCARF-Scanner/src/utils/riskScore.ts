// src/utils/riskScore.ts
export function getRiskScore(type: string, confidence: number, entropy?: number): number {
  if (type.includes('AWS') || type.includes('Private Key')) return 5;
  if (type.includes('Password') && (entropy ?? 0) > 3.5) return 4;
  if (type.includes('Token') || type.includes('API')) return 4;
  if (type.includes('Debug') || type.includes('SMTP')) return 3;
  if (confidence < 50) return 2;
  return 1;
}
