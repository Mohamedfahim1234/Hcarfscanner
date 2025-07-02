
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, FileText, FileSpreadsheet } from "lucide-react";
import { ExportData, exportToPDF, exportToExcel } from "@/utils/exportUtils";
import { toast } from "@/hooks/use-toast";

interface ExportPanelProps {
  exportData: ExportData;
}

export const ExportPanel = ({ exportData }: ExportPanelProps) => {
  const handlePDFExport = () => {
    try {
      exportToPDF(exportData);
      toast({
        title: "PDF Export Successful",
        description: "Your scan report has been downloaded as PDF",
      });
    } catch (error) {
      toast({
        title: "PDF Export Failed",
        description: "There was an error generating the PDF report",
        variant: "destructive"
      });
    }
  };

  const handleExcelExport = () => {
    try {
      exportToExcel(exportData);
      toast({
        title: "Excel Export Successful",
        description: "Your scan report has been downloaded as Excel file",
      });
    } catch (error) {
      toast({
        title: "Excel Export Failed",
        description: "There was an error generating the Excel report",
        variant: "destructive"
      });
    }
  };

  return (
    <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-white flex items-center">
          <Download className="mr-2 text-cyan-400" />
          Export Scan Results
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button
            onClick={handlePDFExport}
            className="bg-red-600 hover:bg-red-700 text-white h-12"
          >
            <FileText className="h-5 w-5 mr-2" />
            Export as PDF
          </Button>
          
          <Button
            onClick={handleExcelExport}
            className="bg-green-600 hover:bg-green-700 text-white h-12"
          >
            <FileSpreadsheet className="h-5 w-5 mr-2" />
            Export as Excel
          </Button>
        </div>
        
        <div className="text-sm text-gray-400 mt-4">
          <p>• PDF format includes detailed vulnerability analysis and recommendations</p>
          <p>• Excel format provides structured data for further analysis</p>
          <p>• Both formats include complete scan metadata and timestamps</p>
        </div>
      </CardContent>
    </Card>
  );
};
