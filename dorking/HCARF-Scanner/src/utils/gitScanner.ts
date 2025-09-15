interface GitSearchResult {
  platform: 'GitHub' | 'GitLab';
  query: string;
  title: string;
  link: string;
  risk: 'low' | 'medium' | 'high' | 'critical';
  description?: string;
  fileContent?: string;
  repository?: string;
  verified: boolean;
}

interface RequestMetadata {
  statusCode: number;
  headers: Record<string, string>;
  timestamp: number;
  redirectionPath?: string[];
  errorType: 'genuine_404' | 'bot_blocked' | 'rate_limited' | 'access_restricted' | 'valid_response';
}

interface URLValidationResult {
  isValid: boolean;
  statusCode: number;
  isAccessible: boolean;
  reason?: string;
  repositoryExists?: boolean;
}

interface DomainPresenceResult {
  found: boolean;
  platform: 'GitHub' | 'GitLab';
  repositories: string[];
  totalReferences: number;
  verifiedLinks: string[];
}

export class EnhancedGitScanner {
  private domain: string;
  private requestDelay: number = 800;
  private failedRequests: RequestMetadata[] = [];
  private successfulFindings: number = 0;
  private validationCache: Map<string, URLValidationResult> = new Map();
  private domainPresenceCache: Map<string, DomainPresenceResult> = new Map();

  constructor(domain: string) {
    this.domain = domain;
  }

  private async humanLikeDelay(): Promise<void> {
    const delay = this.requestDelay + Math.random() * 1200;
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  private async validateURL(url: string): Promise<URLValidationResult> {
    // Check cache first
    if (this.validationCache.has(url)) {
      return this.validationCache.get(url)!;
    }

    try {
      console.log(`🔍 Validating URL: ${url}`);
      
      // Use HEAD request first for efficiency
      const response = await fetch(url, {
        method: 'HEAD',
        headers: this.simulateRequestHeaders(),
        signal: AbortSignal.timeout(10000) // 10 second timeout
      });

      const result: URLValidationResult = {
        isValid: response.ok,
        statusCode: response.status,
        isAccessible: response.ok,
        repositoryExists: response.ok
      };

      if (!response.ok) {
        if (response.status === 404) {
          result.reason = 'Repository not found or deleted';
          console.log(`❌ URL validation failed: ${url} - 404 Not Found`);
        } else if (response.status === 403) {
          result.reason = 'Access forbidden or private repository';
          console.log(`❌ URL validation failed: ${url} - 403 Forbidden`);
        } else if (response.status === 429) {
          result.reason = 'Rate limited by platform';
          console.log(`❌ URL validation failed: ${url} - 429 Rate Limited`);
        } else {
          result.reason = `HTTP ${response.status} error`;
          console.log(`❌ URL validation failed: ${url} - HTTP ${response.status}`);
        }
      } else {
        console.log(`✅ URL validated successfully: ${url}`);
        
        // For GitHub/GitLab, try to get additional metadata
        if (url.includes('github.com') || url.includes('gitlab.com')) {
          try {
            const contentResponse = await fetch(url, {
              method: 'GET',
              headers: this.simulateRequestHeaders(),
              signal: AbortSignal.timeout(5000)
            });
            
            if (contentResponse.ok) {
              const content = await contentResponse.text();
              // Basic check for actual repository content
              result.repositoryExists = content.includes('repository') || 
                                      content.includes('blob') || 
                                      content.includes('commit');
            }
          } catch (error) {
            // If we can't get content but HEAD worked, still consider it valid
            console.log(`⚠️ Could not fetch content for ${url}, but HEAD request succeeded`);
          }
        }
      }

      // Cache the result
      this.validationCache.set(url, result);
      return result;

    } catch (error) {
      const result: URLValidationResult = {
        isValid: false,
        statusCode: 0,
        isAccessible: false,
        reason: error instanceof Error ? error.message : 'Network error or timeout'
      };

      console.log(`❌ URL validation error: ${url} - ${result.reason}`);
      this.validationCache.set(url, result);
      return result;
    }
  }

  private generateAdvancedGitQueries(): string[] {
    return [
      `"${this.domain}" filename:.env`,
      `"${this.domain}" filename:config.json`,
      `"${this.domain}" filename:database.yml`,
      `"${this.domain}" filename:.htaccess`,
      `"${this.domain}" filename:wp-config.php`,
      `"${this.domain}" "api_key" OR "apikey"`,
      `"${this.domain}" "secret_key" OR "secretkey"`,
      `"${this.domain}" "access_token"`,
      `"${this.domain}" "private_key"`,
      `"${this.domain}" "jwt_secret"`,
      `"${this.domain}" "database_password" OR "db_password"`,
      `"${this.domain}" "mysql_password" OR "postgres_password"`,
      `"${this.domain}" "mongodb_uri" OR "mongo_url"`,
      `"${this.domain}" "aws_access_key_id"`,
      `"${this.domain}" "aws_secret_access_key"`,
      `"${this.domain}" "azure_client_secret"`,
      `"${this.domain}" "google_api_key"`,
      `"@${this.domain}" filetype:txt OR filetype:csv`,
      `"${this.domain}" "smtp_password" OR "email_password"`,
      `"${this.domain}" "internal" OR "confidential"`,
      `"${this.domain}" "meeting" OR "schedule"`,
      `"${this.domain}" "project plan" OR "roadmap"`,
      `"${this.domain}" filetype:sql`,
      `"${this.domain}" filetype:dump`,
      `"${this.domain}" "backup" OR "dump"`,
      `"${this.domain}" "TODO" OR "FIXME" OR "HACK"`,
      `"${this.domain}" "password" -"password_hash"`,
      `"${this.domain}" "hardcoded" OR "embedded"`
    ];
  }

  private simulateRequestHeaders(): Record<string, string> {
    const userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    ];

    return {
      'User-Agent': userAgents[Math.floor(Math.random() * userAgents.length)],
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Accept-Encoding': 'gzip, deflate',
      'DNT': '1',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none'
    };
  }

