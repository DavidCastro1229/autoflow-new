import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, useSensor, useSensors, useDroppable, useDraggable } from "@dnd-kit/core";
import { Loader2, User, Car, Wrench, Calendar, DollarSign, Eye, FileText } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface Cliente {
  id: string;
  nombre: string;
  apellido: string;
}

interface Vehiculo {
  id: string;
  marca: string;
  modelo: string;
  placa: string;
}

interface Tecnico {
  id: string;
  nombre: string;
  apellido: string;
}

interface TipoOperacion {
  id: string;
  nombre: string;
}

interface Orden {
  id: string;
  cliente_id: string;
  vehiculo_id: string;
  descripcion: string;
  tipo_servicio_id: string;
  tecnico_id: string;
  fecha_ingreso: string;
  fecha_entrega: string | null;
  prioridad: 'baja' | 'media' | 'alta' | 'urgente';
  estado: 'recepcion' | 'autorizado' | 'en_proceso' | 'finalizada' | 'cancelada';
  costo_estimado: number | null;
  observaciones: string | null;
  clientes: Cliente;
  vehiculos: Vehiculo;
  tecnicos: Tecnico;
  tipos_operacion: TipoOperacion;
}

type EstadoOrden = 'recepcion' | 'autorizado' | 'en_proceso' | 'finalizada' | 'cancelada';

const COLUMNAS: { id: EstadoOrden; label: string; color: string }[] = [
  { id: 'recepcion', label: 'Recepción', color: 'bg-blue-500/10 border-blue-500' },
  { id: 'autorizado', label: 'Autorizado', color: 'bg-purple-500/10 border-purple-500' },
  { id: 'en_proceso', label: 'En Proceso', color: 'bg-yellow-500/10 border-yellow-500' },
  { id: 'finalizada', label: 'Finalizada', color: 'bg-green-500/10 border-green-500' },
  { id: 'cancelada', label: 'Cancelada', color: 'bg-red-500/10 border-red-500' },
];

