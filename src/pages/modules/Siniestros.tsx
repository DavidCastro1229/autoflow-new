import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAseguradoraTalleres } from "@/hooks/useAseguradoraTalleres";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Plus, Search, Loader2, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

interface Siniestro {
  id: string;
  numero_siniestro: string;
  taller_id: string;
  vehiculo_id: string;
  fecha_siniestro: string;
  descripcion: string;
  estado: string;
  monto_estimado: number;
  created_at: string;
  vehiculos?: {
    marca: string;
    modelo: string;
    placa: string;
  };
  talleres?: {
    nombre_taller: string;
  };
}

const Siniestros = () => {
  const { talleres, loading: talleresLoading } = useAseguradoraTalleres();
  const [siniestros, setSiniestros] = useState<Siniestro[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTaller, setSelectedTaller] = useState<string>("todos");
  const [openDialog, setOpenDialog] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    numero_siniestro: "",
    taller_id: "",
    vehiculo_id: "",
    fecha_siniestro: "",
    descripcion: "",
    estado: "pendiente",
    monto_estimado: 0
  });

  const fetchSiniestros = async () => {
    if (talleres.length === 0) {
      setLoading(false);
      return;
    }

    const tallerIds = selectedTaller === "todos" 
      ? talleres.map(t => t.id)
      : [selectedTaller];

    try {
      const { data, error } = await supabase
        .from("siniestros")
        .select(`
          *,
          vehiculos (marca, modelo, placa),
          talleres (nombre_taller)
        `)
        .in("taller_id", tallerIds)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setSiniestros(data || []);
    } catch (error) {
      console.error("Error fetching siniestros:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los siniestros",
        variant: "destructive"
      });
    }

    setLoading(false);
  };

  useEffect(() => {
    if (!talleresLoading) {
      fetchSiniestros();
    }
  }, [talleres, selectedTaller, talleresLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const { error } = await supabase
        .from("siniestros")
        .insert([formData]);

      if (error) throw error;

      toast({
        title: "Siniestro registrado",
        description: "El siniestro se ha registrado correctamente"
      });

      setOpenDialog(false);
      setFormData({
        numero_siniestro: "",
        taller_id: "",
        vehiculo_id: "",
        fecha_siniestro: "",
        descripcion: "",
        estado: "pendiente",
        monto_estimado: 0
      });
      fetchSiniestros();
    } catch (error) {
      console.error("Error creating siniestro:", error);
      toast({
        title: "Error",
        description: "No se pudo registrar el siniestro",
        variant: "destructive"
      });
    }
  };

  const filteredSiniestros = siniestros.filter(siniestro =>
    siniestro.numero_siniestro.toLowerCase().includes(searchTerm.toLowerCase()) ||
    siniestro.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
    siniestro.vehiculos?.placa.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getEstadoBadge = (estado: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pendiente: "secondary",
      en_proceso: "default",
      completado: "outline",
      rechazado: "destructive"
    };
    return variants[estado] || "default";
  };

  if (talleresLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Siniestros</h1>
          <p className="text-muted-foreground">
            Gestión de reportes de siniestros
          </p>
        </div>
        
        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Siniestro
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Registrar Nuevo Siniestro</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="numero_siniestro">Número de Siniestro</Label>
                  <Input
                    id="numero_siniestro"
                    value={formData.numero_siniestro}
                    onChange={(e) => setFormData({ ...formData, numero_siniestro: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="taller_id">Taller</Label>
                  <Select
                    value={formData.taller_id}
                    onValueChange={(value) => setFormData({ ...formData, taller_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar taller" />
                    </SelectTrigger>
                    <SelectContent>
                      {talleres.map((taller) => (
                        <SelectItem key={taller.id} value={taller.id}>
                          {taller.nombre_taller}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fecha_siniestro">Fecha del Siniestro</Label>
                  <Input
                    id="fecha_siniestro"
                    type="date"
                    value={formData.fecha_siniestro}
                    onChange={(e) => setFormData({ ...formData, fecha_siniestro: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="monto_estimado">Monto Estimado</Label>
                  <Input
                    id="monto_estimado"
                    type="number"
                    value={formData.monto_estimado}
                    onChange={(e) => setFormData({ ...formData, monto_estimado: parseFloat(e.target.value) })}
                    required
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="descripcion">Descripción</Label>
                  <Textarea
                    id="descripcion"
                    value={formData.descripcion}
                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                    rows={4}
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setOpenDialog(false)}>
                  Cancelar
                </Button>
                <Button type="submit">Registrar Siniestro</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar siniestros..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedTaller} onValueChange={setSelectedTaller}>
              <SelectTrigger className="w-full sm:w-[250px]">
                <SelectValue placeholder="Filtrar por taller" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los talleres</SelectItem>
                {talleres.map((taller) => (
                  <SelectItem key={taller.id} value={taller.id}>
                    {taller.nombre_taller}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {filteredSiniestros.length === 0 ? (
            <div className="text-center py-8">
              <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {searchTerm ? "No se encontraron siniestros" : "No hay siniestros registrados"}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredSiniestros.map((siniestro) => (
                <Card key={siniestro.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-3">
                          <AlertTriangle className="h-5 w-5 text-orange-500" />
                          <h3 className="font-semibold">{siniestro.numero_siniestro}</h3>
                          <Badge variant={getEstadoBadge(siniestro.estado)}>
                            {siniestro.estado.replace("_", " ")}
                          </Badge>
                        </div>
                        <div className="grid gap-2 text-sm text-muted-foreground">
                          <p><strong>Taller:</strong> {siniestro.talleres?.nombre_taller}</p>
                          <p><strong>Vehículo:</strong> {siniestro.vehiculos?.marca} {siniestro.vehiculos?.modelo} - {siniestro.vehiculos?.placa}</p>
                          <p><strong>Fecha:</strong> {new Date(siniestro.fecha_siniestro).toLocaleDateString()}</p>
                          <p><strong>Descripción:</strong> {siniestro.descripcion}</p>
                          <p><strong>Monto Estimado:</strong> L. {siniestro.monto_estimado.toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Siniestros;