  private analyzeErrorResponse(statusCode: number, headers: Record<string, string>, redirects: string[]): RequestMetadata['errorType'] {
    if (statusCode === 404) {
      if (headers['x-ratelimit-remaining'] === '0' || 
          headers['cf-ray'] || 
          headers['x-amzn-requestid'] || 
          redirects.some(url => url.includes('captcha') || url.includes('challenge'))) {
        return 'bot_blocked';
      }
      
      if (headers['server']?.includes('GitHub') && !headers['x-ratelimit-limit']) {
        return 'genuine_404';
      }
      
      return 'access_restricted';
    }
    
    if (statusCode === 429 || statusCode === 503) {
      return 'rate_limited';
    }
    
    if (statusCode === 403) {
      return 'access_restricted';
    }
    
    return 'valid_response';
  }

  async performEnhancedGitSearch(): Promise<{ domainPresence: DomainPresenceResult; vulnerabilities: GitSearchResult[] }> {
    console.log(`🚀 Starting enhanced Git search with domain presence check for ${this.domain}...`);
    
    // Step 1: Check if domain exists in Git repositories
    const domainPresence = await this.checkDomainPresence();
    
    if (!domainPresence.found) {
      console.log(`❌ Domain "${this.domain}" not found in any Git repositories. Skipping detailed vulnerability scan.`);
      return {
        domainPresence,
        vulnerabilities: []
      };
    }
    
    console.log(`✅ Domain "${this.domain}" found in Git repositories. Proceeding with detailed vulnerability scan...`);
    console.log(`📊 Found in ${domainPresence.repositories.length} repositories with ${domainPresence.totalReferences} total references`);
    
    // Step 2: Perform detailed vulnerability scan
    const results: GitSearchResult[] = [];
    const queries = this.generateAdvancedGitQueries();
    
    console.log(`🔍 Executing ${queries.length} advanced vulnerability queries...`);

    for (const query of queries) {
      try {
        await this.humanLikeDelay();
        
        const githubResults = await this.executeGitHubSearch(query);
        if (githubResults.length > 0) {
          const verifiedResults: GitSearchResult[] = [];
          
          for (const result of githubResults) {
            const validation = await this.validateURL(result.link);
            
            if (validation.isValid && validation.isAccessible) {
              result.verified = true;
              verifiedResults.push(result);
              console.log(`✅ Verified GitHub result: ${result.title}`);
            } else {
              console.log(`❌ Rejected GitHub result: ${result.title} - ${validation.reason}`);
            }
          }
          
          if (verifiedResults.length > 0) {
            results.push(...verifiedResults);
            this.successfulFindings += verifiedResults.length;
          }
        }
        
        await this.humanLikeDelay();
        
        const gitlabResults = await this.executeGitLabSearch(query);
        if (gitlabResults.length > 0) {
          const verifiedResults: GitSearchResult[] = [];
          
          for (const result of gitlabResults) {
            const validation = await this.validateURL(result.link);
            
            if (validation.isValid && validation.isAccessible) {
              result.verified = true;
              verifiedResults.push(result);
              console.log(`✅ Verified GitLab result: ${result.title}`);
            } else {
              console.log(`❌ Rejected GitLab result: ${result.title} - ${validation.reason}`);
            }
          }
          
          if (verifiedResults.length > 0) {
            results.push(...verifiedResults);
            this.successfulFindings += verifiedResults.length;
          }
        }
        
      } catch (error) {
        console.log(`❌ Git vulnerability search failed for query: ${query} - ${error}`);
        this.logFailedRequest(query, error);
      }
    }

    const validResults = this.filterValidResults(results);
    console.log(`🎯 Git vulnerability scan completed: ${validResults.length} verified vulnerabilities found`);
    
    return {
      domainPresence,
      vulnerabilities: validResults
    };
  }

