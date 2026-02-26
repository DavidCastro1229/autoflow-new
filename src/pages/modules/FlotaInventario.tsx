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
];

const COLUMN_LABELS: Record<string, string> = {
  numero_unidad: "Número de Unidad",
  marca_modelo: "Marca/Modelo",
  numero_placa: "Número de Placa",
  numero_vin: "Número VIN",
  anio_fabricacion: "Año de Fabricación",
  kilometraje_actual: "Kilometraje Actual",
  estado_vehiculo: "Estado del Vehículo",
};

const COLUMN_EXAMPLES: Record<string, string> = {
  numero_unidad: "U-001",
  marca_modelo: "Toyota Hilux 2024",
  numero_placa: "ABC-1234",
  numero_vin: "1HGCM82633A004352",
  anio_fabricacion: "2024",
  kilometraje_actual: "15000",
  estado_vehiculo: "activo",
};

const exportColumns = [
  { header: "Unidad", key: "numero_unidad", width: 15 },
  { header: "Marca/Modelo", key: "marca_modelo", width: 25 },
  { header: "Placa", key: "numero_placa", width: 15 },
  { header: "VIN", key: "numero_vin", width: 25 },
  { header: "Año", key: "anio_fabricacion", width: 10 },
  { header: "Kilometraje", key: "kilometraje_actual", width: 15 },
  { header: "Estado", key: "estado_vehiculo", width: 15 },
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
        acc[col] = COLUMN_EXAMPLES[col];
        return acc;
      }, {} as Record<string, string>),
    ];
    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Vehiculos");
    ws["!cols"] = EXPECTED_COLUMNS.map((col) => ({ wch: Math.max(col.length + 5, 20) }));
    XLSX.writeFile(wb, "plantilla_vehiculos.xlsx");
    toast({ title: "Plantilla descargada", description: "Completa la plantilla con los datos de tus vehículos" });
  };

  const validateExcelStructure = (headers: string[]): { valid: boolean; missing: string[]; extra: string[] } => {
    const normalizedHeaders = headers.map((h) => h.trim().toLowerCase());
    const normalizedExpected = EXPECTED_COLUMNS.map((c) => c.toLowerCase());
    const missing = EXPECTED_COLUMNS.filter((col) => !normalizedHeaders.includes(col.toLowerCase()));
    const extra = headers.filter((h) => !normalizedExpected.includes(h.trim().toLowerCase()));
    return { valid: missing.length === 0, missing, extra };
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
      const jsonData = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet);

      if (jsonData.length === 0) {
        toast({ title: "Archivo vacío", description: "El archivo no contiene datos", variant: "destructive" });
        setUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }

      const headers = Object.keys(jsonData[0]);
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

      const errors: string[] = [];
      const validRows: any[] = [];

      jsonData.forEach((row, idx) => {
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
        validRows.push({
          flota_id: flotaId,
          numero_unidad: String(row.numero_unidad).trim(),
          marca_modelo: String(row.marca_modelo).trim(),
          numero_placa: String(row.numero_placa).trim(),
          numero_vin: String(row.numero_vin).trim(),
          anio_fabricacion: anio,
          kilometraje_actual: km,
          estado_vehiculo: String(row.estado_vehiculo || "activo").trim().toLowerCase(),
        });
      });

      if (validRows.length > 0) {
        const { error } = await supabase.from("flota_vehiculos").insert(validRows);
        if (error) throw error;
        await fetchVehiculos();
      }

      setImportResult({ success: validRows.length, errors });
      setImportDialogOpen(true);

      if (validRows.length > 0) {
        toast({
          title: "Importación completada",
          description: `${validRows.length} vehículo(s) importados${errors.length > 0 ? `, ${errors.length} con errores` : ""}`,
        });
      }
    } catch (error: any) {
      toast({ title: "Error al importar", description: error.message, variant: "destructive" });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
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
              <strong className="ml-1">Estado:</strong> activo, en_servicio, entregado o inactivo. 
              Si no se especifica, se usará "activo" por defecto.
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
    </div>
  );
}
