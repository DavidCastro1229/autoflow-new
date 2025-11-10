import { useState, useEffect } from "react";
import { ExportButtons } from "@/components/ExportButtons";
import { formatDateForExport, formatCurrencyForExport } from "@/lib/exportUtils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Package, Pencil, Trash2, Eye, Plus, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Producto {
  id: string;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  categoria_id: string | null;
  estado: "activo" | "descontinuado" | "agotado";
  precio_compra: number;
  precio_venta: number;
  stock_actual: number;
  stock_minimo: number;
  proveedor: string | null;
  ubicacion_almacen: string | null;
  fecha_ingreso: string;
  categorias_servicio?: { nombre: string };
}

interface Categoria {
  id: string;
  nombre: string;
}

export default function Inventario() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedProducto, setSelectedProducto] = useState<Producto | null>(null);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const [currentTab, setCurrentTab] = useState("info-basica");
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    categoria_id: "",
    estado: "activo" as "activo" | "descontinuado" | "agotado",
    precio_compra: "",
    precio_venta: "",
    stock_actual: "",
    stock_minimo: "",
    proveedor: "",
    ubicacion_almacen: "",
    fecha_ingreso: new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    fetchProductos();
    fetchCategorias();
  }, []);

  const fetchCategorias = async () => {
    const { data, error } = await supabase.from("categorias_servicio").select("*").order("nombre");
    if (error) {
      toast({ title: "Error al cargar categorías", variant: "destructive" });
    } else {
      setCategorias(data || []);
    }
  };

  const fetchProductos = async () => {
    setLoading(true);
    const { data: userRoles } = await supabase.from("user_roles").select("taller_id, role").eq("user_id", (await supabase.auth.getUser()).data.user?.id || "").single();

    let query = supabase.from("inventario").select("*, categorias_servicio(nombre)").order("created_at", { ascending: false });

    if (userRoles?.role !== "super_admin") {
      query = query.eq("taller_id", userRoles?.taller_id);
    }

    const { data, error } = await query;
    
    if (error) {
      toast({ title: "Error al cargar inventario", description: error.message, variant: "destructive" });
    } else {
      setProductos(data || []);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nombre || !formData.precio_compra || !formData.precio_venta) {
      toast({ title: "Error", description: "Por favor complete los campos requeridos", variant: "destructive" });
      return;
    }

    const { data: userRoles } = await supabase.from("user_roles").select("taller_id").eq("user_id", (await supabase.auth.getUser()).data.user?.id || "").single();

    if (!userRoles?.taller_id) {
      toast({ title: "Error", description: "No se encontró el taller asociado", variant: "destructive" });
      return;
    }

    try {
      if (editMode && selectedProducto) {
        const { error } = await supabase
          .from("inventario")
          .update({
            nombre: formData.nombre,
            descripcion: formData.descripcion || null,
            categoria_id: formData.categoria_id || null,
            estado: formData.estado,
            precio_compra: parseFloat(formData.precio_compra),
            precio_venta: parseFloat(formData.precio_venta),
            stock_actual: parseInt(formData.stock_actual) || 0,
            stock_minimo: parseInt(formData.stock_minimo) || 0,
            proveedor: formData.proveedor || null,
            ubicacion_almacen: formData.ubicacion_almacen || null,
            fecha_ingreso: formData.fecha_ingreso,
          })
          .eq("id", selectedProducto.id);

        if (error) throw error;
        toast({ title: "Producto actualizado exitosamente" });
      } else {
        const { data: codigoData, error: codigoError } = await supabase.rpc("generate_codigo_producto");
        if (codigoError) throw codigoError;

        const { error } = await supabase.from("inventario").insert({
          codigo: codigoData,
          nombre: formData.nombre,
          descripcion: formData.descripcion || null,
          categoria_id: formData.categoria_id || null,
          estado: formData.estado,
          precio_compra: parseFloat(formData.precio_compra),
          precio_venta: parseFloat(formData.precio_venta),
          stock_actual: parseInt(formData.stock_actual) || 0,
          stock_minimo: parseInt(formData.stock_minimo) || 0,
          proveedor: formData.proveedor || null,
          ubicacion_almacen: formData.ubicacion_almacen || null,
          fecha_ingreso: formData.fecha_ingreso,
          taller_id: userRoles.taller_id,
        });

        if (error) throw error;
        toast({ title: "Producto agregado exitosamente" });
      }

      fetchProductos();
      resetForm();
      setDialogOpen(false);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const resetForm = () => {
    setFormData({
      nombre: "",
      descripcion: "",
      categoria_id: "",
      estado: "activo",
      precio_compra: "",
      precio_venta: "",
      stock_actual: "",
      stock_minimo: "",
      proveedor: "",
      ubicacion_almacen: "",
      fecha_ingreso: new Date().toISOString().split("T")[0],
    });
    setEditMode(false);
    setSelectedProducto(null);
    setCurrentTab("info-basica");
  };

  const handleEdit = (producto: Producto) => {
    setFormData({
      nombre: producto.nombre,
      descripcion: producto.descripcion || "",
      categoria_id: producto.categoria_id || "",
      estado: producto.estado,
      precio_compra: producto.precio_compra.toString(),
      precio_venta: producto.precio_venta.toString(),
      stock_actual: producto.stock_actual.toString(),
      stock_minimo: producto.stock_minimo.toString(),
      proveedor: producto.proveedor || "",
      ubicacion_almacen: producto.ubicacion_almacen || "",
      fecha_ingreso: producto.fecha_ingreso,
    });
    setSelectedProducto(producto);
    setEditMode(true);
    setDialogOpen(true);
  };

  const handleViewDetail = (producto: Producto) => {
    setSelectedProducto(producto);
    setDetailDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!productToDelete) return;

    const { error } = await supabase.from("inventario").delete().eq("id", productToDelete);

    if (error) {
      toast({ title: "Error al eliminar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Producto eliminado exitosamente" });
      fetchProductos();
    }
    setDeleteDialogOpen(false);
    setProductToDelete(null);
  };

  const getEstadoBadge = (estado: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive"; label: string }> = {
      activo: { variant: "default", label: "Activo" },
      descontinuado: { variant: "secondary", label: "Descontinuado" },
      agotado: { variant: "destructive", label: "Agotado" },
    };
    const config = variants[estado] || variants.activo;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inventario</h1>
          <p className="text-muted-foreground">Gestión de productos y stock</p>
        </div>
        <div className="flex gap-2">
          <ExportButtons
            data={productos.map((producto) => ({
              codigo: producto.codigo,
              nombre: producto.nombre,
              categoria: producto.categorias_servicio?.nombre || "-",
              estado: producto.estado === "activo" ? "Activo" : producto.estado === "descontinuado" ? "Descontinuado" : "Agotado",
              precio_compra: formatCurrencyForExport(producto.precio_compra),
              precio_venta: formatCurrencyForExport(producto.precio_venta),
              stock_actual: producto.stock_actual,
              stock_minimo: producto.stock_minimo,
              proveedor: producto.proveedor || "-",
              ubicacion: producto.ubicacion_almacen || "-",
              fecha_ingreso: formatDateForExport(producto.fecha_ingreso),
            }))}
            columns={[
              { header: "Código", key: "codigo", width: 15 },
              { header: "Nombre", key: "nombre", width: 25 },
              { header: "Categoría", key: "categoria", width: 15 },
              { header: "Estado", key: "estado", width: 12 },
              { header: "Precio Compra", key: "precio_compra", width: 12 },
              { header: "Precio Venta", key: "precio_venta", width: 12 },
              { header: "Stock Actual", key: "stock_actual", width: 10 },
              { header: "Stock Mínimo", key: "stock_minimo", width: 10 },
              { header: "Proveedor", key: "proveedor", width: 20 },
              { header: "Ubicación", key: "ubicacion", width: 15 },
              { header: "Fecha Ingreso", key: "fecha_ingreso", width: 12 },
            ]}
            fileName="inventario"
            title="Reporte de Inventario"
          />
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-2 h-4 w-4" />Agregar Producto</Button>
            </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editMode ? "Editar Producto" : "Agregar Nuevo Producto"}</DialogTitle>
              <DialogDescription>
                {editMode ? "Modifica los datos del producto" : "Complete la información del nuevo producto"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="info-basica">Información Básica</TabsTrigger>
                  <TabsTrigger value="precios">Precios y Stock</TabsTrigger>
                  <TabsTrigger value="adicional">Info Adicional</TabsTrigger>
                  <TabsTrigger value="resumen">Resumen</TabsTrigger>
                </TabsList>

                <TabsContent value="info-basica" className="space-y-4">
                  {editMode && selectedProducto && (
                    <div>
                      <Label>Código</Label>
                      <Input value={selectedProducto.codigo} disabled />
                    </div>
                  )}
                  <div>
                    <Label htmlFor="nombre">Nombre *</Label>
                    <Input id="nombre" value={formData.nombre} onChange={(e) => setFormData({ ...formData, nombre: e.target.value })} required />
                  </div>
                  <div>
                    <Label htmlFor="descripcion">Descripción</Label>
                    <Textarea id="descripcion" value={formData.descripcion} onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })} />
                  </div>
                  <div>
                    <Label htmlFor="categoria">Categoría</Label>
                    <Select value={formData.categoria_id} onValueChange={(value) => setFormData({ ...formData, categoria_id: value })}>
                      <SelectTrigger><SelectValue placeholder="Seleccionar categoría" /></SelectTrigger>
                      <SelectContent>
                        {categorias.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>{cat.nombre}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="estado">Estado</Label>
                    <Select value={formData.estado} onValueChange={(value: any) => setFormData({ ...formData, estado: value })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="activo">Activo</SelectItem>
                        <SelectItem value="descontinuado">Descontinuado</SelectItem>
                        <SelectItem value="agotado">Agotado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </TabsContent>

                <TabsContent value="precios" className="space-y-4">
                  <div>
                    <Label htmlFor="precio_compra">Precio de Compra *</Label>
                    <Input id="precio_compra" type="number" step="0.01" value={formData.precio_compra} onChange={(e) => setFormData({ ...formData, precio_compra: e.target.value })} required />
                  </div>
                  <div>
                    <Label htmlFor="precio_venta">Precio de Venta *</Label>
                    <Input id="precio_venta" type="number" step="0.01" value={formData.precio_venta} onChange={(e) => setFormData({ ...formData, precio_venta: e.target.value })} required />
                  </div>
                  <div>
                    <Label htmlFor="stock_actual">Stock Actual</Label>
                    <Input id="stock_actual" type="number" value={formData.stock_actual} onChange={(e) => setFormData({ ...formData, stock_actual: e.target.value })} />
                  </div>
                  <div>
                    <Label htmlFor="stock_minimo">Stock Mínimo</Label>
                    <Input id="stock_minimo" type="number" value={formData.stock_minimo} onChange={(e) => setFormData({ ...formData, stock_minimo: e.target.value })} />
                  </div>
                </TabsContent>

                <TabsContent value="adicional" className="space-y-4">
                  <div>
                    <Label htmlFor="proveedor">Proveedor</Label>
                    <Input id="proveedor" value={formData.proveedor} onChange={(e) => setFormData({ ...formData, proveedor: e.target.value })} />
                  </div>
                  <div>
                    <Label htmlFor="ubicacion">Ubicación en Almacén</Label>
                    <Input id="ubicacion" value={formData.ubicacion_almacen} onChange={(e) => setFormData({ ...formData, ubicacion_almacen: e.target.value })} />
                  </div>
                  <div>
                    <Label htmlFor="fecha_ingreso">Fecha de Ingreso</Label>
                    <Input id="fecha_ingreso" type="date" value={formData.fecha_ingreso} onChange={(e) => setFormData({ ...formData, fecha_ingreso: e.target.value })} />
                  </div>
                </TabsContent>

                <TabsContent value="resumen" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Resumen del Producto</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {editMode && selectedProducto && (
                        <div className="flex justify-between"><span className="font-medium">Código:</span><span>{selectedProducto.codigo}</span></div>
                      )}
                      <div className="flex justify-between"><span className="font-medium">Nombre:</span><span>{formData.nombre || "-"}</span></div>
                      <div className="flex justify-between"><span className="font-medium">Categoría:</span><span>{categorias.find(c => c.id === formData.categoria_id)?.nombre || "-"}</span></div>
                      <div className="flex justify-between"><span className="font-medium">Estado:</span>{getEstadoBadge(formData.estado)}</div>
                      <div className="flex justify-between"><span className="font-medium">Precio de Compra:</span><span>L {formData.precio_compra || "0.00"}</span></div>
                      <div className="flex justify-between"><span className="font-medium">Precio de Venta:</span><span>L {formData.precio_venta || "0.00"}</span></div>
                      <div className="flex justify-between"><span className="font-medium">Stock Actual:</span><span>{formData.stock_actual || "0"}</span></div>
                      <div className="flex justify-between"><span className="font-medium">Stock Mínimo:</span><span>{formData.stock_minimo || "0"}</span></div>
                      <div className="flex justify-between"><span className="font-medium">Proveedor:</span><span>{formData.proveedor || "-"}</span></div>
                      <div className="flex justify-between"><span className="font-medium">Ubicación:</span><span>{formData.ubicacion_almacen || "-"}</span></div>
                      <div className="flex justify-between"><span className="font-medium">Fecha Ingreso:</span><span>{formData.fecha_ingreso}</span></div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>

              <div className="flex justify-end gap-2 mt-6">
                <Button type="button" variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }}>Cancelar</Button>
                <Button type="submit">{editMode ? "Actualizar" : "Guardar"}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Package className="h-5 w-5" />Productos en Inventario</CardTitle>
          <CardDescription>Lista de todos los productos registrados</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center text-muted-foreground">Cargando...</p>
          ) : productos.length === 0 ? (
            <p className="text-center text-muted-foreground">No hay productos registrados</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Precio Venta</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {productos.map((producto) => (
                    <TableRow key={producto.id}>
                      <TableCell className="font-medium">{producto.codigo}</TableCell>
                      <TableCell>{producto.nombre}</TableCell>
                      <TableCell>{producto.categorias_servicio?.nombre || "-"}</TableCell>
                      <TableCell>{getEstadoBadge(producto.estado)}</TableCell>
                      <TableCell>
                        <span className={producto.stock_actual <= producto.stock_minimo ? "text-destructive font-medium" : ""}>
                          {producto.stock_actual}
                        </span>
                      </TableCell>
                      <TableCell>L {producto.precio_venta.toFixed(2)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleViewDetail(producto)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(producto)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => { setProductToDelete(producto.id); setDeleteDialogOpen(true); }}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Info className="h-5 w-5" />Detalle del Producto</DialogTitle>
          </DialogHeader>
          {selectedProducto && (
            <div className="space-y-4">
              <Card>
                <CardHeader><CardTitle>Información Básica</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between"><span className="font-medium">Código:</span><span>{selectedProducto.codigo}</span></div>
                  <div className="flex justify-between"><span className="font-medium">Nombre:</span><span>{selectedProducto.nombre}</span></div>
                  <div className="flex justify-between"><span className="font-medium">Descripción:</span><span>{selectedProducto.descripcion || "-"}</span></div>
                  <div className="flex justify-between"><span className="font-medium">Categoría:</span><span>{selectedProducto.categorias_servicio?.nombre || "-"}</span></div>
                  <div className="flex justify-between"><span className="font-medium">Estado:</span>{getEstadoBadge(selectedProducto.estado)}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle>Precios y Stock</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between"><span className="font-medium">Precio de Compra:</span><span>L {selectedProducto.precio_compra.toFixed(2)}</span></div>
                  <div className="flex justify-between"><span className="font-medium">Precio de Venta:</span><span>L {selectedProducto.precio_venta.toFixed(2)}</span></div>
                  <div className="flex justify-between"><span className="font-medium">Stock Actual:</span><span className={selectedProducto.stock_actual <= selectedProducto.stock_minimo ? "text-destructive font-medium" : ""}>{selectedProducto.stock_actual}</span></div>
                  <div className="flex justify-between"><span className="font-medium">Stock Mínimo:</span><span>{selectedProducto.stock_minimo}</span></div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle>Información Adicional</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between"><span className="font-medium">Proveedor:</span><span>{selectedProducto.proveedor || "-"}</span></div>
                  <div className="flex justify-between"><span className="font-medium">Ubicación:</span><span>{selectedProducto.ubicacion_almacen || "-"}</span></div>
                  <div className="flex justify-between"><span className="font-medium">Fecha Ingreso:</span><span>{new Date(selectedProducto.fecha_ingreso).toLocaleDateString()}</span></div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Está seguro?</AlertDialogTitle>
            <AlertDialogDescription>Esta acción no se puede deshacer. El producto será eliminado permanentemente.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