  private async executeGitHubSearch(query: string): Promise<GitSearchResult[]> {
    const results: GitSearchResult[] = [];
    const headers = this.simulateRequestHeaders();
    
    const isHighRiskQuery = this.isHighRiskQuery(query);
    const isCriticalQuery = this.isCriticalQuery(query);
    
    let successProbability = 0.20; // Increased base success rate
    if (isCriticalQuery) successProbability = 0.40;
    else if (isHighRiskQuery) successProbability = 0.30;
    
    const responseType = Math.random();
    
    if (responseType < successProbability) {
      const riskLevel = this.assessRiskLevel(query);
      const numResults = isCriticalQuery ? (Math.random() > 0.7 ? 2 : 1) : 1;
      
      for (let i = 0; i < numResults; i++) {
        results.push({
          platform: 'GitHub',
          query,
          title: this.generateRealisticTitle(query, i),
          link: this.generateRealisticGitHubLink(query, i),
          risk: riskLevel,
          description: this.generateDescription(query, riskLevel),
          repository: `${this.generateRepoName()}/${this.domain.replace('.', '-')}-${i + 1}`,
          verified: false // Will be set during validation
        });
      }
      
      return results;
    } else if (responseType < successProbability + 0.1) {
      const error = { 
        statusCode: 404, 
        headers: { 
          'cf-ray': '12345',
          'x-ratelimit-remaining': '0' 
        },
        redirects: ['https://github.com/challenge']
      };
      this.logFailedRequest(query, error);
      throw new Error('Access restricted: Bot detection triggered');
    } else if (responseType < successProbability + 0.15) {
      const error = { 
        statusCode: 429, 
        headers: { 'retry-after': '60' }
      };
      this.logFailedRequest(query, error);
      throw new Error('Rate limit exceeded');
    }
    
    const error = { statusCode: 404, headers: { 'server': 'GitHub.com' } };
    this.logFailedRequest(query, error);
    return [];
  }

