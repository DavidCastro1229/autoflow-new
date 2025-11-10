import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, FileSpreadsheet, FileText } from "lucide-react";
import { exportToExcel, exportToPDF, ExportColumn } from "@/lib/exportUtils";
import { useToast } from "@/hooks/use-toast";

interface ExportButtonsProps {
  data: any[];
  columns: ExportColumn[];
  fileName: string;
  title: string;
}

export function ExportButtons({
  data,
  columns,
  fileName,
  title,
}: ExportButtonsProps) {
  const { toast } = useToast();

  const handleExportExcel = () => {
    const success = exportToExcel(data, columns, fileName);
    if (success) {
      toast({
        title: "Exportado exitosamente",
        description: "Los datos se han exportado a Excel",
      });
    } else {
      toast({
        title: "Error al exportar",
        description: "No se pudo exportar a Excel",
        variant: "destructive",
      });
    }
  };

  const handleExportPDF = () => {
    const success = exportToPDF(data, columns, fileName, title);
    if (success) {
      toast({
        title: "Exportado exitosamente",
        description: "Los datos se han exportado a PDF",
      });
    } else {
      toast({
        title: "Error al exportar",
        description: "No se pudo exportar a PDF",
        variant: "destructive",
      });
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Exportar
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleExportExcel}>
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          Exportar a Excel
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleExportPDF}>
          <FileText className="mr-2 h-4 w-4" />
          Exportar a PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
