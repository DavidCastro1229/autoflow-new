import { useRef, useEffect, useState } from "react";
import SignatureCanvas from "react-signature-canvas";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Eraser, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface SignaturePadProps {
  label?: string;
  value?: string;
  onChange?: (signature: string | null) => void;
  disabled?: boolean;
  className?: string;
  required?: boolean;
}

export function SignaturePad({
  label = "Firma Digital",
  value,
  onChange,
  disabled = false,
  className,
  required = false,
}: SignaturePadProps) {
  const sigCanvas = useRef<SignatureCanvas>(null);
  const [isEmpty, setIsEmpty] = useState(true);
  const [hasExistingSignature, setHasExistingSignature] = useState(false);

  useEffect(() => {
    if (value && sigCanvas.current) {
      sigCanvas.current.fromDataURL(value);
      setIsEmpty(false);
      setHasExistingSignature(true);
    }
  }, [value]);

  const handleClear = () => {
    if (sigCanvas.current) {
      sigCanvas.current.clear();
      setIsEmpty(true);
      setHasExistingSignature(false);
      onChange?.(null);
    }
  };

  const handleEnd = () => {
    if (sigCanvas.current && !sigCanvas.current.isEmpty()) {
      const dataUrl = sigCanvas.current.toDataURL("image/png");
      setIsEmpty(false);
      onChange?.(dataUrl);
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <Label className="flex items-center gap-1">
          {label}
          {required && <span className="text-destructive">*</span>}
        </Label>
      )}
      
      <div className="relative">
        <div
          className={cn(
            "border-2 border-dashed rounded-lg bg-muted/30 transition-colors",
            disabled ? "opacity-50 cursor-not-allowed" : "hover:border-primary/50",
            !isEmpty ? "border-primary" : "border-muted-foreground/30"
          )}
        >
          <SignatureCanvas
            ref={sigCanvas}
            penColor="black"
            canvasProps={{
              width: 400,
              height: 150,
              className: cn(
                "w-full rounded-lg",
                disabled && "pointer-events-none"
              ),
            }}
            onEnd={handleEnd}
          />
        </div>

        {!isEmpty && (
          <div className="absolute top-2 right-2 flex items-center gap-1">
            <div className="flex items-center gap-1 bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs">
              <Check className="w-3 h-3" />
              Firmado
            </div>
          </div>
        )}

        <div className="flex justify-between items-center mt-2">
          <p className="text-xs text-muted-foreground">
            {isEmpty ? "Dibuja tu firma en el recuadro" : "Firma registrada"}
          </p>
          
          {!disabled && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="text-xs"
            >
              <Eraser className="w-3 h-3 mr-1" />
              Limpiar
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

interface SignatureDisplayProps {
  signature: string;
  label?: string;
  date?: string;
  className?: string;
}

export function SignatureDisplay({
  signature,
  label = "Firma",
  date,
  className,
}: SignatureDisplayProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label>{label}</Label>
      <div className="border rounded-lg p-3 bg-muted/20">
        <img
          src={signature}
          alt={label}
          className="max-h-24 mx-auto"
        />
        {date && (
          <p className="text-xs text-center text-muted-foreground mt-2">
            Firmado el {new Date(date).toLocaleDateString('es-MX', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
        )}
      </div>
    </div>
  );
}
