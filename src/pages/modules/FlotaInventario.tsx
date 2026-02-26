import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { ExportButtons } from "@/components/ExportButtons";
import { Truck, Plus, Trash2, Loader2, Pencil, Upload, FileSpreadsheet, Download, AlertCircle, CheckCircle2, Info } from "lucide-react";
import * as XLSX from "xlsx";

interface Vehiculo {
  id: string;
  numero_unidad: string;
  marca_modelo: string;
  numero_placa: string;
  numero_vin: string;
  anio_fabricacion: number;
  kilometraje_actual: number;
  estado_vehiculo: string;
}

const EXPECTED_COLUMNS = [
  "numero_unidad",
  "marca_modelo",
  "numero_placa",
  "numero_vin",
  "anio_fabricacion",
  "kilometraje_actual",
  "estado_vehiculo",
  "fecha_ultimo_mantenimiento",
  "proximo_mantenimiento_programado",
  "historial_reparaciones",
  "conductores_asignados",
  "permiso_explotacion_unidad",
  "fecha_autorizacion_explotacion",
  "fecha_vencimiento_explotacion",
  "permiso_circulacion",
  "fecha_autorizacion_circulacion",
  "fecha_vencimiento_circulacion",
  "permiso_publicidad",
  "fecha_autorizacion_publicidad",
  "fecha_vencimiento_publicidad",
  "permisos_especiales",
  "fecha_autorizacion_especiales",
  "fecha_vencimiento_especiales",
];

const COLUMN_LABELS: Record<string, string> = {
  numero_unidad: "Numero de Unidad",
  marca_modelo: "Marca y Modelo",
  numero_placa: "Numero de Placa",
  numero_vin: "Numero de VIN",
  anio_fabricacion: "Ano de Fabricacion",
  kilometraje_actual: "Kilometraje Actual",
  estado_vehiculo: "Estado del Vehiculo",
  fecha_ultimo_mantenimiento: "Fecha de Ultimo Mantenimiento",
  proximo_mantenimiento_programado: "Proximo Mantenimiento Programado",
  historial_reparaciones: "Historial de Reparaciones",
  conductores_asignados: "Conductores Asignados",
  permiso_explotacion_unidad: "Permiso de Explotacion de Unidad",
  fecha_autorizacion_explotacion: "Fecha Autorizacion de Explotacion de Unidad",
  fecha_vencimiento_explotacion: "Fecha Vencimiento de Explotacion de Unidad",
  permiso_circulacion: "Permiso de Circulacion",
  fecha_autorizacion_circulacion: "Fecha Autorizacion de Circulacion",
  fecha_vencimiento_circulacion: "Fecha Vencimiento de Circulacion",
  permiso_publicidad: "Permiso de Publicidad",
  fecha_autorizacion_publicidad: "Fecha Autorizacion de Publicidad",
  fecha_vencimiento_publicidad: "Fecha Vencimiento de Publicidad",
  permisos_especiales: "Permisos Especiales",
  fecha_autorizacion_especiales: "Fecha Autorizacion Especiales",
  fecha_vencimiento_especiales: "Fecha Vencimiento Especiales",
};

const COLUMN_ALIASES: Record<string, string[]> = {
  permiso_explotacion_unidad: ["Permiso de Explotacion de la Unidad", "Permiso de Explotacion de Unidad"],
  fecha_autorizacion_explotacion: [
    "Fecha de Autorizacion de Explotacion de la Unidad",
    "Fecha Autorizacion de Explotacion de Unidad",
  ],
  fecha_vencimiento_explotacion: [
    "Fecha de Vencimiento de Explotacion de la Unidad",
    "Fecha Vencimiento de Explotacion de Unidad",
  ],
  fecha_autorizacion_circulacion: ["Fecha de Autorizacion de Circulacion", "Fecha Autorizacion de Circulacion"],
  fecha_vencimiento_circulacion: ["Fecha de Vencimiento de Circulacion", "Fecha Vencimiento de Circulacion"],
  fecha_autorizacion_publicidad: ["Fecha de Autorizacion de Publicidad", "Fecha Autorizacion de Publicidad"],
  fecha_vencimiento_publicidad: ["Fecha de Vencimiento de Publicidad", "Fecha Vencimiento de Publicidad"],
  fecha_autorizacion_especiales: [
    "Fecha de Autorizacion de Permisos Especiales",
    "Fecha de Autorizacion Especiales",
    "Fecha Autorizacion Especiales",
  ],
  fecha_vencimiento_especiales: [
    "Fecha de Vencimiento de Permisos Especiales",
    "Fecha de Vencimiento Especiales",
    "Fecha Vencimiento Especiales",
  ],
};

