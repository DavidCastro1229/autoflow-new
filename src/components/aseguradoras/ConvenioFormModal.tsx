import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, DollarSign, Clock, FileCheck, PenTool } from "lucide-react";
import { SignaturePad } from "@/components/ui/signature-pad";

export interface ConvenioData {
  // Tarifas y descuentos
  tarifa_mo_mecanica: number;
  tarifa_mo_pintura: number;
  descuento_repuestos_b2b: number;
  regla_origen_piezas: string;
  
  // SLA Pre-producción
  tiempo_max_inspeccion: number;
  tiempo_max_traslado: number;
  tiempo_max_presupuesto: number;
  tiempo_max_autorizacion_tap: number;
  
  // SLA Logística y producción
  tiempo_max_auth_repuestos: number;
  tiempo_max_entrega_repuestos: number;
  tiempo_max_reparacion: number;
  tiempo_max_auth_complementos: number;
  
  // Cierre y postventa
  tiempo_max_qc_final: number;
  dias_credito_pago: number;
  duracion_garantia_meses: number;
  
  // Firma
  firma_aseguradora?: string;
}

interface ConvenioFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tallerNombre: string;
  mensaje: string;
  onMensajeChange: (mensaje: string) => void;
  onSubmit: (convenio: ConvenioData) => void;
  isLoading?: boolean;
}

const defaultConvenio: ConvenioData = {
  tarifa_mo_mecanica: 35,
  tarifa_mo_pintura: 40,
  descuento_repuestos_b2b: 15,
  regla_origen_piezas: "OEM",
  tiempo_max_inspeccion: 24,
  tiempo_max_traslado: 48,
  tiempo_max_presupuesto: 24,
  tiempo_max_autorizacion_tap: 24,
  tiempo_max_auth_repuestos: 24,
  tiempo_max_entrega_repuestos: 5,
  tiempo_max_reparacion: 72,
  tiempo_max_auth_complementos: 12,
  tiempo_max_qc_final: 4,
  dias_credito_pago: 30,
  duracion_garantia_meses: 12,
  firma_aseguradora: undefined,
};

