import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Calendar, Hash, ArrowRight, Plus, Minus,
  ShoppingCart, ShoppingBag, TrendingUp, TrendingDown,
  CreditCard, CheckCircle, XCircle, Clock,
} from "lucide-react";
import {
  formatDateTime,
  buildActivityText, getActionConfig, getActionColors,
  getUserInitials, getUserAvatarColor,
  parseJSON, formatFieldValue, humanizeFieldName,
} from "./auditHelpers";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(val, type) {
  if (val === null || val === undefined || val === "") return <span className="text-muted-foreground/50 italic text-xs">—</span>;
  if (type === "currency") return `$${Number(val).toLocaleString("es-AR", { minimumFractionDigits: 2 })}`;
  if (type === "bool")     return val ? "Sí" : "No";
  return String(val);
}

// ─── Shared sub-components ────────────────────────────────────────────────────

function UserAvatar({ name }) {
  const initials   = getUserInitials(name);
  const colorClass = getUserAvatarColor(name);
  return (
    <div className={`w-9 h-9 rounded-full ${colorClass} flex items-center justify-center text-white text-xs font-bold shrink-0 select-none`}>
      {initials}
    </div>
  );
}

/** Fila de detalle simple (una sola columna de valor) */
function DetailRow({ label, value, icon, accent = false }) {
  return (
    <div className={`flex items-start justify-between gap-4 px-4 py-2.5 rounded-lg ${accent ? "bg-muted/40" : "hover:bg-muted/20"} transition-colors`}>
      <div className="flex items-center gap-2 text-sm text-muted-foreground shrink-0">
        {icon && <span className="opacity-60">{icon}</span>}
        {label}
      </div>
      <div className="text-sm font-medium text-right text-foreground">{value}</div>
    </div>
  );
}

/** Fila de antes/después (dos columnas con flecha) */
function FieldRow({ before, after, accion, changed }) {
  const isCreate = !before && !!after;
  const isDelete = !!before && !after;
  const beforeStr = formatFieldValue(before);
  const afterStr  = formatFieldValue(after);

  return (
    <div className={`grid grid-cols-[1fr_28px_1fr] items-start gap-2 px-3 py-2 rounded-lg transition-colors
        ${changed && !isCreate && !isDelete ? "bg-amber-50/60 dark:bg-amber-950/20" : "hover:bg-muted/20"}`}
    >
      {/* Antes */}
      <div className="min-w-0">
        {isCreate
          ? <span className="text-xs text-muted-foreground/40 italic">—</span>
          : <p className={`text-sm break-all leading-snug ${changed ? "text-muted-foreground line-through decoration-muted-foreground/40" : "text-foreground"}`}>
              {beforeStr ?? <span className="italic text-xs text-muted-foreground/50">vacío</span>}
            </p>
        }
      </div>
      {/* Flecha */}
      <div className="flex items-center justify-center pt-0.5">
        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/35 shrink-0" />
      </div>
      {/* Después */}
      <div className="min-w-0">
        {isDelete
          ? <span className="text-xs text-muted-foreground/40 italic">eliminado</span>
          : <p className={`text-sm break-all leading-snug ${changed ? "text-emerald-700 dark:text-emerald-400 font-medium" : "text-foreground"}`}>
              {afterStr ?? <span className="italic text-xs text-muted-foreground/50">vacío</span>}
            </p>
        }
      </div>
    </div>
  );
}

// ─── Vista: detalle de Venta ──────────────────────────────────────────────────
// Campos reales del backend (PascalCase): Codigo, Cliente, Total, MedioPago, Estado

function VentaDetail({ data }) {
  if (!data) return <EmptyData />;

  const estadoIcon = {
    "Completada":               <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />,
    "Anulada":                  <XCircle     className="h-3.5 w-3.5 text-gray-400"    />,
    "Pendiente de Autorización":<Clock       className="h-3.5 w-3.5 text-amber-500"   />,
  };

  return (
    <div className="space-y-0.5">
      <SectionLabel icon={<ShoppingCart className="h-3.5 w-3.5" />} label="Detalle de la venta" />
      <DetailRow label="Código"        value={fmt(data.Codigo)}    accent />
      <DetailRow label="Cliente"       value={fmt(data.Cliente)}          />
      <DetailRow label="Medio de pago" value={fmt(data.MedioPago)} accent />
      <DetailRow label="Total"         value={fmt(data.Total, "currency")} />
      <DetailRow
        label="Estado"
        accent
        value={
          <span className="flex items-center gap-1.5 justify-end">
            {estadoIcon[data.Estado] ?? null}
            {fmt(data.Estado)}
          </span>
        }
      />
      {data.Motivo && (
        <DetailRow label="Motivo de anulación" value={fmt(data.Motivo)} />
      )}
    </div>
  );
}

