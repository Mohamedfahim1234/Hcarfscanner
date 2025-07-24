import { useState, useEffect } from "react";
import { Search, Shield, AlertTriangle, Github, Globe, Settings, Zap, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExportPanel } from "@/components/ExportPanel";
import { ResultsPanel } from "@/components/ResultsPanel";
import { LoadingAnimation } from "@/components/LoadingAnimation";
import { toast } from "@/hooks/use-toast";
import { ApiConfigPanel } from "@/components/ApiConfigPanel";
import AIAssistantSidebar from "@/components/AIAssistantSidebar";
import { LegalNoticeModal } from "@/components/LegalNoticeModal";

const Index = () => {
  const [domain, setDomain] = useState("");
  const [captcha, setCaptcha] = useState("");
  const [captchaValue, setCaptchaValue] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [showApiConfig, setShowApiConfig] = useState(false);
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [captchaVerified, setCaptchaVerified] = useState(() => localStorage.getItem("captchaVerified") === "true");
  const [apiKeys, setApiKeys] = useState(() => {
    // Load from sessionStorage if available
    return {
      githubToken: sessionStorage.getItem("githubToken") || "",
      googleApiKey: sessionStorage.getItem("googleApiKey") || "",
      googleCx: sessionStorage.getItem("googleCx") || ""
    };
  });
  const [showExportPanel, setShowExportPanel] = useState(false);

  function generateCaptcha() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let val = '';
    for (let i = 0; i < 6; i++) val += chars[Math.floor(Math.random() * chars.length)];
    return val;
  }

  useEffect(() => {
    setCaptchaValue(generateCaptcha());
  }, []);

  function getExportData() {
    return {
      domain,
      timestamp: new Date().toISOString(),
      totalResults: results.length,
      vulnerabilities: results,
      errors: [],
      metadata: {
        scanDuration: 0,
        totalQueries: 0,
        successfulQueries: results.length,
        failedQueries: 0
      }
    };
  }

  function renderCaptcha() {
    return (
      <div className="flex items-center gap-2 mt-4">
        <span className="font-mono text-lg bg-slate-700 px-3 py-2 rounded text-cyan-300 tracking-widest select-none">{captchaValue}</span>
        <Input
          type="text"
          placeholder="Enter CAPTCHA"
          value={captcha}
          onChange={e => setCaptcha(e.target.value.toUpperCase())}
          className="w-40 bg-slate-700 border-slate-600 text-white placeholder-gray-400"
        />
        <Button variant="outline" onClick={() => setCaptchaValue(generateCaptcha())}>↻</Button>
      </div>
    );
  }

  async function handleScan() {
    // Always use latest keys from sessionStorage
    const keys = {
      githubToken: sessionStorage.getItem("githubToken") || "",
      googleApiKey: sessionStorage.getItem("googleApiKey") || "",
      googleCx: sessionStorage.getItem("googleCx") || ""
    };
    if (!keys.githubToken) {
      toast({ title: "Please enter your GitHub API key in the config panel." });
      setShowApiConfig(true);
      return;
    }
    if (!captchaVerified || captcha !== captchaValue) {
      toast({ title: "Please complete the CAPTCHA before scanning." });
      return;
    }
    setIsScanning(true);
    setResults([]);
    try {
      // Dynamically import the GitHub scanner
      const { performGitHubSearch } = await import("@/utils/gitScanner");
      const findings = await performGitHubSearch([domain], keys.githubToken);
      setResults(findings || []);
      setShowExportPanel(true);
    } catch (err) {
      toast({ title: "Scan failed", description: err?.message || String(err) });
    } finally {
      setIsScanning(false);
    }
  }

  return (
    <>
      <LegalNoticeModal />
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 md:p-8">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,255,0.1)_1px,transparent_1px)] bg-[size:50px_50px] animate-pulse opacity-30"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-500/10 to-transparent animate-pulse"></div>
        <div className="relative z-10 container mx-auto px-4 py-8">
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
              <Badge variant="outline" className="border-[#00e6e6] text-[#00e6e6] flex items-center">
                <Github className="h-3 w-3 mr-1" />
                GitHub Integration
              </Badge>
              <Badge variant="outline" className="border-[#8833ff] text-[#8833ff] flex items-center">
                <Globe className="h-3 w-3 mr-1" />
                Google Search
              </Badge>
              <Badge variant="outline" className="border-purple-400 text-purple-400 flex items-center">
                <Shield className="h-3 w-3 mr-1" />
                Real-time Scanning
              </Badge>
            </div>
          </div>
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
                    onChange={e => setDomain(e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white placeholder-gray-400 h-14 text-lg focus:border-cyan-400 transition-colors"
                    disabled={isScanning}
                    onKeyPress={e => e.key === 'Enter' && !isScanning && handleScan()}
                  />
                </div>
                <Button
                  onClick={() => setShowApiConfig(true)}
                  variant="outline"
                  className="border-slate-600 text-white hover:bg-slate-700 h-14 px-6"
                  disabled={isScanning}
                  title="Show API key/configuration panel"
                >
                  <Settings className="h-5 w-5" />
                </Button>
                {showApiConfig && (
                  <ApiConfigPanel
                    onConfigured={(newKeys) => {
                      if (newKeys) {
                        setApiKeys({
                          githubToken: newKeys.githubToken || "",
                          googleApiKey: newKeys.googleApiKey || "",
                          googleCx: newKeys.googleCx || ""
                        });
                        // Save each key to sessionStorage
                        Object.entries(newKeys).forEach(([k, v]) => {
                          if (v) sessionStorage.setItem(k, v);
                          else sessionStorage.removeItem(k);
                        });
                      }
                      setShowApiConfig(false);
                    }}
                    isCaptchaVerified={captchaVerified}
                  />
                )}
                <Button
                  onClick={handleScan}
                  disabled={isScanning || !domain.trim() || captcha !== captchaValue}
                  className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white h-14 px-10 text-lg font-semibold disabled:opacity-50 cyber-glow"
                  title={captcha !== captchaValue ? 'Complete CAPTCHA to enable scan' : 'Start scan'}
                >
                  {isScanning ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Scanning...
                    </>
                  ) : "Start Scan"}
                </Button>
              </div>
              {/* CAPTCHA */}
              {captcha !== captchaValue && renderCaptcha()}
              {/* Export Panel (single instance, after scan) */}
              {showExportPanel && !isScanning && (
                <div className="mb-6">
                  <ExportPanel exportData={getExportData()} />
                  <div className="flex flex-wrap gap-4 mt-4">
                    <Button
                      variant="outline"
                      className="border-cyan-400 text-cyan-300 hover:bg-slate-700"
                      onClick={async () => {
                        const { exportFindingsAsMarkdown } = await import('@/utils/exportUtils');
                        const md = exportFindingsAsMarkdown(getExportData().vulnerabilities);
                        const blob = new Blob([md], { type: 'text/markdown' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `${domain || 'scan'}-hcarf-report.md`;
                        a.click();
                        URL.revokeObjectURL(url);
                      }}
                    >
                      Export as Markdown
                    </Button>
                    <Button
                      variant="outline"
                      className="border-green-400 text-green-300 hover:bg-slate-700"
                      onClick={async () => {
                        const { exportFindingsAsJSON } = await import('@/utils/exportUtils');
                        const json = exportFindingsAsJSON(getExportData().vulnerabilities);
                        const blob = new Blob([json], { type: 'application/json' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `${domain || 'scan'}-hcarf-report.json`;
                        a.click();
                        URL.revokeObjectURL(url);
                      }}
                    >
                      Export as JSON
                    </Button>
                    <Button
                      variant="outline"
                      className="border-yellow-400 text-yellow-300 hover:bg-slate-700"
                      onClick={async () => {
                        const data = getExportData();
                        const rows = [
                          ["Platform","Title","Risk","Link","Description","Query","Type","Recommendation"],
                          ...data.vulnerabilities.map(v => [
                            v.platform,
                            v.title,
                            v.risk,
                            v.link,
                            (v.description || '').replace(/\n/g, ' '),
                            v.query,
                            v.vulnerabilityType,
                            (v.recommendation || '').replace(/\n/g, ' ')
                          ])
                        ];
                        const csv = rows.map(r => r.map(x => '\"'+String(x).replace(/\"/g,'\"\"')+'\"').join(",")).join("\r\n");
                        const blob = new Blob([csv], { type: 'text/csv' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `${domain || 'scan'}-hcarf-report.csv`;
                        a.click();
                        URL.revokeObjectURL(url);
                      }}
                    >
                      Export as CSV
                    </Button>
                  </div>
                </div>
              )}
              {/* Results */}
              {results.length > 0 && !isScanning && (
                <ResultsPanel results={results} domain={domain} />
              )}
            </CardContent>
          </Card>
          {/* Loading Animation */}
          {isScanning && <LoadingAnimation domain={domain} />}
          {/* Only show AI Assistant sidebar if API Config is not open */}
          {!showApiConfig && (
            <AIAssistantSidebar open={showAIAssistant} setOpen={setShowAIAssistant} />
          )}
        </div>
      </div>
      {/* Floating AI Assistant Button */}
      {!showAIAssistant && !showApiConfig && (
        <button
          onClick={() => setShowAIAssistant(true)}
          className="fixed bottom-8 right-8 z-[10000] bg-gradient-to-br from-fuchsia-500 via-cyan-500 to-blue-500 hover:from-fuchsia-400 hover:to-blue-400 text-white rounded-full shadow-2xl border-2 border-fuchsia-300/60 p-0 flex items-center gap-3 px-6 py-3 text-lg font-bold transition-all focus:outline-none focus:ring-2 focus:ring-fuchsia-400 animate-bounce-in"
          style={{ boxShadow: '0 4px 32px #a21caf55' }}
        >
          <span className="mr-2"><Sparkles className="inline w-6 h-6 animate-pulse" /></span>
          AI Assistant
        </button>
      )}
    </>
  );
};

export default Index;