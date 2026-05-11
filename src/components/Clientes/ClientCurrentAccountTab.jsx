import { useState, useEffect } from "react";
import { Plus, RefreshCw, Settings, ChevronDown } from "lucide-react";
import PermissionGuard from "@/components/PermissionGuard";
import { getCurrentUser } from "@/services/AuthService";
import { toast } from "sonner";
import { FaFilePdf, FaFileExcel } from "react-icons/fa";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  createCurrentAccount,
  getAccountMovements,
  getCurrentAccountSummary,
  getPaymentReceipt,
  exportarCCClientePdf,
  exportarCCClienteExcel,
} from "@/services/CurrentAccountQueries";
import CreateAccountForm from "./CreateAccountForm";
import ManageAccountMovementForm from "./ManageAccountMovementForm";
import PayConsumptionForm from "./PayConsumptionForm";
import RegisterDebitNoteForm from "./RegisterDebitNoteForm";
import UpdateAccountLimitModal from "./UpdateAccountLimitModal";
import CurrentAccountOpeningInfo from "./CurrentAccountOpeningInfo";
import CurrentAccountSummaryCards from "./CurrentAccountSummaryCards";
import CurrentAccountMovementsSection from "./CurrentAccountMovementsSection";

export default function ClientCurrentAccountTab({ cliente, clientId, onAccountCreated }) {
  const [summary, setSummary] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(false);

  const [movementsData, setMovementsData] = useState(null);
  const [loadingMovements, setLoadingMovements] = useState(false);

  // Filtros de movimientos
  const [pageIndex, setPageIndex] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [dateFrom, setDateFrom] = useState(null);
  const [dateTo, setDateTo] = useState(null);
  const [movementType, setMovementType] = useState("todos");

  const [showCreateAccountForm, setShowCreateAccountForm] = useState(false);
  const [showManageMovementForm, setShowManageMovementForm] = useState(false);
  const [showUpdateLimitModal, setShowUpdateLimitModal] = useState(false);
  const [consumoAPagar, setConsumoAPagar] = useState(null);
  const [consumoParaAjuste, setConsumoParaAjuste] = useState(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      if (pageIndex !== 1) setPageIndex(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    if (cliente?.tieneCuentaCorriente) {
      loadSummary();
    }
  }, [cliente?.tieneCuentaCorriente]);

  useEffect(() => {
    if (cliente?.tieneCuentaCorriente) {
      loadMovements();
    }
  }, [cliente?.tieneCuentaCorriente, pageIndex, debouncedSearchTerm, dateFrom, dateTo, movementType]);

  const loadSummary = async () => {
    try {
      setLoadingSummary(true);
      const data = await getCurrentAccountSummary(clientId);
      setSummary(data);
    } catch (error) {
      console.error("Error loading account summary:", error);
    } finally {
      setLoadingSummary(false);
    }
  };

  const loadMovements = async () => {
    try {
      setLoadingMovements(true);
      // Formateamos las fechas como YYYY-MM-DD para evitar problemas de parseo en .NET
      const formatDate = (date) => {
        if (!date) return null;
        const d = new Date(date);
        const pad = (n) => n.toString().padStart(2, '0');
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
      };
      
      const typeId = movementType === "todos" ? null : parseInt(movementType);
      
      const data = await getAccountMovements(
        clientId,
        pageIndex,
        debouncedSearchTerm,
        formatDate(dateFrom),
        formatDate(dateTo),
        typeId
      );
      setMovementsData(data);
    } catch (error) {
      toast.error("Error al cargar los movimientos de cuenta corriente");
      console.error("Error loading account movements:", error);
    } finally {
      setLoadingMovements(false);
    }
  };

  // ── Derivados (sólo se recalculan cuando cambia summary) ─────────────────
  const opening = summary?.opening ?? null;
  const latest = summary?.latest ?? null;

  // Si latest es null (cuenta recién creada sin movimientos), usamos el saldo de opening
  const saldoActual = latest?.saldoActual ?? opening?.saldoActual ?? 0;
  const limiteCuenta = latest?.limiteCuenta ?? opening?.limiteCuenta ?? 0;
  // El límite total de la cuenta es el asignado administrativamente
  const limiteTotal = limiteCuenta; 
  const deudaActual = Math.max(saldoActual, 0);
  const saldoAFavor = Math.max(-saldoActual, 0);
  // El crédito disponible es el límite actual + saldo a favor (puede superar el límite original).
  const creditoDisponible = limiteCuenta + saldoAFavor;
  // ────────────────────────────────────────────────────────────────────────────

  const handleCreateAccount = async (accountData) => {
    try {
      await createCurrentAccount({
        ...accountData,
        idCliente: parseInt(clientId),
        idUsuarioRegistra: getCurrentUser()?.userId,
      });
      toast.success("Cuenta corriente creada exitosamente");
      setShowCreateAccountForm(false);
      if (onAccountCreated) {
        await onAccountCreated();
      }
    } catch (error) {
      toast.error(error.message || "Error al crear la cuenta corriente");
      console.error("Error creating current account:", error);
    }
  };

  const handleMovementRegistered = async () => {
    await loadSummary();
    if (pageIndex !== 1) {
      setPageIndex(1); // Esto disparará loadMovements
    } else {
      await loadMovements();
    }
  };

  const openReceipt = async (idMovimiento) => {
    try {
      const blob = await getPaymentReceipt(idMovimiento);
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
    } catch {
      toast.error("No se pudo generar el comprobante.");
    }
  };

  const handlePayConsumption = (movimiento) => {
    setConsumoAPagar(movimiento);
    setShowManageMovementForm(false);
    setConsumoParaAjuste(null);
  };

  const handlePriceAdjustment = (movimiento) => {
    setConsumoParaAjuste(movimiento);
    setConsumoAPagar(null);
    setShowManageMovementForm(false);
  };

  const handleConsumptionPaid = async () => {
    setConsumoAPagar(null);
    handleMovementRegistered();
  };

  // ── Export Estado de Cuenta ─────────────────────────────────────────────────
  const [exportCCDialog, setExportCCDialog] = useState(false);
  const [exportCCType, setExportCCType] = useState(null); // "pdf" | "excel"
  const [exportCCDesde, setExportCCDesde] = useState("");
  const [exportCCHasta, setExportCCHasta] = useState("");
  const [exportingCC, setExportingCC] = useState(null);

  const openExportCCDialog = (type) => {
    setExportCCType(type);
    setExportCCDesde("");
    setExportCCHasta("");
    setExportCCDialog(true);
  };

  const handleExportCCConfirm = async () => {
    const fn = exportCCType === "pdf" ? exportarCCClientePdf : exportarCCClienteExcel;
    setExportingCC(exportCCType);
    try {
      await fn(clientId, { fechaDesde: exportCCDesde, fechaHasta: exportCCHasta });
      toast.success(exportCCType === "pdf" ? "PDF descargado" : "Excel descargado");
      setExportCCDialog(false);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setExportingCC(null);
    }
  };

  const handleViewReceiptForConsumption = (consumo) => {
    // Si ya sabemos que está pagado o parcial, los pagos estarán en baseMovements 
    // pero como ahora están paginados, tal vez no estén en esta página.
    // Lo ideal será que en un futuro el backend devuelva el idMovimientoPago en el consumo.
    // Por ahora, mostraremos un toast indicando la limitación en vista paginada si no está en cache.
    const movimientosCache = movementsData?.items || [];
    const pagoFactura = movimientosCache.find(
      (m) =>
        m.tipoMovimiento === "pago_factura" &&
        m.codigoVenta === consumo.codigoVenta
    );

    if (pagoFactura) {
      openReceipt(pagoFactura.idMovimiento);
      return;
    }

    // Fallback: buscar el pago_global más antiguo posterior al consumo en la página actual
    const pagoGlobal = [...movimientosCache]
      .filter(
        (m) =>
          m.tipoMovimiento === "pago_global" &&
          new Date(m.fecha) >= new Date(consumo.fecha)
      )
      .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())[0];

    if (pagoGlobal) {
      openReceipt(pagoGlobal.idMovimiento);
    } else {
      toast.info("Comprobante no encontrado en la página actual. Busque en Pagos/Todos los movimientos.");
    }
  };


  if (!cliente?.tieneCuentaCorriente) {
    return (
      <>
        <CreateAccountForm
          open={showCreateAccountForm}
          onClose={() => setShowCreateAccountForm(false)}
          onSubmit={handleCreateAccount}
        />
        
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Cuenta Corriente</CardTitle>
            <CardDescription>
              Este cliente no tiene una cuenta corriente
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PermissionGuard permission="CC_MANAGE">
              <Button
                type="button"
                onClick={() => setShowCreateAccountForm(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Crear Cuenta Corriente
              </Button>
            </PermissionGuard>
          </CardContent>
        </Card>
      </>
    );
  }

  return (
    <>
      <UpdateAccountLimitModal
        open={showUpdateLimitModal}
        onClose={() => setShowUpdateLimitModal(false)}
        clientId={parseInt(clientId)}
        limiteActual={limiteTotal}
        onSuccess={() => {
          toast.success("Límite actualizado correctamente");
          handleMovementRegistered();
        }}
      />

      <PayConsumptionForm
        open={consumoAPagar !== null}
        onClose={() => setConsumoAPagar(null)}
        consumo={consumoAPagar || {}}
        clientId={parseInt(clientId)}
        onPaid={handleConsumptionPaid}
      />

      <RegisterDebitNoteForm
        open={consumoParaAjuste !== null}
        onClose={() => setConsumoParaAjuste(null)}
        clientId={parseInt(clientId)}
        currentBalance={latest?.saldoActual ?? 0}
        idVenta={consumoParaAjuste?.idVenta}
        codigoVenta={consumoParaAjuste?.codigoVenta}
        onMovementRegistered={() => {
          setConsumoParaAjuste(null);
          handleMovementRegistered();
        }}
      />

      <ManageAccountMovementForm
        open={showManageMovementForm}
        onClose={() => setShowManageMovementForm(false)}
        clientId={parseInt(clientId)}
        currentBalance={latest?.saldoActual ?? 0}
        limiteTotal={limiteTotal}
        onMovementRegistered={handleMovementRegistered}
        onModificarLimite={() => setShowUpdateLimitModal(true)}
      />

      <Card className="mt-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Cuenta Corriente</CardTitle>
              <CardDescription>
                Historial y estado de la cuenta
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button type="button" variant="outline" size="sm">
                    Exportar
                    <ChevronDown className="h-4 w-4 ml-1.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => openExportCCDialog("pdf")}>
                    <FaFilePdf className="h-4 w-4 mr-2 text-red-500" />
                    Estado de cuenta PDF
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => openExportCCDialog("excel")}>
                    <FaFileExcel className="h-4 w-4 mr-2 text-green-600" />
                    Estado de cuenta Excel
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                type="button"
                variant="default"
                size="sm"
                onClick={() => setShowManageMovementForm(true)}
                disabled={loadingMovements}
              >
                <Settings className="h-4 w-4 mr-2" />
                Gestionar Cuenta
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => { loadSummary(); loadMovements(); }}
                disabled={loadingSummary || loadingMovements}
                title="Actualizar"
              >
                <RefreshCw className={`h-4 w-4 ${(loadingSummary || loadingMovements) ? "animate-spin" : ""}`} />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {loadingSummary && !summary ? (
            <div className="text-center py-8 text-muted-foreground">
              Cargando resumen de cuenta...
            </div>
          ) : (
            <>
              {/* 1. Bloque apertura */}
              {opening && (
                <CurrentAccountOpeningInfo
                  opening={opening}
                  latestLimitModification={summary?.latestLimitModification}
                  clientId={clientId}
                />
              )}

              {/* 2. Cards de resumen */}
              <CurrentAccountSummaryCards
                deudaActual={deudaActual}
                creditoDisponible={creditoDisponible}
                saldoAFavor={saldoAFavor}
              />

              {/* 3. Filtros y tabla de movimientos */}
              <CurrentAccountMovementsSection
                movementsData={movementsData}
                loadingMovements={loadingMovements}
                limiteTotal={limiteTotal}
                
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                pageIndex={pageIndex}
                setPageIndex={setPageIndex}
                dateFrom={dateFrom}
                setDateFrom={(value) => { setDateFrom(value); setPageIndex(1); }}
                dateTo={dateTo}
                setDateTo={(value) => { setDateTo(value); setPageIndex(1); }}
                movementType={movementType}
                setMovementType={(value) => {
                  setMovementType(value);
                  setPageIndex(1);
                }}

                onPayConsumption={handlePayConsumption}
                onViewReceipt={handleViewReceiptForConsumption}
                onMovementsChanged={handleMovementRegistered}
                onPriceAdjustment={handlePriceAdjustment}
              />
            </>
          )}
        </CardContent>
      </Card>

      {/* ── Dialog exportación Estado de Cuenta ────────────────────────────── */}
      <Dialog open={exportCCDialog} onOpenChange={setExportCCDialog}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {exportCCType === "pdf"
                ? <FaFilePdf className="h-4 w-4 text-red-500" />
                : <FaFileExcel className="h-4 w-4 text-green-600" />}
              Estado de Cuenta — {exportCCType === "pdf" ? "PDF" : "Excel"}
            </DialogTitle>
            <DialogDescription>
              Filtrá el período del estado de cuenta. Dejá vacío para exportar todo el historial.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-2">
            <div className="space-y-1">
              <label className="text-sm font-medium">Fecha desde</label>
              <Input type="date" value={exportCCDesde} onChange={(e) => setExportCCDesde(e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Fecha hasta</label>
              <Input type="date" value={exportCCHasta} onChange={(e) => setExportCCHasta(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExportCCDialog(false)}>Cancelar</Button>
            <Button onClick={handleExportCCConfirm} disabled={exportingCC !== null}>
              {exportingCC !== null ? "Exportando..." : (
                exportCCType === "excel"
                  ? <><FaFileExcel className="h-4 w-4 mr-1.5 text-green-600" /> Exportar Excel</>
                  : <><FaFilePdf className="h-4 w-4 mr-1.5 text-red-500" /> Exportar PDF</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
