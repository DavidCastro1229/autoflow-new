import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export interface ExportColumn {
  header: string;
  key: string;
  width?: number;
}

export const exportToExcel = (
  data: any[],
  columns: ExportColumn[],
  fileName: string
) => {
  try {
    // Preparar los datos para Excel
    const worksheetData = data.map((row) => {
      const obj: any = {};
      columns.forEach((col) => {
        obj[col.header] = row[col.key] || "";
      });
      return obj;
    });

    // Crear el libro de trabajo
    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Datos");

    // Ajustar anchos de columnas
    const maxWidth = 50;
    const colWidths = columns.map((col) => ({
      wch: Math.min(col.width || col.header.length + 5, maxWidth),
    }));
    worksheet["!cols"] = colWidths;

    // Descargar el archivo
    XLSX.writeFile(workbook, `${fileName}.xlsx`);

    return true;
  } catch (error) {
    console.error("Error exporting to Excel:", error);
    return false;
  }
};

export const exportToPDF = (
  data: any[],
  columns: ExportColumn[],
  fileName: string,
  title: string
) => {
  try {
    const doc = new jsPDF();

    // Agregar título
    doc.setFontSize(16);
    doc.text(title, 14, 15);

    // Agregar fecha de generación
    doc.setFontSize(10);
    doc.text(
      `Generado: ${new Date().toLocaleDateString("es-MX", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })}`,
      14,
      22
    );

    // Preparar headers y datos para la tabla
    const headers = columns.map((col) => col.header);
    const rows = data.map((row) =>
      columns.map((col) => {
        const value = row[col.key];
        // Formatear valores especiales
        if (value === null || value === undefined) return "";
        if (typeof value === "object") return JSON.stringify(value);
        return String(value);
      })
    );

    // Generar tabla
    autoTable(doc, {
      head: [headers],
      body: rows,
      startY: 28,
      styles: {
        fontSize: 8,
        cellPadding: 2,
      },
      headStyles: {
        fillColor: [59, 130, 246], // Color primario
        textColor: 255,
        fontStyle: "bold",
      },
      alternateRowStyles: {
        fillColor: [245, 247, 250],
      },
      margin: { top: 28 },
    });

    // Descargar el archivo
    doc.save(`${fileName}.pdf`);

    return true;
  } catch (error) {
    console.error("Error exporting to PDF:", error);
    return false;
  }
};

export const formatDateForExport = (date: string | Date) => {
  if (!date) return "";
  return new Date(date).toLocaleDateString("es-MX");
};

export const formatCurrencyForExport = (value: number) => {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(value);
};

export const formatBooleanForExport = (value: boolean) => {
  return value ? "Sí" : "No";
};