// ─── Vista: detalle de Compra ─────────────────────────────────────────────────
// Campos reales del backend (PascalCase): Comprobante, Proveedor, Subtotal,
// Descuento, IVA, Total, CantidadItems  |  anulación: Activo, Motivo

function CompraDetail({ data }) {
  if (!data) return <EmptyData />;
  return (
    <div className="space-y-0.5">
      <SectionLabel icon={<ShoppingBag className="h-3.5 w-3.5" />} label="Detalle de la compra" />
      <DetailRow label="Comprobante"   value={fmt(data.Comprobante)}              accent />
      <DetailRow label="Proveedor"     value={fmt(data.Proveedor)}                       />
      <DetailRow label="Subtotal"      value={fmt(data.Subtotal,  "currency")}    accent />
      <DetailRow label="Descuento"     value={fmt(data.Descuento, "currency")}           />
      <DetailRow label="IVA"           value={fmt(data.IVA,       "currency")}    accent />
      <DetailRow label="Total"         value={fmt(data.Total,     "currency")}           />
      {data.CantidadItems !== undefined && (
        <DetailRow label="Ítems"       value={fmt(data.CantidadItems)}            accent />
      )}
      {data.Motivo && (
        <DetailRow label="Motivo de anulación" value={fmt(data.Motivo)}                  />
      )}
    </div>
  );
}

// ─── Vista: movimiento de stock ───────────────────────────────────────────────

function StockMovDetail({ data, accion }) {
  if (!data) return <EmptyData />;
  const isIngreso = accion === "STOCK_INGRESO";
  const Icon      = isIngreso ? TrendingUp : TrendingDown;
  const iconColor = isIngreso ? "text-emerald-500" : "text-orange-500";
  return (
    <div className="space-y-0.5">
      <SectionLabel icon={<Icon className={`h-3.5 w-3.5 ${iconColor}`} />} label={isIngreso ? "Ingreso de stock" : "Egreso de stock"} />
      <DetailRow label="Producto"       value={fmt(data.producto ?? data.nombreProducto)}   accent />
      <DetailRow label="Cantidad"       value={fmt(data.cantidad)}                                 />
      <DetailRow label="Stock anterior" value={fmt(data.stockAnterior ?? data.stockPrevio)} accent />
      <DetailRow label="Stock nuevo"    value={fmt(data.stockNuevo    ?? data.stockActual)}        />
      {data.motivo && <DetailRow label="Motivo" value={fmt(data.motivo)} accent />}
    </div>
  );
}

// ─── Vista: cuenta corriente creada ──────────────────────────────────────────

function CCDetail({ data }) {
  if (!data) return <EmptyData />;
  return (
    <div className="space-y-0.5">
      <SectionLabel icon={<CreditCard className="h-3.5 w-3.5" />} label="Cuenta corriente" />
      <DetailRow label="Cliente"        value={fmt(data.cliente ?? data.nombreCliente)} accent />
      <DetailRow label="Límite crédito" value={fmt(data.limiteCredito, "currency")}           />
      <DetailRow label="Saldo inicial"  value={fmt(data.saldoInicial ?? data.saldoActual, "currency")} accent />
      {data.tipoPago && <DetailRow label="Tipo de pago" value={fmt(data.tipoPago)} />}
    </div>
  );
}

// ─── Vista: detalle de una sola columna (creación o eliminación) ──────────────