const COLUMN_EXAMPLES: Record<string, string> = {
  numero_unidad: "U-001",
  marca_modelo: "Toyota Hilux 2024",
  numero_placa: "ABC-1234",
  numero_vin: "1HGCM82633A004352",
  anio_fabricacion: "2024",
  kilometraje_actual: "15000",
  estado_vehiculo: "activo",
  fecha_ultimo_mantenimiento: "2025-01-15",
  proximo_mantenimiento_programado: "2025-07-15",
  historial_reparaciones: "Cambio de aceite, frenos",
  conductores_asignados: "Juan Pérez",
  permiso_explotacion_unidad: "PEX-2024-001",
  fecha_autorizacion_explotacion: "2024-01-01",
  fecha_vencimiento_explotacion: "2025-01-01",
  permiso_circulacion: "PC-2024-001",
  fecha_autorizacion_circulacion: "2024-01-01",
  fecha_vencimiento_circulacion: "2025-01-01",
  permiso_publicidad: "PP-2024-001",
  fecha_autorizacion_publicidad: "2024-01-01",
  fecha_vencimiento_publicidad: "2025-01-01",
  permisos_especiales: "PE-2024-001",
  fecha_autorizacion_especiales: "2024-01-01",
  fecha_vencimiento_especiales: "2025-01-01",
};

const exportColumns = [
  { header: "Unidad", key: "numero_unidad", width: 15 },
  { header: "Marca/Modelo", key: "marca_modelo", width: 25 },
  { header: "Placa", key: "numero_placa", width: 15 },
  { header: "VIN", key: "numero_vin", width: 25 },
  { header: "Año", key: "anio_fabricacion", width: 10 },
  { header: "Kilometraje", key: "kilometraje_actual", width: 15 },
  { header: "Estado", key: "estado_vehiculo", width: 15 },
  { header: "Últ. Mantenimiento", key: "fecha_ultimo_mantenimiento", width: 20 },
  { header: "Próx. Mantenimiento", key: "proximo_mantenimiento_programado", width: 20 },
  { header: "Historial Reparaciones", key: "historial_reparaciones", width: 25 },
  { header: "Conductores", key: "conductores_asignados", width: 20 },
  { header: "Permiso Explotación", key: "permiso_explotacion_unidad", width: 20 },
  { header: "Aut. Explotación", key: "fecha_autorizacion_explotacion", width: 18 },
  { header: "Venc. Explotación", key: "fecha_vencimiento_explotacion", width: 18 },
  { header: "Permiso Circulación", key: "permiso_circulacion", width: 20 },
  { header: "Aut. Circulación", key: "fecha_autorizacion_circulacion", width: 18 },
  { header: "Venc. Circulación", key: "fecha_vencimiento_circulacion", width: 18 },
  { header: "Permiso Publicidad", key: "permiso_publicidad", width: 20 },
  { header: "Aut. Publicidad", key: "fecha_autorizacion_publicidad", width: 18 },
  { header: "Venc. Publicidad", key: "fecha_vencimiento_publicidad", width: 18 },
  { header: "Permisos Especiales", key: "permisos_especiales", width: 20 },
  { header: "Aut. Especiales", key: "fecha_autorizacion_especiales", width: 18 },
  { header: "Venc. Especiales", key: "fecha_vencimiento_especiales", width: 18 },
];

