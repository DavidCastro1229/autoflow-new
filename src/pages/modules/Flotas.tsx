import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Building2, Users, Phone, X } from "lucide-react";
import { Separator } from "@/components/ui/separator";

type TipoFlota = "propia" | "alquilada" | "mixta";
type EstadoFlota = "activa" | "en_renovacion" | "inactiva";
type TipoComunicacionInterna = "gerencia" | "ventas" | "produccion" | "suministro";
type TipoComunicacionExterna = "aseguradora" | "arrendadora" | "taller_externo";

interface Propietario {
  id?: string;
  nombre_propietario: string;
  telefono: string;
  correo: string;
  razon_social: string;
  rtn: string;
  cantidad_vehiculos: number;
}

interface JefeFlota {
  nombre: string;
  telefono: string;
  correo: string;
  cargo_posicion: string;
  horarios_trabajo: string;
}

interface ContactoComunicacion {
  id?: string;
  nombre: string;
  correo: string;
  celular: string;
  whatsapp: string;
  telefono_fijo: string;
}

interface ComunicacionInterna {
  gerencia: ContactoComunicacion[];
  ventas: ContactoComunicacion[];
  produccion: ContactoComunicacion[];
  suministro: ContactoComunicacion[];
}

interface ComunicacionExterna {
  aseguradora: ContactoComunicacion[];
  arrendadora: ContactoComunicacion[];
  taller_externo: ContactoComunicacion[];
}

interface Departamento {
  id?: string;
  nombre_departamento: string;
  comunicacion_interna: ComunicacionInterna;
  comunicacion_externa: ComunicacionExterna;
}

interface Flota {
  id?: string;
  numero_flota: string;
  fecha_registro: string;
  nombre_flota: string;
  logo_url: string;
  tipo_flota: TipoFlota;
  razon_social: string;
  numero_rtn: string;
  cantidad_vehiculos: number;
  categoria_vehiculos: string[];
  estado: EstadoFlota;
  rubro_empresa: string;
  direccion_fisica: string;
  telefono_contacto: string;
  correo_contacto: string;
  sitio_web: string;
  direccion_google_maps: string;
  direccion_escrita: string;
  direccion_parqueo: string;
  direccion_google_maps_parqueo: string;
  horarios_atencion: string;
  taller_id: string;
  propietarios?: Propietario[];
  jefe_flota?: JefeFlota;
  departamentos?: Departamento[];
}

const initialFormData: Flota = {
  numero_flota: "",
  fecha_registro: new Date().toISOString().split('T')[0],
  nombre_flota: "",
  logo_url: "",
  tipo_flota: "propia",
  razon_social: "",
  numero_rtn: "",
  cantidad_vehiculos: 0,
  categoria_vehiculos: [],
  estado: "activa",
  rubro_empresa: "",
  direccion_fisica: "",
  telefono_contacto: "",
  correo_contacto: "",
  sitio_web: "",
  direccion_google_maps: "",
  direccion_escrita: "",
  direccion_parqueo: "",
  direccion_google_maps_parqueo: "",
  horarios_atencion: "",
  taller_id: "",
  propietarios: [],
  jefe_flota: {
    nombre: "",
    telefono: "",
    correo: "",
    cargo_posicion: "",
    horarios_trabajo: "",
  },
  departamentos: [],
};

