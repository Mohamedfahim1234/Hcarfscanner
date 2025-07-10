import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';

export interface ExportData {
  domain: string;
  timestamp: string;
  totalResults: number;
  vulnerabilities: Array<{
    platform: string;
    title: string;
    risk: string;
    link: string;
    description?: string;
    query: string;
    vulnerabilityType: string;
    recommendation: string;
    snippet?: string;
  }>;
  corsVulnerabilities?: Array<{
    type: string;
    severity: string;
    description: string;
    recommendation: string;
  }>;
  errors: Array<{
    platform: string;
    query: string;
    error: string;
    reason: string;
  }>;
  metadata: {
    scanDuration: number;
    totalQueries: number;
    successfulQueries: number;
    failedQueries: number;
  };
}

// Security recommendation generator
export const generateSecurityRecommendation = (title: string, link: string, description?: string): { type: string; recommendation: string } => {
  const content = `${title} ${description || ''} ${link}`.toLowerCase();
  
  // Pattern matching for vulnerability types and recommendations
  if (content.includes('.env') || content.includes('environment')) {
    return {
      type: 'Environment Variables Exposure',
      recommendation: 'Immediately rotate all exposed secrets and remove sensitive files from Git history. Use environment variables or secrets managers like HashiCorp Vault.'
    };
  }
  
  if (content.includes('password') || content.includes('pwd') || content.includes('secret') || content.includes('key')) {
    return {
      type: 'Hardcoded Credentials',
      recommendation: 'Remove hardcoded credentials immediately. Migrate to environment variables or secure secrets management. Change all exposed passwords.'
    };
  }
  
  if (content.includes('database') || content.includes('db_') || content.includes('mongodb') || content.includes('mysql') || content.includes('postgres')) {
    return {
      type: 'Database Configuration Exposure',
      recommendation: 'Change database credentials immediately. Implement IP whitelisting and use connection pooling with encrypted connections.'
    };
  }
  
  if (content.includes('api_key') || content.includes('token') || content.includes('bearer')) {
    return {
      type: 'API Key Exposure',
      recommendation: 'Revoke and regenerate all exposed API keys. Implement proper API key rotation policies and use short-lived tokens where possible.'
    };
  }
  
  if (content.includes('aws') || content.includes('s3') || content.includes('amazon')) {
    return {
      type: 'Cloud Service Credentials',
      recommendation: 'Immediately rotate AWS credentials. Review IAM policies and implement least privilege access. Enable CloudTrail for monitoring.'
    };
  }
  
  if (content.includes('config') || content.includes('settings')) {
    return {
      type: 'Configuration File Exposure',
      recommendation: 'Review and secure configuration files. Remove sensitive data and use secure configuration management practices.'
    };
  }
  
  if (content.includes('email') || content.includes('@')) {
    return {
      type: 'Email Address Exposure',
      recommendation: 'Consider using role-based email addresses. Implement email masking in public repositories and documentation.'
    };
  }
  
  if (content.includes('pastebin') || content.includes('paste')) {
    return {
      type: 'Paste Service Leak',
      recommendation: 'Contact paste service to remove sensitive content. Implement monitoring for organization data on paste sites.'
    };
  }
  
  if (content.includes('cors') || content.includes('cross-origin')) {
    return {
      type: 'CORS Misconfiguration',
      recommendation: 'Restrict CORS policy to trusted origins only. Avoid wildcard (*) origins in production environments.'
    };
  }
  
  // Default for unknown patterns
  return {
    type: 'Potential Information Disclosure',
    recommendation: 'Review the exposed content for sensitive information. Consider making repositories private or removing sensitive files.'
  };
};

