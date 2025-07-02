
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Key, Github, Globe } from "lucide-react";

interface ConfigPanelProps {
  apiKeys: {
    githubToken: string;
    serpApiKey: string;
  };
  setApiKeys: (keys: { githubToken: string; serpApiKey: string }) => void;
}

export const ConfigPanel = ({ apiKeys, setApiKeys }: ConfigPanelProps) => {
  return (
    <Card className="bg-slate-700/50 border-slate-600">
      <CardHeader>
        <CardTitle className="text-white flex items-center text-sm">
          <Key className="mr-2 h-4 w-4 text-cyan-400" />
          API Configuration
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="github-token" className="text-gray-300 flex items-center mb-2">
            <Github className="mr-2 h-4 w-4" />
            GitHub Personal Access Token
          </Label>
          <Input
            id="github-token"
            type="password"
            placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
            value={apiKeys.githubToken}
            onChange={(e) => setApiKeys({ ...apiKeys, githubToken: e.target.value })}
            className="bg-slate-600 border-slate-500 text-white placeholder-gray-400"
          />
          <p className="text-xs text-gray-400 mt-1">
            Optional: Increases rate limits for GitHub searches
          </p>
        </div>
        
        <div>
          <Label htmlFor="serp-key" className="text-gray-300 flex items-center mb-2">
            <Globe className="mr-2 h-4 w-4" />
            SerpAPI Key
          </Label>
          <Input
            id="serp-key"
            type="password"
            placeholder="Your SerpAPI key"
            value={apiKeys.serpApiKey}
            onChange={(e) => setApiKeys({ ...apiKeys, serpApiKey: e.target.value })}
            className="bg-slate-600 border-slate-500 text-white placeholder-gray-400"
          />
          <p className="text-xs text-gray-400 mt-1">
            Optional: Enables advanced Google search capabilities
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