export default function Flotas() {
  const { tallerId } = useUserRole();
  const { toast } = useToast();
  const [flotas, setFlotas] = useState<Flota[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState<Flota>(initialFormData);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [categoriaInput, setCategoriaInput] = useState("");

  useEffect(() => {
    if (tallerId) {
      fetchFlotas();
    }
  }, [tallerId]);

  const fetchFlotas = async () => {
    try {
      const { data, error } = await supabase
        .from("flotas")
        .select("*")
        .eq("taller_id", tallerId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setFlotas(data || []);
    } catch (error) {
      console.error("Error fetching flotas:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las flotas",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!tallerId) {
      toast({
        title: "Error",
        description: "No se pudo identificar el taller",
        variant: "destructive",
      });
      return;
    }

    try {
      const flotaData = {
        ...formData,
        taller_id: tallerId,
      };

      let flotaId: string;

      if (editingId) {
        const { error } = await supabase
          .from("flotas")
          .update(flotaData)
          .eq("id", editingId);

        if (error) throw error;
        flotaId = editingId;
      } else {
        const { data, error } = await supabase
          .from("flotas")
          .insert([flotaData])
          .select()
          .single();

        if (error) throw error;
        flotaId = data.id;
      }

      // Save propietarios if tipo_flota is mixta
      if (formData.tipo_flota === "mixta" && formData.propietarios && formData.propietarios.length > 0) {
        if (editingId) {
          await supabase.from("flota_propietarios").delete().eq("flota_id", flotaId);
        }
        
        const propietariosData = formData.propietarios.map(p => ({
          flota_id: flotaId,
          ...p,
        }));

        const { error: propError } = await supabase
          .from("flota_propietarios")
          .insert(propietariosData);

        if (propError) throw propError;
      }

      // Save jefe de flota
      if (formData.jefe_flota) {
        if (editingId) {
          await supabase.from("flota_jefe").delete().eq("flota_id", flotaId);
        }

        const { error: jefeError } = await supabase
          .from("flota_jefe")
          .insert([{
            flota_id: flotaId,
            ...formData.jefe_flota,
          }]);

        if (jefeError) throw jefeError;
      }

      // Save departamentos with comunicacion
      if (formData.departamentos && formData.departamentos.length > 0) {
        if (editingId) {
          await supabase.from("flota_departamentos").delete().eq("flota_id", flotaId);
        }

        for (const dept of formData.departamentos) {
          const { data: deptData, error: deptError } = await supabase
            .from("flota_departamentos")
            .insert([{
              flota_id: flotaId,
              nombre_departamento: dept.nombre_departamento,
            }])
            .select()
            .single();

          if (deptError) throw deptError;

          // Save comunicacion interna
          const comunicacionInternaData: any[] = [];
          Object.entries(dept.comunicacion_interna).forEach(([tipo, contactos]) => {
            contactos.forEach(contacto => {
              comunicacionInternaData.push({
                departamento_id: deptData.id,
                tipo: tipo as TipoComunicacionInterna,
                ...contacto,
              });
            });
          });

          if (comunicacionInternaData.length > 0) {
            const { error: intError } = await supabase
              .from("flota_comunicacion_interna")
              .insert(comunicacionInternaData);
            if (intError) throw intError;
          }

          // Save comunicacion externa
          const comunicacionExternaData: any[] = [];
          Object.entries(dept.comunicacion_externa).forEach(([tipo, contactos]) => {
            contactos.forEach(contacto => {
              comunicacionExternaData.push({
                departamento_id: deptData.id,
                tipo: tipo as TipoComunicacionExterna,
                ...contacto,
              });
            });
          });

          if (comunicacionExternaData.length > 0) {
            const { error: extError } = await supabase
              .from("flota_comunicacion_externa")
              .insert(comunicacionExternaData);
            if (extError) throw extError;
          }
        }
      }

      toast({
        title: "Éxito",
        description: `Flota ${editingId ? "actualizada" : "creada"} correctamente`,
      });

      setDialogOpen(false);
      setFormData(initialFormData);
      setEditingId(null);
      fetchFlotas();
    } catch (error) {
      console.error("Error saving flota:", error);
      toast({
        title: "Error",
        description: "No se pudo guardar la flota",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (flota: Flota) => {
    setFormData(flota);
    setEditingId(flota.id!);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Está seguro de eliminar esta flota?")) return;

    try {
      const { error } = await supabase.from("flotas").delete().eq("id", id);
      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Flota eliminada correctamente",
      });
      fetchFlotas();
    } catch (error) {
      console.error("Error deleting flota:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar la flota",
        variant: "destructive",
      });
    }
  };

  const addPropietario = () => {
    setFormData({
      ...formData,
      propietarios: [
        ...(formData.propietarios || []),
        {
          nombre_propietario: "",
          telefono: "",
          correo: "",
          razon_social: "",
          rtn: "",
          cantidad_vehiculos: 0,
        },
      ],
    });
  };

  const removePropietario = (index: number) => {
    setFormData({
      ...formData,
      propietarios: formData.propietarios?.filter((_, i) => i !== index),
    });
  };

  const updatePropietario = (index: number, field: keyof Propietario, value: any) => {
    const newPropietarios = [...(formData.propietarios || [])];
    newPropietarios[index] = { ...newPropietarios[index], [field]: value };
    setFormData({ ...formData, propietarios: newPropietarios });
  };

  const addDepartamento = () => {
    setFormData({
      ...formData,
      departamentos: [
        ...(formData.departamentos || []),
        {
          nombre_departamento: "",
          comunicacion_interna: {
            gerencia: [],
            ventas: [],
            produccion: [],
            suministro: [],
          },
          comunicacion_externa: {
            aseguradora: [],
            arrendadora: [],
            taller_externo: [],
          },
        },
      ],
    });
  };

  const removeDepartamento = (index: number) => {
    setFormData({
      ...formData,
      departamentos: formData.departamentos?.filter((_, i) => i !== index),
    });
  };

  const updateDepartamentoNombre = (index: number, value: string) => {
    const newDepartamentos = [...(formData.departamentos || [])];
    newDepartamentos[index] = { ...newDepartamentos[index], nombre_departamento: value };
    setFormData({ ...formData, departamentos: newDepartamentos });
  };

  const addContacto = (deptIndex: number, tipo: "interna" | "externa", categoria: string) => {
    const newDepartamentos = [...(formData.departamentos || [])];
    const dept = newDepartamentos[deptIndex];
    
    const newContacto: ContactoComunicacion = {
      nombre: "",
      correo: "",
      celular: "",
      whatsapp: "",
      telefono_fijo: "",
    };

    if (tipo === "interna") {
      dept.comunicacion_interna[categoria as keyof ComunicacionInterna].push(newContacto);
    } else {
      dept.comunicacion_externa[categoria as keyof ComunicacionExterna].push(newContacto);
    }

    setFormData({ ...formData, departamentos: newDepartamentos });
  };

  const removeContacto = (deptIndex: number, tipo: "interna" | "externa", categoria: string, contactoIndex: number) => {
    const newDepartamentos = [...(formData.departamentos || [])];
    const dept = newDepartamentos[deptIndex];

    if (tipo === "interna") {
      dept.comunicacion_interna[categoria as keyof ComunicacionInterna] = 
        dept.comunicacion_interna[categoria as keyof ComunicacionInterna].filter((_, i) => i !== contactoIndex);
    } else {
      dept.comunicacion_externa[categoria as keyof ComunicacionExterna] = 
        dept.comunicacion_externa[categoria as keyof ComunicacionExterna].filter((_, i) => i !== contactoIndex);
    }

    setFormData({ ...formData, departamentos: newDepartamentos });
  };

  const updateContacto = (
    deptIndex: number,
    tipo: "interna" | "externa",
    categoria: string,
    contactoIndex: number,
    field: keyof ContactoComunicacion,
    value: string
  ) => {
    const newDepartamentos = [...(formData.departamentos || [])];
    const dept = newDepartamentos[deptIndex];

    if (tipo === "interna") {
      const contactos = [...dept.comunicacion_interna[categoria as keyof ComunicacionInterna]];
      contactos[contactoIndex] = { ...contactos[contactoIndex], [field]: value };
      dept.comunicacion_interna[categoria as keyof ComunicacionInterna] = contactos;
    } else {
      const contactos = [...dept.comunicacion_externa[categoria as keyof ComunicacionExterna]];
      contactos[contactoIndex] = { ...contactos[contactoIndex], [field]: value };
      dept.comunicacion_externa[categoria as keyof ComunicacionExterna] = contactos;
    }

    setFormData({ ...formData, departamentos: newDepartamentos });
  };

  const addCategoria = () => {
    if (categoriaInput.trim()) {
      setFormData({
        ...formData,
        categoria_vehiculos: [...formData.categoria_vehiculos, categoriaInput.trim()],
      });
      setCategoriaInput("");
    }
  };

  const removeCategoria = (index: number) => {
    setFormData({
      ...formData,
      categoria_vehiculos: formData.categoria_vehiculos.filter((_, i) => i !== index),
    });
  };

  if (loading) {
    return <div>Cargando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Flotas</h1>
          <p className="text-muted-foreground">Gestión de flotas vehiculares</p>
        </div>
        <Button onClick={() => { setFormData(initialFormData); setEditingId(null); setDialogOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva Flota
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Listado de Flotas</CardTitle>
          <CardDescription>Administra todas las flotas registradas</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Número</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Razón Social</TableHead>
                <TableHead>Vehículos</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {flotas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    No hay flotas registradas
                  </TableCell>
                </TableRow>
              ) : (
                flotas.map((flota) => (
                  <TableRow key={flota.id}>
                    <TableCell className="font-medium">{flota.numero_flota}</TableCell>
                    <TableCell>{flota.nombre_flota}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{flota.tipo_flota}</Badge>
                    </TableCell>
                    <TableCell>{flota.razon_social}</TableCell>
                    <TableCell>{flota.cantidad_vehiculos}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          flota.estado === "activa"
                            ? "default"
                            : flota.estado === "en_renovacion"
                            ? "secondary"
                            : "destructive"
                        }
                      >
                        {flota.estado}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(flota)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(flota.id!)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar" : "Nueva"} Flota</DialogTitle>
            <DialogDescription>
              Complete la información de la flota en las siguientes secciones
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            <Tabs defaultValue="generales" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="generales">
                  <Building2 className="mr-2 h-4 w-4" />
                  Datos Generales
                </TabsTrigger>
                <TabsTrigger value="jefe">
                  <Users className="mr-2 h-4 w-4" />
                  Jefe de Flota
                </TabsTrigger>
                <TabsTrigger value="comunicacion">
                  <Phone className="mr-2 h-4 w-4" />
                  Comunicación
                </TabsTrigger>
              </TabsList>

              <TabsContent value="generales" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="numero_flota">Número de Flota *</Label>
                    <Input
                      id="numero_flota"
                      required
                      value={formData.numero_flota}
                      onChange={(e) => setFormData({ ...formData, numero_flota: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="fecha_registro">Fecha de Registro *</Label>
                    <Input
                      id="fecha_registro"
                      type="date"
                      required
                      value={formData.fecha_registro}
                      onChange={(e) => setFormData({ ...formData, fecha_registro: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="nombre_flota">Nombre de la Flota *</Label>
                    <Input
                      id="nombre_flota"
                      required
                      value={formData.nombre_flota}
                      onChange={(e) => setFormData({ ...formData, nombre_flota: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="logo_url">Logo URL</Label>
                    <Input
                      id="logo_url"
                      value={formData.logo_url}
                      onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="tipo_flota">Tipo de Flota *</Label>
                    <Select
                      value={formData.tipo_flota}
                      onValueChange={(value: TipoFlota) => setFormData({ ...formData, tipo_flota: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="propia">Propia</SelectItem>
                        <SelectItem value="alquilada">Alquilada</SelectItem>
                        <SelectItem value="mixta">Mixta</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="razon_social">Razón Social *</Label>
                    <Input
                      id="razon_social"
                      required
                      value={formData.razon_social}
                      onChange={(e) => setFormData({ ...formData, razon_social: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="numero_rtn">Número RTN *</Label>
                    <Input
                      id="numero_rtn"
                      required
                      value={formData.numero_rtn}
                      onChange={(e) => setFormData({ ...formData, numero_rtn: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="cantidad_vehiculos">Cantidad de Vehículos *</Label>
                    <Input
                      id="cantidad_vehiculos"
                      type="number"
                      required
                      value={formData.cantidad_vehiculos}
                      onChange={(e) => setFormData({ ...formData, cantidad_vehiculos: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="rubro_empresa">Rubro de la Empresa *</Label>
                    <Input
                      id="rubro_empresa"
                      required
                      value={formData.rubro_empresa}
                      onChange={(e) => setFormData({ ...formData, rubro_empresa: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="estado">Estado *</Label>
                    <Select
                      value={formData.estado}
                      onValueChange={(value: EstadoFlota) => setFormData({ ...formData, estado: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="activa">Activa</SelectItem>
                        <SelectItem value="en_renovacion">En Renovación</SelectItem>
                        <SelectItem value="inactiva">Inactiva</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label>Categorías de Vehículos</Label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      placeholder="Ej: Camiones, Motocicletas"
                      value={categoriaInput}
                      onChange={(e) => setCategoriaInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCategoria())}
                    />
                    <Button type="button" onClick={addCategoria}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.categoria_vehiculos.map((cat, idx) => (
                      <Badge key={idx} variant="secondary" className="flex items-center gap-1">
                        {cat}
                        <X className="h-3 w-3 cursor-pointer" onClick={() => removeCategoria(idx)} />
                      </Badge>
                    ))}
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="font-semibold">Información de Contacto</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="direccion_fisica">Dirección Física *</Label>
                      <Input
                        id="direccion_fisica"
                        required
                        value={formData.direccion_fisica}
                        onChange={(e) => setFormData({ ...formData, direccion_fisica: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="telefono_contacto">Teléfono de Contacto *</Label>
                      <Input
                        id="telefono_contacto"
                        required
                        value={formData.telefono_contacto}
                        onChange={(e) => setFormData({ ...formData, telefono_contacto: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="correo_contacto">Correo Electrónico *</Label>
                      <Input
                        id="correo_contacto"
                        type="email"
                        required
                        value={formData.correo_contacto}
                        onChange={(e) => setFormData({ ...formData, correo_contacto: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="sitio_web">Sitio Web</Label>
                      <Input
                        id="sitio_web"
                        value={formData.sitio_web}
                        onChange={(e) => setFormData({ ...formData, sitio_web: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="direccion_google_maps">Dirección Google Maps</Label>
                      <Input
                        id="direccion_google_maps"
                        value={formData.direccion_google_maps}
                        onChange={(e) => setFormData({ ...formData, direccion_google_maps: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="direccion_escrita">Dirección Escrita</Label>
                      <Input
                        id="direccion_escrita"
                        value={formData.direccion_escrita}
                        onChange={(e) => setFormData({ ...formData, direccion_escrita: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="direccion_parqueo">Dirección de Parqueo</Label>
                      <Input
                        id="direccion_parqueo"
                        value={formData.direccion_parqueo}
                        onChange={(e) => setFormData({ ...formData, direccion_parqueo: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="direccion_google_maps_parqueo">Google Maps Parqueo</Label>
                      <Input
                        id="direccion_google_maps_parqueo"
                        value={formData.direccion_google_maps_parqueo}
                        onChange={(e) => setFormData({ ...formData, direccion_google_maps_parqueo: e.target.value })}
                      />
                    </div>
                    <div className="col-span-2">
                      <Label htmlFor="horarios_atencion">Horarios de Atención</Label>
                      <Textarea
                        id="horarios_atencion"
                        value={formData.horarios_atencion}
                        onChange={(e) => setFormData({ ...formData, horarios_atencion: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                {formData.tipo_flota === "mixta" && (
                  <>
                    <Separator />
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h4 className="font-semibold">Propietarios (Flota Mixta)</h4>
                        <Button type="button" size="sm" onClick={addPropietario}>
                          <Plus className="h-4 w-4 mr-2" />
                          Agregar Propietario
                        </Button>
                      </div>
                      {formData.propietarios?.map((prop, idx) => (
                        <Card key={idx}>
                          <CardContent className="pt-6">
                            <div className="flex justify-between items-center mb-4">
                              <h5 className="font-medium">Propietario {idx + 1}</h5>
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                onClick={() => removePropietario(idx)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label>Nombre</Label>
                                <Input
                                  value={prop.nombre_propietario}
                                  onChange={(e) => updatePropietario(idx, "nombre_propietario", e.target.value)}
                                />
                              </div>
                              <div>
                                <Label>Teléfono</Label>
                                <Input
                                  value={prop.telefono}
                                  onChange={(e) => updatePropietario(idx, "telefono", e.target.value)}
                                />
                              </div>
                              <div>
                                <Label>Correo</Label>
                                <Input
                                  type="email"
                                  value={prop.correo}
                                  onChange={(e) => updatePropietario(idx, "correo", e.target.value)}
                                />
                              </div>
                              <div>
                                <Label>Razón Social</Label>
                                <Input
                                  value={prop.razon_social}
                                  onChange={(e) => updatePropietario(idx, "razon_social", e.target.value)}
                                />
                              </div>
                              <div>
                                <Label>RTN</Label>
                                <Input
                                  value={prop.rtn}
                                  onChange={(e) => updatePropietario(idx, "rtn", e.target.value)}
                                />
                              </div>
                              <div>
                                <Label>Cantidad de Vehículos</Label>
                                <Input
                                  type="number"
                                  value={prop.cantidad_vehiculos}
                                  onChange={(e) => updatePropietario(idx, "cantidad_vehiculos", parseInt(e.target.value) || 0)}
                                />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </>
                )}
              </TabsContent>

              <TabsContent value="jefe" className="space-y-4">
                <h4 className="font-semibold">Información del Jefe de Flota</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="jefe_nombre">Nombre *</Label>
                    <Input
                      id="jefe_nombre"
                      required
                      value={formData.jefe_flota?.nombre || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          jefe_flota: { ...formData.jefe_flota!, nombre: e.target.value },
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="jefe_telefono">Teléfono *</Label>
                    <Input
                      id="jefe_telefono"
                      required
                      value={formData.jefe_flota?.telefono || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          jefe_flota: { ...formData.jefe_flota!, telefono: e.target.value },
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="jefe_correo">Correo *</Label>
                    <Input
                      id="jefe_correo"
                      type="email"
                      required
                      value={formData.jefe_flota?.correo || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          jefe_flota: { ...formData.jefe_flota!, correo: e.target.value },
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="jefe_cargo">Cargo/Posición *</Label>
                    <Input
                      id="jefe_cargo"
                      required
                      value={formData.jefe_flota?.cargo_posicion || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          jefe_flota: { ...formData.jefe_flota!, cargo_posicion: e.target.value },
                        })
                      }
                    />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="jefe_horarios">Horarios de Trabajo *</Label>
                    <Textarea
                      id="jefe_horarios"
                      required
                      value={formData.jefe_flota?.horarios_trabajo || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          jefe_flota: { ...formData.jefe_flota!, horarios_trabajo: e.target.value },
                        })
                      }
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="comunicacion" className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-semibold">Departamentos de Comunicación</h4>
                  <Button type="button" size="sm" onClick={addDepartamento}>
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar Departamento
                  </Button>
                </div>

                {formData.departamentos?.map((dept, deptIdx) => (
                  <Card key={deptIdx}>
                    <CardContent className="pt-6 space-y-4">
                      <div className="flex justify-between items-center">
                        <Input
                          placeholder="Nombre del Departamento"
                          value={dept.nombre_departamento}
                          onChange={(e) => updateDepartamentoNombre(deptIdx, e.target.value)}
                          className="max-w-sm"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => removeDepartamento(deptIdx)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <Separator />

                      <div>
                        <h5 className="font-medium mb-2">Comunicación Interna</h5>
                        {(["gerencia", "ventas", "produccion", "suministro"] as const).map((tipo) => (
                          <div key={tipo} className="mb-4">
                            <div className="flex justify-between items-center mb-2">
                              <Label className="capitalize">{tipo}</Label>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => addContacto(deptIdx, "interna", tipo)}
                              >
                                <Plus className="h-3 w-3 mr-1" />
                                Agregar
                              </Button>
                            </div>
                            {dept.comunicacion_interna[tipo].map((contacto, contactoIdx) => (
                              <Card key={contactoIdx} className="p-4 mb-2">
                                <div className="flex justify-between items-start mb-2">
                                  <span className="text-sm font-medium">Contacto {contactoIdx + 1}</span>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeContacto(deptIdx, "interna", tipo, contactoIdx)}
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  <Input
                                    placeholder="Nombre"
                                    value={contacto.nombre}
                                    onChange={(e) =>
                                      updateContacto(deptIdx, "interna", tipo, contactoIdx, "nombre", e.target.value)
                                    }
                                  />
                                  <Input
                                    placeholder="Correo"
                                    value={contacto.correo}
                                    onChange={(e) =>
                                      updateContacto(deptIdx, "interna", tipo, contactoIdx, "correo", e.target.value)
                                    }
                                  />
                                  <Input
                                    placeholder="Celular"
                                    value={contacto.celular}
                                    onChange={(e) =>
                                      updateContacto(deptIdx, "interna", tipo, contactoIdx, "celular", e.target.value)
                                    }
                                  />
                                  <Input
                                    placeholder="WhatsApp"
                                    value={contacto.whatsapp}
                                    onChange={(e) =>
                                      updateContacto(deptIdx, "interna", tipo, contactoIdx, "whatsapp", e.target.value)
                                    }
                                  />
                                  <Input
                                    placeholder="Teléfono Fijo"
                                    value={contacto.telefono_fijo}
                                    onChange={(e) =>
                                      updateContacto(deptIdx, "interna", tipo, contactoIdx, "telefono_fijo", e.target.value)
                                    }
                                  />
                                </div>
                              </Card>
                            ))}
                          </div>
                        ))}
                      </div>

                      <Separator />

                      <div>
                        <h5 className="font-medium mb-2">Comunicación Externa</h5>
                        {(["aseguradora", "arrendadora", "taller_externo"] as const).map((tipo) => (
                          <div key={tipo} className="mb-4">
                            <div className="flex justify-between items-center mb-2">
                              <Label className="capitalize">{tipo.replace("_", " ")}</Label>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => addContacto(deptIdx, "externa", tipo)}
                              >
                                <Plus className="h-3 w-3 mr-1" />
                                Agregar
                              </Button>
                            </div>
                            {dept.comunicacion_externa[tipo].map((contacto, contactoIdx) => (
                              <Card key={contactoIdx} className="p-4 mb-2">
                                <div className="flex justify-between items-start mb-2">
                                  <span className="text-sm font-medium">Contacto {contactoIdx + 1}</span>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeContacto(deptIdx, "externa", tipo, contactoIdx)}
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  <Input
                                    placeholder="Nombre"
                                    value={contacto.nombre}
                                    onChange={(e) =>
                                      updateContacto(deptIdx, "externa", tipo, contactoIdx, "nombre", e.target.value)
                                    }
                                  />
                                  <Input
                                    placeholder="Correo"
                                    value={contacto.correo}
                                    onChange={(e) =>
                                      updateContacto(deptIdx, "externa", tipo, contactoIdx, "correo", e.target.value)
                                    }
                                  />
                                  <Input
                                    placeholder="Celular"
                                    value={contacto.celular}
                                    onChange={(e) =>
                                      updateContacto(deptIdx, "externa", tipo, contactoIdx, "celular", e.target.value)
                                    }
                                  />
                                  <Input
                                    placeholder="WhatsApp"
                                    value={contacto.whatsapp}
                                    onChange={(e) =>
                                      updateContacto(deptIdx, "externa", tipo, contactoIdx, "whatsapp", e.target.value)
                                    }
                                  />
                                  <Input
                                    placeholder="Teléfono Fijo"
                                    value={contacto.telefono_fijo}
                                    onChange={(e) =>
                                      updateContacto(deptIdx, "externa", tipo, contactoIdx, "telefono_fijo", e.target.value)
                                    }
                                  />
                                </div>
                              </Card>
                            ))}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>
            </Tabs>

            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">{editingId ? "Actualizar" : "Crear"} Flota</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
