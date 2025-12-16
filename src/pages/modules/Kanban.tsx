import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Plus, Upload, Search, Loader2, Pencil, Copy, Trash2, Workflow } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { TareaFormModal } from "@/components/kanban/TareaFormModal";
import { TareaFasesManager } from "@/components/kanban/TareaFasesManager";
import { ExportButtons } from "@/components/ExportButtons";

// Types
interface CatalogoTarea {
  id: string;
  numero_orden: number;
  codigo_tarea: string;
  nombre: string;
  descripcion: string | null;
  objetivo: string | null;
  tipo_tarea: 'administrativa' | 'operativa';
  categorias: string[];
  condiciones_aplicacion: string[];
  tiempo_estimado: number;
  unidad_tiempo: 'minutos' | 'horas';
  medidas_seguridad: string | null;
  notas_internas: string | null;
  roles_preferentes: number[];
  forma_pago: 'por_hora' | 'salario_fijo' | 'contrato_precio_fijo';
  taller_id: string;
  created_at: string;
  updated_at: string;
}

interface Especialidad {
  id: number;
  nombre: string;
}

const CATEGORIAS_OPTIONS = [
  "Lavado y estética",
  "Llantas y alineamiento",
  "Mantenimiento preventivo",
  "Mantenimiento correctivo",
  "Reparación de colisiones",
  "Aire acondicionado",
  "Instalación de accesorios",
  "General"
];

const CONDICIONES_OPTIONS = [
  "Por kilómetros recorridos",
  "Por tiempo (Meses/años)",
  "Por horas de funcionamiento",
  "Condiciones visuales",
  "Recomendaciones del fabricante",
  "Comportamiento/síntoma vehículo"
];

