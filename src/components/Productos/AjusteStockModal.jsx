import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sliders } from "lucide-react";
import { toast } from "sonner";
import { registrarAjusteStock, fetchTiposMovimientoStock } from "@/services/StockMovementQueries";

const initialForm = { idTipoMovimiento: "", cantidad: "", motivo: "" };

export default function AjusteStockModal({ open, producto, onClose, onSuccess }) {
  const [form, setForm] = useState(initialForm);
  const [errores, setErrores] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [tiposAjuste, setTiposAjuste] = useState([]);
  const [loadingTipos, setLoadingTipos] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoadingTipos(true);
    fetchTiposMovimientoStock()
      .then((data) => setTiposAjuste((data ?? []).filter((t) => !t.esSistema)))
      .catch(() => toast.error("Error al cargar tipos de ajuste"))
      .finally(() => setLoadingTipos(false));
  }, [open]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errores[field]) setErrores((prev) => ({ ...prev, [field]: "" }));
  };

  const validar = () => {
    const e = {};
    if (!form.idTipoMovimiento) e.idTipoMovimiento = "Seleccioná un tipo de ajuste";
    const cant = parseInt(form.cantidad, 10);
    if (!form.cantidad || !Number.isFinite(cant) || cant <= 0)
      e.cantidad = "La cantidad debe ser un entero mayor a 0";
    if (!form.motivo.trim()) e.motivo = "El motivo es requerido";
    setErrores(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validar()) return;

    const tipo = tiposAjuste.find((t) => t.idTipoMovimientoStock === Number(form.idTipoMovimiento));
    const cant = parseInt(form.cantidad, 10);

    try {
      setSubmitting(true);
      await registrarAjusteStock({
        idProducto: producto.id,
        cantidad: cant,
        idTipoMovimiento: tipo.idTipoMovimientoStock,
        motivo: form.motivo.trim(),
      });

      toast.success("Ajuste registrado", {
        description: `Stock de "${producto.nombre}" actualizado correctamente.`,
      });

      const cantidadFinal = tipo.esPositivo ? cant : -cant;
      const nuevoStock = (producto.stock ?? 0) + cantidadFinal;
      onSuccess?.({ ...producto, stock: nuevoStock });
      handleClose();
    } catch (err) {
      toast.error("Error al registrar ajuste", { description: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setForm(initialForm);
    setErrores({});
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sliders className="h-5 w-5" />
            Ajuste de Stock
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Producto (readonly) */}
          <div className="space-y-1">
            <Label>Producto</Label>
            <Input value={producto?.nombre ?? ""} disabled className="bg-muted/50" />
            {producto && (
              <p className="text-xs text-muted-foreground">
                Stock actual: <span className="font-medium">{producto.stock}</span>
              </p>
            )}
          </div>

          {/* Tipo de ajuste */}
          <div className="space-y-1">
            <Label>Tipo de Ajuste *</Label>
            <Select
              value={form.idTipoMovimiento}
              onValueChange={(v) => handleChange("idTipoMovimiento", v)}
            >
              <SelectTrigger
                disabled={loadingTipos || submitting}
                className={errores.idTipoMovimiento ? "border-destructive" : ""}
              >
                <SelectValue placeholder={loadingTipos ? "Cargando tipos..." : "Seleccionar tipo..."} />
              </SelectTrigger>
              <SelectContent>
                {tiposAjuste.map((t) => (
                  <SelectItem key={t.idTipoMovimientoStock} value={String(t.idTipoMovimientoStock)}>
                    {t.nombre}{t.esPositivo ? " (+)" : " (-)"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errores.idTipoMovimiento && (
              <p className="text-sm text-destructive">{errores.idTipoMovimiento}</p>
            )}
          </div>

          {/* Cantidad */}
          <div className="space-y-1">
            <Label htmlFor="cantidad">Cantidad *</Label>
            <Input
              id="cantidad"
              type="number"
              min="1"
              value={form.cantidad}
              onChange={(e) => handleChange("cantidad", e.target.value)}
              placeholder="Ej: 5"
              className={errores.cantidad ? "border-destructive" : ""}
            />
            {errores.cantidad && (
              <p className="text-sm text-destructive">{errores.cantidad}</p>
            )}
          </div>

          {/* Motivo */}
          <div className="space-y-1">
            <Label htmlFor="motivo">Motivo *</Label>
            <Textarea
              id="motivo"
              value={form.motivo}
              onChange={(e) => handleChange("motivo", e.target.value)}
              placeholder="Ej: Sobrante detectado en conteo físico"
              rows={2}
              className={errores.motivo ? "border-destructive" : ""}
            />
            {errores.motivo && (
              <p className="text-sm text-destructive">{errores.motivo}</p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={submitting}>
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Registrando..." : "Confirmar Ajuste"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