export default function FlotaInventario() {
  const { flotaId } = useUserRole();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importResult, setImportResult] = useState<{ success: number; errors: string[] } | null>(null);
  const [previewData, setPreviewData] = useState<any[] | null>(null);
  const [previewErrors, setPreviewErrors] = useState<string[]>([]);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [confirmingImport, setConfirmingImport] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    numero_unidad: "", marca_modelo: "", numero_placa: "", numero_vin: "",
    anio_fabricacion: new Date().getFullYear(), kilometraje_actual: 0, estado_vehiculo: "activo",
  });

  useEffect(() => {
    if (flotaId) fetchVehiculos();
  }, [flotaId]);

  const fetchVehiculos = async () => {
    try {
      const { data, error } = await supabase.from("flota_vehiculos").select("*").eq("flota_id", flotaId).order("created_at", { ascending: false });
      if (error) throw error;
      setVehiculos(data || []);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!flotaId) return;
    try {
      if (editingId) {
        const { error } = await supabase.from("flota_vehiculos").update(form).eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("flota_vehiculos").insert([{ flota_id: flotaId, ...form }]);
        if (error) throw error;
      }
      setDialogOpen(false);
      setEditingId(null);
      setForm({ numero_unidad: "", marca_modelo: "", numero_placa: "", numero_vin: "", anio_fabricacion: new Date().getFullYear(), kilometraje_actual: 0, estado_vehiculo: "activo" });
      fetchVehiculos();
      toast({ title: editingId ? "Actualizado" : "Creado", description: "Vehículo guardado correctamente" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleEdit = (v: Vehiculo) => {
    setEditingId(v.id);
    setForm({ numero_unidad: v.numero_unidad, marca_modelo: v.marca_modelo, numero_placa: v.numero_placa, numero_vin: v.numero_vin, anio_fabricacion: v.anio_fabricacion, kilometraje_actual: v.kilometraje_actual, estado_vehiculo: v.estado_vehiculo });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    await supabase.from("flota_vehiculos").delete().eq("id", id);
    fetchVehiculos();
    toast({ title: "Eliminado" });
  };

  const downloadTemplate = () => {
    const templateData = [
      EXPECTED_COLUMNS.reduce((acc, col) => {
        acc[COLUMN_LABELS[col]] = COLUMN_EXAMPLES[col];
        return acc;
      }, {} as Record<string, string>),
    ];
    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Vehiculos");
    ws["!cols"] = EXPECTED_COLUMNS.map((col) => ({ wch: Math.max((COLUMN_LABELS[col] || col).length + 5, 20) }));
    XLSX.writeFile(wb, "plantilla_vehiculos.xlsx");
    toast({ title: "Plantilla descargada", description: "Completa la plantilla con los datos de tus vehículos" });
  };

  const normalizeText = (text: string) =>
    String(text ?? "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[\u200B-\u200D\uFEFF]/g, "")
      .replace(/[._,;:()[\]{}\-\/\\]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();

  const normalizeLoose = (text: string) =>
    normalizeText(text).replace(/\b(de|del|la|el|los|las)\b/g, "").replace(/\s+/g, " ").trim();

  const findColumnKey = (header: string): string | null => {
    const normalized = normalizeText(header);
    const normalizedLoose = normalizeLoose(header);

    for (const [key, label] of Object.entries(COLUMN_LABELS)) {
      if (normalizeText(label) === normalized || normalizeLoose(label) === normalizedLoose) return key;

      const aliases = COLUMN_ALIASES[key] || [];
      if (aliases.some((alias) => normalizeText(alias) === normalized || normalizeLoose(alias) === normalizedLoose)) {
        return key;
      }
    }

    for (const key of EXPECTED_COLUMNS) {
      const keyLabel = key.replace(/_/g, " ");
      if (normalizeText(keyLabel) === normalized || normalizeLoose(keyLabel) === normalizedLoose) return key;
    }

    return null;
  };

  const validateExcelStructure = (headers: string[]): { valid: boolean; missing: string[]; extra: string[]; mapping: Record<string, string> } => {
    const mapping: Record<string, string> = {}; // header -> key
    const matchedKeys = new Set<string>();
    const extra: string[] = [];

    for (const header of headers) {
      const key = findColumnKey(header);
      if (key) {
        mapping[header] = key;
        matchedKeys.add(key);
      } else {
        extra.push(header);
      }
    }

    const missing = EXPECTED_COLUMNS.filter((col) => !matchedKeys.has(col));
    return { valid: missing.length === 0, missing, extra, mapping };
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !flotaId) return;

    const validTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
      "text/csv",
    ];
    if (!validTypes.includes(file.type) && !file.name.match(/\.(xlsx|xls|csv)$/i)) {
      toast({ title: "Archivo inválido", description: "Solo se permiten archivos Excel (.xlsx, .xls) o CSV", variant: "destructive" });
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setUploading(true);
    setImportResult(null);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json<any[]>(worksheet, {
        header: 1,
        defval: "",
        raw: false,
      });

      if (!rows.length) {
        toast({ title: "Archivo vacío", description: "El archivo no contiene datos", variant: "destructive" });
        setUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }

      const rawHeaders = (rows[0] || []).map((h) => String(h ?? "").trim());
      const headers = rawHeaders.filter((h) => h.length > 0);
      const dataRows = rows.slice(1).filter((row) => row.some((cell) => String(cell ?? "").trim() !== ""));

      if (dataRows.length === 0) {
        toast({ title: "Archivo vacío", description: "El archivo no contiene filas de datos", variant: "destructive" });
        setUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }

      const validation = validateExcelStructure(headers);

      if (!validation.valid) {
        setImportResult({
          success: 0,
          errors: [
            `La estructura del archivo no es correcta.`,
            ...(validation.missing.length > 0
              ? [`Columnas faltantes: ${validation.missing.map((c) => COLUMN_LABELS[c] || c).join(", ")}`]
              : []),
            ...(validation.extra.length > 0
              ? [`Columnas no reconocidas: ${validation.extra.join(", ")}`]
              : []),
            "Descarga la plantilla para ver la estructura correcta.",
          ],
        });
        setImportDialogOpen(true);
        setUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }

      // Remap rows using real header row (not first data row)
      const remappedData = dataRows.map((row) => {
        const mapped: Record<string, any> = {};
        rawHeaders.forEach((header, index) => {
          if (!header) return;
          const key = validation.mapping[header] || findColumnKey(header);
          if (key) mapped[key] = row[index];
        });
        return mapped;
      });

      // Date conversion helper: DD/MM/YYYY or D/M/YY → YYYY-MM-DD
      const parseDate = (val: any): string | null => {
        if (!val) return null;
        const s = String(val).trim();
        if (!s) return null;
        // Already YYYY-MM-DD
        if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
        // DD/MM/YYYY or D/M/YYYY or D/M/YY
        const parts = s.split(/[\/\-\.]/);
        if (parts.length === 3) {
          let [d, m, y] = parts.map(Number);
          if (y < 100) y += 2000;
          if (d > 0 && m > 0 && m <= 12 && y >= 1900) {
            return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
          }
        }
        return null;
      };

      const DATE_FIELDS = [
        "fecha_ultimo_mantenimiento", "proximo_mantenimiento_programado",
        "fecha_autorizacion_explotacion", "fecha_vencimiento_explotacion",
        "fecha_autorizacion_circulacion", "fecha_vencimiento_circulacion",
        "fecha_autorizacion_publicidad", "fecha_vencimiento_publicidad",
        "fecha_autorizacion_especiales", "fecha_vencimiento_especiales",
      ];

      const errors: string[] = [];
      const validRows: any[] = [];

      remappedData.forEach((row, idx) => {
        const rowNum = idx + 2;
        if (!row.numero_unidad || !row.marca_modelo || !row.numero_placa || !row.numero_vin) {
          errors.push(`Fila ${rowNum}: Faltan campos obligatorios (unidad, marca/modelo, placa o VIN)`);
          return;
        }
        const anio = parseInt(String(row.anio_fabricacion));
        if (isNaN(anio) || anio < 1900 || anio > new Date().getFullYear() + 2) {
          errors.push(`Fila ${rowNum}: Año de fabricación inválido "${row.anio_fabricacion}"`);
          return;
        }
        const km = parseInt(String(row.kilometraje_actual || 0));
        if (isNaN(km) || km < 0) {
          errors.push(`Fila ${rowNum}: Kilometraje inválido "${row.kilometraje_actual}"`);
          return;
        }

        const vehiculo: any = {
          flota_id: flotaId,
          numero_unidad: String(row.numero_unidad).trim(),
          marca_modelo: String(row.marca_modelo).trim(),
          numero_placa: String(row.numero_placa).trim(),
          numero_vin: String(row.numero_vin).trim(),
          anio_fabricacion: anio,
          kilometraje_actual: km,
          estado_vehiculo: String(row.estado_vehiculo || "activo").trim().toLowerCase(),
          historial_reparaciones: row.historial_reparaciones ? String(row.historial_reparaciones).trim() : null,
          conductores_asignados: row.conductores_asignados ? String(row.conductores_asignados).trim() : null,
          permiso_explotacion_unidad: row.permiso_explotacion_unidad ? String(row.permiso_explotacion_unidad).trim() : null,
          permiso_circulacion: row.permiso_circulacion ? String(row.permiso_circulacion).trim() : null,
          permiso_publicidad: row.permiso_publicidad ? String(row.permiso_publicidad).trim() : null,
          permisos_especiales: row.permisos_especiales ? String(row.permisos_especiales).trim() : null,
        };

        // Convert all date fields
        for (const field of DATE_FIELDS) {
          vehiculo[field] = parseDate(row[field]);
        }

        validRows.push(vehiculo);
      });

      // Show preview instead of inserting directly
      setPreviewData(validRows);
      setPreviewErrors(errors);
      setPreviewDialogOpen(true);
    } catch (error: any) {
      toast({ title: "Error al procesar archivo", description: error.message, variant: "destructive" });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleConfirmImport = async () => {
    if (!previewData || previewData.length === 0) return;
    setConfirmingImport(true);
    try {
      const { error } = await supabase.from("flota_vehiculos").insert(previewData);
      if (error) throw error;
      await fetchVehiculos();
      setPreviewDialogOpen(false);
      setImportResult({ success: previewData.length, errors: previewErrors });
      setImportDialogOpen(true);
      toast({
        title: "Importación completada",
        description: `${previewData.length} vehículo(s) importados${previewErrors.length > 0 ? `, ${previewErrors.length} con errores` : ""}`,
      });
    } catch (error: any) {
      toast({ title: "Error al importar", description: error.message, variant: "destructive" });
    } finally {
      setConfirmingImport(false);
      setPreviewData(null);
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-[50vh]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2"><Truck className="h-8 w-8 text-primary" />Inventario de Vehículos</h1>
          <p className="text-muted-foreground mt-1">{vehiculos.length} vehículos registrados</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <ExportButtons data={vehiculos} columns={exportColumns} fileName="inventario_vehiculos" title="Inventario de Vehículos" />
          <Button variant="outline" onClick={downloadTemplate}>
            <Download className="h-4 w-4 mr-2" />Plantilla Excel
          </Button>
          <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
            {uploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
            Importar Excel
          </Button>
          <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleFileUpload} />
          <Button onClick={() => { setEditingId(null); setForm({ numero_unidad: "", marca_modelo: "", numero_placa: "", numero_vin: "", anio_fabricacion: new Date().getFullYear(), kilometraje_actual: 0, estado_vehiculo: "activo" }); setDialogOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" />Agregar Vehículo
          </Button>
        </div>
      </div>

      {/* Estructura requerida del Excel */}
      <Card className="border-dashed">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            Estructura requerida del archivo Excel
          </CardTitle>
          <CardDescription>El archivo debe contener exactamente las siguientes columnas con los nombres indicados</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {EXPECTED_COLUMNS.map((col) => (
                    <TableHead key={col} className="text-xs font-semibold whitespace-nowrap">{col}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  {EXPECTED_COLUMNS.map((col) => (
                    <TableCell key={col} className="text-xs text-muted-foreground whitespace-nowrap">{COLUMN_EXAMPLES[col]}</TableCell>
                  ))}
                </TableRow>
              </TableBody>
            </Table>
          </div>
          <div className="mt-3 flex items-start gap-2 text-xs text-muted-foreground">
            <Info className="h-4 w-4 mt-0.5 shrink-0" />
            <span>
              <strong>Campos obligatorios:</strong> numero_unidad, marca_modelo, numero_placa, numero_vin. 
              <strong className="ml-1">Estado:</strong> activo, en_servicio, entregado o inactivo (por defecto "activo"). 
              <strong className="ml-1">Fechas:</strong> formato AAAA-MM-DD. Los demás campos son opcionales.
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Unidad</TableHead>
                <TableHead>Marca/Modelo</TableHead>
                <TableHead>Placa</TableHead>
                <TableHead>VIN</TableHead>
                <TableHead>Año</TableHead>
                <TableHead>Km</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vehiculos.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">No hay vehículos registrados</TableCell></TableRow>
              ) : vehiculos.map((v) => (
                <TableRow key={v.id}>
                  <TableCell className="font-medium">{v.numero_unidad}</TableCell>
                  <TableCell>{v.marca_modelo}</TableCell>
                  <TableCell>{v.numero_placa}</TableCell>
                  <TableCell className="font-mono text-xs">{v.numero_vin}</TableCell>
                  <TableCell>{v.anio_fabricacion}</TableCell>
                  <TableCell>{v.kilometraje_actual.toLocaleString()}</TableCell>
                  <TableCell><Badge variant="outline">{v.estado_vehiculo}</Badge></TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(v)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(v.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog de agregar/editar */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingId ? "Editar" : "Agregar"} Vehículo</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Número de Unidad</Label><Input value={form.numero_unidad} onChange={(e) => setForm(p => ({ ...p, numero_unidad: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Marca/Modelo</Label><Input value={form.marca_modelo} onChange={(e) => setForm(p => ({ ...p, marca_modelo: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Placa</Label><Input value={form.numero_placa} onChange={(e) => setForm(p => ({ ...p, numero_placa: e.target.value }))} /></div>
              <div className="space-y-2"><Label>VIN</Label><Input value={form.numero_vin} onChange={(e) => setForm(p => ({ ...p, numero_vin: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Año</Label><Input type="number" value={form.anio_fabricacion} onChange={(e) => setForm(p => ({ ...p, anio_fabricacion: parseInt(e.target.value) || 0 }))} /></div>
              <div className="space-y-2"><Label>Kilometraje</Label><Input type="number" value={form.kilometraje_actual} onChange={(e) => setForm(p => ({ ...p, kilometraje_actual: parseInt(e.target.value) || 0 }))} /></div>
            </div>
          </div>
          <DialogFooter><Button onClick={handleSubmit}>{editingId ? "Actualizar" : "Agregar"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de resultados de importación */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {importResult?.success && importResult.success > 0 ? (
                <><CheckCircle2 className="h-5 w-5 text-green-500" />Resultado de la Importación</>
              ) : (
                <><AlertCircle className="h-5 w-5 text-destructive" />Error en la Importación</>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {importResult?.success !== undefined && importResult.success > 0 && (
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertTitle>Vehículos importados exitosamente</AlertTitle>
                <AlertDescription>{importResult.success} vehículo(s) fueron agregados correctamente.</AlertDescription>
              </Alert>
            )}
            {importResult?.errors && importResult.errors.length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Errores encontrados</AlertTitle>
                <AlertDescription>
                  <ul className="list-disc pl-4 mt-2 space-y-1 text-sm">
                    {importResult.errors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setImportDialogOpen(false)}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de vista previa antes de importar */}
      <Dialog open={previewDialogOpen} onOpenChange={(open) => { if (!confirmingImport) setPreviewDialogOpen(open); }}>
        <DialogContent className="max-w-[95vw] max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-primary" />
              Vista Previa de Importación
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-hidden flex flex-col gap-4">
            {previewErrors.length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>{previewErrors.length} fila(s) con errores (no se importarán)</AlertTitle>
                <AlertDescription>
                  <ul className="list-disc pl-4 mt-1 text-xs max-h-20 overflow-y-auto">
                    {previewErrors.map((err, i) => <li key={i}>{err}</li>)}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertTitle>{previewData?.length || 0} vehículo(s) listos para importar</AlertTitle>
              <AlertDescription>Revisa los datos antes de confirmar la importación.</AlertDescription>
            </Alert>
            <div className="flex-1 overflow-auto border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs whitespace-nowrap sticky top-0 bg-background">#</TableHead>
                    <TableHead className="text-xs whitespace-nowrap sticky top-0 bg-background">Unidad</TableHead>
                    <TableHead className="text-xs whitespace-nowrap sticky top-0 bg-background">Marca/Modelo</TableHead>
                    <TableHead className="text-xs whitespace-nowrap sticky top-0 bg-background">Placa</TableHead>
                    <TableHead className="text-xs whitespace-nowrap sticky top-0 bg-background">VIN</TableHead>
                    <TableHead className="text-xs whitespace-nowrap sticky top-0 bg-background">Año</TableHead>
                    <TableHead className="text-xs whitespace-nowrap sticky top-0 bg-background">Km</TableHead>
                    <TableHead className="text-xs whitespace-nowrap sticky top-0 bg-background">Estado</TableHead>
                    <TableHead className="text-xs whitespace-nowrap sticky top-0 bg-background">Últ. Mant.</TableHead>
                    <TableHead className="text-xs whitespace-nowrap sticky top-0 bg-background">Próx. Mant.</TableHead>
                    <TableHead className="text-xs whitespace-nowrap sticky top-0 bg-background">Conductores</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(previewData || []).map((row, i) => (
                    <TableRow key={i}>
                      <TableCell className="text-xs text-muted-foreground">{i + 1}</TableCell>
                      <TableCell className="text-xs font-medium">{row.numero_unidad}</TableCell>
                      <TableCell className="text-xs">{row.marca_modelo}</TableCell>
                      <TableCell className="text-xs">{row.numero_placa}</TableCell>
                      <TableCell className="text-xs font-mono">{row.numero_vin}</TableCell>
                      <TableCell className="text-xs">{row.anio_fabricacion}</TableCell>
                      <TableCell className="text-xs">{row.kilometraje_actual?.toLocaleString()}</TableCell>
                      <TableCell className="text-xs"><Badge variant="outline">{row.estado_vehiculo}</Badge></TableCell>
                      <TableCell className="text-xs">{row.fecha_ultimo_mantenimiento || "—"}</TableCell>
                      <TableCell className="text-xs">{row.proximo_mantenimiento_programado || "—"}</TableCell>
                      <TableCell className="text-xs">{row.conductores_asignados || "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setPreviewDialogOpen(false); setPreviewData(null); }} disabled={confirmingImport}>
              Cancelar
            </Button>
            <Button onClick={handleConfirmImport} disabled={confirmingImport || !previewData?.length}>
              {confirmingImport ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
              Confirmar Importación ({previewData?.length || 0})
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
