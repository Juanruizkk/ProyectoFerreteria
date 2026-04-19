import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
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
  PRODUCTO:  <Package    className="h-3.5 w-3.5" />,
  CLIENTE:   <Users      className="h-3.5 w-3.5" />,
  VENTA:     <ShoppingCart className="h-3.5 w-3.5" />,
  USUARIO:   <User       className="h-3.5 w-3.5" />,
  PROVEEDOR: <Truck      className="h-3.5 w-3.5" />,
  COMPRA:    <ShoppingBag className="h-3.5 w-3.5" />,
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function UserAvatar({ name }) {
  const initials   = getUserInitials(name);
  const colorClass = getUserAvatarColor(name);
  return (
    <div
      className={`w-7 h-7 rounded-full ${colorClass} flex items-center justify-center
                  text-white text-[10px] font-bold shrink-0 select-none`}
    >
      {initials}
    </div>
  );
}

function ActionBadge({ accion }) {
  const cfg    = getActionConfig(accion);
  const colors = getActionColors(accion);
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px]
                  font-medium border whitespace-nowrap
                  ${colors.bg} ${colors.text} ${colors.border}`}
    >
      {cfg.label}
    </span>
  );
}

function SkeletonRow() {
  return (
    <TableRow>
      <TableCell className="pl-5">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-full bg-muted animate-pulse shrink-0" />
          <div className="space-y-1.5 flex-1">
            <div className="h-3.5 w-2/3 bg-muted animate-pulse rounded" />
            <div className="h-3   w-1/3 bg-muted animate-pulse rounded" />
          </div>
        </div>
      </TableCell>
      <TableCell><div className="h-4 w-20 bg-muted animate-pulse rounded" /></TableCell>
      <TableCell><div className="h-5 w-24 bg-muted animate-pulse rounded-full" /></TableCell>
      <TableCell>
        <div className="space-y-1">
          <div className="h-3.5 w-20 bg-muted animate-pulse rounded" />
          <div className="h-3   w-28 bg-muted animate-pulse rounded" />
        </div>
      </TableCell>
      <TableCell><div className="h-7 w-7 bg-muted animate-pulse rounded mx-auto" /></TableCell>
    </TableRow>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function AuditTable({ data, isLoading, onViewChanges }) {
  if (!isLoading && (!data || data.length === 0)) {
    return (
      <Card className="border-border/50">
        <CardContent className="py-16 flex flex-col items-center gap-3 text-muted-foreground">
          <FileText className="h-10 w-10 opacity-15" />
          <p className="text-sm font-medium">No se encontraron registros</p>
          <p className="text-xs opacity-70">Probá ajustar los filtros de búsqueda</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50 shadow-sm overflow-hidden">
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="pl-5 w-[42%]">Actividad</TableHead>
              <TableHead className="w-[16%]">Entidad</TableHead>
              <TableHead className="w-[16%]">Acción</TableHead>
              <TableHead className="w-[20%]">Fecha</TableHead>
              <TableHead className="w-[6%] text-center pr-4">Ver</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {isLoading
              ? Array.from({ length: 7 }).map((_, i) => <SkeletonRow key={i} />)
              : data.map((item) => {
                  const { user, verb, entity, id } = buildActivityText(item);
                  return (
                    <TableRow
                      key={item.idAuditoria}
                      className="hover:bg-muted/30 transition-colors group border-b border-border/40 last:border-0"
                    >
                      {/* Actividad — avatar + oración natural */}
                      <TableCell className="pl-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <UserAvatar name={item.usuarioNombre} />
                          <div className="min-w-0">
                            <p className="text-sm leading-snug">
                              <span className="font-semibold text-foreground">{user}</span>
                              {" "}
                              <span className="text-muted-foreground">{verb}</span>
                              {" "}
                              <span className="font-medium text-foreground">{entity}</span>
                              {id && (
                                <span className="font-mono text-xs text-muted-foreground ml-0.5">
                                  {id}
                                </span>
                              )}
                            </p>
                            {item.detalle && (
                              <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-xs">
                                {item.detalle}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>

                      {/* Entidad — icono + nombre */}
                      <TableCell className="py-3.5">
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          {ENTITY_ICONS[item.entidadTipo] ?? <FileText className="h-3.5 w-3.5" />}
                          <span className="text-sm capitalize">
                            {(item.entidadTipo ?? "").toLowerCase()}
                          </span>
                        </div>
                      </TableCell>

                      {/* Acción — badge semántico */}
                      <TableCell className="py-3.5">
                        <ActionBadge accion={item.accion} />
                      </TableCell>

                      {/* Fecha — relativa + absoluta en tooltip */}
                      <TableCell className="py-3.5">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="cursor-default">
                                <p className="text-sm text-foreground">
                                  {formatRelativeTime(item.fechaHora)}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {formatDateTime(item.fechaHora)}
                                </p>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              {formatDateTime(item.fechaHora)}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableCell>

                      {/* Acción — botón Ver */}
                      <TableCell className="text-center pr-4 py-3.5">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onViewChanges(item)}
                          className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