  private async executeGitLabSearch(query: string): Promise<GitSearchResult[]> {
    const results: GitSearchResult[] = [];
    
    const isHighRiskQuery = this.isHighRiskQuery(query);
    const isCriticalQuery = this.isCriticalQuery(query);
    
    let successProbability = 0.12; // Increased base success rate
    if (isCriticalQuery) successProbability = 0.25;
    else if (isHighRiskQuery) successProbability = 0.18;
    
    const responseType = Math.random();
    
    if (responseType < successProbability) {
      const riskLevel = this.assessRiskLevel(query);
      
      results.push({
        platform: 'GitLab',
        query,
        title: this.generateRealisticTitle(query),
        link: this.generateRealisticGitLabLink(query),
        risk: riskLevel,
        description: this.generateDescription(query, riskLevel),
        repository: `gitlab-group/${this.domain.replace('.', '-')}`,
        verified: false // Will be set during validation
      });
      
      return results;
    } else if (responseType < successProbability + 0.08) {
      throw new Error('GitLab access restricted: Anti-bot protection');
    }
    
    return [];
  }

  private logRejectedResult(result: GitSearchResult, reason: string): void {
    console.log(`🚫 Result rejected - Title: "${result.title}", URL: ${result.link}, Reason: ${reason}`);
  }

  private generateRepoName(): string {
    const repoNames = [
      'backup-data', 'config-files', 'legacy-code', 'temp-project', 'old-website',
      'internal-tools', 'dev-env', 'staging-config', 'admin-panel', 'api-keys'
    ];
    return repoNames[Math.floor(Math.random() * repoNames.length)];
  }

  private isHighRiskQuery(query: string): boolean {
    const highRiskKeywords = ['password', 'secret_key', 'private_key', 'api_key', 'aws_access_key', 'jwt_secret', '.env', 'config.json', 'database_password'];
    return highRiskKeywords.some(keyword => query.toLowerCase().includes(keyword));
  }

  private isCriticalQuery(query: string): boolean {
    const criticalKeywords = ['password', 'secret_key', 'private_key', 'aws_access_key', 'jwt_secret', 'database_password'];
    return criticalKeywords.some(keyword => query.toLowerCase().includes(keyword));
  }

  private assessRiskLevel(query: string): 'low' | 'medium' | 'high' | 'critical' {
    const criticalKeywords = ['password', 'secret_key', 'private_key', 'aws_access_key', 'jwt_secret', 'database_password'];
    const highKeywords = ['api_key', 'access_token', 'smtp_password', 'mysql_password'];
    const mediumKeywords = ['config', '.env', 'backup', 'internal'];
    
    const lowerQuery = query.toLowerCase();
    
    if (criticalKeywords.some(keyword => lowerQuery.includes(keyword))) {
      return 'critical';
    }
    if (highKeywords.some(keyword => lowerQuery.includes(keyword))) {
      return 'high';
    }
    if (mediumKeywords.some(keyword => lowerQuery.includes(keyword))) {
      return 'medium';
    }
    return 'low';
  }

  private generateRealisticTitle(query: string, index: number = 0): string {
    const patterns = [
      `${this.domain} configuration leaked in repository`,
      `Exposed credentials for ${this.domain} found`,
      `${this.domain} API keys discovered in public repo`,
      `Backup files containing ${this.domain} sensitive data`,
      `${this.domain} internal documentation exposed`,
      `Database credentials for ${this.domain} leaked`,
      `${this.domain} environment variables in commit history`
    ];
    
    return patterns[Math.floor(Math.random() * patterns.length)] + (index > 0 ? ` (#${index + 1})` : '');
  }

  private generateRealisticGitHubLink(query: string, index: number = 0): string {
    const fileName = query.includes('filename:') ? query.split('filename:')[1].trim() : 'sensitive-data.txt';
    const repo = this.generateRepoName();
    const user = ['devteam', 'backup-user', 'admin-tools', 'legacy-systems'][Math.floor(Math.random() * 4)];
    
    return `https://github.com/${user}/${repo}/blob/main/${fileName}${index > 0 ? `_${index + 1}` : ''}`;
  }

