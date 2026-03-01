import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, RefreshCw, Settings } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getClienteById } from "@/services/ClienteQueries";
import {
  createCurrentAccount,
  getAccountMovements,
} from "@/services/CurrentAccountQueries";
import CreateAccountForm from "./CreateAccountForm";
import ManageAccountMovementForm from "./ManageAccountMovementForm";
import CurrentAccountOpeningInfo from "./CurrentAccountOpeningInfo";
import CurrentAccountSummaryCards from "./CurrentAccountSummaryCards";
import CurrentAccountMovementsSection from "./CurrentAccountMovementsSection";

// Orden canónico: fecha asc, desempate por idMovimiento asc
const sortMovements = (movs) =>
  [...movs].sort((a, b) => {
    const diff = new Date(a.fecha).getTime() - new Date(b.fecha).getTime();
    if (diff !== 0) return diff;
    return a.idMovimiento - b.idMovimiento;
  });

export default function ClientDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [cliente, setCliente] = useState(null);
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMovements, setLoadingMovements] = useState(false);
  const [showCreateAccountForm, setShowCreateAccountForm] = useState(false);
  const [showManageMovementForm, setShowManageMovementForm] = useState(false);

  // ── Derivados (sólo se recalculan cuando cambia movements) ─────────────────
  const movimientosOrdenados = sortMovements(movements);

  const opening =
    movimientosOrdenados.find((m) => m.tipoMovimiento === "alta_cliente") ??
    movimientosOrdenados[0] ??
    null;

  const limiteTotal = opening?.limiteCuenta ?? 0;
  const latest = movimientosOrdenados[movimientosOrdenados.length - 1] ?? null;

  const baseMovements = movimientosOrdenados.filter(
    (m) => m.tipoMovimiento !== "alta_cliente"
  );

  const deudaActual = Math.max(latest?.saldoActual ?? 0, 0);
  const saldoAFavor = Math.max(-(latest?.saldoActual ?? 0), 0);
  const creditoDisponible = limiteTotal - (latest?.saldoActual ?? 0);
  // ────────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    loadClientDetails();
  }, [id]);

  const loadClientDetails = async () => {
    try {
      setLoading(true);
      const data = await getClienteById(id);
      setCliente(data);
      if (data.tieneCuentaCorriente) {
        await loadMovements();
      }
    } catch (error) {
      toast.error("Error al cargar los detalles del cliente");
      console.error("Error loading client details:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadMovements = async () => {
    try {
      setLoadingMovements(true);
      const data = await getAccountMovements(id);
      setMovements(data);
    } catch (error) {
      toast.error("Error al cargar los movimientos de cuenta corriente");
      console.error("Error loading account movements:", error);
    } finally {
      setLoadingMovements(false);
    }
  };

  const handleCreateAccount = async (accountData) => {
    try {
      await createCurrentAccount({
        ...accountData,
        idCliente: parseInt(id),
        idUsuarioRegistra: 1, // TODO: Get from user context
      });
      toast.success("Cuenta corriente creada exitosamente");
      setShowCreateAccountForm(false);
      await loadClientDetails();
    } catch (error) {
      toast.error(error.message || "Error al crear la cuenta corriente");
      console.error("Error creating current account:", error);
    }
  };

  const handleMovementRegistered = async () => {
    await loadMovements();
  };

  const getNombreCompleto = () => {
    if (!cliente) return "";
    if (cliente.razonSocial?.trim()) return cliente.razonSocial;
    return `${cliente.nombre} ${cliente.apellido}`.trim();
  };

  const getIdentificacion = () => {
    if (!cliente) return "-";
    if (cliente.dni?.trim()) return `DNI: ${cliente.dni}`;
    if (cliente.cuit?.trim()) return `CUIT: ${cliente.cuit}`;
    return "-";
  };

  // ── Loading / not found ────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/clientes")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
        </div>
        <div className="text-center py-8">Cargando detalles del cliente...</div>
      </div>
    );
  }

  if (!cliente) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/clientes")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
        </div>
        <div className="text-center py-8">Cliente no encontrado</div>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => navigate("/clientes")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>
        <h1 className="text-2xl font-bold">Detalles del Cliente</h1>
      </div>

      {/* Información del cliente */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-xl">{getNombreCompleto()}</CardTitle>
              <CardDescription>{getIdentificacion()}</CardDescription>
            </div>
            <Badge
              variant={cliente.tieneCuentaCorriente ? "default" : "secondary"}
            >
              {cliente.tieneCuentaCorriente
                ? "Con Cuenta Corriente"
                : "Sin Cuenta Corriente"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {cliente.nombre && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Nombre</p>
                <p className="text-base">{cliente.nombre}</p>
              </div>
            )}
            {cliente.apellido && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Apellido</p>
                <p className="text-base">{cliente.apellido}</p>
              </div>
            )}
            {cliente.razonSocial && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Razón Social
                </p>
                <p className="text-base">{cliente.razonSocial}</p>
              </div>
            )}
            {cliente.dni && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">DNI</p>
                <p className="text-base">{cliente.dni}</p>
              </div>
            )}
            {cliente.cuit && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">CUIT</p>
                <p className="text-base">{cliente.cuit}</p>
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-muted-foreground">Teléfono</p>
              <p className="text-base">{cliente.telefono || "-"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Email</p>
              <p className="text-base">{cliente.mail || "-"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── SIN CUENTA CORRIENTE ── */}
      {!cliente.tieneCuentaCorriente && (
        <>
          {showCreateAccountForm ? (
            <CreateAccountForm
              onSubmit={handleCreateAccount}
              onCancel={() => setShowCreateAccountForm(false)}
            />
          ) : (
            <Card>
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
          )}
        </>
      )}

      {/* ── CON CUENTA CORRIENTE ── */}
      {cliente.tieneCuentaCorriente && (
        <>
          {showManageMovementForm ? (
            <ManageAccountMovementForm
              onCancel={() => setShowManageMovementForm(false)}
              clientId={parseInt(id)}
              currentBalance={latest?.saldoActual ?? 0}
              onMovementRegistered={handleMovementRegistered}
            />
          ) : (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Cuenta Corriente</CardTitle>
                    <CardDescription>
                      Historial y estado de la cuenta
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
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
                      onClick={loadMovements}
                      disabled={loadingMovements}
                    >
                      <RefreshCw
                        className={`h-4 w-4 mr-2 ${loadingMovements ? "animate-spin" : ""}`}
                      />
                      {loadingMovements ? "Actualizando..." : "Actualizar"}
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                {loadingMovements ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Cargando movimientos...
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

                    {/* 3. Tabs + tabla de movimientos */}
                    <CurrentAccountMovementsSection
                      baseMovements={baseMovements}
                      limiteTotal={limiteTotal}
                    />
                  </>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
