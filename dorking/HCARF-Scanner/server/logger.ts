// server/logger.ts
import fs from 'fs';

export function logScan({ user, domain, findings, time }: { user: string, domain: string, findings: any[], time: string }) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    user,
    domain,
    findings: findings.length,
    time
  };
  fs.appendFileSync('scan_audit.log', JSON.stringify(logEntry) + '\n');
}

export function blockIfAbuse(user: { isOwner: boolean }, domains: string[]) {
  if (domains.length > 3 && !user.isOwner) throw new Error('Abuse detected');
}