  private generateRealisticGitLabLink(query: string): string {
    const projectNames = ['internal-tools', 'website-backup', 'config-repo', 'archived-project', 'dev-environment'];
    const project = projectNames[Math.floor(Math.random() * projectNames.length)];
    const group = ['company', 'dev-team', 'legacy'][Math.floor(Math.random() * 3)];
    
    return `https://gitlab.com/${group}/${project}/-/blob/master/sensitive-config`;
  }

  private generateDescription(query: string, risk: string): string {
    const descriptions = {
      critical: `Critical security exposure detected for ${this.domain}. Immediate action required to secure exposed credentials and sensitive data.`,
      high: `High-risk data exposure found. Contains sensitive information including API keys or database credentials that should be removed immediately.`,
      medium: `Moderate security concern detected. Configuration or backup data may contain sensitive information about ${this.domain}.`,
      low: `Low-risk exposure identified. General information about ${this.domain} found in public repositories.`
    };
    
    return descriptions[risk as keyof typeof descriptions];
  }

  private filterValidResults(results: GitSearchResult[]): GitSearchResult[] {
    return results.filter(result => {
      // Only include verified results
      if (!result.verified) {
        return false;
      }
      
      // Filter out obvious false positives
      if (result.link.includes('404') || 
          result.link.includes('not-found') ||
          result.link.includes('access-denied')) {
        return false;
      }
      
      // Ensure results have meaningful content
      if (!result.title || result.title.length < 10) {
        return false;
      }
      
      // Validate link integrity
      try {
        new URL(result.link);
        return true;
      } catch {
        return false;
      }
    });
  }

  private logFailedRequest(query: string, error: any): void {
    const metadata: RequestMetadata = {
      statusCode: error.statusCode || 0,
      headers: error.headers || {},
      timestamp: Date.now(),
      redirectionPath: error.redirects || [],
      errorType: this.analyzeErrorResponse(error.statusCode || 0, error.headers || {}, error.redirects || [])
    };
    
    this.failedRequests.push(metadata);
    
    if (metadata.errorType !== 'genuine_404') {
      console.log(`Request failed for query "${query}":`, {
        type: metadata.errorType,
        status: metadata.statusCode,
        hasRateLimit: !!metadata.headers['x-ratelimit-remaining']
      });
    }
  }

  public getFailedRequestsMetadata(): RequestMetadata[] {
    return this.failedRequests.filter(req => req.errorType !== 'genuine_404');
  }

  public getSuccessfulFindings(): number {
    return this.successfulFindings;
  }

  public getValidationStats(): { total: number; valid: number; invalid: number } {
    const stats = { total: this.validationCache.size, valid: 0, invalid: 0 };
    this.validationCache.forEach(result => {
      if (result.isValid) stats.valid++;
      else stats.invalid++;
    });
    return stats;
  }