function SingleColumnDetail({ data, mode }) {
  // mode: "created" | "deleted"
  const isCreated = mode === "created";
  if (!data || Object.keys(data).length === 0) return <EmptyData />;

  const keys = Object.keys(data);
  return (
    <div className="space-y-0.5">
      <SectionLabel
        label={isCreated ? "Registro creado" : "Registro eliminado"}
        tone={isCreated ? "emerald" : "red"}
      />
      {keys.map((key, i) => (
        <DetailRow
          key={key}
          label={humanizeFieldName(key)}
          value={fmt(formatFieldValue(data[key]))}
          accent={i % 2 === 0}
        />
      ))}
    </div>
  );
}

// ─── Vista: antes / después (modificaciones) ──────────────────────────────────

function BeforeAfterDetail({ before, after, accion }) {
  const allKeys = Array.from(new Set([
    ...Object.keys(before || {}),
    ...Object.keys(after  || {}),
  ]));

  if (allKeys.length === 0) return <EmptyData />;

  const hasChanged = (key) => {
    if (!before || !after) return true;
    return JSON.stringify(before[key]) !== JSON.stringify(after[key]);
  };

  const sortedKeys = [...allKeys].sort((a, b) =>
    (hasChanged(a) ? 0 : 1) - (hasChanged(b) ? 0 : 1)
  );

  return (
    <div className="space-y-0.5">
      {/* Encabezado columnas */}
      <div className="grid grid-cols-[1fr_28px_1fr] gap-2 px-3 pb-3 mb-1 border-b">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
          <Minus className="h-3 w-3" /> Antes
        </p>
        <div />
        <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide flex items-center gap-1">
          <Plus className="h-3 w-3" /> Después
        </p>
      </div>

      {sortedKeys.map((key) => {
        const changed = hasChanged(key);
        return (
          <div key={key}>
            <div className="px-3 pt-2 pb-0.5 flex items-center gap-2">
              <p className="text-xs text-muted-foreground font-medium">
                {humanizeFieldName(key)}
              </p>
              {changed && (
                <span className="inline-flex items-center px-1.5 py-px rounded text-[9px] font-semibold bg-amber-100 text-amber-700 border border-amber-200">
                  Modificado
                </span>
              )}
            </div>
            <FieldRow
              before={before?.[key]}
              after={after?.[key]}
              accion={accion}
              changed={changed}
            />
          </div>
        );
      })}
    </div>
  );
}

// ─── Auxiliares UI ────────────────────────────────────────────────────────────

