// src/utils/secretScanner.ts
import { secretRules, SecretMatch } from './secretRules';

export type ScanFinding = {
  url: string;
  file: string;
  line: number;
  match: string;
  type: string;
  severity: string;
  explanation: string;
  fix?: string;
  confidence: number; // 0-100
  snippet: string;
};

export function scanContent({
  url,
  file,
  content,
}: { url: string; file: string; content: string }) : ScanFinding[] {
  const findings: ScanFinding[] = [];
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    for (const rule of secretRules) {
      const match = rule.regex.exec(line);
      if (match) {
        // Heuristic: If in comment, lower confidence
        const isComment = /^\s*(#|\/\/|\/\*|\*|<!--)/.test(line);
        const isConfigFile = /\.(env|json|ya?ml|ini|conf|config|settings\.py)$/i.test(file);
        let confidence = 80;
        if (isComment) confidence = 40;
        if (isConfigFile) confidence = 95;
        if (rule.type === 'Sensitive File Name') confidence = 99;

        findings.push({
          url,
          file,
          line: idx + 1,
          match: match[0],
          type: rule.type,
          severity: rule.severity,
          explanation: rule.getExplanation(match[0]),
          fix: rule.getFix ? rule.getFix(match[0]) : undefined,
          confidence,
          snippet: line.trim().slice(0, 200),
        });
      }
    }
  });
  return findings;
}
