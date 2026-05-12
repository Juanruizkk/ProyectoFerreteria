import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertCircle, Info, Loader2, RefreshCw, Users, Zap } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { getCurrentUser } from "@/services/AuthService";
import PermissionGuard from "@/components/PermissionGuard";
import {
  getCurrentInterestConfig,
  getOverdueClients,
  applyInterest,
  applyInterestBulk,
} from "@/services/CurrentAccountQueries";

const formatCurrency = (amount) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(amount ?? 0);

export default function OverdueClientsPanel({ onGoToInterestConfig }) {
  const [currentConfig, setCurrentConfig] = useState(undefined); // undefined = not loaded yet
  const [overdueClients, setOverdueClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [configError, setConfigError] = useState(null);
  const [overdueError, setOverdueError] = useState(null);

  // Individual apply
  const [applyTarget, setApplyTarget] = useState(null);
  const [applying, setApplying] = useState(false);

  // Bulk apply
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [applyingBulk, setApplyingBulk] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setConfigError(null);
    setOverdueError(null);

    // Load config and clients in parallel
    const [configResult, clientsResult] = await Promise.allSettled([
      getCurrentInterestConfig(),
      getOverdueClients(),
    ]);

    if (configResult.status === "fulfilled") {
      setCurrentConfig(configResult.value); // null if 404
    } else {
      setCurrentConfig(null);
      setConfigError(configResult.reason?.message || "Error al cargar configuración activa.");
    }

    if (clientsResult.status === "fulfilled") {
      setOverdueClients(clientsResult.value || []);
    } else {
      setOverdueClients([]);
      setOverdueError(clientsResult.reason?.message || "Error al cargar clientes morosos.");
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleApplyIndividual = async () => {
    if (!applyTarget) return;
    const user = getCurrentUser();
    try {
      setApplying(true);
      const message = await applyInterest(applyTarget.idCliente, user?.userId ?? 0);
      toast.success(message || "Interés aplicado correctamente.");
      setApplyTarget(null);
      await load();
    } catch (error) {
      toast.error(error.message || "Error al aplicar interés.");
      setApplyTarget(null);
    } finally {
      setApplying(false);
    }
  };

  const handleApplyBulk = async () => {
    const user = getCurrentUser();
    try {
      setApplyingBulk(true);
      const message = await applyInterestBulk(user?.userId ?? 0);
      toast.success(message || "Interés masivo aplicado.");
      setBulkDialogOpen(false);
      await load();
    } catch (error) {
      toast.error(error.message || "Error al aplicar interés masivo.");
      setBulkDialogOpen(false);
    } finally {
      setApplyingBulk(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Clientes con deuda vencida según la configuración de interés activa.
        </p>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Actualizar
        </Button>
      </div>

      {/* Active config info block */}
      <ActiveConfigBlock
        config={currentConfig}
        error={configError}
        loading={loading}
        onGoToConfig={onGoToInterestConfig}
      />

      {/* Overdue error */}
      {overdueError && (
        <div className="flex items-start gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          {overdueError}
        </div>
      )}

      {/* Bulk button */}
      <PermissionGuard permission="CC_MANAGE">
        {overdueClients.length > 0 && (
          <div className="flex justify-end">
            <Button onClick={() => setBulkDialogOpen(true)} disabled={loading}>
              <Users className="h-4 w-4 mr-2" />
              Aplicar a todos ({overdueClients.length})
            </Button>
          </div>
        )}
      </PermissionGuard>

      {/* Table */}
      <div className="rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cliente</TableHead>
              <TableHead>DNI / CUIT</TableHead>
              <TableHead className="text-right">Saldo deudor</TableHead>
              <TableHead className="text-right">Interés a aplicar</TableHead>
              <PermissionGuard permission="CC_MANAGE">
                <TableHead className="text-right">Acción</TableHead>
              </PermissionGuard>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-36" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-4 w-24 ml-auto" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-4 w-28 ml-auto" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-8 w-28 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : overdueClients.length === 0 && !overdueError ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  {currentConfig ? (
                    <EmptyMessage config={currentConfig} />
                  ) : (
                    "No hay clientes morosos."
                  )}
                </TableCell>
              </TableRow>
            ) : (
              overdueClients.map((client) => (
                <TableRow key={client.idCliente}>
                  <TableCell className="font-medium">{client.nombreCliente}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {client.dni ?? client.cuit ?? "—"}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCurrency(client.saldoDeudor)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCurrency(client.importeInteres)}{" "}
                    <span className="text-muted-foreground text-xs">
                      ({client.porcentajeInteres}%)
                    </span>
                  </TableCell>
                  <PermissionGuard permission="CC_MANAGE">
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setApplyTarget(client)}
                        disabled={loading}
                      >
                        <Zap className="h-3.5 w-3.5 mr-1" />
                        Aplicar interés
                      </Button>
                    </TableCell>
                  </PermissionGuard>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Individual apply dialog */}
      <AlertDialog open={!!applyTarget} onOpenChange={(open) => { if (!open && !applying) setApplyTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Aplicar interés?</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Aplicar interés de{" "}
              <span className="font-semibold text-foreground">
                {formatCurrency(applyTarget?.importeInteres)}
              </span>{" "}
              a{" "}
              <span className="font-semibold text-foreground">{applyTarget?.nombreCliente}</span>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={applying}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleApplyIndividual} disabled={applying}>
              {applying ? (
                <><Loader2 className="h-4 w-4 mr-1 animate-spin" />Aplicando...</>
              ) : (
                "Aplicar"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk apply dialog */}
      <AlertDialog open={bulkDialogOpen} onOpenChange={(open) => { if (!open && !applyingBulk) setBulkDialogOpen(false); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Aplicar interés masivo?</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Aplicar interés del{" "}
              <span className="font-semibold text-foreground">
                {currentConfig?.porcentajeInteres}%
              </span>{" "}
              a los{" "}
              <span className="font-semibold text-foreground">{overdueClients.length}</span>{" "}
              clientes morosos? Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={applyingBulk}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleApplyBulk} disabled={applyingBulk}>
              {applyingBulk ? (
                <><Loader2 className="h-4 w-4 mr-1 animate-spin" />Aplicando...</>
              ) : (
                "Aplicar a todos"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function ActiveConfigBlock({ config, loading, onGoToConfig }) {
  if (loading && config === undefined) return null;

  if (!config) {
    return (
      <div className="flex items-start gap-3 rounded-md border border-amber-500/50 bg-amber-500/10 p-4 text-sm">
        <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
        <div className="space-y-1">
          <p className="font-medium text-amber-800 dark:text-amber-200">
            No hay configuración de interés activa.
          </p>
          <p className="text-muted-foreground">
            Configurá una en la sección de configuración antes de aplicar interés.
          </p>
          {onGoToConfig && (
            <PermissionGuard permission="CC_MANAGE">
              <Button
                variant="link"
                size="sm"
                className="h-auto p-0 text-amber-700 dark:text-amber-300"
                onClick={onGoToConfig}
              >
                Ir a Configuración de Interés →
              </Button>
            </PermissionGuard>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3 rounded-md border border-border bg-muted/50 p-4 text-sm">
      <Info className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
      <div>
        <p className="font-medium">
          Configuración activa:{" "}
          <span className="text-foreground">"{config.nombre}"</span>
        </p>
        <p className="text-muted-foreground">
          Tasa: <span className="font-medium text-foreground">{config.porcentajeInteres.toFixed(2)}%</span>
          {"  |  "}
          Vence el día <span className="font-medium text-foreground">{config.diaVencimiento}</span> de cada mes
        </p>
      </div>
      <Badge className="ml-auto bg-green-600 hover:bg-green-700 text-white shrink-0">Activa</Badge>
    </div>
  );
}

function EmptyMessage({ config }) {
  const today = new Date().getDate();
  if (today <= config.diaVencimiento) {
    return (
      <span>
        El plazo de pago aún no venció (vence el día{" "}
        <span className="font-medium">{config.diaVencimiento}</span>). No hay morosos por el momento.
      </span>
    );
  }
  return <span>Todos los clientes tienen el interés aplicado este mes.</span>;
}
