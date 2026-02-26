import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";

const DIAS_SEMANA = [
  { key: "lunes", label: "Lunes" },
  { key: "martes", label: "Martes" },
  { key: "miercoles", label: "Miércoles" },
  { key: "jueves", label: "Jueves" },
  { key: "viernes", label: "Viernes" },
  { key: "sabado", label: "Sábado" },
  { key: "domingo", label: "Domingo" },
];

const HORAS = Array.from({ length: 24 }, (_, i) => {
  const h = i.toString().padStart(2, "0");
  return [`${h}:00`, `${h}:30`];
}).flat();

export interface DiaHorario {
  activo: boolean;
  apertura: string;
  cierre: string;
}

export type HorariosMap = Record<string, DiaHorario>;

const DEFAULT_HORARIOS: HorariosMap = Object.fromEntries(
  DIAS_SEMANA.map((d) => [
    d.key,
    {
      activo: ["lunes", "martes", "miercoles", "jueves", "viernes"].includes(d.key),
      apertura: "08:00",
      cierre: "17:00",
    },
  ])
);

export function parseHorarios(json: string | null | undefined): HorariosMap {
  if (!json) return { ...DEFAULT_HORARIOS };
  try {
    const parsed = JSON.parse(json);
    if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
      // Merge with defaults to ensure all days exist
      const result: HorariosMap = {};
      for (const dia of DIAS_SEMANA) {
        result[dia.key] = parsed[dia.key] ?? DEFAULT_HORARIOS[dia.key];
      }
      return result;
    }
  } catch {
    // fallback
  }
  return { ...DEFAULT_HORARIOS };
}

export function stringifyHorarios(horarios: HorariosMap): string {
  return JSON.stringify(horarios);
}

interface Props {
  value: HorariosMap;
  onChange: (horarios: HorariosMap) => void;
}

export default function HorariosAtencionSelector({ value, onChange }: Props) {
  const updateDia = (key: string, patch: Partial<DiaHorario>) => {
    onChange({ ...value, [key]: { ...value[key], ...patch } });
  };

  return (
    <div className="space-y-2">
      {DIAS_SEMANA.map((dia) => {
        const h = value[dia.key];
        return (
          <div
            key={dia.key}
            className="flex items-center gap-3 rounded-lg border border-border px-3 py-2"
          >
            <Switch
              checked={h.activo}
              onCheckedChange={(v) => updateDia(dia.key, { activo: v })}
            />
            <span className="w-24 text-sm font-medium">{dia.label}</span>
            {h.activo ? (
              <div className="flex items-center gap-2 text-sm">
                <Select value={h.apertura} onValueChange={(v) => updateDia(dia.key, { apertura: v })}>
                  <SelectTrigger className="w-[100px] h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {HORAS.map((hr) => (
                      <SelectItem key={hr} value={hr}>{hr}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span className="text-muted-foreground">a</span>
                <Select value={h.cierre} onValueChange={(v) => updateDia(dia.key, { cierre: v })}>
                  <SelectTrigger className="w-[100px] h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {HORAS.map((hr) => (
                      <SelectItem key={hr} value={hr}>{hr}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <span className="text-xs text-muted-foreground">Cerrado</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
