import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Loader2, DollarSign, Clock, FileCheck, Package, PenTool } from "lucide-react";
import { SignatureDisplay } from "@/components/ui/signature-pad";

interface ConvenioViewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  solicitudId: string | null;
}

interface Convenio {
  id: string;
  tarifa_mo_mecanica: number;
  tarifa_mo_pintura: number;
  descuento_repuestos_b2b: number;
  regla_origen_piezas: string;
  tiempo_max_inspeccion: number;
  tiempo_max_traslado: number;
  tiempo_max_presupuesto: number;
  tiempo_max_autorizacion_tap: number;
  tiempo_max_auth_repuestos: number;
  tiempo_max_entrega_repuestos: number;
  tiempo_max_reparacion: number;
  tiempo_max_auth_complementos: number;
  tiempo_max_qc_final: number;
  dias_credito_pago: number;
  duracion_garantia_meses: number;
  firma_aseguradora: string | null;
  firma_taller: string | null;
  fecha_firma_aseguradora: string | null;
  fecha_firma_taller: string | null;
}

export default function ConvenioViewModal({
  open,
  onOpenChange,
  solicitudId,
}: ConvenioViewModalProps) {
  const [convenio, setConvenio] = useState<Convenio | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && solicitudId) {
      fetchConvenio();
    }
  }, [open, solicitudId]);

  const fetchConvenio = async () => {
    if (!solicitudId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("convenios_afiliacion")
        .select("*")
        .eq("solicitud_id", solicitudId)
        .single();

      if (error) throw error;
      setConvenio(data);
    } catch (error) {
      console.error("Error fetching convenio:", error);
    } finally {
      setLoading(false);
    }
  };

  const ConvenioItem = ({ label, value, unit }: { label: string; value: string | number; unit?: string }) => (
    <div className="flex justify-between items-center py-2">
      <span className="text-sm text-muted-foreground">{label}</span>
      <Badge variant="secondary" className="font-mono">
        {value} {unit}
      </Badge>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Términos del Convenio</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : convenio ? (
          <ScrollArea className="h-[60vh] pr-4">
            <div className="space-y-6">
              {/* Tarifas y Descuentos */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <DollarSign className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">Tarifas y Descuentos</h3>
                </div>
                <div className="bg-muted/50 rounded-lg p-4 space-y-1">
                  <ConvenioItem 
                    label="Tarifa Mano de Obra Mecánica" 
                    value={convenio.tarifa_mo_mecanica} 
                    unit="USD/hora" 
                  />
                  <ConvenioItem 
                    label="Tarifa Mano de Obra Pintura/Enderezado" 
                    value={convenio.tarifa_mo_pintura} 
                    unit="USD/hora" 
                  />
                  <ConvenioItem 
                    label="Descuento Repuestos B2B" 
                    value={convenio.descuento_repuestos_b2b} 
                    unit="%" 
                  />
                  <ConvenioItem 
                    label="Regla de Origen de Piezas" 
                    value={convenio.regla_origen_piezas} 
                  />
                </div>
              </div>

              <Separator />

              {/* SLA Pre-Producción */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">SLA Pre-Producción</h3>
                </div>
                <div className="bg-muted/50 rounded-lg p-4 space-y-1">
                  <ConvenioItem 
                    label="Tiempo Máx. Inspección" 
                    value={convenio.tiempo_max_inspeccion} 
                    unit="horas" 
                  />
                  <ConvenioItem 
                    label="Tiempo Máx. Traslado al Taller" 
                    value={convenio.tiempo_max_traslado} 
                    unit="horas" 
                  />
                  <ConvenioItem 
                    label="Tiempo Máx. Presupuesto del Taller" 
                    value={convenio.tiempo_max_presupuesto} 
                    unit="horas" 
                  />
                  <ConvenioItem 
                    label="Tiempo Máx. Autorización TAP" 
                    value={convenio.tiempo_max_autorizacion_tap} 
                    unit="horas" 
                  />
                </div>
              </div>

              <Separator />

              {/* SLA Logística y Producción */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Package className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">SLA Logística y Producción</h3>
                </div>
                <div className="bg-muted/50 rounded-lg p-4 space-y-1">
                  <ConvenioItem 
                    label="Tiempo Máx. Autorización Repuestos" 
                    value={convenio.tiempo_max_auth_repuestos} 
                    unit="horas" 
                  />
                  <ConvenioItem 
                    label="Tiempo Máx. Entrega Repuestos" 
                    value={convenio.tiempo_max_entrega_repuestos} 
                    unit="días" 
                  />
                  <ConvenioItem 
                    label="Tiempo Máx. Reparación (TAT)" 
                    value={convenio.tiempo_max_reparacion} 
                    unit="horas" 
                  />
                  <ConvenioItem 
                    label="Tiempo Máx. Autorización Complementos" 
                    value={convenio.tiempo_max_auth_complementos} 
                    unit="horas" 
                  />
                </div>
              </div>

              <Separator />

              {/* Cierre y Postventa */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <FileCheck className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">Cierre y Postventa</h3>
                </div>
                <div className="bg-muted/50 rounded-lg p-4 space-y-1">
                  <ConvenioItem 
                    label="Tiempo Máx. QC Final" 
                    value={convenio.tiempo_max_qc_final} 
                    unit="horas" 
                  />
                  <ConvenioItem 
                    label="Días de Crédito para Pago" 
                    value={convenio.dias_credito_pago} 
                    unit="días" 
                  />
                  <ConvenioItem 
                    label="Duración Garantía Mano de Obra" 
                    value={convenio.duracion_garantia_meses} 
                    unit="meses" 
                  />
                </div>
              </div>

              <Separator />

              {/* Firmas Digitales */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <PenTool className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">Firmas Digitales</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {convenio.firma_aseguradora ? (
                    <SignatureDisplay 
                      signature={convenio.firma_aseguradora}
                      label="Firma de la Aseguradora"
                      date={convenio.fecha_firma_aseguradora || undefined}
                    />
                  ) : (
                    <div className="border rounded-lg p-4 bg-muted/20">
                      <p className="text-sm text-muted-foreground text-center">
                        Pendiente firma de aseguradora
                      </p>
                    </div>
                  )}
                  
                  {convenio.firma_taller ? (
                    <SignatureDisplay 
                      signature={convenio.firma_taller}
                      label="Firma del Taller"
                      date={convenio.fecha_firma_taller || undefined}
                    />
                  ) : (
                    <div className="border rounded-lg p-4 bg-muted/20">
                      <p className="text-sm text-muted-foreground text-center">
                        Pendiente firma del taller
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </ScrollArea>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No se encontraron términos de convenio
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
