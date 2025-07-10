// src/utils/secretRules.ts
export type SecretMatch = {
  type: string;
  regex: RegExp;
  severity: 'Low' | 'Medium' | 'High';
  getExplanation: (match: string) => string;
  getFix?: (match: string) => string;
};

export const secretRules: SecretMatch[] = [
  {
    type: 'Password Assignment',
    regex: /password\s*=\s*["'][^"']+["']/i,
    severity: 'High',
    getExplanation: () => 'Exposed passwords can grant unauthorized access.',
    getFix: () => 'Remove hardcoded passwords and use environment variables or a secrets manager.',
  },
  {
    type: 'Google API Key',
    regex: /AIza[0-9A-Za-z-_]{35}/,
    severity: 'High',
    getExplanation: () => 'Google API keys can be abused for quota theft or data exfiltration.',
    getFix: () => 'Regenerate the key and restrict usage to trusted domains.',
  },
  {
    type: 'OpenAI API Key',
    regex: /sk-[a-zA-Z0-9]{48}/,
    severity: 'High',
    getExplanation: () => 'OpenAI API keys can be used to run up costs or access your account.',
    getFix: () => 'Revoke and rotate the key immediately.',
  },
  {
    type: 'GitHub Token',
    regex: /ghp_[A-Za-z0-9]{36}/,
    severity: 'High',
    getExplanation: () => 'GitHub tokens can allow repository access and code modification.',
    getFix: () => 'Revoke the token and audit for unauthorized access.',
  },
  {
    type: 'JWT Token',
    regex: /eyJ[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+/,
    severity: 'High',
    getExplanation: () => 'JWTs can allow session hijacking if leaked.',
    getFix: () => 'Invalidate the token and investigate for unauthorized use.',
  },
  {
    type: 'AWS Secret Key',
    regex: /aws(.{0,20})?(secret)?(.{0,20})?['\"][0-9a-zA-Z/+]{40}['\"]/i,
    severity: 'High',
    getExplanation: () => 'AWS credentials can compromise cloud infrastructure.',
    getFix: () => 'Revoke the key and rotate credentials immediately.',
  },
  {
    type: 'Base64 Secret',
    regex: /\b([A-Za-z0-9+/]{40,}={0,2})\b/,
    severity: 'Medium',
    getExplanation: () => 'Long base64 strings may indicate encoded secrets.',
    getFix: () => 'Investigate the value and remove if sensitive.',
  },
  {
    type: 'Database Connection String',
    regex: /(mongodb|postgres|mysql|sqlserver):\/\/[^\s]+/i,
    severity: 'High',
    getExplanation: () => 'Database credentials can allow data theft or modification.',
    getFix: () => 'Rotate credentials and restrict network access.',
  },
  {
    type: 'SSH Private Key',
    regex: /-----BEGIN (RSA|DSA|EC|OPENSSH) PRIVATE KEY-----/,
    severity: 'High',
    getExplanation: () => 'Private keys allow unauthorized server access.',
    getFix: () => 'Remove the key and rotate all affected credentials.',
  },
  {
    type: 'OAuth Token',
    regex: /ya29\.[0-9A-Za-z\-_]+/,
    severity: 'High',
    getExplanation: () => 'OAuth tokens can be used to impersonate users.',
    getFix: () => 'Revoke the token and audit for abuse.',
  },
  {
    type: 'Firebase Config',
    regex: /apiKey:\s*['\"][A-Za-z0-9-_]{35}['\"]/,
    severity: 'Medium',
    getExplanation: () => 'Firebase config leaks can expose your backend to abuse.',
    getFix: () => 'Regenerate and restrict the config.',
  },
  {
    type: 'SMTP Credentials',
    regex: /(smtp|mail)\.[^\s]+:[0-9]+.*(user|username|login|pass|password)=['\"][^'\"]+['\"]/i,
    severity: 'Medium',
    getExplanation: () => 'SMTP credentials can be used to send spam or phish.',
    getFix: () => 'Rotate credentials and use environment variables.',
  },
  {
    type: 'DEBUG True in Production',
    regex: /debug\s*=\s*true/i,
    severity: 'Medium',
    getExplanation: () => 'Debug mode exposes sensitive error messages.',
    getFix: () => 'Set DEBUG to false in production.',
  },
  {
    type: 'Email + Password Combo',
    regex: /[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+:[^\s]+/,
    severity: 'High',
    getExplanation: () => 'Email/password combos can be used for credential stuffing.',
    getFix: () => 'Reset affected accounts and notify users.',
  },
  {
    type: 'Sensitive File Name',
    regex: /\.(env|htpasswd|secrets\.yml|config\.js|bak|backup\.sql|db\.dump)$/i,
    severity: 'High',
    getExplanation: () => 'Sensitive files may contain secrets or credentials.',
    getFix: () => 'Remove from public repositories and rotate any exposed secrets.',
  },
];
