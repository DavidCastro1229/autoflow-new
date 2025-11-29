import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAseguradoraTalleres, TallerAfiliado } from "@/hooks/useAseguradoraTalleres";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Building2, Phone, Mail, MapPin, Loader2, Search, MessageSquare, Eye } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const Talleres = () => {
  const { talleres, loading } = useAseguradoraTalleres();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTaller, setSelectedTaller] = useState<TallerAfiliado | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const navigate = useNavigate();

  const handleViewDetails = (taller: TallerAfiliado) => {
    setSelectedTaller(taller);
    setDetailsOpen(true);
  };

  const handleSendMessage = (tallerId: string) => {
    navigate('/mensajes', { state: { selectedTallerId: tallerId } });
  };

  const filteredTalleres = talleres.filter(taller =>
    taller.nombre_taller.toLowerCase().includes(searchTerm.toLowerCase()) ||
    taller.ciudad.toLowerCase().includes(searchTerm.toLowerCase()) ||
    taller.estado.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Talleres Afiliados</h1>
        <p className="text-muted-foreground">
          Gestión de talleres asociados a tu aseguradora
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Talleres ({talleres.length})</CardTitle>
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, ciudad o estado..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
        <CardContent>
          {filteredTalleres.length === 0 ? (
            <div className="text-center py-8">
              <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {searchTerm ? "No se encontraron talleres" : "No hay talleres afiliados"}
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {filteredTalleres.map((taller) => (
                <Card key={taller.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={taller.logo_url || undefined} alt={taller.nombre_taller} />
                        <AvatarFallback>
                          <Building2 className="h-6 w-6" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <CardTitle className="text-lg">{taller.nombre_taller}</CardTitle>
                        <CardDescription>{taller.ciudad}, {taller.estado}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{taller.direccion}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{taller.telefono}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{taller.email}</span>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleViewDetails(taller)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Ver Detalles
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleSendMessage(taller.id)}
                      >
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Enviar Mensaje
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Detalles */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalles del Taller</DialogTitle>
          </DialogHeader>
          {selectedTaller && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={selectedTaller.logo_url || undefined} alt={selectedTaller.nombre_taller} />
                  <AvatarFallback>
                    <Building2 className="h-8 w-8" />
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-xl font-semibold">{selectedTaller.nombre_taller}</h3>
                  {selectedTaller.descripcion && (
                    <p className="text-sm text-muted-foreground">{selectedTaller.descripcion}</p>
                  )}
                </div>
              </div>

              <div className="grid gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Contacto Principal</label>
                    <p className="text-sm mt-1">
                      {selectedTaller.nombre_contacto} {selectedTaller.apellido_contacto}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Email</label>
                    <p className="text-sm mt-1">{selectedTaller.email}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Teléfono</label>
                    <p className="text-sm mt-1">{selectedTaller.telefono}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Código Postal</label>
                    <p className="text-sm mt-1">{selectedTaller.codigo_postal}</p>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">Dirección</label>
                  <p className="text-sm mt-1">{selectedTaller.direccion}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Ciudad</label>
                    <p className="text-sm mt-1">{selectedTaller.ciudad}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Estado</label>
                    <p className="text-sm mt-1">{selectedTaller.estado}</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  variant="default"
                  className="flex-1"
                  onClick={() => {
                    handleSendMessage(selectedTaller.id);
                    setDetailsOpen(false);
                  }}
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Enviar Mensaje
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Talleres;
