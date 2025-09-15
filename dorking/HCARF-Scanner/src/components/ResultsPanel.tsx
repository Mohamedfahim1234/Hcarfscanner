
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, Github, Globe, ExternalLink, Shield, Zap } from "lucide-react";

interface ScanResult {
  platform: "GitHub" | "Google";
  query: string;
  title: string;
  link: string;
  risk: "low" | "medium" | "high" | "critical";
  description?: string;
}

interface ResultsPanelProps {
  results: ScanResult[];
  domain: string;
}

export const ResultsPanel = ({ results, domain }: ResultsPanelProps) => {
  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "critical": return "bg-red-500 text-white";
      case "high": return "bg-orange-500 text-white";
      case "medium": return "bg-yellow-500 text-black";
      case "low": return "bg-green-500 text-white";
      default: return "bg-gray-500 text-white";
    }
  };

  const getRiskIcon = (risk: string) => {
    switch (risk) {
      case "critical": return <AlertTriangle className="h-4 w-4" />;
      case "high": return <AlertTriangle className="h-4 w-4" />;
      case "medium": return <Shield className="h-4 w-4" />;
      case "low": return <Shield className="h-4 w-4" />;
      default: return <Shield className="h-4 w-4" />;
    }
  };

  const githubResults = results.filter(r => r.platform === "GitHub");
  const googleResults = results.filter(r => r.platform === "Google");
  const criticalResults = results.filter(r => r.risk === "critical" || r.risk === "high");

  return (
    <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-white flex items-center justify-between">
          <div className="flex items-center">
            <Zap className="mr-2 text-cyan-400" />
            Scan Results for {domain}
          </div>
          <Badge variant="outline" className="text-cyan-400 border-cyan-400">
            {results.length} Total Findings
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {results.length === 0 ? (
          <div className="text-center py-12">
            <Shield className="h-16 w-16 text-green-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No Leaks Detected</h3>
            <p className="text-gray-400">
              Great news! No obvious data leaks were found for {domain}
            </p>
          </div>
        ) : (
          <>
            {/* Critical Alerts */}
            {criticalResults.length > 0 && (
              <div className="mb-6 p-4 bg-red-900/20 border border-red-500/50 rounded-lg">
                <div className="flex items-center mb-3">
                  <AlertTriangle className="h-5 w-5 text-red-400 mr-2" />
                  <h4 className="text-lg font-semibold text-red-400">Critical Findings</h4>
                </div>
                <p className="text-gray-300 mb-3">
                  {criticalResults.length} high-risk leak(s) detected. Immediate attention required!
                </p>
                <div className="space-y-2">
                  {criticalResults.slice(0, 3).map((result, index) => (
                    <div key={index} className="flex items-center justify-between bg-red-900/30 p-2 rounded">
                      <span className="text-red-300 text-sm">{result.title}</span>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-red-400 text-red-400 hover:bg-red-400 hover:text-white"
                        onClick={() => window.open(result.link, '_blank')}
                      >
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Tabs defaultValue="all" className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-slate-700">
                <TabsTrigger value="all" className="data-[state=active]:bg-slate-600">
                  All Results ({results.length})
                </TabsTrigger>
                <TabsTrigger value="github" className="data-[state=active]:bg-slate-600">
                  <Github className="h-4 w-4 mr-2" />
                  GitHub ({githubResults.length})
                </TabsTrigger>
                <TabsTrigger value="google" className="data-[state=active]:bg-slate-600">
                  <Globe className="h-4 w-4 mr-2" />
                  Google ({googleResults.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="space-y-4 mt-6">
                {results.map((result, index) => (
                  <Card key={index} className="bg-slate-700/50 border-slate-600">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center mb-2">
                            {result.platform === "GitHub" ? (
                              <Github className="h-4 w-4 text-white mr-2" />
                            ) : (
                              <Globe className="h-4 w-4 text-white mr-2" />
                            )}
                            <h4 className="font-semibold text-white">{result.title}</h4>
                            <Badge className={`ml-2 ${getRiskColor(result.risk)}`}>
                              {getRiskIcon(result.risk)}
                              <span className="ml-1 capitalize">{result.risk}</span>
                            </Badge>
                          </div>
                          {result.description && (
                            <p className="text-gray-300 text-sm mb-2">{result.description}</p>
                          )}
                          <p className="text-gray-400 text-xs">Query: {result.query}</p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-slate-500 text-white hover:bg-slate-600 ml-4"
                          onClick={() => window.open(result.link, '_blank')}
                        >
                          <ExternalLink className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="github" className="space-y-4 mt-6">
                {githubResults.map((result, index) => (
                  <Card key={index} className="bg-slate-700/50 border-slate-600">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center mb-2">
                            <Github className="h-4 w-4 text-white mr-2" />
                            <h4 className="font-semibold text-white">{result.title}</h4>
                            <Badge className={`ml-2 ${getRiskColor(result.risk)}`}>
                              {getRiskIcon(result.risk)}
                              <span className="ml-1 capitalize">{result.risk}</span>
                            </Badge>
                          </div>
                          {result.description && (
                            <p className="text-gray-300 text-sm mb-2">{result.description}</p>
                          )}
                          <p className="text-gray-400 text-xs">Query: {result.query}</p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-slate-500 text-white hover:bg-slate-600 ml-4"
                          onClick={() => window.open(result.link, '_blank')}
                        >
                          <ExternalLink className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="google" className="space-y-4 mt-6">
                {googleResults.map((result, index) => (
                  <Card key={index} className="bg-slate-700/50 border-slate-600">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center mb-2">
                            <Globe className="h-4 w-4 text-white mr-2" />
                            <h4 className="font-semibold text-white">{result.title}</h4>
                            <Badge className={`ml-2 ${getRiskColor(result.risk)}`}>
                              {getRiskIcon(result.risk)}
                              <span className="ml-1 capitalize">{result.risk}</span>
                            </Badge>
                          </div>
                          {result.description && (
                            <p className="text-gray-300 text-sm mb-2">{result.description}</p>
                          )}
                          <p className="text-gray-400 text-xs">Query: {result.query}</p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-slate-500 text-white hover:bg-slate-600 ml-4"
                          onClick={() => window.open(result.link, '_blank')}
                        >
                          <ExternalLink className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>
            </Tabs>
          </>
        )}
      </CardContent>
    </Card>
  );
};
