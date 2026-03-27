import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

/**
 * DateRangeFilter — selector de rango de fechas reutilizable.
 *
 * Props:
 *   desde         string  valor "yyyy-MM-dd"
 *   hasta         string  valor "yyyy-MM-dd"
 *   onDesdeChange (value: string) => void
 *   onHastaChange (value: string) => void
 *   onClear       () => void   — se muestra solo si hay alguna fecha activa
 */
export default function DateRangeFilter({ desde, hasta, onDesdeChange, onHastaChange, onClear }) {
  return (
    <div className="flex gap-3 items-end flex-wrap">
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Desde</Label>
        <Input
          type="date"
          className="w-40 h-8 text-sm"
          value={desde}
          onChange={(e) => onDesdeChange(e.target.value)}
        />
      </div>
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Hasta</Label>
        <Input
          type="date"
          className="w-40 h-8 text-sm"
          value={hasta}
          onChange={(e) => onHastaChange(e.target.value)}
        />
      </div>
      {(desde || hasta) && onClear && (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 text-xs text-muted-foreground"
          onClick={onClear}
        >
          Limpiar fechas
        </Button>
      )}
    </div>
  );
}