export default function Kanban() {
  const [ordenes, setOrdenes] = useState<Orden[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedOrden, setSelectedOrden] = useState<Orden | null>(null);
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  useEffect(() => {
    fetchOrdenes();
  }, []);

  const fetchOrdenes = async () => {
    try {
      setLoading(true);
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      const { data: userRole } = await supabase
        .from("user_roles")
        .select("taller_id")
        .eq("user_id", userData.user.id)
        .single();

      if (!userRole?.taller_id) return;

      const { data, error } = await supabase
        .from("ordenes")
        .select(`
          *,
          clientes!ordenes_cliente_id_fkey (id, nombre, apellido),
          vehiculos!ordenes_vehiculo_id_fkey (id, marca, modelo, placa),
          tecnicos!ordenes_tecnico_id_fkey (id, nombre, apellido),
          tipos_operacion!ordenes_tipo_servicio_id_fkey (id, nombre)
        `)
        .eq("taller_id", userRole.taller_id)
        .order("fecha_ingreso", { ascending: false });

      if (error) throw error;
      setOrdenes(data || []);
    } catch (error: any) {
      console.error("Error fetching ordenes:", error);
      toast.error("Error al cargar las órdenes");
    } finally {
      setLoading(false);
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const ordenId = active.id as string;
    const nuevoEstado = over.id as EstadoOrden;
    const orden = ordenes.find(o => o.id === ordenId);

    if (!orden || orden.estado === nuevoEstado) return;

    // Actualizar optimísticamente
    setOrdenes(prev =>
      prev.map(o => (o.id === ordenId ? { ...o, estado: nuevoEstado } : o))
    );

    try {
      const { error } = await supabase
        .from("ordenes")
        .update({ estado: nuevoEstado })
        .eq("id", ordenId);

      if (error) throw error;

      toast.success("Estado actualizado correctamente");
    } catch (error: any) {
      console.error("Error updating orden:", error);
      toast.error("Error al actualizar el estado");
      // Revertir el cambio optimista
      fetchOrdenes();
    }
  };

  const getOrdenesPorEstado = (estado: EstadoOrden) => {
    return ordenes.filter(orden => orden.estado === estado);
  };

  const getPrioridadColor = (prioridad: string) => {
    const colors = {
      baja: 'bg-blue-500',
      media: 'bg-yellow-500',
      alta: 'bg-orange-500',
      urgente: 'bg-red-500',
    };
    return colors[prioridad as keyof typeof colors] || 'bg-gray-500';
  };

  const getEstadoBadge = (estado: string) => {
    const variants = {
      recepcion: "secondary",
      autorizado: "default",
      en_proceso: "default",
      finalizada: "default",
      cancelada: "destructive"
    };
    return variants[estado as keyof typeof variants] || "default";
  };

  const getPrioridadBadge = (prioridad: string) => {
    const variants = {
      baja: "secondary",
      media: "default",
      alta: "destructive",
      urgente: "destructive"
    };
    return variants[prioridad as keyof typeof variants] || "default";
  };

  const handleViewDetails = (orden: Orden) => {
    setSelectedOrden(orden);
    setDetailsModalOpen(true);
  };

  const activeOrden = activeId ? ordenes.find(o => o.id === activeId) : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Kanban - Órdenes de Trabajo</h1>
        <p className="text-muted-foreground">Arrastra las tarjetas para cambiar el estado de las órdenes</p>
      </div>

      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {COLUMNAS.map(columna => (
            <KanbanColumn
              key={columna.id}
              columna={columna}
              ordenes={getOrdenesPorEstado(columna.id)}
              getPrioridadColor={getPrioridadColor}
              onViewDetails={handleViewDetails}
            />
          ))}
        </div>

        <DragOverlay>
          {activeOrden && (
            <OrdenCard
              orden={activeOrden}
              getPrioridadColor={getPrioridadColor}
              isDragging
            />
          )}
        </DragOverlay>
      </DndContext>

      {/* Modal de Detalles */}
      <Dialog open={detailsModalOpen} onOpenChange={setDetailsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalles de la Orden</DialogTitle>
          </DialogHeader>

          {selectedOrden && (
            <div className="space-y-6">
              {/* Información de la Orden */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Información de la Orden
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-muted-foreground">Tipo de Servicio</Label>
                      <p className="font-medium">{selectedOrden.tipos_operacion.nombre}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Estado</Label>
                      <div className="mt-1">
                        <Badge variant={getEstadoBadge(selectedOrden.estado) as any}>
                          {selectedOrden.estado === "recepcion" ? "Recepción" :
                           selectedOrden.estado === "autorizado" ? "Autorizado" :
                           selectedOrden.estado === "en_proceso" ? "En Proceso" :
                           selectedOrden.estado === "finalizada" ? "Finalizada" : "Cancelada"}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Prioridad</Label>
                      <div className="mt-1">
                        <Badge variant={getPrioridadBadge(selectedOrden.prioridad) as any}>
                          {selectedOrden.prioridad}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Costo Estimado</Label>
                      <p className="font-medium">
                        {selectedOrden.costo_estimado ? `$${selectedOrden.costo_estimado.toFixed(2)}` : "No especificado"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Fecha de Ingreso</Label>
                      <p className="font-medium">
                        {format(new Date(selectedOrden.fecha_ingreso), "dd/MM/yyyy HH:mm", { locale: es })}
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Fecha de Entrega</Label>
                      <p className="font-medium">
                        {selectedOrden.fecha_entrega 
                          ? format(new Date(selectedOrden.fecha_entrega), "dd/MM/yyyy HH:mm", { locale: es })
                          : "No especificada"}
                      </p>
                    </div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Descripción</Label>
                    <p className="font-medium mt-1">{selectedOrden.descripcion}</p>
                  </div>
                  {selectedOrden.observaciones && (
                    <div>
                      <Label className="text-muted-foreground">Observaciones</Label>
                      <p className="font-medium mt-1">{selectedOrden.observaciones}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Separator />

              {/* Información del Cliente */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Información del Cliente
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-muted-foreground">Nombre</Label>
                      <p className="font-medium">{selectedOrden.clientes.nombre} {selectedOrden.clientes.apellido}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Separator />

              {/* Información del Vehículo */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Car className="h-5 w-5" />
                    Información del Vehículo
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-muted-foreground">Marca y Modelo</Label>
                      <p className="font-medium">{selectedOrden.vehiculos.marca} {selectedOrden.vehiculos.modelo}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Placa</Label>
                      <p className="font-medium">{selectedOrden.vehiculos.placa}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Separator />

              {/* Información del Técnico */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wrench className="h-5 w-5" />
                    Información del Técnico
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-muted-foreground">Nombre</Label>
                      <p className="font-medium">{selectedOrden.tecnicos.nombre} {selectedOrden.tecnicos.apellido}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface KanbanColumnProps {
  columna: { id: EstadoOrden; label: string; color: string };
  ordenes: Orden[];
  getPrioridadColor: (prioridad: string) => string;
  onViewDetails: (orden: Orden) => void;
}

function KanbanColumn({ columna, ordenes, getPrioridadColor, onViewDetails }: KanbanColumnProps) {
  const { setNodeRef } = useDroppable({ id: columna.id });

  return (
    <div ref={setNodeRef} className="flex flex-col gap-3">
      <div className={cn("rounded-lg border-2 p-3", columna.color)}>
        <h3 className="font-semibold text-sm flex items-center justify-between">
          {columna.label}
          <Badge variant="secondary" className="ml-2">
            {ordenes.length}
          </Badge>
        </h3>
      </div>

      <ScrollArea className="h-[calc(100vh-280px)]">
        <div className="space-y-3 pr-4">
          {ordenes.map(orden => (
            <Draggable key={orden.id} id={orden.id}>
              <OrdenCard
                orden={orden}
                getPrioridadColor={getPrioridadColor}
                onViewDetails={onViewDetails}
              />
            </Draggable>
          ))}
          {ordenes.length === 0 && (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No hay órdenes
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

interface DraggableProps {
  id: string;
  children: React.ReactNode;
}

function Draggable({ id, children }: DraggableProps) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      {children}
    </div>
  );
}

interface OrdenCardProps {
  orden: Orden;
  getPrioridadColor: (prioridad: string) => string;
  isDragging?: boolean;
  onViewDetails?: (orden: Orden) => void;
}

function OrdenCard({ orden, getPrioridadColor, isDragging, onViewDetails }: OrdenCardProps) {
  return (
    <Card className={cn(
      "cursor-grab active:cursor-grabbing transition-shadow hover:shadow-lg",
      isDragging && "opacity-50 shadow-2xl scale-105"
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-sm font-medium line-clamp-2">
            {orden.descripcion}
          </CardTitle>
          <div className={cn("w-3 h-3 rounded-full flex-shrink-0", getPrioridadColor(orden.prioridad))} />
        </div>
      </CardHeader>
      <CardContent className="space-y-2 text-xs">
        <div className="flex items-center gap-2 text-muted-foreground">
          <User className="h-3 w-3" />
          <span className="truncate">{orden.clientes.nombre} {orden.clientes.apellido}</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Car className="h-3 w-3" />
          <span className="truncate">{orden.vehiculos.marca} {orden.vehiculos.modelo}</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Wrench className="h-3 w-3" />
          <span className="truncate">{orden.tecnicos.nombre} {orden.tecnicos.apellido}</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Calendar className="h-3 w-3" />
          <span>{format(new Date(orden.fecha_ingreso), "dd/MM/yyyy", { locale: es })}</span>
        </div>
        {orden.costo_estimado && (
          <div className="flex items-center gap-2 text-muted-foreground font-semibold">
            <DollarSign className="h-3 w-3" />
            <span>${orden.costo_estimado.toFixed(2)}</span>
          </div>
        )}
        {onViewDetails && (
          <Button
            variant="outline"
            size="sm"
            className="w-full mt-2"
            onClick={(e) => {
              e.stopPropagation();
              onViewDetails(orden);
            }}
          >
            <Eye className="h-3 w-3 mr-1" />
            Ver Detalles
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
