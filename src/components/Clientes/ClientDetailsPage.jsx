import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Settings } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getClienteById } from "@/services/ClienteQueries";
import { createCurrentAccount, getAccountMovements } from "@/services/CurrentAccountQueries";
import CreateAccountForm from "./CreateAccountForm";
import AccountMovementsTable from "./AccountMovementsTable";
import ManageAccountMovementForm from "./ManageAccountMovementForm";

export default function ClientDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [cliente, setCliente] = useState(null);
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMovements, setLoadingMovements] = useState(false);
  const [showCreateAccountForm, setShowCreateAccountForm] = useState(false);
  const [showMovements, setShowMovements] = useState(false);
  const [showManageMovementForm, setShowManageMovementForm] = useState(false);

  useEffect(() => {
    loadClientDetails();
  }, [id]);

  const loadClientDetails = async () => {
    try {
      setLoading(true);
      const data = await getClienteById(id);
      setCliente(data);

      // Automatically load movements if client has current account
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
      setShowMovements(true);
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
        // TODO: Get from user context - currently hardcoded
        idUsuarioRegistra: 1,
      });
      toast.success("Cuenta corriente creada exitosamente");
      setShowCreateAccountForm(false);
      // Reload client details to update tieneCuentaCorriente status
      await loadClientDetails();
      // Automatically load and show movements after creating account
      await loadMovements();
    } catch (error) {
      toast.error(error.message || "Error al crear la cuenta corriente");
      console.error("Error creating current account:", error);
    }
  };

  const handleCancelCreateAccount = () => {
    setShowCreateAccountForm(false);
  };

  const getNombreCompleto = () => {
    if (!cliente) return "";
    if (cliente.razonSocial && cliente.razonSocial.trim() !== "") {
      return cliente.razonSocial;
    }
    return `${cliente.nombre} ${cliente.apellido}`.trim();
  };

  const getIdentificacion = () => {
    if (!cliente) return "-";
    if (cliente.dni && cliente.dni.trim() !== "") {
      return `DNI: ${cliente.dni}`;
    }
    if (cliente.cuit && cliente.cuit.trim() !== "") {
      return `CUIT: ${cliente.cuit}`;
    }
    return "-";
  };

  const getCurrentBalance = () => {
    if (!movements || movements.length === 0) return 0;
    // Get the last movement's current balance
    return movements[movements.length - 1]?.saldoActual || 0;
  };

  const handleMovementRegistered = async () => {
    // Reload movements after a new movement is registered
    await loadMovements();
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <Button type="button" variant="outline" onClick={() => navigate("/clientes")}>
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
          <Button type="button" variant="outline" onClick={() => navigate("/clientes")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
        </div>
        <div className="text-center py-8">Cliente no encontrado</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header with Back button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button type="button" variant="outline" onClick={() => navigate("/clientes")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          <h1 className="text-2xl font-bold">Detalles del Cliente</h1>
        </div>
      </div>

      {/* Client Information Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-xl">{getNombreCompleto()}</CardTitle>
              <CardDescription>{getIdentificacion()}</CardDescription>
            </div>
            <Badge variant={cliente.tieneCuentaCorriente ? "default" : "secondary"}>
              {cliente.tieneCuentaCorriente ? "Con Cuenta Corriente" : "Sin Cuenta Corriente"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Personal/Company Information */}
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
                <p className="text-sm font-medium text-muted-foreground">Razón Social</p>
                <p className="text-base">{cliente.razonSocial}</p>
              </div>
            )}

            {/* Identification */}
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

            {/* Contact Information */}
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

      {/* Create Account Form - Only show if client doesn't have current account */}
      {!cliente.tieneCuentaCorriente && showCreateAccountForm && (
        <CreateAccountForm
          onSubmit={handleCreateAccount}
          onCancel={handleCancelCreateAccount}
        />
      )}

      {/* Current Account Section - Button to create */}
      {!cliente.tieneCuentaCorriente && !showCreateAccountForm && (
        <Card>
          <CardHeader>
            <CardTitle>Cuenta Corriente</CardTitle>
            <CardDescription>
              Este cliente no tiene una cuenta corriente
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button type="button" onClick={() => setShowCreateAccountForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Crear Cuenta Corriente
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Manage Account Movement Form - Only show if client has current account */}
      {cliente.tieneCuentaCorriente && showManageMovementForm && (
        <ManageAccountMovementForm
          onCancel={() => setShowManageMovementForm(false)}
          clientId={parseInt(id)}
          currentBalance={getCurrentBalance()}
          onMovementRegistered={handleMovementRegistered}
        />
      )}

      {/* Current Account Section - Movements table */}
      {cliente.tieneCuentaCorriente && !showManageMovementForm && (
        <Card>
          <CardHeader>
            <CardTitle>Cuenta Corriente</CardTitle>
            <CardDescription>
              Gestión de movimientos de cuenta corriente
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {!showMovements ? (
                <Button type="button" onClick={loadMovements} disabled={loadingMovements}>
                  {loadingMovements ? "Cargando..." : "Ver Movimientos de Cuenta Corriente"}
                </Button>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Movimientos de Cuenta Corriente</h3>
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
                        {loadingMovements ? "Actualizando..." : "Actualizar"}
                      </Button>
                    </div>
                  </div>
                  <AccountMovementsTable movements={movements} />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}