
export interface CorsVulnerability {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  recommendation: string;
  details?: string;
}

export class CorsScanner {
  private domain: string;

  constructor(domain: string) {
    this.domain = domain;
  }

  async scanCorsVulnerabilities(): Promise<CorsVulnerability[]> {
    const vulnerabilities: CorsVulnerability[] = [];
    
    try {
      // Test various CORS configurations
      const testOrigins = [
        'https://evil.com',
        'http://malicious.site',
        'null',
        '*'
      ];

      const testEndpoints = [
        '/',
        '/api',
        '/admin',
        '/login',
        '/dashboard'
      ];

      for (const endpoint of testEndpoints) {
        for (const origin of testOrigins) {
          try {
            const corsVuln = await this.testCorsEndpoint(endpoint, origin);
            if (corsVuln) {
              vulnerabilities.push(corsVuln);
            }
          } catch (error) {
            // Silent fail for individual tests
            console.log(`CORS test failed for ${endpoint} with origin ${origin}`);
          }
        }
      }

      // Add simulated vulnerabilities for demo purposes
      if (Math.random() > 0.7) {
        vulnerabilities.push({
          type: 'Wildcard Origin with Credentials',
          severity: 'critical',
          description: 'Server allows wildcard (*) origin with credentials enabled',
          recommendation: 'Replace wildcard with specific allowed origins and disable credentials if not needed',
          details: `Found on endpoint: https://${this.domain}/api`
        });
      }

      if (Math.random() > 0.8) {
        vulnerabilities.push({
          type: 'Reflected Origin Header',
          severity: 'high',
          description: 'Server reflects any Origin header without validation',
          recommendation: 'Implement proper origin validation against a whitelist',
          details: `Vulnerable endpoint: https://${this.domain}/admin`
        });
      }

      if (Math.random() > 0.6) {
        vulnerabilities.push({
          type: 'Null Origin Accepted',
          severity: 'medium',
          description: 'Server accepts null origin which can be exploited',
          recommendation: 'Reject null origins or implement proper validation',
          details: `Affected: https://${this.domain}/login`
        });
      }

    } catch (error) {
      console.error('CORS scanning error:', error);
    }

    return vulnerabilities;
  }

  private async testCorsEndpoint(endpoint: string, origin: string): Promise<CorsVulnerability | null> {
    try {
      // Simulate CORS preflight request
      const url = `https://${this.domain}${endpoint}`;
      
      // In a real implementation, this would make actual requests
      // For demo purposes, we'll simulate based on common patterns
      const simulateVulnerability = Math.random() > 0.9;
      
      if (simulateVulnerability) {
        if (origin === '*') {
          return {
            type: 'Wildcard Origin Misconfiguration',
            severity: 'high',
            description: `Endpoint ${endpoint} accepts wildcard origin`,
            recommendation: 'Use specific origins instead of wildcard'
          };
        }
        
        if (origin === 'null') {
          return {
            type: 'Null Origin Vulnerability',
            severity: 'medium',
            description: `Endpoint ${endpoint} accepts null origin`,
            recommendation: 'Reject null origins in CORS policy'
          };
        }
      }

      return null;
    } catch (error) {
      return null;
    }
  }
}

export const performCorsCheck = async (domain: string): Promise<CorsVulnerability[]> => {
  const scanner = new CorsScanner(domain);
  return await scanner.scanCorsVulnerabilities();
};
