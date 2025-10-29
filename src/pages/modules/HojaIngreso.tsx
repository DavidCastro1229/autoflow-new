import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Loader2, Upload, X } from "lucide-react";
import SignatureCanvas from "react-signature-canvas";
import { useUserRole } from "@/hooks/useUserRole";

interface ItemState {
  cantidad: string;
  si: boolean;
  no: boolean;
}

const HojaIngreso = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { tallerId, loading: rolesLoading } = useUserRole();
  const [loading, setLoading] = useState(false);
  const [vehiculos, setVehiculos] = useState<any[]>([]);
  const [selectedVehiculo, setSelectedVehiculo] = useState("");
  
  const sigClienteRef = useRef<SignatureCanvas>(null);
  const sigEncargadoRef = useRef<SignatureCanvas>(null);

  const [interiores, setInteriores] = useState({
    documentos: { cantidad: "", si: false, no: false },
    radio: { cantidad: "", si: false, no: false },
    portafusil: { cantidad: "", si: false, no: false },
    encendedor: { cantidad: "", si: false, no: false },
    tapetes_tela: { cantidad: "", si: false, no: false },
    tapetes_plastico: { cantidad: "", si: false, no: false },
    medidor_gasolina: { cantidad: "", si: false, no: false },
    kilometraje: { cantidad: "", si: false, no: false },
  });

  const [exteriores, setExteriores] = useState({
    antena: { cantidad: "", si: false, no: false },
    falanges: { cantidad: "", si: false, no: false },
    centro_rin: { cantidad: "", si: false, no: false },
    placas: { cantidad: "", si: false, no: false },
  });

  const [nivelGasolina, setNivelGasolina] = useState("1/4");

  const [coqueta, setCoqueta] = useState({
    herramienta: { cantidad: "", si: false, no: false },
    reflejantes: { cantidad: "", si: false, no: false },
    cables_corriente: { cantidad: "", si: false, no: false },
    llanta_refaccion: { cantidad: "", si: false, no: false },
    llave_cruceta: { cantidad: "", si: false, no: false },
    gato: { cantidad: "", si: false, no: false },
    latero: { cantidad: "", si: false, no: false },
    otro: { cantidad: "", si: false, no: false },
  });

  const [motor, setMotor] = useState({
    bateria: { cantidad: "", si: false, no: false },
    computadora: { cantidad: "", si: false, no: false },
    tapones_deposito: { cantidad: "", si: false, no: false },
  });

  const [comentarios, setComentarios] = useState("");
  const [imagenesCarroceria, setImagenesCarroceria] = useState<File[]>([]);

  useEffect(() => {
    if (tallerId) {
      fetchVehiculos();
    }
  }, [tallerId]);

  const fetchVehiculos = async () => {
    if (!tallerId) return;

    const { data, error } = await supabase
      .from("vehiculos")
      .select(`
        id,
        placa,
        marca,
        modelo,
        anio,
        clientes (
          nombre,
          apellido
        )
      `)
      .eq("taller_id", tallerId)
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudieron cargar los vehículos",
      });
      return;
    }

    setVehiculos(data || []);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setImagenesCarroceria(prev => [...prev, ...files]);
    }
  };

  const removeImage = (index: number) => {
    setImagenesCarroceria(prev => prev.filter((_, i) => i !== index));
  };

  const uploadImages = async () => {
    const uploadedUrls: string[] = [];

    for (const file of imagenesCarroceria) {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${tallerId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("hojas-ingreso")
        .upload(filePath, file);

      if (uploadError) {
        console.error("Error uploading image:", uploadError);
        continue;
      }

      const { data } = supabase.storage
        .from("hojas-ingreso")
        .getPublicUrl(filePath);

      uploadedUrls.push(data.publicUrl);
    }

    return uploadedUrls;
  };

  const uploadSignature = async (canvas: SignatureCanvas | null, type: string) => {
    if (!canvas || canvas.isEmpty()) return null;

    const signatureBlob = await fetch(canvas.toDataURL()).then(res => res.blob());
    const fileName = `${type}_${Date.now()}.png`;
    const filePath = `${tallerId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("hojas-ingreso")
      .upload(filePath, signatureBlob);

    if (uploadError) {
      console.error("Error uploading signature:", uploadError);
      return null;
    }

    const { data } = supabase.storage
      .from("hojas-ingreso")
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedVehiculo) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Selecciona un vehículo",
      });
      return;
    }

    setLoading(true);

    try {
      const imageUrls = await uploadImages();
      const firmaClienteUrl = await uploadSignature(sigClienteRef.current, "cliente");
      const firmaEncargadoUrl = await uploadSignature(sigEncargadoRef.current, "encargado");

      const { error } = await supabase.from("hojas_ingreso").insert({
        vehiculo_id: selectedVehiculo,
        taller_id: tallerId,
        interiores,
        exteriores,
        nivel_gasolina: nivelGasolina,
        coqueta,
        motor,
        comentarios,
        imagenes_carroceria: imageUrls,
        firma_cliente: firmaClienteUrl,
        firma_encargado: firmaEncargadoUrl,
      });

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Hoja de ingreso creada correctamente",
      });

      navigate("/vehiculos");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const renderItemCheckboxes = (
    section: any,
    setSection: any,
    key: string,
    label: string
  ) => (
    <div className="grid grid-cols-4 gap-4 items-center border-b pb-2">
      <Label>{label}</Label>
      <Input
        type="number"
        placeholder="Cantidad"
        value={section[key].cantidad}
        onChange={(e) =>
          setSection({
            ...section,
            [key]: { ...section[key], cantidad: e.target.value },
          })
        }
      />
      <div className="flex items-center gap-2">
        <Checkbox
          checked={section[key].si}
          onCheckedChange={(checked) =>
            setSection({
              ...section,
              [key]: { ...section[key], si: checked, no: false },
            })
          }
        />
        <Label>Sí</Label>
      </div>
      <div className="flex items-center gap-2">
        <Checkbox
          checked={section[key].no}
          onCheckedChange={(checked) =>
            setSection({
              ...section,
              [key]: { ...section[key], no: checked, si: false },
            })
          }
        />
        <Label>No</Label>
      </div>
    </div>
  );

  if (rolesLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Hoja de Ingreso</h1>
        <Button variant="outline" onClick={() => navigate("/vehiculos")}>
          Cancelar
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Seleccionar Vehículo</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedVehiculo} onValueChange={setSelectedVehiculo}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un vehículo" />
              </SelectTrigger>
              <SelectContent>
                {vehiculos.map((vehiculo) => (
                  <SelectItem key={vehiculo.id} value={vehiculo.id}>
                    {vehiculo.placa} - {vehiculo.marca} {vehiculo.modelo} ({vehiculo.anio}) - {vehiculo.clientes?.nombre} {vehiculo.clientes?.apellido}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Interiores</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {renderItemCheckboxes(interiores, setInteriores, "documentos", "Documentos")}
            {renderItemCheckboxes(interiores, setInteriores, "radio", "Radio")}
            {renderItemCheckboxes(interiores, setInteriores, "portafusil", "Portafusil")}
            {renderItemCheckboxes(interiores, setInteriores, "encendedor", "Encendedor")}
            {renderItemCheckboxes(interiores, setInteriores, "tapetes_tela", "Tapetes de Tela")}
            {renderItemCheckboxes(interiores, setInteriores, "tapetes_plastico", "Tapetes de Plástico")}
            {renderItemCheckboxes(interiores, setInteriores, "medidor_gasolina", "Medidor de Gasolina")}
            {renderItemCheckboxes(interiores, setInteriores, "kilometraje", "Kilometraje")}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Exteriores</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {renderItemCheckboxes(exteriores, setExteriores, "antena", "Antena")}
            {renderItemCheckboxes(exteriores, setExteriores, "falanges", "Falanges")}
            {renderItemCheckboxes(exteriores, setExteriores, "centro_rin", "Centro de Rin")}
            {renderItemCheckboxes(exteriores, setExteriores, "placas", "Placas")}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Nivel de Gasolina</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={nivelGasolina} onValueChange={setNivelGasolina}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Vacío">Vacío</SelectItem>
                <SelectItem value="1/4">1/4</SelectItem>
                <SelectItem value="1/2">1/2</SelectItem>
                <SelectItem value="3/4">3/4</SelectItem>
                <SelectItem value="Lleno">Lleno</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cajuela/Coqueta</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {renderItemCheckboxes(coqueta, setCoqueta, "herramienta", "Herramienta")}
            {renderItemCheckboxes(coqueta, setCoqueta, "reflejantes", "Reflejantes")}
            {renderItemCheckboxes(coqueta, setCoqueta, "cables_corriente", "Cables de Corriente")}
            {renderItemCheckboxes(coqueta, setCoqueta, "llanta_refaccion", "Llanta de Refacción")}
            {renderItemCheckboxes(coqueta, setCoqueta, "llave_cruceta", "Llave Cruceta")}
            {renderItemCheckboxes(coqueta, setCoqueta, "gato", "Gato")}
            {renderItemCheckboxes(coqueta, setCoqueta, "latero", "Latero")}
            {renderItemCheckboxes(coqueta, setCoqueta, "otro", "Otro")}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Motor</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {renderItemCheckboxes(motor, setMotor, "bateria", "Batería")}
            {renderItemCheckboxes(motor, setMotor, "computadora", "Computadora")}
            {renderItemCheckboxes(motor, setMotor, "tapones_deposito", "Tapones de Depósito")}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Comentarios</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Escribe comentarios adicionales..."
              value={comentarios}
              onChange={(e) => setComentarios(e.target.value)}
              rows={4}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Imágenes de la Carrocería</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="images" className="cursor-pointer">
                <div className="border-2 border-dashed rounded-lg p-6 text-center hover:bg-accent">
                  <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                  <p className="mt-2">Haz clic para subir imágenes</p>
                </div>
              </Label>
              <Input
                id="images"
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleImageUpload}
              />
            </div>
            {imagenesCarroceria.length > 0 && (
              <div className="grid grid-cols-3 gap-4">
                {imagenesCarroceria.map((file, index) => (
                  <div key={index} className="relative">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={`Carrocería ${index + 1}`}
                      className="w-full h-32 object-cover rounded"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-1 right-1"
                      onClick={() => removeImage(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Firma del Cliente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="border rounded">
                <SignatureCanvas
                  ref={sigClienteRef}
                  canvasProps={{
                    className: "w-full h-40",
                  }}
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => sigClienteRef.current?.clear()}
              >
                Limpiar
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Firma del Encargado</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="border rounded">
                <SignatureCanvas
                  ref={sigEncargadoRef}
                  canvasProps={{
                    className: "w-full h-40",
                  }}
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => sigEncargadoRef.current?.clear()}
              >
                Limpiar
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/vehiculos")}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              "Guardar Hoja de Ingreso"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default HojaIngreso;
