import { useState, useEffect } from "react";
import { Plus, RefreshCw, Settings, SlidersHorizontal } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  createCurrentAccount,
  getAccountMovements,
  getCurrentAccountSummary,
  getPaymentReceipt,
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

  // Si latest es null (cuenta recién creada sin movimientos), usamos el límite de opening
  const saldoActual = latest?.saldoActual ?? 0;
  const limiteCuenta = latest?.limiteCuenta ?? opening?.limiteCuenta ?? 0;
  const limiteTotal = saldoActual + limiteCuenta;
  const deudaActual = Math.max(saldoActual, 0);
  const saldoAFavor = Math.max(-saldoActual, 0);
  const creditoDisponible = limiteTotal - saldoActual;
  // ────────────────────────────────────────────────────────────────────────────

  const handleCreateAccount = async (accountData) => {
    try {
      await createCurrentAccount({
        ...accountData,
        idCliente: parseInt(clientId),
        idUsuarioRegistra: 1, // TODO: Get from user context
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
            <Button
              type="button"
              onClick={() => setShowCreateAccountForm(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Crear Cuenta Corriente
            </Button>
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
        onMovementRegistered={handleMovementRegistered}
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
            <div className="flex flex-col sm:flex-row gap-2">
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
                size="sm"
                onClick={() => setShowUpdateLimitModal(true)}
                disabled={loadingSummary || loadingMovements}
              >
                <SlidersHorizontal className="h-4 w-4 mr-2" />
                Modificar Límite
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  loadSummary();
                  loadMovements();
                }}
                disabled={loadingSummary || loadingMovements}
              >
                <RefreshCw
                  className={`h-4 w-4 mr-2 ${(loadingSummary || loadingMovements) ? "animate-spin" : ""}`}
                />
                {(loadingSummary || loadingMovements) ? "Actualizando..." : "Actualizar"}
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
                <CurrentAccountOpeningInfo opening={opening} />
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
    </>
  );
}
