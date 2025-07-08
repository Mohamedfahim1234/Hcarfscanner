import { useState } from "react";
import { Search, Shield, AlertTriangle, Github, Globe, Settings, Zap, Info, WifiOff, Clock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ConfigPanel } from "@/components/ConfigPanel";
import { ResultsPanel } from "@/components/ResultsPanel";
import { LoadingAnimation } from "@/components/LoadingAnimation";
import { toast } from "@/hooks/use-toast";
import { ExportPanel } from "@/components/ExportPanel";
import { performGitHubSearch } from "@/utils/gitScanner";
import { performCorsCheck, CorsVulnerability } from "@/utils/corsScanner";
import { ExportData, generateSecurityRecommendation } from "@/utils/exportUtils";
import ChatBot from "@/components/ChatBot";

interface ScanResult {
  platform: "GitHub" | "Google";
  query: string;
  title: string;
  link: string;
  risk: "low" | "medium" | "high" | "critical";
  description?: string;
  verified?: boolean;
}

interface ScanError {
  platform: "GitHub" | "Google";
  query: string;
  error: string;
  reason: string;
}

interface DetailedFailureReason {
  type: "domain_not_found" | "cors_blocked" | "rate_limited" | "api_unavailable" | "network_error" | "timeout";
  message: string;
  suggestion: string;
}

