import { performGitHubSearch } from "../utils/gitScanner";
import { performGoogleSearch } from "../utils/googleScanner";
import { generatePayloadsWithAI } from "../utils/generatePayloadsWithAI";
import { validateFindingWithAI } from "../utils/validateFindingWithAI";

export interface ScanResult {
  source: "github" | "google";
  url: string;
  severity?: "low" | "medium" | "high";
  description?: string;
  isFalsePositive?: boolean;
}

export interface ScanSummary {
  totalFindings: number;
  highRisks: number;
  mediumRisks: number;
  lowRisks: number;
  falsePositives: number;
  summaryText: string;
}

export async function runDomainScan(
  domain: string,
  sources: string[] = ["GitHub", "Google"]
): Promise<{ 
  domain: string; 
  payloads: string[]; 
  results: ScanResult[]; 
  summary: ScanSummary 
}> {
  if (!domain) throw new Error("No domain provided to runDomainScan");

  console.log(`🚀 Starting scan for ${domain}`);

  // 1️⃣ Generate AI payloads
  const payloads = await generatePayloadsWithAI(domain, sources);

  let results: ScanResult[] = [];

  // 2️⃣ Run scans
  for (const source of sources) {
    if (source.toLowerCase() === "github") {
      try {
        const gitResults = await performGitHubSearch([`"${domain}"`], process.env.GITHUB_TOKEN || "");
        results.push(...gitResults.map(r => ({
          source: "github" as const,
          url: r.link,
          severity: r.risk || "medium",
          description: r.description || ""
        })));
      } catch (err) { console.error("[Scanner] GitHub scan failed:", err); }
    }
    if (source.toLowerCase() === "google") {
      try {
        const googleResults = await performGoogleSearch(domain);
        results.push(...googleResults.map(r => ({
          source: "google" as const,
          url: r.link,
          severity: r.risk || "low",
          description: r.snippet || ""
        })));
      } catch (err) { console.error("[Scanner] Google scan failed:", err); }
    }
  }

  // 3️⃣ Remove duplicates
  results = results.filter((v, i, a) => a.findIndex(t => t.url === v.url) === i);

  // 4️⃣ Validate findings with AI (mark false positives)
  for (let res of results) {
    try {
      const isValid = await validateFindingWithAI(domain, res.url, res.description || "");
      res.isFalsePositive = !isValid;
    } catch (err) {
      console.error("[Scanner] AI validation failed:", err);
    }
  }

  // 5️⃣ Create summary
  const highRisks = results.filter(r => r.severity === "high" && !r.isFalsePositive).length;
  const mediumRisks = results.filter(r => r.severity === "medium" && !r.isFalsePositive).length;
  const lowRisks = results.filter(r => r.severity === "low" && !r.isFalsePositive).length;
  const falsePositives = results.filter(r => r.isFalsePositive).length;

  const summary: ScanSummary = {
    totalFindings: results.length,
    highRisks,
    mediumRisks,
    lowRisks,
    falsePositives,
    summaryText: `Scan completed for ${domain}. Found ${results.length} total findings: ${highRisks} high-risk, ${mediumRisks} medium-risk, ${lowRisks} low-risk, and ${falsePositives} false positives.`
  };

  return {
    domain,
    payloads,
    results,
    summary
  };
}