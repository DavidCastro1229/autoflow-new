import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAseguradoraTalleres } from "@/hooks/useAseguradoraTalleres";
import { Input } from "@/components/ui/input";
import { Building2, Phone, Mail, MapPin, Loader2, Search } from "lucide-react";
import { useState } from "react";

const Talleres = () => {
  const { talleres, loading } = useAseguradoraTalleres();
  const [searchTerm, setSearchTerm] = useState("");

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
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Building2 className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-lg">{taller.nombre_taller}</CardTitle>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{taller.direccion}, {taller.ciudad}, {taller.estado}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{taller.telefono}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{taller.email}</span>
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

export default Talleres;