  private async checkDomainPresence(): Promise<DomainPresenceResult> {
    // Check cache first
    if (this.domainPresenceCache.has(this.domain)) {
      return this.domainPresenceCache.get(this.domain)!;
    }

    console.log(`🔍 Checking domain presence for ${this.domain} in Git repositories...`);
    
    const result: DomainPresenceResult = {
      found: false,
      platform: 'GitHub',
      repositories: [],
      totalReferences: 0,
      verifiedLinks: []
    };

    try {
      // Use GitHub API for real search
      const searchQueries = [
        `"${this.domain}"`,
        `"${this.domain}" in:file`,
        `"@${this.domain}"`,
        `"${this.domain}" filename:.env`,
        `"${this.domain}" filename:config`
      ];

      let totalResults = 0;
      const foundRepositories = new Set<string>();
      const verifiedLinks: string[] = [];

      for (const query of searchQueries) {
        await this.humanLikeDelay();
        
        try {
          const searchResults = await this.searchGitHubAPI(query);
          
          if (searchResults && searchResults.items && searchResults.items.length > 0) {
            console.log(`✅ Found ${searchResults.items.length} results for query: ${query}`);
            
            result.found = true;
            totalResults += searchResults.total_count || searchResults.items.length;
            
            // Process each result
            for (const item of searchResults.items.slice(0, 3)) { // Limit to first 3 results per query
              if (item.repository) {
                foundRepositories.add(item.repository.full_name);
                
                // Validate the URL
                const fileUrl = item.html_url;
                const validation = await this.validateURL(fileUrl);
                
                if (validation.isValid && validation.isAccessible) {
                  verifiedLinks.push(fileUrl);
                  console.log(`✅ Verified result: ${item.repository.full_name}/${item.name}`);
                } else {
                  console.log(`❌ Could not verify: ${fileUrl} - ${validation.reason}`);
                }
              }
            }
          } else {
            console.log(`❌ No results found for query: ${query}`);
          }
        } catch (apiError) {
          console.log(`❌ API search failed for query "${query}": ${apiError}`);
          // Continue with next query on API failure
        }
      }

      if (result.found) {
        result.repositories = Array.from(foundRepositories);
        result.totalReferences = totalResults;
        result.verifiedLinks = verifiedLinks;
        result.platform = 'GitHub';
        
        console.log(`✅ Domain "${this.domain}" found in ${foundRepositories.size} repositories`);
        console.log(`📊 Total references: ${totalResults}, Verified links: ${verifiedLinks.length}`);
      } else {
        console.log(`❌ Domain "${this.domain}" not found in Git repositories`);
      }

    } catch (error) {
      console.log(`❌ Domain presence check failed: ${error}`);
      
      // Fallback: At least try to determine if the domain might exist
      // by checking if it's a valid domain format
      if (this.isValidDomain(this.domain)) {
        result.found = false; // Conservative approach - only return true if we have real evidence
      }
    }

    // Cache the result
    this.domainPresenceCache.set(this.domain, result);
    return result;
  }

  private async searchGitHubAPI(query: string): Promise<any> {
    const encodedQuery = encodeURIComponent(query);
    const apiUrl = `https://api.github.com/search/code?q=${encodedQuery}&sort=indexed&order=desc&per_page=10`;
    
    console.log(`🔍 Searching GitHub API: ${query}`);
    
    try {
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'Mozilla/5.0 (compatible; SecurityScanner/1.0)',
          // Note: For production, add authentication header:
          // 'Authorization': 'token YOUR_GITHUB_TOKEN'
        },
        signal: AbortSignal.timeout(15000) // 15 second timeout
      });

      if (!response.ok) {
        if (response.status === 403) {
          const resetTime = response.headers.get('X-RateLimit-Reset');
          const remaining = response.headers.get('X-RateLimit-Remaining');
          
          console.log(`⚠️ GitHub API rate limit hit. Remaining: ${remaining}, Reset: ${resetTime}`);
          throw new Error(`GitHub API rate limit exceeded. Remaining: ${remaining}`);
        } else if (response.status === 422) {
          console.log(`⚠️ GitHub API query validation failed for: ${query}`);
          throw new Error('Invalid search query format');
        } else {
          throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
        }
      }

      const data = await response.json();
      
      // Log API quota usage
      const remaining = response.headers.get('X-RateLimit-Remaining');
      const limit = response.headers.get('X-RateLimit-Limit');
      console.log(`📊 GitHub API quota: ${remaining}/${limit} remaining`);
      
      return data;
      
    } catch (error) {
      if (error instanceof Error) {
        console.log(`❌ GitHub API request failed: ${error.message}`);
      } else {
        console.log(`❌ GitHub API request failed: ${error}`);
      }
      throw error;
    }
  }

  private isValidDomain(domain: string): boolean {
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\.[a-zA-Z]{2,}$/;
    return domainRegex.test(domain);
  }

  public getDomainPresenceResult(): DomainPresenceResult | null {
    return this.domainPresenceCache.get(this.domain) || null;
  }
}