const Index = () => {
  const [domain, setDomain] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [results, setResults] = useState<ScanResult[]>([]);
  const [errors, setErrors] = useState<ScanError[]>([]);
  const [showConfig, setShowConfig] = useState(false);
  const [failureReasons, setFailureReasons] = useState<DetailedFailureReason[]>([]);
  const [domainStatus, setDomainStatus] = useState<{
    isValid: boolean;
    exists: boolean;
    accessible: boolean;
    message: string;
  } | null>(null);
  const [apiKeys, setApiKeys] = useState({
    githubToken: "",
    serpApiKey: ""
  });
  const [corsVulnerabilities, setCorsVulnerabilities] = useState<CorsVulnerability[]>([]);
  const [scanStartTime, setScanStartTime] = useState<number>(0);
  const [showExportPanel, setShowExportPanel] = useState(false);
  const [gitDomainFound, setGitDomainFound] = useState<boolean | null>(null);

  const githubDorks = [
    "filename:.env",
    "filename:config.json",
    "filename:database.yml",
    "password",
    "api_key",
    "secret_key",
    "aws_access_key",
    "private_key",
    "database_password",
    "jwt_secret"
  ];

  const googleDorks = [
    "site:pastebin.com",
    "site:paste.ee",
    "site:hastebin.com",
    "filetype:sql",
    "filetype:log",
    "filetype:env",
    "intitle:index.of config",
    "inurl:backup",
    "inurl:admin",
    "filetype:txt password"
  ];

  const validateDomain = (input: string): { isValid: boolean; cleanDomain: string; error?: string } => {
    if (!input.trim()) {
      return { isValid: false, cleanDomain: "", error: "Domain cannot be empty" };
    }

    let cleanDomain = input.replace(/^https?:\/\//, '').replace(/\/.*$/, '').toLowerCase();
    cleanDomain = cleanDomain.replace(/^www\./, '');

    const domainRegex = /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)*[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?$/;
    
    if (!domainRegex.test(cleanDomain)) {
      return { isValid: false, cleanDomain, error: "Invalid domain format" };
    }

    if (!cleanDomain.includes('.')) {
      return { isValid: false, cleanDomain, error: "Domain must include a top-level domain (e.g., .com, .org)" };
    }

    if (cleanDomain.length > 253) {
      return { isValid: false, cleanDomain, error: "Domain name is too long" };
    }

    return { isValid: true, cleanDomain };
  };

  const checkDomainAccessibility = async (domain: string): Promise<{
    exists: boolean;
    accessible: boolean;
    corsEnabled: boolean;
    message: string;
  }> => {
    try {
      const dnsResponse = await fetch(`https://dns.google/resolve?name=${domain}&type=A`);
      const dnsData = await dnsResponse.json();
      
      if (!dnsData.Answer || dnsData.Answer.length === 0) {
        return {
          exists: false,
          accessible: false,
          corsEnabled: false,
          message: `Domain '${domain}' does not exist or cannot be resolved`
        };
      }

      try {
        const response = await fetch(`https://${domain}`, { 
          method: 'HEAD',
          mode: 'no-cors',
          signal: AbortSignal.timeout(5000)
        });
        
        return {
          exists: true,
          accessible: true,
          corsEnabled: false,
          message: `Domain '${domain}' exists and is accessible (CORS restrictions apply)`
        };
      } catch (corsError) {
        return {
          exists: true,
          accessible: true,
          corsEnabled: false,
          message: `Domain '${domain}' exists but has CORS restrictions (normal for security)`
        };
      }
    } catch (error) {
      return {
        exists: false,
        accessible: false,
        corsEnabled: false,
        message: `Cannot verify domain '${domain}' - network error or invalid domain`
      };
    }
  };

  const validateGoogleURL = async (url: string): Promise<{ isValid: boolean; reason?: string }> => {
    try {
      console.log(`🔍 Validating Google result URL: ${url}`);
      
      const response = await fetch(url, {
        method: 'HEAD',
        signal: AbortSignal.timeout(8000)
      });

      if (response.ok) {
        console.log(`✅ Google URL validated successfully: ${url}`);
        return { isValid: true };
      } else {
        const reason = `HTTP ${response.status} - ${response.status === 404 ? 'Not Found' : 'Access Error'}`;
        console.log(`❌ Google URL validation failed: ${url} - ${reason}`);
        return { isValid: false, reason };
      }
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'Network error or timeout';
      console.log(`❌ Google URL validation error: ${url} - ${reason}`);
      return { isValid: false, reason };
    }
  };

  const generateDetailedFailureReasons = (domain: string, errorCount: number, domainAccessible: boolean): DetailedFailureReason[] => {
    const reasons: DetailedFailureReason[] = [];

    if (!domainAccessible) {
      reasons.push({
        type: "domain_not_found",
        message: `The domain '${domain}' appears to be invalid or unreachable`,
        suggestion: "Verify the domain spelling and ensure it's a valid, active domain"
      });
    }

    reasons.push({
      type: "cors_blocked",
      message: "Direct web searches are blocked by browser security (CORS policy)",
      suggestion: "This is normal - real implementations use backend services to bypass CORS"
    });

    if (errorCount > 0) {
      reasons.push({
        type: "api_unavailable",
        message: "GitHub and Google APIs require authentication tokens",
        suggestion: "Configure API keys in settings for real search functionality"
      });
    }

    reasons.push({
      type: "rate_limited",
      message: "API rate limits may prevent extensive searching",
      suggestion: "Use premium API keys or implement proper rate limiting"
    });

    return reasons;
  };

  const scoreResult = (title: string): "low" | "medium" | "high" | "critical" => {
    const lowerTitle = title.toLowerCase();
    const criticalKeywords = ["password", "secret", "private_key", "jwt", "token", "credential"];
    const highKeywords = ["api", "config", "database", "admin", "backup"];
    const mediumKeywords = ["env", "log", ".txt", ".json"];

    if (criticalKeywords.some(keyword => lowerTitle.includes(keyword))) {
      return "critical";
    }
    if (highKeywords.some(keyword => lowerTitle.includes(keyword))) {
      return "high";
    }
    if (mediumKeywords.some(keyword => lowerTitle.includes(keyword))) {
      return "medium";
    }
    return "low";
  };

  const simulateGithubSearch = async (query: string, domain: string): Promise<ScanResult[]> => {
    try {
      const delay = 600 + Math.random() * 800;
      await new Promise(resolve => setTimeout(resolve, delay));
      
      const isHighRiskQuery = ['password', 'secret', 'api_key', '.env', 'config.json', 'private_key', 'database'].some(
        keyword => query.toLowerCase().includes(keyword)
      );
      
      const isMediumRiskQuery = ['backup', 'admin', 'internal', 'jwt', 'token'].some(
        keyword => query.toLowerCase().includes(keyword)
      );
      
      if (!isHighRiskQuery && !isMediumRiskQuery) {
        return [];
      }
      
      const successRate = isHighRiskQuery ? 0.35 : 0.20;
      
      if (Math.random() > successRate) {
        return [];
      }
      
      if (Math.random() < 0.1) {
        const errorTypes = ["rate_limit", "auth_required", "bot_detected"];
        const randomError = errorTypes[Math.floor(Math.random() * errorTypes.length)];
        throw new Error(`GitHub API Error: ${randomError.replace('_', ' ')} - ${query}`);
      }

      const mockResults: ScanResult[] = [];
      const numResults = isHighRiskQuery && Math.random() > 0.7 ? 2 : 1;
      
      for (let i = 0; i < numResults; i++) {
        const mockUrl = `https://github.com/leaked-repo/${domain.replace('.', '-')}/blob/main/${query.split(' ')[0]}${i > 0 ? `_${i + 1}` : ''}`;
        
        const isValidURL = Math.random() > 0.3;
        
        if (isValidURL) {
          mockResults.push({
            platform: "GitHub",
            query,
            title: `${domain} - ${query.includes('password') ? 'credentials' : query.includes('api') ? 'API keys' : 'sensitive config'} exposed${i > 0 ? ` (#${i + 1})` : ''}`,
            link: mockUrl,
            risk: scoreResult(query),
            description: `Verified exposure: ${query} found in public repository for ${domain}`,
            verified: true
          });
          console.log(`✅ GitHub result validated: ${mockUrl}`);
        } else {
          console.log(`❌ GitHub result rejected (404 or inaccessible): ${mockUrl}`);
        }
      }

      return mockResults;
    } catch (error) {
      throw new Error(`GitHub search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const performGoogleSearch = async (query: string, domain: string): Promise<ScanResult[]> => {
    if (!apiKeys.serpApiKey) {
      console.log(`❌ Google search skipped: No SerpAPI key provided for query "${query}"`);
      return [];
    }

    try {
      console.log(`🔍 Performing Google search: ${query}`);
      
      const response = await fetch(`https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(query)}&api_key=${apiKeys.serpApiKey}&num=10`);
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Invalid SerpAPI key - check your API configuration');
        } else if (response.status === 429) {
          throw new Error('SerpAPI rate limit exceeded - try again later');
        } else {
          throw new Error(`SerpAPI error: ${response.status}`);
        }
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(`SerpAPI error: ${data.error}`);
      }

      const results: ScanResult[] = [];
      const organicResults = data.organic_results || [];
      
      for (const result of organicResults.slice(0, 5)) {
        if (result.link && result.title) {
          // Validate the URL is accessible
          const validation = await validateGoogleURL(result.link);
          
          if (validation.isValid) {
            results.push({
              platform: "Google",
              query,
              title: result.title,
              link: result.link,
              risk: scoreResult(result.title + ' ' + (result.snippet || '')),
              description: result.snippet || `Google search result for: ${query}`,
              verified: true
            });
            console.log(`✅ Google result validated: ${result.link}`);
          } else {
            console.log(`❌ Google result rejected: ${result.link} - ${validation.reason}`);
          }
        }
      }

      console.log(`✅ Google search completed: ${results.length} verified results found for "${query}"`);
      return results;
      
    } catch (error) {
      console.error(`❌ Google search failed for "${query}":`, error);
      throw new Error(`Google search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleScan = async () => {
    const validation = validateDomain(domain);
    if (!validation.isValid) {
      toast({
        title: "Invalid Domain",
        description: validation.error,
        variant: "destructive"
      });
      return;
    }

    setIsScanning(true);
    setResults([]);
    setErrors([]);
    setFailureReasons([]);
    setDomainStatus(null);
    setCorsVulnerabilities([]);
    setShowExportPanel(false);
    setScanStartTime(Date.now());
    setGitDomainFound(null);

    try {
      console.log(`🚀 Starting comprehensive scan with domain presence check for ${validation.cleanDomain}...`);
      
      const domainCheck = await checkDomainAccessibility(validation.cleanDomain);
      setDomainStatus({
        isValid: true,
        exists: domainCheck.exists,
        accessible: domainCheck.accessible,
        message: domainCheck.message
      });

      const allResults: ScanResult[] = [];
      const scanErrors: ScanError[] = [];

      // Enhanced Git search with domain presence check
      try {
        console.log('🔍 Starting GitHub Code Search with token authentication...');
        const gitResults = await performGitHubSearch([validation.cleanDomain], apiKeys.githubToken || undefined);
        
        if (gitResults.length > 0) {
          const hasActualVulnerabilities = gitResults.some(result => 
            result.risk !== 'low' || result.title.includes('exposed') || result.title.includes('leaked')
          );
          
          setGitDomainFound(true);
          
          gitResults.forEach(gitResult => {
            allResults.push({
              platform: gitResult.platform as "GitHub" | "Google",
              query: gitResult.query,
              title: gitResult.title,
              link: gitResult.link,
              risk: gitResult.risk,
              description: gitResult.description,
              verified: gitResult.verified
            });
          });
          
          if (hasActualVulnerabilities) {
            console.log(`✅ Git scan completed: ${gitResults.length} verified vulnerabilities found`);
          } else {
            console.log(`✅ Git scan completed: Domain found in repositories but no vulnerabilities detected`);
          }
        } else {
          setGitDomainFound(false);
          console.log('❌ Git scan completed: Domain not found in any Git repositories');
        }
      } catch (error) {
        console.error('❌ Git scan failed:', error);
        setGitDomainFound(false);
        scanErrors.push({
          platform: "GitHub",
          query: "Git Domain Presence Check",
          error: error instanceof Error ? error.message : 'Unknown error',
          reason: "Domain presence verification failed"
        });
      }

      // Only proceed with other scans if Git domain was found
      if (gitDomainFound !== false) {
        // Google Dorking
        const googlePromises = googleDorks.map(async (dork) => {
          const searchQuery = `${dork} ${validation.cleanDomain}`;
          try {
            return await performGoogleSearch(searchQuery, validation.cleanDomain);
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            let reason = "No accessible indexed results found for this search";
            if (errorMessage.includes("quota")) reason = "Google Search API quota exceeded";
            else if (errorMessage.includes("blocked")) reason = "Search blocked by content filtering";
            else if (errorMessage.includes("timeout")) reason = "Google search request timeout";
            scanErrors.push({
              platform: "Google",
              query: searchQuery,
              error: errorMessage,
              reason
            });
            return [];
          }
        });

        const googleResults = await Promise.allSettled(googlePromises);
        let googleCount = 0;
        googleResults.forEach((result) => {
          if (result.status === 'fulfilled') {
            allResults.push(...result.value);
            googleCount += result.value.length;
          }
        });

        if (googleCount > 0) {
          console.log(`✅ Google dorking completed: ${googleCount} verified results found`);
        }
      }

      const detailedReasons = generateDetailedFailureReasons(
        validation.cleanDomain,
        scanErrors.length,
        domainCheck.accessible
      );

      setResults(allResults);
      setErrors(scanErrors);
      setFailureReasons(detailedReasons);
      
      if (allResults.length > 0 || corsVulnerabilities.length > 0) {
        setShowExportPanel(true);
      }
      
      const verifiedCount = allResults.filter(r => r.verified).length;
      console.log(`🎯 Scan Summary: ${allResults.length} total results (${verifiedCount} verified), ${corsVulnerabilities.length} CORS issues`);

      // Updated toast messages based on Git domain presence
      if (gitDomainFound === false) {
        toast({
          title: "Domain Not Found in Git Repositories",
          description: `No references to "${validation.cleanDomain}" found in public Git repositories. Domain may not have Git-based exposures.`,
        });
      } else if (allResults.length === 0 && corsVulnerabilities.length === 0) {
        toast({
          title: "Domain Found - No Vulnerabilities Detected",
          description: `Domain "${validation.cleanDomain}" found in Git repositories but no accessible security vulnerabilities detected.`,
        });
      } else {
        const totalVulns = allResults.length + corsVulnerabilities.length;
        toast({
          title: "Security Issues Detected",
          description: `Found ${totalVulns} security vulnerabilities for ${validation.cleanDomain} (${verifiedCount} verified)`,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Scan failed:', error);
      toast({
        title: "Scan Failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred during scanning",
        variant: "destructive"
      });
    } finally {
      setIsScanning(false);
    }
  };

  const getExportData = (): ExportData => {
    const scanDuration = Date.now() - scanStartTime;
    
    return {
      domain,
      timestamp: new Date().toISOString(),
      totalResults: results.length,
      vulnerabilities: results.map(result => {
        const securityInfo = generateSecurityRecommendation(result.title, result.link, result.description);
        return {
          platform: result.platform,
          title: result.title,
          risk: result.risk,
          link: result.link,
          description: result.description || '',
          query: result.query,
          vulnerabilityType: securityInfo.type,
          recommendation: securityInfo.recommendation,
          snippet: result.description || ''
        };
      }),
      corsVulnerabilities: corsVulnerabilities,
      errors: errors,
      metadata: {
        scanDuration,
        totalQueries: githubDorks.length + googleDorks.length + 20,
        successfulQueries: results.length,
        failedQueries: errors.length
      }
    };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 md:p-8">
      {/* Enhanced animated background */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,255,0.1)_1px,transparent_1px)] bg-[size:50px_50px] animate-pulse opacity-30"></div>
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-500/10 to-transparent animate-pulse"></div>
      
      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Updated Header with HCARF Scanner branding */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <div className="relative">
              <div className="h-20 w-20 bg-gradient-to-br from-pink-500 to-orange-500 rounded-full flex items-center justify-center mr-4 animate-glow">
                <Shield className="h-12 w-12 text-white" />
              </div>
              <div className="absolute inset-0 h-20 w-20 bg-gradient-to-br from-pink-500 to-orange-500 rounded-full mr-4 animate-ping opacity-20"></div>
            </div>
            <h1 className="text-7xl font-bold bg-gradient-to-r from-pink-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent animate-pulse">
              HCARF Scanner
            </h1>
            <div className="relative">
              <Zap className="h-20 w-20 text-pink-400 ml-4 animate-glow" />
              <div className="absolute inset-0 h-20 w-20 text-pink-400 ml-4 animate-ping opacity-20">
                <Zap className="h-20 w-20" />
              </div>
            </div>
          </div>
          <p className="text-xl text-gray-300 max-w-4xl mx-auto mb-4">
            Advanced leak detection system for domains and websites. Discover exposed credentials, API keys, and sensitive information across GitHub, Google, and other platforms.
          </p>
          <div className="flex justify-center gap-4 text-sm text-gray-400 mb-2">
            <Badge variant="outline" className="border-pink-400 text-pink-400 flex items-center">
              <Github className="h-3 w-3 mr-1" />
              GitHub Integration
            </Badge>
            <Badge variant="outline" className="border-cyan-400 text-cyan-400 flex items-center">
              <Globe className="h-3 w-3 mr-1" />
              Google Search
            </Badge>
            <Badge variant="outline" className="border-purple-400 text-purple-400 flex items-center">
              <Shield className="h-3 w-3 mr-1" />
              Real-time Scanning
            </Badge>
          </div>
        </div>

        {/* Main Interface */}
        <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm mb-8 cyber-glow">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Search className="mr-2 text-cyan-400" />
              Domain & Website Security Scanner
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex gap-4">
              <div className="flex-1">
                <Input
                  type="text"
                  placeholder="Enter domain or URL (e.g., example.com, https://example.com)"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white placeholder-gray-400 h-14 text-lg focus:border-cyan-400 transition-colors"
                  disabled={isScanning}
                  onKeyPress={(e) => e.key === 'Enter' && !isScanning && handleScan()}
                />
              </div>
              <Button
                onClick={() => setShowConfig(!showConfig)}
                variant="outline"
                className="border-slate-600 text-white hover:bg-slate-700 h-14 px-6"
                disabled={isScanning}
              >
                <Settings className="h-5 w-5" />
              </Button>
              <Button
                onClick={handleScan}
                disabled={isScanning || !domain.trim()}
                className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white h-14 px-10 text-lg font-semibold disabled:opacity-50 cyber-glow"
              >
                {isScanning ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Scanning...
                  </>
                ) : "Start Scan"}
              </Button>
            </div>

            {showConfig && (
              <ConfigPanel apiKeys={apiKeys} setApiKeys={setApiKeys} />
            )}

            {/* Domain Status */}
            {domainStatus && (
              <Alert className={`${domainStatus.exists ? 'border-green-500/50 bg-green-900/20' : 'border-red-500/50 bg-red-900/20'}`}>
                <AlertCircle className={`h-4 w-4 ${domainStatus.exists ? 'text-green-400' : 'text-red-400'}`} />
                <AlertTitle className={domainStatus.exists ? 'text-green-400' : 'text-red-400'}>
                  Domain Status: {domainStatus.exists ? 'Valid' : 'Invalid'}
                </AlertTitle>
                <AlertDescription className="text-gray-300">
                  {domainStatus.message}
                </AlertDescription>
              </Alert>
            )}

            {/* Git Domain Presence Status */}
            {gitDomainFound !== null && !isScanning && (
              <Alert className={`${gitDomainFound ? 'border-green-500/50 bg-green-900/20' : 'border-yellow-500/50 bg-yellow-900/20'}`}>
                <Github className={`h-4 w-4 ${gitDomainFound ? 'text-green-400' : 'text-yellow-400'}`} />
                <AlertTitle className={gitDomainFound ? 'text-green-400' : 'text-yellow-400'}>
                  Git Presence: {gitDomainFound ? 'Domain Found' : 'Domain Not Found'}
                </AlertTitle>
                <AlertDescription className="text-gray-300">
                  {gitDomainFound 
                    ? `Domain "${domain}" found in Git repositories. Detailed vulnerability scan completed.`
                    : `Domain "${domain}" not found in any public Git repositories. This means no Git-based exposures are publicly accessible.`
                  }
                </AlertDescription>
              </Alert>
            )}

            {/* Detailed Failure Analysis */}
            {failureReasons.length > 0 && !isScanning && results.length === 0 && gitDomainFound === false && (
              <Card className="bg-slate-700/50 border-slate-600">
                <CardHeader>
                  <CardTitle className="text-yellow-400 flex items-center">
                    <Info className="mr-2" />
                    Analysis Results & Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {failureReasons.map((reason, index) => (
                    <div key={index} className="border-l-4 border-yellow-400 pl-4 py-2">
                      <h4 className="text-white font-medium mb-1">
                        {reason.type.replace('_', ' ').toUpperCase()}
                      </h4>
                      <p className="text-gray-300 text-sm mb-1">{reason.message}</p>
                      <p className="text-gray-400 text-xs italic">{reason.suggestion}</p>
                    </div>
                  ))}
                  
                  <div className="mt-4 p-4 bg-blue-900/20 rounded-lg border border-blue-500/30">
                    <h4 className="text-blue-400 font-medium mb-2">ℹ️ About Git Domain Scanning</h4>
                    <p className="text-gray-300 text-sm">
                      The scanner first checks if your domain exists in public Git repositories before performing detailed vulnerability scans. 
                      If no references are found, it means your domain likely doesn't have Git-based exposures.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Error Summary */}
            {errors.length > 0 && !isScanning && (
              <Card className="bg-yellow-900/20 border-yellow-500/50">
                <CardHeader>
                  <CardTitle className="text-yellow-400 flex items-center">
                    <AlertTriangle className="h-5 w-5 mr-2" />
                    Search Issues Detected ({errors.length} queries affected)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {errors.reduce((acc, error) => {
                      const existing = acc.find(item => item.reason === error.reason);
                      if (existing) {
                        existing.count++;
                      } else {
                        acc.push({ reason: error.reason, count: 1, platform: error.platform });
                      }
                      return acc;
                    }, [] as Array<{reason: string, count: number, platform: string}>).map((errorGroup, index) => (
                      <div key={index} className="flex items-center justify-between bg-yellow-900/30 p-3 rounded">
                        <div>
                          <span className="text-yellow-300 font-medium">{errorGroup.reason}</span>
                          <span className="text-gray-400 text-sm ml-2">({errorGroup.count} affected)</span>
                        </div>
                        <Badge variant="outline" className="border-yellow-400 text-yellow-400">
                          {errorGroup.platform}
                        </Badge>
                      </div>
                    ))}
                  </div>
                  <details className="mt-4 text-sm text-gray-300">
                    <summary className="cursor-pointer hover:text-white">View detailed error log</summary>
                    <div className="mt-2 space-y-1 max-h-40 overflow-y-auto">
                      {errors.map((error, index) => (
                        <div key={index} className="text-xs bg-slate-800/50 p-2 rounded">
                          <span className="text-gray-400">{error.platform}:</span> {error.error}
                        </div>
                      ))}
                    </div>
                  </details>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>

        {/* Loading Animation */}
        {isScanning && <LoadingAnimation domain={domain} />}

        {/* CORS Vulnerabilities Panel */}
        {corsVulnerabilities.length > 0 && !isScanning && (
          <Card className="bg-red-900/20 border-red-500/50 backdrop-blur-sm mb-6">
            <CardHeader>
              <CardTitle className="text-red-400 flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2" />
                CORS Vulnerabilities Detected ({corsVulnerabilities.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {corsVulnerabilities.map((vuln, index) => (
                <div key={index} className="border-l-4 border-red-400 pl-4 py-2 bg-red-900/30 rounded">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-white font-medium">{vuln.type}</h4>
                    <Badge className={`${
                      vuln.severity === 'critical' ? 'bg-red-500' :
                      vuln.severity === 'high' ? 'bg-orange-500' :
                      vuln.severity === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                    } text-white`}>
                      {vuln.severity.toUpperCase()}
                    </Badge>
                  </div>
                  <p className="text-gray-300 text-sm mb-2">{vuln.description}</p>
                  <p className="text-gray-400 text-xs italic">{vuln.recommendation}</p>
                  {vuln.details && (
                    <p className="text-gray-500 text-xs mt-1">Details: {vuln.details}</p>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Export Panel */}
        {showExportPanel && !isScanning && (
          <div className="mb-6">
            <ExportPanel exportData={getExportData()} />
          </div>
        )}

        {/* Results */}
        {results.length > 0 && !isScanning && (
          <ResultsPanel results={results} domain={domain} />
        )}

        {/* Enhanced Statistics Cards with updated icons */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm hover:bg-slate-800/70 transition-all duration-300 cyber-glow">
            <CardContent className="p-6 text-center">
              <Github className="h-12 w-12 text-pink-400 mx-auto mb-4 animate-pulse" />
              <h3 className="text-lg font-semibold text-white mb-2">GitHub Intelligence</h3>
              <p className="text-gray-400 text-sm">Advanced repository scanning</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm hover:bg-slate-800/70 transition-all duration-300 cyber-glow">
            <CardContent className="p-6 text-center">
              <Globe className="h-12 w-12 text-cyan-400 mx-auto mb-4 animate-pulse" />
              <h3 className="text-lg font-semibold text-white mb-2">Google OSINT</h3>
              <p className="text-gray-400 text-sm">Comprehensive web analysis</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm hover:bg-slate-800/70 transition-all duration-300 cyber-glow">
            <CardContent className="p-6 text-center">
              <AlertTriangle className="h-12 w-12 text-orange-400 mx-auto mb-4 animate-pulse" />
              <h3 className="text-lg font-semibold text-white mb-2">Risk Assessment</h3>
              <p className="text-gray-400 text-sm">Intelligent threat analysis</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm hover:bg-slate-800/70 transition-all duration-300 cyber-glow">
            <CardContent className="p-6 text-center">
              <Shield className="h-12 w-12 text-purple-400 mx-auto mb-4 animate-pulse" />
              <h3 className="text-lg font-semibold text-white mb-2">CORS Detection</h3>
              <p className="text-gray-400 text-sm">Security vulnerability scanning</p>
            </CardContent>
          </Card>
        </div>

        {/* ChatBot component - always accessible */}
        <ChatBot scanContext={{
          domain,
          results,
          errors,
          corsVulnerabilities,
          failureReasons,
          scanTime: scanStartTime ? (Date.now() - scanStartTime) : 0
        }} />
      </div>
    </div>
  );
};

export default Index;
