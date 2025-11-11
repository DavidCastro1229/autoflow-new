import { AlertCircle, CreditCard } from "lucide-react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

interface TrialExpiredModalProps {
  open: boolean;
  diasRestantes: number | null;
}

export const TrialExpiredModal = ({ open, diasRestantes }: TrialExpiredModalProps) => {
  const isExpired = diasRestantes !== null && diasRestantes <= 0;

  return (
    <AlertDialog open={open}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertCircle className="h-6 w-6 text-destructive" />
          </div>
          <AlertDialogTitle className="text-center">
            {isExpired ? "Período de Prueba Finalizado" : "Tu Prueba Está Por Expirar"}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center space-y-3">
            {isExpired ? (
              <>
                <p className="text-base">
                  Tu período de prueba de 15 días ha finalizado.
                </p>
                <p>
                  Para continuar usando todas las funcionalidades del sistema, necesitas activar una suscripción.
                </p>
              </>
            ) : (
              <>
                <p className="text-base">
                  Te quedan <span className="font-bold text-destructive">{diasRestantes} días</span> de prueba.
                </p>
                <p>
                  Considera activar una suscripción para no perder acceso a todas las funcionalidades del sistema.
                </p>
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-col gap-2">
          <Button 
            className="w-full" 
            onClick={() => {
              // Aquí se implementaría la redirección a la página de suscripción
              window.open("https://autoflowx.com/suscripcion", "_blank");
            }}
          >
            <CreditCard className="h-4 w-4 mr-2" />
            Activar Suscripción
          </Button>
          {!isExpired && (
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => {
                // Cerrar el modal pero el usuario puede seguir usando el sistema
              }}
            >
              Continuar con la Prueba
            </Button>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