export default function ConvenioFormModal({
  open,
  onOpenChange,
  tallerNombre,
  mensaje,
  onMensajeChange,
  onSubmit,
  isLoading = false,
}: ConvenioFormModalProps) {
  const [convenio, setConvenio] = useState<ConvenioData>(defaultConvenio);

  const handleChange = (field: keyof ConvenioData, value: number | string) => {
    setConvenio((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = () => {
    onSubmit(convenio);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Solicitud de Afiliación</DialogTitle>
          <DialogDescription>
            Configura los términos del convenio para <strong>{tallerNombre}</strong>
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[60vh] pr-4">
          <Tabs defaultValue="tarifas" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="tarifas" className="text-xs">
                <DollarSign className="w-3 h-3 mr-1" />
                Tarifas
              </TabsTrigger>
              <TabsTrigger value="pre-produccion" className="text-xs">
                <Clock className="w-3 h-3 mr-1" />
                Pre-Prod
              </TabsTrigger>
              <TabsTrigger value="logistica" className="text-xs">
                <Clock className="w-3 h-3 mr-1" />
                Logística
              </TabsTrigger>
              <TabsTrigger value="cierre" className="text-xs">
                <FileCheck className="w-3 h-3 mr-1" />
                Cierre
              </TabsTrigger>
              <TabsTrigger value="firma" className="text-xs">
                <PenTool className="w-3 h-3 mr-1" />
                Firma
              </TabsTrigger>
            </TabsList>

            <TabsContent value="tarifas" className="space-y-4 mt-4">
              <h3 className="font-semibold text-sm text-muted-foreground">Tarifas y Descuentos</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tarifa_mo_mecanica">
                    Tarifa Mano de Obra Mecánica (USD/hora)
                  </Label>
                  <Input
                    id="tarifa_mo_mecanica"
                    type="number"
                    min={0}
                    step={0.5}
                    value={convenio.tarifa_mo_mecanica}
                    onChange={(e) => handleChange("tarifa_mo_mecanica", parseFloat(e.target.value) || 0)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Tarifa por hora acordada para trabajos de mecánica
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tarifa_mo_pintura">
                    Tarifa Mano de Obra Pintura/Enderezado (USD/hora)
                  </Label>
                  <Input
                    id="tarifa_mo_pintura"
                    type="number"
                    min={0}
                    step={0.5}
                    value={convenio.tarifa_mo_pintura}
                    onChange={(e) => handleChange("tarifa_mo_pintura", parseFloat(e.target.value) || 0)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Tarifa por hora acordada para trabajos de pintura y enderezado
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="descuento_repuestos_b2b">
                    Descuento Repuestos B2B (%)
                  </Label>
                  <Input
                    id="descuento_repuestos_b2b"
                    type="number"
                    min={0}
                    max={100}
                    value={convenio.descuento_repuestos_b2b}
                    onChange={(e) => handleChange("descuento_repuestos_b2b", parseFloat(e.target.value) || 0)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Porcentaje de descuento obligatorio sobre el precio de lista de repuestos
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="regla_origen_piezas">
                    Regla de Origen de Piezas
                  </Label>
                  <Select
                    value={convenio.regla_origen_piezas}
                    onValueChange={(value) => handleChange("regla_origen_piezas", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="OEM">OEM (Original)</SelectItem>
                      <SelectItem value="Certificada">Certificada</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Tipo de pieza autorizado para reparación
                  </p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="pre-produccion" className="space-y-4 mt-4">
              <h3 className="font-semibold text-sm text-muted-foreground">SLA Pre-Producción</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tiempo_max_inspeccion">
                    Tiempo Máx. Inspección (horas)
                  </Label>
                  <Input
                    id="tiempo_max_inspeccion"
                    type="number"
                    min={1}
                    value={convenio.tiempo_max_inspeccion}
                    onChange={(e) => handleChange("tiempo_max_inspeccion", parseInt(e.target.value) || 0)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Tiempo máximo para que el ajustador realice la inspección
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tiempo_max_traslado">
                    Tiempo Máx. Traslado al Taller (horas)
                  </Label>
                  <Input
                    id="tiempo_max_traslado"
                    type="number"
                    min={1}
                    value={convenio.tiempo_max_traslado}
                    onChange={(e) => handleChange("tiempo_max_traslado", parseInt(e.target.value) || 0)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Tiempo máximo para trasladar el vehículo al taller
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tiempo_max_presupuesto">
                    Tiempo Máx. Presupuesto del Taller (horas)
                  </Label>
                  <Input
                    id="tiempo_max_presupuesto"
                    type="number"
                    min={1}
                    value={convenio.tiempo_max_presupuesto}
                    onChange={(e) => handleChange("tiempo_max_presupuesto", parseInt(e.target.value) || 0)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Tiempo máximo para que el taller envíe el presupuesto
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tiempo_max_autorizacion_tap">
                    Tiempo Máx. Autorización TAP (horas)
                  </Label>
                  <Input
                    id="tiempo_max_autorizacion_tap"
                    type="number"
                    min={1}
                    value={convenio.tiempo_max_autorizacion_tap}
                    onChange={(e) => handleChange("tiempo_max_autorizacion_tap", parseInt(e.target.value) || 0)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Tiempo máximo para autorizar el presupuesto inicial
                  </p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="logistica" className="space-y-4 mt-4">
              <h3 className="font-semibold text-sm text-muted-foreground">SLA Logística y Producción</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tiempo_max_auth_repuestos">
                    Tiempo Máx. Autorización Repuestos (horas)
                  </Label>
                  <Input
                    id="tiempo_max_auth_repuestos"
                    type="number"
                    min={1}
                    value={convenio.tiempo_max_auth_repuestos}
                    onChange={(e) => handleChange("tiempo_max_auth_repuestos", parseInt(e.target.value) || 0)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Tiempo máximo para autorizar la orden de compra de repuestos
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tiempo_max_entrega_repuestos">
                    Tiempo Máx. Entrega Repuestos (días)
                  </Label>
                  <Input
                    id="tiempo_max_entrega_repuestos"
                    type="number"
                    min={1}
                    value={convenio.tiempo_max_entrega_repuestos}
                    onChange={(e) => handleChange("tiempo_max_entrega_repuestos", parseInt(e.target.value) || 0)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Tiempo máximo para la entrega de repuestos al taller
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tiempo_max_reparacion">
                    Tiempo Máx. Reparación TAT (horas)
                  </Label>
                  <Input
                    id="tiempo_max_reparacion"
                    type="number"
                    min={1}
                    value={convenio.tiempo_max_reparacion}
                    onChange={(e) => handleChange("tiempo_max_reparacion", parseInt(e.target.value) || 0)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Tiempo total máximo para completar la reparación
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tiempo_max_auth_complementos">
                    Tiempo Máx. Autorización Complementos (horas)
                  </Label>
                  <Input
                    id="tiempo_max_auth_complementos"
                    type="number"
                    min={1}
                    value={convenio.tiempo_max_auth_complementos}
                    onChange={(e) => handleChange("tiempo_max_auth_complementos", parseInt(e.target.value) || 0)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Tiempo máximo para autorizar trabajos complementarios
                  </p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="cierre" className="space-y-4 mt-4">
              <h3 className="font-semibold text-sm text-muted-foreground">Cierre y Postventa</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tiempo_max_qc_final">
                    Tiempo Máx. QC Final (horas)
                  </Label>
                  <Input
                    id="tiempo_max_qc_final"
                    type="number"
                    min={1}
                    value={convenio.tiempo_max_qc_final}
                    onChange={(e) => handleChange("tiempo_max_qc_final", parseInt(e.target.value) || 0)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Tiempo máximo para la inspección final antes de la entrega
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dias_credito_pago">
                    Días de Crédito para Pago
                  </Label>
                  <Input
                    id="dias_credito_pago"
                    type="number"
                    min={1}
                    value={convenio.dias_credito_pago}
                    onChange={(e) => handleChange("dias_credito_pago", parseInt(e.target.value) || 0)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Plazo máximo para el pago de la factura final al taller
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="duracion_garantia_meses">
                    Duración Garantía Mano de Obra (meses)
                  </Label>
                  <Input
                    id="duracion_garantia_meses"
                    type="number"
                    min={1}
                    value={convenio.duracion_garantia_meses}
                    onChange={(e) => handleChange("duracion_garantia_meses", parseInt(e.target.value) || 0)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Duración de la garantía otorgada por la mano de obra
                  </p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="firma" className="space-y-4 mt-4">
              <h3 className="font-semibold text-sm text-muted-foreground">Firma de la Aseguradora</h3>
              
              <div className="bg-muted/30 p-4 rounded-lg">
                <p className="text-sm text-muted-foreground mb-4">
                  Al firmar, confirmas que los términos del convenio propuesto son correctos y autorizados por la aseguradora.
                </p>
                
                <SignaturePad
                  label="Firma del Representante de la Aseguradora"
                  value={convenio.firma_aseguradora}
                  onChange={(signature) => handleChange("firma_aseguradora", signature || "")}
                  required
                />
              </div>
            </TabsContent>
          </Tabs>

          <div className="space-y-2 mt-6 border-t pt-4">
            <Label htmlFor="mensaje">Mensaje para el taller (opcional)</Label>
            <Textarea
              id="mensaje"
              placeholder="Escribe un mensaje para acompañar tu solicitud..."
              value={mensaje}
              onChange={(e) => onMensajeChange(e.target.value)}
              rows={3}
            />
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isLoading || !convenio.firma_aseguradora}
          >
            <Send className="w-4 h-4 mr-2" />
            {isLoading ? "Enviando..." : "Enviar Solicitud"}
          </Button>
        </DialogFooter>
        {!convenio.firma_aseguradora && (
          <p className="text-xs text-destructive text-center">
            Debes firmar el convenio antes de enviar la solicitud
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