export default function Kanban() {
  const [tareas, setTareas] = useState<CatalogoTarea[]>([]);
  const [especialidades, setEspecialidades] = useState<Especialidad[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [tallerId, setTallerId] = useState<string | null>(null);
  
  // Modal states
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingTarea, setEditingTarea] = useState<CatalogoTarea | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [tareaToDelete, setTareaToDelete] = useState<CatalogoTarea | null>(null);
  const [fasesManagerOpen, setFasesManagerOpen] = useState(false);
  const [tareaForFases, setTareaForFases] = useState<CatalogoTarea | null>(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      const { data: userRole } = await supabase
        .from("user_roles")
        .select("taller_id")
        .eq("user_id", userData.user.id)
        .maybeSingle();

      if (!userRole?.taller_id) return;
      setTallerId(userRole.taller_id);

      // Fetch especialidades y tareas en paralelo
      const [especialidadesRes, tareasRes] = await Promise.all([
        supabase.from("especialidades_taller").select("id, nombre").order("nombre"),
        supabase
          .from("catalogo_tareas")
          .select("*")
          .eq("taller_id", userRole.taller_id)
          .order("numero_orden", { ascending: true })
      ]);

      if (especialidadesRes.error) throw especialidadesRes.error;
      if (tareasRes.error) throw tareasRes.error;

      setEspecialidades(especialidadesRes.data || []);
      setTareas(tareasRes.data || []);
    } catch (error: any) {
      console.error("Error fetching data:", error);
      toast.error("Error al cargar los datos");
    } finally {
      setLoading(false);
    }
  };

  const fetchTareas = async () => {
    if (!tallerId) return;
    
    try {
      const { data, error } = await supabase
        .from("catalogo_tareas")
        .select("*")
        .eq("taller_id", tallerId)
        .order("numero_orden", { ascending: true });

      if (error) throw error;
      setTareas(data || []);
    } catch (error: any) {
      console.error("Error fetching tareas:", error);
      toast.error("Error al cargar las tareas");
    }
  };

  const handleCreateTarea = () => {
    setEditingTarea(null);
    setFormModalOpen(true);
  };

  const handleEditTarea = (tarea: CatalogoTarea) => {
    setEditingTarea(tarea);
    setFormModalOpen(true);
  };

  const handleDuplicateTarea = async (tarea: CatalogoTarea) => {
    if (!tallerId) return;

    try {
      // Obtener siguiente número de orden y código
      const { data: nextNumero } = await supabase.rpc('get_next_numero_orden_tarea', { p_taller_id: tallerId });
      const { data: newCodigo } = await supabase.rpc('generate_codigo_tarea', { p_taller_id: tallerId });

      const { error } = await supabase.from("catalogo_tareas").insert({
        taller_id: tallerId,
        numero_orden: nextNumero || 1,
        codigo_tarea: newCodigo || `TAR-${String(nextNumero || 1).padStart(4, '0')}`,
        nombre: `${tarea.nombre} (copia)`,
        descripcion: tarea.descripcion,
        objetivo: tarea.objetivo,
        tipo_tarea: tarea.tipo_tarea,
        categorias: tarea.categorias,
        condiciones_aplicacion: tarea.condiciones_aplicacion,
        tiempo_estimado: tarea.tiempo_estimado,
        unidad_tiempo: tarea.unidad_tiempo,
        medidas_seguridad: tarea.medidas_seguridad,
        notas_internas: tarea.notas_internas,
        roles_preferentes: tarea.roles_preferentes,
        forma_pago: tarea.forma_pago
      });

      if (error) throw error;

      toast.success("Tarea duplicada exitosamente");
      fetchTareas();
    } catch (error: any) {
      console.error("Error duplicating tarea:", error);
      toast.error("Error al duplicar la tarea");
    }
  };

  const handleDeleteClick = (tarea: CatalogoTarea) => {
    setTareaToDelete(tarea);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!tareaToDelete) return;

    try {
      const { error } = await supabase
        .from("catalogo_tareas")
        .delete()
        .eq("id", tareaToDelete.id);

      if (error) throw error;

      toast.success("Tarea eliminada exitosamente");
      setDeleteDialogOpen(false);
      setTareaToDelete(null);
      fetchTareas();
    } catch (error: any) {
      console.error("Error deleting tarea:", error);
      toast.error("Error al eliminar la tarea");
    }
  };

  const handleFormSuccess = () => {
    setFormModalOpen(false);
    setEditingTarea(null);
    fetchTareas();
  };

  const handleManageFases = (tarea: CatalogoTarea) => {
    setTareaForFases(tarea);
    setFasesManagerOpen(true);
  };

  const handleImportExcel = () => {
    toast.info("Funcionalidad de importación próximamente");
  };

  // Filtrar tareas
  const filteredTareas = tareas.filter(tarea => {
    if (!searchTerm.trim()) return true;
    const search = searchTerm.toLowerCase();
    return (
      tarea.codigo_tarea.toLowerCase().includes(search) ||
      tarea.nombre.toLowerCase().includes(search) ||
      (tarea.descripcion?.toLowerCase().includes(search)) ||
      tarea.categorias.some(c => c.toLowerCase().includes(search))
    );
  });

  // Obtener nombre de rol por ID
  const getRolNombre = (rolId: number) => {
    const esp = especialidades.find(e => e.id === rolId);
    return esp?.nombre || `Rol ${rolId}`;
  };

  // Columnas para exportación
  const exportColumns = [
    { header: "N° Orden", key: "numero_orden" },
    { header: "Código", key: "codigo" },
    { header: "Nombre", key: "nombre" },
    { header: "Tipo", key: "tipo" },
    { header: "Categorías", key: "categorias" },
    { header: "Condiciones", key: "condiciones" },
    { header: "Roles Preferentes", key: "roles" },
  ];

  // Datos para exportación
  const exportData = filteredTareas.map(t => ({
    numero_orden: t.numero_orden,
    codigo: t.codigo_tarea,
    nombre: t.nombre,
    tipo: t.tipo_tarea === 'administrativa' ? 'Administrativa' : 'Operativa',
    categorias: t.categorias.join(", "),
    condiciones: t.condiciones_aplicacion.join(", "),
    roles: t.roles_preferentes.map(getRolNombre).join(", ")
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Catálogo de Tareas del Taller</h1>
          <p className="text-muted-foreground">Define las tareas atómicas para tus flujos de trabajo</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleImportExcel}>
            <Upload className="h-4 w-4 mr-2" />
            Importar Excel
          </Button>
          <Button onClick={handleCreateTarea}>
            <Plus className="h-4 w-4 mr-2" />
            Nueva Tarea
          </Button>
        </div>
      </div>

      {/* Buscador y filtros */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Buscar por código, nombre, descripción o categoría..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <ExportButtons 
          data={exportData}
          columns={exportColumns}
          fileName="catalogo-tareas" 
          title="Catálogo de Tareas" 
        />
      </div>

      {/* Tabla de tareas */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-20">N° Orden</TableHead>
              <TableHead className="w-28">Código</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead className="w-28">Tipo</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead>Condiciones</TableHead>
              <TableHead>Rol Preferente</TableHead>
              <TableHead className="w-40 text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTareas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  {searchTerm ? "No se encontraron tareas con ese criterio" : "No hay tareas configuradas. Crea tu primera tarea."}
                </TableCell>
              </TableRow>
            ) : (
              filteredTareas.map((tarea) => (
                <TableRow key={tarea.id}>
                  <TableCell className="font-medium">{tarea.numero_orden}</TableCell>
                  <TableCell>
                    <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                      {tarea.codigo_tarea}
                    </code>
                  </TableCell>
                  <TableCell className="font-medium">{tarea.nombre}</TableCell>
                  <TableCell>
                    <Badge variant={tarea.tipo_tarea === 'administrativa' ? 'secondary' : 'default'}>
                      {tarea.tipo_tarea === 'administrativa' ? 'Admin' : 'Operativa'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {tarea.categorias.slice(0, 2).map((cat, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {cat}
                        </Badge>
                      ))}
                      {tarea.categorias.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{tarea.categorias.length - 2}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {tarea.condiciones_aplicacion.slice(0, 1).map((cond, idx) => (
                        <span key={idx} className="text-xs text-muted-foreground">
                          {cond}
                        </span>
                      ))}
                      {tarea.condiciones_aplicacion.length > 1 && (
                        <span className="text-xs text-muted-foreground">
                          +{tarea.condiciones_aplicacion.length - 1}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {tarea.roles_preferentes.slice(0, 1).map((rolId, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {getRolNombre(rolId)}
                        </Badge>
                      ))}
                      {tarea.roles_preferentes.length > 1 && (
                        <Badge variant="outline" className="text-xs">
                          +{tarea.roles_preferentes.length - 1}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleManageFases(tarea)}
                        title="Gestionar Fases"
                        className="text-primary hover:text-primary"
                      >
                        <Workflow className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditTarea(tarea)}
                        title="Editar"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDuplicateTarea(tarea)}
                        title="Duplicar"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteClick(tarea)}
                        title="Eliminar"
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Modal de creación/edición */}
      <TareaFormModal
        open={formModalOpen}
        onOpenChange={setFormModalOpen}
        tarea={editingTarea}
        tallerId={tallerId}
        especialidades={especialidades}
        categoriasOptions={CATEGORIAS_OPTIONS}
        condicionesOptions={CONDICIONES_OPTIONS}
        onSuccess={handleFormSuccess}
      />

      {/* Modal de gestión de fases */}
      {tallerId && (
        <TareaFasesManager
          open={fasesManagerOpen}
          onOpenChange={setFasesManagerOpen}
          tarea={tareaForFases}
          tallerId={tallerId}
        />
      )}

      {/* Dialog de confirmación de eliminación */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar tarea?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente la tarea 
              "{tareaToDelete?.nombre}" del catálogo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