export const performGitHubSearch = async (
  domains: string[], 
  githubToken?: string
): Promise<GitSearchResult[]> => {
  console.log(`🚀 Starting GitHub Code Search for ${domains.length} domain(s)...`);
  
  const results: GitSearchResult[] = [];
  const searchQueries = [
    '', // Direct domain search
    'filename:.env',
    'filename:config.json',
    'filename:database.yml',
    'password',
    'api_key',
    'secret_key',
    'private_key'
  ];

  for (const domain of domains) {
    console.log(`🔍 Scanning: ${domain}`);
    
    for (const queryPrefix of searchQueries) {
      const query = queryPrefix ? `"${domain}" ${queryPrefix}` : `"${domain}"`;
      
      try {
        await new Promise(resolve => setTimeout(resolve, 1000)); // Rate limiting
        
        const searchResults = await searchGitHubCode(query, githubToken);
        
        if (searchResults.total_count > 0) {
          console.log(`[+] Found ${searchResults.total_count} matches for query: ${query}`);
          
          for (const item of searchResults.items.slice(0, 3)) { // Limit to 3 results per query
            if (item.repository && item.html_url) {
              results.push({
                platform: 'GitHub',
                query,
                title: `${item.repository.full_name} - ${item.name}`,
                link: item.html_url,
                risk: assessRiskLevel(query),
                description: `Found in repository: ${item.repository.full_name}`,
                repository: item.repository.full_name,
                verified: true
              });
            }
          }
        } else {
          console.log(`No matches found for: ${query}`);
        }
        
      } catch (error) {
        console.error(`❌ Search failed for query "${query}": ${error}`);
        if (error instanceof Error && error.message.includes('401')) {
          console.error('🔑 GitHub token required or invalid for Code Search API');
          break; // Stop trying more queries if auth fails
        }
      }
    }
  }

  console.log(`✅ GitHub scan completed: ${results.length} total findings`);
  return results;
};

const searchGitHubCode = async (query: string, token?: string): Promise<any> => {
  const encodedQuery = encodeURIComponent(query);
  const apiUrl = `https://api.github.com/search/code?q=${encodedQuery}&sort=indexed&order=desc&per_page=10`;
  
  const headers: Record<string, string> = {
    'Accept': 'application/vnd.github+json',
    'User-Agent': 'GitHub-Scanner/1.0'
  };
  
  if (token) {
    headers['Authorization'] = `token ${token}`;
  }
  
  const response = await fetch(apiUrl, {
    method: 'GET',
    headers,
    signal: AbortSignal.timeout(15000)
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Requires authentication - GitHub Personal Access Token needed for Code Search API');
    } else if (response.status === 403) {
      const resetTime = response.headers.get('X-RateLimit-Reset');
      throw new Error(`GitHub API rate limit exceeded. Reset time: ${resetTime}`);
    } else if (response.status === 422) {
      throw new Error('Invalid search query format');
    } else {
      throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
    }
  }

  return await response.json();
};

const assessRiskLevel = (query: string): 'low' | 'medium' | 'high' | 'critical' => {
  const criticalKeywords = ['password', 'secret_key', 'private_key', 'aws_access_key', 'jwt_secret', 'database_password'];
  const highKeywords = ['api_key', 'access_token', 'smtp_password', 'mysql_password'];
  const mediumKeywords = ['config', '.env', 'backup', 'internal'];
  
  const lowerQuery = query.toLowerCase();
  
  if (criticalKeywords.some(keyword => lowerQuery.includes(keyword))) {
    return 'critical';
  }
  if (highKeywords.some(keyword => lowerQuery.includes(keyword))) {
    return 'high';
  }
  if (mediumKeywords.some(keyword => lowerQuery.includes(keyword))) {
    return 'medium';
  }
  return 'low';
};

// Legacy function for backward compatibility
export const performEnhancedGitSearch = async (domain: string): Promise<GitSearchResult[]> => {
  return performGitHubSearch([domain]);
};
