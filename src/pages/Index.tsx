import React, { useState, useEffect } from 'react';
import { Search, Shield, AlertTriangle, ExternalLink, Github, Globe, Key, Zap, Eye, Lock, Link, Loader2, Database, FileText, Code, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';

interface ScanResult {
  query: string;
  platform: string;
  title: string;
  link: string;
  risk: string;
  riskLevel: number;
  description?: string;
  timestamp?: string;
  leakType?: string;
}

const Index = () => {
  const [targetDomain, setTargetDomain] = useState('');
  const [githubToken, setGithubToken] = useState('');
  const [serpApiKey, setSerpApiKey] = useState('');
  const [results, setResults] = useState<ScanResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [error, setError] = useState('');
  const [totalScanned, setTotalScanned] = useState(0);
  const [showApiFields, setShowApiFields] = useState(false);
  const [useApi, setUseApi] = useState(false);
  const [dorkResults, setDorkResults] = useState<{ query: string; links: { title: string; url: string }[] }[]>([]);

  // Google dork payloads (from cheat sheet)
  const dorkPayloads = [
    'site:pastebin.com "{domain}"',
    'site:github.com "{domain}"',
    'site:gitlab.com "{domain}"',
    'site:bitbucket.org "{domain}"',
    'inurl:/admin/ "{domain}"',
    'filetype:env "{domain}"',
    'filetype:log "{domain}"',
    'filetype:sql "{domain}"',
    'filetype:txt "{domain}" password',
    'filetype:xls "{domain}"',
    'filetype:csv "{domain}"',
    'intitle:index.of "{domain}"',
    'inurl:wp-content "{domain}"',
    'inurl:config "{domain}"',
    'inurl:credentials "{domain}"',
    'inurl:passwd "{domain}"',
    'inurl:secret "{domain}"',
    'inurl:token "{domain}"',
    'inurl:api "{domain}"',
    'inurl:db "{domain}"',
    'inurl:backup "{domain}"',
    'inurl:dump "{domain}"',
    'inurl:private "{domain}"',
    'inurl:login "{domain}"',
    'inurl:signin "{domain}"',
    'inurl:signup "{domain}"',
    'inurl:register "{domain}"',
    'inurl:auth "{domain}"',
    'inurl:admin "{domain}"',
    'inurl:dashboard "{domain}"',
    'inurl:portal "{domain}"',
    'inurl:console "{domain}"',
    'inurl:manage "{domain}"',
    'inurl:server "{domain}"',
    'inurl:client "{domain}"',
    'inurl:user "{domain}"',
    'inurl:account "{domain}"',
    'inurl:profile "{domain}"',
    'inurl:settings "{domain}"',
    'inurl:config "{domain}"',
    'inurl:setup "{domain}"',
    'inurl:install "{domain}"',
    'inurl:upgrade "{domain}"',
    'inurl:update "{domain}"',
    'inurl:change "{domain}"',
    'inurl:reset "{domain}"',
    'inurl:forgot "{domain}"',
    'inurl:recover "{domain}"',
    'inurl:restore "{domain}"',
    'inurl:backup "{domain}"',
    'inurl:dump "{domain}"',
    'inurl:private "{domain}"',
    'inurl:secret "{domain}"',
    'inurl:token "{domain}"',
    'inurl:api "{domain}"',
    'inurl:key "{domain}"',
    'inurl:password "{domain}"',
    'inurl:passwd "{domain}"',
    'inurl:credentials "{domain}"',
    'inurl:auth "{domain}"',
    'inurl:login "{domain}"',
    'inurl:signin "{domain}"',
    'inurl:signup "{domain}"',
    'inurl:register "{domain}"',
    'inurl:user "{domain}"',
    'inurl:account "{domain}"',
    'inurl:profile "{domain}"',
    'inurl:settings "{domain}"',
    'inurl:config "{domain}"',
    'inurl:setup "{domain}"',
    'inurl:install "{domain}"',
    'inurl:upgrade "{domain}"',
    'inurl:update "{domain}"',
    'inurl:change "{domain}"',
    'inurl:reset "{domain}"',
    'inurl:forgot "{domain}"',
    'inurl:recover "{domain}"',
    'inurl:restore "{domain}"',
  ];

  const getRiskColor = (risk: string) => {
    const riskLower = risk.toLowerCase();
    if (riskLower.includes('critical') || riskLower.includes('high')) return 'bg-red-500';
    if (riskLower.includes('medium')) return 'bg-yellow-500';
    if (riskLower.includes('low')) return 'bg-green-500';
    return 'bg-gray-500';
  };

  const getRiskBadgeVariant = (risk: string) => {
    const riskLower = risk.toLowerCase();
    if (riskLower.includes('critical') || riskLower.includes('high')) return 'destructive';
    if (riskLower.includes('medium')) return 'secondary';
    return 'default';
  };

  const getLeakTypeIcon = (leakType: string) => {
    switch (leakType?.toLowerCase()) {
      case 'database credentials':
        return <Database className="h-4 w-4" />;
      case 'api keys':
        return <Key className="h-4 w-4" />;
      case 'authentication tokens':
        return <Shield className="h-4 w-4" />;
      case 'configuration files':
        return <Settings className="h-4 w-4" />;
      case 'data dumps':
        return <FileText className="h-4 w-4" />;
      default:
        return <Code className="h-4 w-4" />;
    }
  };

  const scoreResult = (title: string, query: string) => {
    const titleLower = title.toLowerCase();
    const queryLower = query.toLowerCase();
    
    let score = 50; // base score
    
    // High-risk indicators
    if (titleLower.includes('password') || titleLower.includes('secret') || titleLower.includes('api_key')) {
      score += 40;
    }
    if (titleLower.includes('database') || titleLower.includes('db') || titleLower.includes('sql')) {
      score += 35;
    }
    if (titleLower.includes('token') || titleLower.includes('jwt') || titleLower.includes('auth')) {
      score += 30;
    }
    if (titleLower.includes('.env') || titleLower.includes('config')) {
      score += 25;
    }
    
    // Risk level classification
    if (score >= 85) return { level: 'Critical', score };
    if (score >= 70) return { level: 'High', score };
    if (score >= 50) return { level: 'Medium', score };
    return { level: 'Low', score };
  };

  const updateProgress = (current: number, total: number) => {
    const progress = Math.round((current / total) * 100);
    setScanProgress(progress);
  };

  const generateSearchQueries = (domain: string) => {
    const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/\/$/, '');
    return {
      github: [
        `"${cleanDomain}" password`,
        `"${cleanDomain}" api_key`,
        `"${cleanDomain}" secret`,
        `"${cleanDomain}" token`,
        `"${cleanDomain}" credentials`,
        `"${cleanDomain}" database`,
        `"${cleanDomain}" config`,
        `"${cleanDomain}" .env`,
        `site:github.com "${cleanDomain}" password`,
        `site:github.com "${cleanDomain}" api_key`,
      ],
      google: [
        `"${cleanDomain}" password filetype:txt`,
        `"${cleanDomain}" api_key filetype:log`,
        `"${cleanDomain}" secret`,
        `"${cleanDomain}" credentials`,
        `site:pastebin.com "${cleanDomain}"`,
        `site:github.com "${cleanDomain}" password`,
        `"${cleanDomain}" database dump`,
        `"${cleanDomain}" .env file`,
      ]
    };
  };

  const performGithubSearch = async (query: string, token: string) => {
    if (!token) {
      console.log('No GitHub token provided, skipping GitHub search');
      return [];
    }

    try {
      const response = await fetch(`https://api.github.com/search/code?q=${encodeURIComponent(query)}&per_page=10`, {
        headers:
         {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'HCARF-Scanner'
        }
      });

      if (!response.ok) {
        if (response.status === 403) {
          console.error('GitHub API rate limit exceeded or authentication failed');
          return [];
        }
        throw new Error(`GitHub API error: ${response.status}`);
      }

      const data = await response.json();
      return data.items || [];
    } catch (error) {
      console.error('GitHub search error:', error);
      return [];
    }
  };

  const performGoogleSearch = async (query: string, apiKey: string) => {
    if (!apiKey) {
      console.log('No SerpAPI key provided, skipping Google search');
      return [];
    }

    try {
      const response = await fetch(`https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(query)}&api_key=${apiKey}&num=10`);
      
      if (!response.ok) {
        throw new Error(`SerpAPI error: ${response.status}`);
      }

      const data = await response.json();
      return data.organic_results || [];
    } catch (error) {
      console.error('Google search error:', error);
      return [];
    }
  };

  // Helper: fetch and parse Google search results via CORS proxy
  const fetchGoogleResults = async (query: string) => {
    try {
      const url = `https://www.google.com/search?q=${encodeURIComponent(query)}&num=10`;
      const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;
      const res = await fetch(proxyUrl);
      if (!res.ok) return [];
      const html = await res.text();
      // Parse links from Google search result HTML
      const linkRegex = /<a href=\"\/url\?q=([^&]+)&/g;
      let match;
      const links: { title: string; url: string }[] = [];
      while ((match = linkRegex.exec(html)) !== null) {
        const url = decodeURIComponent(match[1]);
        // Filter out Google internal links
        if (!url.includes('google.com') && !url.includes('webcache.googleusercontent.com')) {
          links.push({ title: url, url });
        }
      }
      // Try to get titles (optional, fallback to url)
      if (links.length === 0) return [];
      return links;
    } catch (e) {
      return [];
    }
  };

  // Helper: fetch and parse GitHub code search results via CORS proxy
  const fetchGithubResults = async (query: string) => {
    try {
      const url = `https://github.com/search?q=${encodeURIComponent(query)}&type=code`;
      const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;
      const res = await fetch(proxyUrl);
      if (!res.ok) return [];
      const html = await res.text();
      // Parse links to code files
      const linkRegex = /<a[^>]+href=\"(\/[^\"]+\/blob\/[^\"]+)\"[^>]*>(.*?)<\/a>/g;
      let match;
      const links: { title: string; url: string }[] = [];
      while ((match = linkRegex.exec(html)) !== null) {
        const url = `https://github.com${match[1]}`;
        const title = match[2].replace(/<[^>]+>/g, '').trim() || url;
        links.push({ title, url });
      }
      if (links.length === 0) return [];
      return links;
    } catch (e) {
      return [];
    }
  };

  const handleScan = async () => {
    if (!targetDomain.trim()) {
      setError('Please enter a domain or URL to scan');
      return;
    }
    setLoading(true);
    setDorkResults([]);
    setError('');
    setTotalScanned(0);
    setScanProgress(0);

    const cleanDomain = targetDomain.replace(/^https?:\/\//, '').replace(/\/$/, '');
    const queries = dorkPayloads.map(payload => payload.replace(/\{domain\}/g, cleanDomain));

    let foundResults: { query: string; links: { title: string; url: string }[] }[] = [];

    // If API mode and key, use SerpAPI as before
    if (useApi && serpApiKey) {
      for (let i = 0; i < queries.length; i++) {
        const query = queries[i];
        setScanProgress(Math.round(((i + 1) / queries.length) * 100));
        try {
          const serpResults = await performGoogleSearch(query, serpApiKey);
          if (serpResults && serpResults.length > 0) {
            foundResults.push({
              query,
              links: serpResults.map(r => ({
                title: r.title || r.link,
                url: r.link,
              })),
            });
          }
        } catch (e) {}
      }
      setDorkResults(foundResults);
      setLoading(false);
      setScanProgress(100);
      if (foundResults.length === 0) setError('No exposed results found for this domain.');
      return;
    }

    // No API: scan Google and GitHub via CORS proxy and parse real links
    for (let i = 0; i < queries.length; i++) {
      const query = queries[i];
      setScanProgress(Math.round(((i + 1) / queries.length) * 100));
      // Google
      const googleLinks = await fetchGoogleResults(query);
      if (googleLinks.length > 0) {
        foundResults.push({ query: `[Google] ${query}`, links: googleLinks });
      }
      // GitHub
      const githubLinks = await fetchGithubResults(query);
      if (githubLinks.length > 0) {
        foundResults.push({ query: `[GitHub] ${query}`, links: githubLinks });
      }
    }
    setDorkResults(foundResults);
    setLoading(false);
    setScanProgress(100);
    if (foundResults.length === 0) {
      setError('No exposed results found for this domain. (Or blocked by proxy/CORS)');
    }
  };

  const criticalCount = results.filter(r => r.risk.toLowerCase().includes('critical')).length;
  const highCount = results.filter(r => r.risk.toLowerCase().includes('high')).length;
  const mediumCount = results.filter(r => r.risk.toLowerCase().includes('medium')).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 md:p-8">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-red-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse delay-1000"></div>
      </div>

      <div className="max-w-7xl mx-auto space-y-8 relative z-10">
        {/* Enhanced Header */}
        <div className="text-center space-y-6">
          <div className="flex items-center justify-center space-x-4 mb-6">
            <div className="relative">
              <div className="p-4 bg-gradient-to-r from-red-500 to-purple-600 rounded-full animate-pulse">
                <Shield className="h-10 w-10 text-white" />
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-purple-600 rounded-full blur-lg opacity-50 animate-ping"></div>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-red-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              HCARF Scanner
            </h1>
          </div>
          <p className="text-slate-300 text-xl max-w-3xl mx-auto leading-relaxed">
            Advanced leak detection system for domains and websites. 
            Discover exposed credentials, API keys, and sensitive information across GitHub, Google, and other platforms.
          </p>
          <div className="flex justify-center space-x-4 text-sm text-slate-400">
            <div className="flex items-center space-x-1">
              <Github className="h-4 w-4" />
              <span>GitHub Integration</span>
            </div>
            <div className="flex items-center space-x-1">
              <Globe className="h-4 w-4" />
              <span>Google Search</span>
            </div>
            <div className="flex items-center space-x-1">
              <Eye className="h-4 w-4" />
              <span>Real-time Scanning</span>
            </div>
          </div>
        </div>

        {/* Enhanced Scan Input Panel */}
        <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-xl shadow-2xl">
          <CardHeader>
            <CardTitle className="text-slate-100 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Link className="h-6 w-6 text-blue-400" />
                <span className="text-2xl">Target Analysis</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowApiFields(!showApiFields)}
                className="text-slate-400 hover:text-slate-200"
              >
                <Settings className="h-4 w-4 mr-2" />
                API Config
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <label className="text-base font-medium text-slate-200">
                Domain or URL to Scan
              </label>
              <Input
                type="text"
                className="bg-slate-700/50 border-slate-600 text-slate-100 placeholder-slate-400 text-lg py-3"
                value={targetDomain}
                onChange={(e) => setTargetDomain(e.target.value)}
                placeholder="example.com or https://example.com"
              />
              <p className="text-sm text-slate-400">
                🔍 The scanner will search for leaked credentials, API keys, and sensitive data related to this domain
              </p>
            </div>

            {/* API Configuration Section */}
            <div className="space-y-4 p-4 bg-slate-700/30 rounded-lg border border-slate-600">
              <h3 className="text-lg font-medium text-slate-200 mb-3">API Configuration (Optional for Live Scanning)</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">GitHub Token</label>
                  <Input
                    type="password"
                    className="bg-slate-700/50 border-slate-600 text-slate-100"
                    value={githubToken}
                    onChange={(e) => setGithubToken(e.target.value)}
                    placeholder="ghp_xxxxxxxxxxxx"
                  />
                  <p className="text-xs text-slate-500">
                    Get your token from GitHub Settings → Developer settings → Personal access tokens
                  </p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">SerpAPI Key</label>
                  <Input
                    type="password"
                    className="bg-slate-700/50 border-slate-600 text-slate-100"
                    value={serpApiKey}
                    onChange={(e) => setSerpApiKey(e.target.value)}
                    placeholder="serpapi_key_xxxxxx"
                  />
                  <p className="text-xs text-slate-500">
                    Get your API key from serpapi.com
                  </p>
                </div>
              </div>
              <Alert className="bg-blue-900/20 border-blue-800 text-blue-300">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  API keys are optional. Without API keys, only external leaks will be available. Provide keys for live GitHub/Google scanning.
                </AlertDescription>
              </Alert>
            </div>

            {error && (
              <Alert className="bg-red-900/20 border-red-800 text-red-300">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex items-center gap-4 mb-6">
              <label className="flex items-center gap-2 text-slate-300">
                <input type="checkbox" checked={useApi} onChange={e => setUseApi(e.target.checked)} />
                Use API keys for advanced scan (optional)
              </label>
            </div>

            <Button
              onClick={handleScan}
              disabled={loading || !targetDomain.trim()}
              className="w-full bg-gradient-to-r from-red-600 via-purple-600 to-pink-600 hover:from-red-500 hover:via-purple-500 hover:to-pink-500 text-white font-bold py-4 px-8 rounded-xl text-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            >
              {loading ? (
                <div className="flex items-center space-x-3">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Scanning for Vulnerabilities...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  <Search className="h-5 w-5" />
                  <span>Launch Live Security Scan</span>
                  <Zap className="h-5 w-5" />
                </div>
              )}
            </Button>

            {loading && (
              <div className="space-y-3">
                <div className="flex justify-between text-sm text-slate-400">
                  <span>🔍 Performing live searches across platforms...</span>
                  <span className="font-mono">{Math.round(scanProgress)}%</span>
                </div>
                <Progress value={scanProgress} className="h-3 bg-slate-700" />
                <div className="flex justify-center space-x-6 text-xs text-slate-500">
                  <span className="flex items-center space-x-1">
                    <Github className="h-3 w-3" />
                    <span>GitHub API</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <Globe className="h-3 w-3" />
                    <span>SerpAPI</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <FileText className="h-3 w-3" />
                    <span>Live Search</span>
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dork Results Section */}
        {dorkResults.length > 0 && (
          <Card className="bg-slate-800/50 border-slate-700 mb-8">
            <CardHeader>
              <CardTitle className="text-slate-100 flex items-center space-x-3">
                <Search className="h-6 w-6 text-yellow-400" />
                <span className="text-2xl">Google Dork Results</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4">
                {dorkResults.map((dork, idx) => (
                  <li key={idx} className="bg-slate-700/40 p-3 rounded">
                    <div className="font-mono text-slate-200 text-xs mb-2">{dork.query}</div>
                    {dork.links.map((link, lidx) => (
                      <a key={lidx} href={link.url} target="_blank" rel="noopener noreferrer" className="text-blue-400 underline text-sm">
                        {link.title}
                      </a>
                    ))}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Enhanced Results Summary */}
        {results.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm hover:bg-slate-800/70 transition-all">
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-slate-100 mb-1">{totalScanned}</div>
                <div className="text-sm text-slate-400">Total Detected</div>
                <div className="w-full h-1 bg-blue-500 rounded mt-2"></div>
              </CardContent>
            </Card>
            <Card className="bg-red-900/20 border-red-800 hover:bg-red-900/30 transition-all">
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-red-300 mb-1">{criticalCount}</div>
                <div className="text-sm text-red-400">Critical Risk</div>
                <div className="w-full h-1 bg-red-500 rounded mt-2"></div>
              </CardContent>
            </Card>
            <Card className="bg-yellow-900/20 border-yellow-800 hover:bg-yellow-900/30 transition-all">
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-yellow-300 mb-1">{highCount}</div>
                <div className="text-sm text-yellow-400">High Risk</div>
                <div className="w-full h-1 bg-yellow-500 rounded mt-2"></div>
              </CardContent>
            </Card>
            <Card className="bg-green-900/20 border-green-800 hover:bg-green-900/30 transition-all">
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-green-300 mb-1">{mediumCount}</div>
                <div className="text-sm text-green-400">Medium Risk</div>
                <div className="w-full h-1 bg-green-500 rounded mt-2"></div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Enhanced Results Display */}
        <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-xl shadow-2xl">
          <CardHeader>
            <CardTitle className="text-slate-100 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Eye className="h-6 w-6 text-red-400" />
                <span className="text-2xl">Security Vulnerabilities Detected</span>
              </div>
              {results.length > 0 && (
                <Badge variant="secondary" className="px-3 py-1 text-sm">
                  {results.length} vulnerabilities found
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {results.length === 0 && !loading ? (
              <div className="text-center py-16">
                <div className="relative mb-6">
                  <Lock className="h-20 w-20 text-slate-600 mx-auto" />
                  <div className="absolute inset-0 bg-green-500 rounded-full blur-xl opacity-20 animate-pulse"></div>
                </div>
                <p className="text-slate-400 text-xl mb-2">No security vulnerabilities detected</p>
                <p className="text-slate-500">Enter a domain above to begin scanning for potential security risks and data leaks.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {results.map((result, index) => (
                  <Card key={index} className="bg-gradient-to-r from-slate-700/50 to-slate-800/50 border-slate-600 hover:from-slate-700/70 hover:to-slate-800/70 transition-all duration-300 transform hover:scale-[1.02]">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-start space-x-4 flex-1">
                          <div className="flex-shrink-0 p-2 bg-slate-700 rounded-lg">
                            {result.platform === 'GitHub' ? (
                              <Github className="h-6 w-6 text-slate-300" />
                            ) : (
                              <Globe className="h-6 w-6 text-slate-300" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-slate-100 text-lg mb-2 break-words">{result.title}</h3>
                            <div className="flex flex-wrap items-center gap-3 text-sm text-slate-400 mb-3">
                              <span className="flex items-center space-x-1">
                                <span>Source:</span>
                                <span className="font-medium text-slate-300">{result.platform}</span>
                              </span>
                              <span className="flex items-center space-x-1">
                                {getLeakTypeIcon(result.leakType || '')}
                                <span>Type:</span>
                                <span className="font-medium text-slate-300">{result.leakType || 'Unknown'}</span>
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end space-y-2 flex-shrink-0">
                          <Badge variant={getRiskBadgeVariant(result.risk)} className="text-sm font-bold">
                            {result.risk}
                          </Badge>
                          <div className="text-xs text-slate-400">
                            Score: {result.riskLevel}/100
                          </div>
                        </div>
                      </div>
                      
                      {result.description && (
                        <p className="text-sm text-slate-300 mb-4 bg-slate-700/30 p-3 rounded-lg border-l-4 border-blue-500">
                          {result.description}
                        </p>
                      )}
                      
                      <div className="bg-slate-900/50 rounded-lg p-4 mb-4 border border-slate-600">
                        <p className="text-xs text-slate-400 mb-2 font-medium">🔍 Search Query Used:</p>
                        <code className="text-sm text-green-400 bg-slate-800 px-2 py-1 rounded font-mono break-all">
                          {result.query}
                        </code>
                      </div>
                      
                      <Separator className="my-4 bg-slate-600" />
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-6">
                          <div className="flex items-center space-x-2">
                            <div className={`w-4 h-4 rounded-full ${getRiskColor(result.risk)} animate-pulse`}></div>
                            <span className="text-sm text-slate-400">
                              Risk Level: <span className="font-medium text-slate-300">{result.riskLevel}/100</span>
                            </span>
                          </div>
                          <div className="text-xs text-slate-500">
                            {new Date(result.timestamp || '').toLocaleString()}
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-slate-600 text-slate-300 hover:bg-slate-600 hover:text-white transition-colors"
                          onClick={() => window.open(result.link, '_blank')}
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Investigate
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Enhanced Footer */}
        <div className="text-center text-slate-500 text-sm space-y-2 bg-slate-800/30 rounded-lg p-6">
          <div className="flex justify-center items-center space-x-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
            <p className="font-medium">⚠️ Use responsibly and ethically</p>
          </div>
          <p>Only scan domains you own or have explicit permission to test. This tool searches for publicly available information.</p>
          <p className="text-xs mt-4 text-slate-600">
            Powered by advanced dorking techniques • Real-time vulnerability detection • Comprehensive security analysis
          </p>
        </div>
      </div>
    </div>
  );
};

export default Index;
