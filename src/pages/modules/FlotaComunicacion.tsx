import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Phone, Plus, Trash2, Loader2, Eye, Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type TipoComunicacionInterna = "gerencia" | "ventas" | "produccion" | "suministro";
type TipoComunicacionExterna = "aseguradora" | "arrendadora" | "taller_externo";

interface Departamento {
  id: string;
  nombre_departamento: string;
}

interface Contacto {
  id: string;
  nombre: string;
  correo: string;
  celular: string | null;
  whatsapp: string | null;
  telefono_fijo: string | null;
  tipo: string;
}

const TIPO_COLORS: Record<string, string> = {
  gerencia: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700",
  ventas: "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700",
  produccion: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700",
  suministro: "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-700",
  aseguradora: "bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-700",
  arrendadora: "bg-cyan-100 text-cyan-800 border-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-300 dark:border-cyan-700",
  taller_externo: "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-700",
};

export default function FlotaComunicacion() {
  const { flotaId } = useUserRole();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
  const [selectedDept, setSelectedDept] = useState<string | null>(null);
  const [contactosInternos, setContactosInternos] = useState<Contacto[]>([]);
  const [contactosExternos, setContactosExternos] = useState<Contacto[]>([]);
  const [deptDialogOpen, setDeptDialogOpen] = useState(false);
  const [newDeptName, setNewDeptName] = useState("");
  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  const [contactType, setContactType] = useState<"interna" | "externa">("interna");
  const [contactForm, setContactForm] = useState({
    nombre: "", correo: "", celular: "", whatsapp: "", telefono_fijo: "",
    tipo: "gerencia" as string,
  });
  const [viewContact, setViewContact] = useState<Contacto | null>(null);
  const [editContact, setEditContact] = useState<{ contact: Contacto; type: "interna" | "externa" } | null>(null);
  const [editForm, setEditForm] = useState({ nombre: "", correo: "", celular: "", whatsapp: "", telefono_fijo: "" });

  useEffect(() => {
    if (flotaId) fetchDepartamentos();
  }, [flotaId]);

  useEffect(() => {
    if (selectedDept) fetchContactos(selectedDept);
  }, [selectedDept]);

  const fetchDepartamentos = async () => {
    try {
      const { data, error } = await supabase
        .from("flota_departamentos")
        .select("*")
        .eq("flota_id", flotaId)
        .order("created_at");
      if (error) throw error;
      setDepartamentos(data || []);
      if (data && data.length > 0 && !selectedDept) setSelectedDept(data[0].id);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchContactos = async (deptId: string) => {
    const [intRes, extRes] = await Promise.all([
      supabase.from("flota_comunicacion_interna").select("*").eq("departamento_id", deptId),
      supabase.from("flota_comunicacion_externa").select("*").eq("departamento_id", deptId),
    ]);
    setContactosInternos(intRes.data || []);
    setContactosExternos(extRes.data || []);
  };

  const handleAddDept = async () => {
    if (!flotaId || !newDeptName.trim()) return;
    const { error } = await supabase.from("flota_departamentos").insert([{ flota_id: flotaId, nombre_departamento: newDeptName }]);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    setNewDeptName("");
    setDeptDialogOpen(false);
    fetchDepartamentos();
    toast({ title: "Departamento creado" });
  };

  const handleDeleteDept = async (id: string) => {
    await supabase.from("flota_departamentos").delete().eq("id", id);
    if (selectedDept === id) setSelectedDept(null);
    fetchDepartamentos();
  };

  const handleAddContact = async () => {
    if (!selectedDept) return;
    if (contactType === "interna") {
      const { error } = await supabase.from("flota_comunicacion_interna").insert([{ departamento_id: selectedDept, ...contactForm, tipo: contactForm.tipo as TipoComunicacionInterna }]);
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    } else {
      const { error } = await supabase.from("flota_comunicacion_externa").insert([{ departamento_id: selectedDept, ...contactForm, tipo: contactForm.tipo as TipoComunicacionExterna }]);
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    }
    setContactDialogOpen(false);
    setContactForm({ nombre: "", correo: "", celular: "", whatsapp: "", telefono_fijo: "", tipo: "gerencia" });
    fetchContactos(selectedDept);
    toast({ title: "Contacto agregado" });
  };

  const handleDeleteContact = async (id: string, type: "interna" | "externa") => {
    const table = type === "interna" ? "flota_comunicacion_interna" : "flota_comunicacion_externa";
    await supabase.from(table).delete().eq("id", id);
    if (selectedDept) fetchContactos(selectedDept);
  };

  const handleEditContact = async () => {
    if (!editContact || !selectedDept) return;
    const table = editContact.type === "interna" ? "flota_comunicacion_interna" : "flota_comunicacion_externa";
    const { error } = await supabase.from(table).update({
      nombre: editForm.nombre,
      correo: editForm.correo,
      celular: editForm.celular || null,
      whatsapp: editForm.whatsapp || null,
      telefono_fijo: editForm.telefono_fijo || null,
    }).eq("id", editContact.contact.id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    setEditContact(null);
    fetchContactos(selectedDept);
    toast({ title: "Contacto actualizado" });
  };

  const openEdit = (contact: Contacto, type: "interna" | "externa") => {
    setEditContact({ contact, type });
    setEditForm({
      nombre: contact.nombre,
      correo: contact.correo,
      celular: contact.celular || "",
      whatsapp: contact.whatsapp || "",
      telefono_fijo: contact.telefono_fijo || "",
    });
  };

  if (loading) return <div className="flex items-center justify-center min-h-[50vh]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  const tiposInternos: TipoComunicacionInterna[] = ["gerencia", "ventas", "produccion", "suministro"];
  const tiposExternos: TipoComunicacionExterna[] = ["aseguradora", "arrendadora", "taller_externo"];

  const formatTipo = (tipo: string) => tipo.charAt(0).toUpperCase() + tipo.slice(1).replace("_", " ");

  const renderContactTable = (contactos: Contacto[], type: "interna" | "externa") => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nombre</TableHead>
          <TableHead>Tipo</TableHead>
          <TableHead>Correo</TableHead>
          <TableHead>Celular</TableHead>
          <TableHead className="text-right">Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {contactos.length === 0 ? (
          <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">Sin contactos</TableCell></TableRow>
        ) : contactos.map((c) => (
          <TableRow key={c.id}>
            <TableCell className="font-medium">{c.nombre}</TableCell>
            <TableCell>
              <Badge variant="outline" className={TIPO_COLORS[c.tipo] || ""}>
                {formatTipo(c.tipo)}
              </Badge>
            </TableCell>
            <TableCell>{c.correo}</TableCell>
            <TableCell>{c.celular || "-"}</TableCell>
            <TableCell>
              <div className="flex items-center justify-end gap-1">
                <Button variant="ghost" size="icon" onClick={() => setViewContact(c)} title="Ver detalle">
                  <Eye className="h-4 w-4 text-muted-foreground" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => openEdit(c, type)} title="Editar">
                  <Pencil className="h-4 w-4 text-muted-foreground" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleDeleteContact(c.id, type)} title="Eliminar">
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Phone className="h-8 w-8 text-primary" />
          Comunicación
        </h1>
        <p className="text-muted-foreground mt-1">Gestión de departamentos y contactos</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="md:col-span-1">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Departamentos</CardTitle>
              <Button size="icon" variant="ghost" onClick={() => setDeptDialogOpen(true)}><Plus className="h-4 w-4" /></Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            {departamentos.map((d) => (
              <div key={d.id} className={`flex items-center justify-between p-2 rounded-md cursor-pointer transition-colors ${selectedDept === d.id ? "bg-accent" : "hover:bg-accent/50"}`} onClick={() => setSelectedDept(d.id)}>
                <span className="text-sm font-medium">{d.nombre_departamento}</span>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); handleDeleteDept(d.id); }}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
            {departamentos.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Sin departamentos</p>}
          </CardContent>
        </Card>

        <div className="md:col-span-3 space-y-4">
          {selectedDept ? (
            <>
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">{departamentos.find(d => d.id === selectedDept)?.nombre_departamento}</h2>
                <Button onClick={() => setContactDialogOpen(true)} size="sm"><Plus className="h-4 w-4 mr-2" />Agregar Contacto</Button>
              </div>
              <Tabs defaultValue="interna">
                <TabsList>
                  <TabsTrigger value="interna">Comunicación Interna</TabsTrigger>
                  <TabsTrigger value="externa">Comunicación Externa</TabsTrigger>
                </TabsList>
                <TabsContent value="interna">
                  <Card><CardContent className="p-0">{renderContactTable(contactosInternos, "interna")}</CardContent></Card>
                </TabsContent>
                <TabsContent value="externa">
                  <Card><CardContent className="p-0">{renderContactTable(contactosExternos, "externa")}</CardContent></Card>
                </TabsContent>
              </Tabs>
            </>
          ) : (
            <Card><CardContent className="py-12 text-center text-muted-foreground">Selecciona o crea un departamento para ver los contactos</CardContent></Card>
          )}
        </div>
      </div>

      {/* Dialog: Nuevo Departamento */}
      <Dialog open={deptDialogOpen} onOpenChange={setDeptDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nuevo Departamento</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nombre del Departamento</Label>
              <Input value={newDeptName} onChange={(e) => setNewDeptName(e.target.value)} placeholder="Ej: Operaciones" />
            </div>
          </div>
          <DialogFooter><Button onClick={handleAddDept}>Crear</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Nuevo Contacto */}
      <Dialog open={contactDialogOpen} onOpenChange={setContactDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Agregar Contacto</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Tipo de Comunicación</Label>
              <Select value={contactType} onValueChange={(v: "interna" | "externa") => {
                setContactType(v);
                setContactForm(p => ({ ...p, tipo: v === "interna" ? "gerencia" : "aseguradora" }));
              }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="interna">Interna</SelectItem>
                  <SelectItem value="externa">Externa</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Categoría</Label>
              <Select value={contactForm.tipo} onValueChange={(v) => setContactForm(p => ({ ...p, tipo: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(contactType === "interna" ? tiposInternos : tiposExternos).map(t => (
                    <SelectItem key={t} value={t}>{formatTipo(t)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Nombre</Label><Input value={contactForm.nombre} onChange={(e) => setContactForm(p => ({ ...p, nombre: e.target.value }))} /></div>
            <div className="space-y-2"><Label>Correo</Label><Input value={contactForm.correo} onChange={(e) => setContactForm(p => ({ ...p, correo: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Celular</Label><Input value={contactForm.celular} onChange={(e) => setContactForm(p => ({ ...p, celular: e.target.value }))} /></div>
              <div className="space-y-2"><Label>WhatsApp</Label><Input value={contactForm.whatsapp} onChange={(e) => setContactForm(p => ({ ...p, whatsapp: e.target.value }))} /></div>
            </div>
            <div className="space-y-2"><Label>Teléfono Fijo</Label><Input value={contactForm.telefono_fijo} onChange={(e) => setContactForm(p => ({ ...p, telefono_fijo: e.target.value }))} /></div>
          </div>
          <DialogFooter><Button onClick={handleAddContact}>Agregar</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Ver Contacto */}
      <Dialog open={!!viewContact} onOpenChange={() => setViewContact(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Detalle del Contacto</DialogTitle></DialogHeader>
          {viewContact && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground text-xs">Nombre</Label>
                  <p className="font-medium">{viewContact.nombre}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Tipo</Label>
                  <div className="mt-1">
                    <Badge variant="outline" className={TIPO_COLORS[viewContact.tipo] || ""}>
                      {formatTipo(viewContact.tipo)}
                    </Badge>
                  </div>
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground text-xs">Correo</Label>
                <p className="font-medium">{viewContact.correo}</p>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-muted-foreground text-xs">Celular</Label>
                  <p className="font-medium">{viewContact.celular || "-"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">WhatsApp</Label>
                  <p className="font-medium">{viewContact.whatsapp || "-"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Teléfono Fijo</Label>
                  <p className="font-medium">{viewContact.telefono_fijo || "-"}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog: Editar Contacto */}
      <Dialog open={!!editContact} onOpenChange={() => setEditContact(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar Contacto</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Nombre</Label><Input value={editForm.nombre} onChange={(e) => setEditForm(p => ({ ...p, nombre: e.target.value }))} /></div>
            <div className="space-y-2"><Label>Correo</Label><Input value={editForm.correo} onChange={(e) => setEditForm(p => ({ ...p, correo: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Celular</Label><Input value={editForm.celular} onChange={(e) => setEditForm(p => ({ ...p, celular: e.target.value }))} /></div>
              <div className="space-y-2"><Label>WhatsApp</Label><Input value={editForm.whatsapp} onChange={(e) => setEditForm(p => ({ ...p, whatsapp: e.target.value }))} /></div>
            </div>
            <div className="space-y-2"><Label>Teléfono Fijo</Label><Input value={editForm.telefono_fijo} onChange={(e) => setEditForm(p => ({ ...p, telefono_fijo: e.target.value }))} /></div>
          </div>
          <DialogFooter><Button onClick={handleEditContact}>Guardar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