export const exportToPDF = (data: ExportData) => {
  const doc = new jsPDF();
  let yPosition = 20;

  // Header
  doc.setFontSize(20);
  doc.text('Leak Hunter Pro - Security Scan Report', 20, yPosition);
  yPosition += 20;

  // Basic info
  doc.setFontSize(12);
  doc.text(`Domain: ${data.domain}`, 20, yPosition);
  yPosition += 10;
  doc.text(`Scan Date: ${data.timestamp}`, 20, yPosition);
  yPosition += 10;
  doc.text(`Total Vulnerabilities Found: ${data.totalResults}`, 20, yPosition);
  yPosition += 20;

  // Vulnerabilities section
  if (data.vulnerabilities.length > 0) {
    doc.setFontSize(16);
    doc.text('Security Vulnerabilities Found:', 20, yPosition);
    yPosition += 15;

    data.vulnerabilities.forEach((vuln, index) => {
      if (yPosition > 260) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(12);
      doc.text(`${index + 1}. [${vuln.risk.toUpperCase()}] ${vuln.title}`, 25, yPosition);
      yPosition += 10;
      
      doc.setFontSize(10);
      doc.text(`Platform: ${vuln.platform}`, 30, yPosition);
      yPosition += 6;
      doc.text(`Vulnerability Type: ${vuln.vulnerabilityType}`, 30, yPosition);
      yPosition += 6;
      doc.text(`Query: ${vuln.query}`, 30, yPosition);
      yPosition += 6;
      
      if (vuln.description) {
        const descLines = doc.splitTextToSize(`Description: ${vuln.description}`, 160);
        doc.text(descLines, 30, yPosition);
        yPosition += descLines.length * 6;
      }
      
      doc.text(`Link: ${vuln.link}`, 30, yPosition);
      yPosition += 8;
      
      // Security Recommendation
      doc.setFontSize(9);
      doc.setTextColor(200, 0, 0); // Red color for recommendations
      const recLines = doc.splitTextToSize(`🛡️ RECOMMENDATION: ${vuln.recommendation}`, 160);
      doc.text(recLines, 30, yPosition);
      yPosition += recLines.length * 5 + 8;
      doc.setTextColor(0, 0, 0); // Reset to black
    });
  }

  // CORS vulnerabilities
  if (data.corsVulnerabilities && data.corsVulnerabilities.length > 0) {
    if (yPosition > 250) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFontSize(16);
    doc.text('CORS Vulnerabilities:', 20, yPosition);
    yPosition += 15;

    data.corsVulnerabilities.forEach((cors, index) => {
      if (yPosition > 280) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(10);
      doc.text(`${index + 1}. [${cors.severity}] ${cors.type}`, 25, yPosition);
      yPosition += 7;
      doc.text(`Description: ${cors.description}`, 30, yPosition);
      yPosition += 7;
      doc.text(`Recommendation: ${cors.recommendation}`, 30, yPosition);
      yPosition += 12;
    });
  }

  // Metadata
  if (yPosition > 200) {
    doc.addPage();
    yPosition = 20;
  }

  doc.setFontSize(16);
  doc.text('Scan Metadata:', 20, yPosition);
  yPosition += 15;

  doc.setFontSize(10);
  doc.text(`Scan Duration: ${data.metadata.scanDuration}ms`, 25, yPosition);
  yPosition += 7;
  doc.text(`Total Queries: ${data.metadata.totalQueries}`, 25, yPosition);
  yPosition += 7;
  doc.text(`Successful Queries: ${data.metadata.successfulQueries}`, 25, yPosition);
  yPosition += 7;
  doc.text(`Failed Queries: ${data.metadata.failedQueries}`, 25, yPosition);

  // Save the PDF
  doc.save(`leak-hunter-report-${data.domain}-${Date.now()}.pdf`);
};

export const exportToExcel = (data: ExportData) => {
  const workbook = XLSX.utils.book_new();

  // Summary sheet
  const summaryData = [
    ['Domain', data.domain],
    ['Scan Date', data.timestamp],
    ['Total Vulnerabilities', data.totalResults],
    ['Scan Duration (ms)', data.metadata.scanDuration],
    ['Total Queries', data.metadata.totalQueries],
    ['Successful Queries', data.metadata.successfulQueries],
    ['Failed Queries', data.metadata.failedQueries]
  ];
  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

  // Vulnerabilities sheet
  if (data.vulnerabilities.length > 0) {
    const vulnHeaders = ['Platform', 'Title', 'Risk Level', 'Vulnerability Type', 'Query', 'Description', 'Link', 'Security Recommendation'];
    const vulnData = data.vulnerabilities.map(vuln => [
      vuln.platform,
      vuln.title,
      vuln.risk,
      vuln.vulnerabilityType,
      vuln.query,
      vuln.description || '',
      vuln.link,
      vuln.recommendation
    ]);
    const vulnSheet = XLSX.utils.aoa_to_sheet([vulnHeaders, ...vulnData]);
    XLSX.utils.book_append_sheet(workbook, vulnSheet, 'Vulnerabilities');
  }

  // CORS vulnerabilities sheet
  if (data.corsVulnerabilities && data.corsVulnerabilities.length > 0) {
    const corsHeaders = ['Type', 'Severity', 'Description', 'Recommendation'];
    const corsData = data.corsVulnerabilities.map(cors => [
      cors.type,
      cors.severity,
      cors.description,
      cors.recommendation
    ]);
    const corsSheet = XLSX.utils.aoa_to_sheet([corsHeaders, ...corsData]);
    XLSX.utils.book_append_sheet(workbook, corsSheet, 'CORS Vulnerabilities');
  }

  // Errors sheet
  if (data.errors.length > 0) {
    const errorHeaders = ['Platform', 'Query', 'Error', 'Reason'];
    const errorData = data.errors.map(error => [
      error.platform,
      error.query,
      error.error,
      error.reason
    ]);
    const errorSheet = XLSX.utils.aoa_to_sheet([errorHeaders, ...errorData]);
    XLSX.utils.book_append_sheet(workbook, errorSheet, 'Errors');
  }

  // Save the Excel file
  XLSX.writeFile(workbook, `leak-hunter-report-${data.domain}-${Date.now()}.xlsx`);
};

export function exportFindingsAsMarkdown(findings: any[]): string {
  return findings.map(f => `
## 🔗 ${f.url}
- **Type**: ${f.type}
- **Match**: \`${f.match}\`
- **Severity**: ${f.severity === 'High' ? '🔴 High' : f.severity}
- **Line**: ${f.line}
- **Confidence**: ${f.confidence}%
- **Why It's Dangerous**: ${f.explanation}
${f.fix ? `- **How to Fix**: ${f.fix}` : ''}
- **Snippet**: \`${f.snippet}\`
`).join('\n');
}

export function exportFindingsAsJSON(findings: any[]): string {
  return JSON.stringify(findings, null, 2);
}
