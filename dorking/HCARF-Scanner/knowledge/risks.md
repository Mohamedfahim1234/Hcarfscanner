# Dorking Knowledge Base: Common Leak Risks

## Passwords
- **Why risky:** Exposed passwords can grant unauthorized access to systems, databases, or user accounts.
- **What to do:** Remove from code, rotate credentials, and use a secrets manager.

## API Keys
- **Why risky:** API keys can be used to abuse your services, run up costs, or exfiltrate data.
- **What to do:** Revoke and rotate keys, restrict usage to trusted domains.

## AWS/GCP/Azure Keys
- **Why risky:** Cloud provider keys can allow attackers to control infrastructure, steal data, or incur costs.
- **What to do:** Revoke immediately, audit for abuse, and rotate credentials.

## Database Connection Strings
- **Why risky:** Exposes database access, risking data theft or modification.
- **What to do:** Rotate credentials, restrict network access, and never commit to public repos.

## Private Keys
- **Why risky:** SSH or JWT private keys allow unauthorized server or session access.
- **What to do:** Remove from code, rotate keys, and audit for unauthorized use.

## Debug/Production Configs
- **Why risky:** Debug mode or production secrets in public can expose sensitive info or enable attacks.
- **What to do:** Set debug to false, keep secrets out of public code.

## Email/Password Combos
- **Why risky:** Can be used for credential stuffing or account takeover.
- **What to do:** Reset affected accounts, notify users, and enforce strong password policies.

---

For more, see: https://owasp.org/www-project-top-ten/
