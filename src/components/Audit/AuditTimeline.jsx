import { Button } from "@/components/ui/button";
import {
  Eye, Package, Users, ShoppingCart, User, Truck, ShoppingBag, FileText,
} from "lucide-react";
import {
  formatDateTime, formatRelativeTime,
  buildActivityText, getActionConfig, getActionColors,
  getUserInitials, getUserAvatarColor,
} from "./auditHelpers";

// ─── Entity icons ─────────────────────────────────────────────────────────────

const ENTITY_ICONS = {
  PRODUCTO:  <Package      className="h-3 w-3 text-white" />,
  CLIENTE:   <Users        className="h-3 w-3 text-white" />,
  VENTA:     <ShoppingCart className="h-3 w-3 text-white" />,
  USUARIO:   <User         className="h-3 w-3 text-white" />,
  PROVEEDOR: <Truck        className="h-3 w-3 text-white" />,
  COMPRA:    <ShoppingBag  className="h-3 w-3 text-white" />,
};

// ─── Single timeline node ─────────────────────────────────────────────────────

function TimelineNode({ item, onViewChanges, isLast }) {
  const { user, verb, entity, id } = buildActivityText(item);
  const colors      = getActionColors(item.accion);
  const cfg         = getActionConfig(item.accion);
  const avatarColor = getUserAvatarColor(item.usuarioNombre);
  const initials    = getUserInitials(item.usuarioNombre);

  return (
    <div className="relative flex gap-4 pb-5 group">
      {/* Connecting vertical line */}
      {!isLast && (
        <div className="absolute left-[13px] top-7 bottom-0 w-px bg-border/60" />
      )}

      {/* Colored dot with entity icon */}
      <div className="relative z-10 shrink-0 mt-0.5">
        <div
          className={`w-7 h-7 rounded-full ${colors.dot} flex items-center justify-center shadow-sm ring-2 ring-background`}
        >
          {ENTITY_ICONS[item.entidadTipo] ?? <FileText className="h-3 w-3 text-white" />}
        </div>
      </div>

      {/* Card content */}
      <div
        className="flex-1 min-w-0 bg-card border border-border/60 rounded-xl px-4 py-3
                   shadow-sm hover:shadow-md hover:border-border transition-all duration-150"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2.5 flex-1 min-w-0">
            {/* Mini avatar */}
            <div
              className={`w-6 h-6 rounded-full ${avatarColor} flex items-center justify-center
                          text-white text-[9px] font-bold shrink-0 mt-0.5 select-none`}
            >
              {initials}
            </div>

            {/* Text */}
            <div className="min-w-0 flex-1">
              <p className="text-sm leading-snug">
                <span className="font-semibold text-foreground">{user}</span>
                {" "}
                <span className="text-muted-foreground">{verb}</span>
                {" "}
                <span className="font-medium text-foreground">{entity}</span>
                {id && (
                  <span className="font-mono text-xs text-muted-foreground ml-0.5">{id}</span>
                )}
              </p>

              {item.detalle && (
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                  {item.detalle}
                </p>
              )}

              {/* Badge + relative time */}
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <span
                  className={`inline-flex items-center px-1.5 py-px rounded-full text-[10px]
                              font-medium border ${colors.bg} ${colors.text} ${colors.border}`}
                >
                  {cfg.label}
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatRelativeTime(item.fechaHora)}
                </span>
                <span className="text-xs text-muted-foreground/50 hidden sm:inline">
                  · {formatDateTime(item.fechaHora)}
                </span>
              </div>
            </div>
          </div>

          {/* Ver detalle button — aparece en hover */}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onViewChanges(item)}
            className="h-7 w-7 p-0 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Eye className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function TimelineSkeleton() {
  return (
    <div className="space-y-0">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex gap-4 pb-5">
          <div className="w-7 h-7 rounded-full bg-muted animate-pulse shrink-0 mt-0.5" />
          <div className="flex-1 bg-card border border-border/40 rounded-xl p-4 space-y-2.5">
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-full bg-muted animate-pulse shrink-0" />
              <div className="h-3.5 bg-muted animate-pulse rounded w-3/5" />
            </div>
            <div className="flex gap-2">
              <div className="h-4 w-20 bg-muted animate-pulse rounded-full" />
              <div className="h-4 w-16 bg-muted animate-pulse rounded" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function AuditTimeline({ data, isLoading, onViewChanges }) {
  if (isLoading) return <TimelineSkeleton />;

  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
        <FileText className="h-10 w-10 opacity-15" />
        <p className="text-sm font-medium">No se encontraron registros</p>
        <p className="text-xs opacity-70">Probá ajustar los filtros de búsqueda</p>
      </div>
    );
  }

  return (
    <div className="pl-1 pt-1">
      {data.map((item, index) => (
        <TimelineNode
          key={item.idAuditoria}
          item={item}
          onViewChanges={onViewChanges}
          isLast={index === data.length - 1}
        />
      ))}
    </div>
  );
}