function SectionLabel({ icon, label, tone = "default" }) {
  const toneClass = tone === "emerald"
    ? "text-emerald-700 bg-emerald-50 border-emerald-200"
    : tone === "red"
    ? "text-red-700 bg-red-50 border-red-200"
    : "text-muted-foreground bg-muted/30 border-border/50";

  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-semibold uppercase tracking-wide mb-1 ${toneClass}`}>
      {icon}
      {label}
    </div>
  );
}

function EmptyData() {
  return (
    <p className="text-center py-10 text-sm text-muted-foreground">
      No hay datos registrados para este evento.
    </p>
  );
}

// ─── Lógica de selección de vista ─────────────────────────────────────────────

const STOCK_ACCIONES   = new Set(["STOCK_INGRESO", "STOCK_EGRESO"]);
const VENTA_ACCIONES   = new Set(["VENTA_REGISTRADA", "VENTA_PENDIENTE", "VENTA_ANULADA"]);
const COMPRA_ACCIONES  = new Set(["COMPRA_REGISTRADA", "COMPRA_ANULADA"]);
const UPDATE_ACCIONES  = new Set([
  "ACTUALIZACION", "UPDATE", "PRECIO_ACTUALIZADO", "NOMBRE_ACTUALIZADO",
  "AJUSTE_STOCK", "REACTIVACION", "CAMBIO_CONTRASEÑA",
]);

function resolveBodyView(item, before, after) {
  const { accion, entidadTipo } = item;
  // Para anulaciones mergeamos antes+después (antes tiene los datos principales,
  // después solo el nuevo estado/motivo). after prevalece en campos coincidentes.
  const merged = (before || after) ? { ...(before || {}), ...(after || {}) } : null;

  // 1. Entidad VENTA → detalle de venta
  if (entidadTipo === "VENTA" || VENTA_ACCIONES.has(accion))
    return <VentaDetail data={merged} />;

  // 2. Entidad COMPRA → detalle de compra
  if (entidadTipo === "COMPRA" || COMPRA_ACCIONES.has(accion))
    return <CompraDetail data={merged} />;

  // 3. Movimiento de stock → vista stock
  if (STOCK_ACCIONES.has(accion))
    return <StockMovDetail data={merged} accion={accion} />;

  // 4. Cuenta corriente creada → vista CC
  if (accion === "CC_CREADA")
    return <CCDetail data={merged} />;

  // 5. Modificación real con ambos lados → Antes / Después
  if (UPDATE_ACCIONES.has(accion) && before && after)
    return <BeforeAfterDetail before={before} after={after} accion={accion} />;

  // 6. Solo "después" (creación sin tipo especial) → detalle columna simple
  if (!before && after)
    return <SingleColumnDetail data={after}  mode="created" />;

  // 7. Solo "antes" (eliminación sin tipo especial) → detalle columna simple
  if (before && !after)
    return <SingleColumnDetail data={before} mode="deleted" />;

  // 8. Ambos lados sin acción tipificada → Antes / Después genérico
  return <BeforeAfterDetail before={before} after={after} accion={accion} />;
}

// ─── Footer hint ──────────────────────────────────────────────────────────────

function resolveFooterHint(item, before, after) {
  const { accion, entidadTipo } = item;

  if (entidadTipo === "VENTA" || VENTA_ACCIONES.has(accion))   return "Registro transaccional · solo lectura";
  if (entidadTipo === "COMPRA" || COMPRA_ACCIONES.has(accion)) return "Registro transaccional · solo lectura";
  if (STOCK_ACCIONES.has(accion))                               return "Movimiento de stock · solo lectura";
  if (accion === "CC_CREADA")                                   return "Alta de cuenta corriente";
  if (!before && after)                                         return "Registro creado";
  if (before && !after)                                         return "Registro eliminado";

  const allKeys     = Array.from(new Set([...Object.keys(before || {}), ...Object.keys(after || {})]));
  const changedCount = allKeys.filter((k) =>
    JSON.stringify(before?.[k]) !== JSON.stringify(after?.[k])
  ).length;
  return changedCount > 0
    ? `${changedCount} campo${changedCount !== 1 ? "s" : ""} modificado${changedCount !== 1 ? "s" : ""}`
    : "Sin cambios de campos registrados";
}

// ─── Main modal ───────────────────────────────────────────────────────────────

export function AuditChangesModal({ item, open, onClose }) {
  if (!item) return null;

  const before = parseJSON(item.valoresAnteriores);
  const after  = parseJSON(item.valoresNuevos);

  const { user, verb, entity, id } = buildActivityText(item);
  const actionCfg = getActionConfig(item.accion);
  const colors    = getActionColors(item.accion);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0 overflow-hidden flex flex-col gap-0">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <DialogHeader className="px-6 pt-5 pb-4 border-b bg-muted/20 shrink-0">
          <div className="flex items-start gap-3">
            <UserAvatar name={item.usuarioNombre} />
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-base font-semibold leading-snug">
                <span>{user}</span>
                {" "}
                <span className="font-normal text-muted-foreground">{verb}</span>
                {" "}
                <span>{entity}</span>
                {id && <span className="font-mono text-sm text-muted-foreground ml-1">{id}</span>}
              </DialogTitle>

              <DialogDescription asChild>
                <div className="mt-1.5 flex items-center gap-3 flex-wrap">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${colors.bg} ${colors.text} ${colors.border}`}>
                    {actionCfg.label}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {formatDateTime(item.fechaHora)}
                  </span>
                  {item.entidadId && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Hash className="h-3 w-3" />
                      {item.entidadId}
                    </span>
                  )}
                </div>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* ── Body ───────────────────────────────────────────────────────── */}
        <ScrollArea className="flex-1 px-5 py-4 overflow-auto">
          {resolveBodyView(item, before, after)}

          {item.detalle && (
            <div className="mt-5 pt-4 border-t">
              <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide mb-1">
                Detalle
              </p>
              <p className="text-sm text-foreground">{item.detalle}</p>
            </div>
          )}
        </ScrollArea>

        {/* ── Footer ─────────────────────────────────────────────────────── */}
        <div className="px-6 py-3.5 border-t bg-muted/10 shrink-0 flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            {resolveFooterHint(item, before, after)}
          </p>
          <Button variant="outline" size="sm" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
