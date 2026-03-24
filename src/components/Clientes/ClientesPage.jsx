import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Plus, AlertTriangle, UserCircle } from "lucide-react";
import EmptyState from "@/components/Common/EmptyState";
import { toast } from "sonner";
import SearchBar from "../Common/SearchBar";
import PageHeader from "../Common/PageHeader";
import { AuditPagination } from "@/components/Audit/AuditPagination";
import ClientTable from "./ClientTable";
import ClientTableInactive from "./ClientTableInactive";
import ClientForm from "./ClientForm";
import PermissionGuard from "@/components/PermissionGuard";
import AccessDenied from "@/components/Common/AccessDenied";
import { PermissionGroups } from "@/config/permissions";
import {
  fetchClientes,
  getClienteById,
  createCliente,
  updateCliente,
  deleteCliente,
  activateCliente,
} from "@/services/ClienteQueries";

export default function ClientesPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("activos");

  // Clientes activos
  const [clientesActivos, setClientesActivos] = useState([]);
  const [loadingActivos, setLoadingActivos] = useState(false);
  const [searchTermActivos, setSearchTermActivos] = useState("");
  const [currentPageActivos, setCurrentPageActivos] = useState(1);
  const [totalPagesActivos, setTotalPagesActivos] = useState(1);
  const [totalCountActivos, setTotalCountActivos] = useState(0);
  const [debouncedSearchActivos, setDebouncedSearchActivos] = useState("");

  // Clientes inactivos
  const [clientesInactivos, setClientesInactivos] = useState([]);
  const [loadingInactivos, setLoadingInactivos] = useState(false);
  const [searchTermInactivos, setSearchTermInactivos] = useState("");
  const [currentPageInactivos, setCurrentPageInactivos] = useState(1);
  const [totalPagesInactivos, setTotalPagesInactivos] = useState(1);
  const [totalCountInactivos, setTotalCountInactivos] = useState(0);
  const [debouncedSearchInactivos, setDebouncedSearchInactivos] = useState("");

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingCliente, setEditingCliente] = useState(null);

  // Estados para el diálogo de eliminación
  const [mostrarDialogoEliminar, setMostrarDialogoEliminar] = useState(false);
  const [clienteAEliminar, setClienteAEliminar] = useState(null);
  const [eliminando, setEliminando] = useState(false);

  // Estados para el diálogo de activación
  const [mostrarDialogoActivar, setMostrarDialogoActivar] = useState(false);
  const [clienteAActivar, setClienteAActivar] = useState(null);
  const [activando, setActivando] = useState(false);

  const [pageSize, setPageSize] = useState(10);

  const handlePageSizeChange = (size) => {
    setPageSize(size);
    setCurrentPageActivos(1);
    setCurrentPageInactivos(1);
  };

  // Debounce for search activos
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchActivos(searchTermActivos);
      setCurrentPageActivos(1);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTermActivos]);

  // Debounce for search inactivos
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchInactivos(searchTermInactivos);
      setCurrentPageInactivos(1);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTermInactivos]);

  // Load clientes activos
  useEffect(() => {
    if (activeTab === "activos") {
      loadClientesActivos();
    }
  }, [currentPageActivos, debouncedSearchActivos, activeTab]);

  // Load clientes inactivos
  useEffect(() => {
    if (activeTab === "inactivos") {
      loadClientesInactivos();
    }
  }, [currentPageInactivos, debouncedSearchInactivos, activeTab]);

  const loadClientesActivos = async () => {
    try {
      setLoadingActivos(true);
      const data = await fetchClientes(
        currentPageActivos,
        pageSize,
        debouncedSearchActivos,
        "activos"
      );

      setClientesActivos(data.items || []);
      setTotalPagesActivos(data.totalPages || 1);
      setTotalCountActivos(data.totalCount || 0);
    } catch (error) {
      console.error("Error al cargar clientes activos:", error);
      toast.error("Error al cargar clientes activos");
    } finally {
      setLoadingActivos(false);
    }
  };

  const loadClientesInactivos = async () => {
    try {
      setLoadingInactivos(true);
      const data = await fetchClientes(
        currentPageInactivos,
        pageSize,
        debouncedSearchInactivos,
        "eliminados"
      );

      setClientesInactivos(data.items || []);
      setTotalPagesInactivos(data.totalPages || 1);
      setTotalCountInactivos(data.totalCount || 0);
    } catch (error) {
      console.error("Error al cargar clientes inactivos:", error);
      toast.error("Error al cargar clientes inactivos");
    } finally {
      setLoadingInactivos(false);
    }
  };

  const handleCreate = () => {
    setEditingCliente(null);
    setShowForm(true);
  };

  const handleEdit = async (cliente) => {
    try {
      setLoadingActivos(true);
      const clienteCompleto = await getClienteById(cliente.idCliente);
      setEditingCliente(clienteCompleto);
      setShowForm(true);
    } catch (error) {
      console.error("Error al cargar el cliente:", error);
      toast.error("Error al cargar los datos del cliente");
    } finally {
      setLoadingActivos(false);
    }
  };

  const handleSubmit = async (formData) => {
    if (editingCliente) {
      await updateCliente(editingCliente.idCliente, formData);
      toast.success("Cliente actualizado exitosamente");
    } else {
      await createCliente(formData);
      toast.success("Cliente creado exitosamente");
    }

    setShowForm(false);
    setEditingCliente(null);
    loadClientesActivos();
  };

  const handleSolicitarEliminar = (cliente) => {
    setClienteAEliminar(cliente);
    setMostrarDialogoEliminar(true);
  };

  const handleConfirmarEliminar = async () => {
    if (!clienteAEliminar) return;

    try {
      setEliminando(true);
      await deleteCliente(clienteAEliminar.idCliente);
      toast.success("Cliente eliminado exitosamente");
      loadClientesActivos();
      setMostrarDialogoEliminar(false);
      setClienteAEliminar(null);
    } catch (error) {
      console.error("Error al eliminar cliente:", error);
      toast.error(error.message || "Error al eliminar el cliente");
      setMostrarDialogoEliminar(false);
      setClienteAEliminar(null);
    } finally {
      setEliminando(false);
    }
  };

  const handleCancelarEliminar = () => {
    setMostrarDialogoEliminar(false);
    setClienteAEliminar(null);
  };

  const handleSolicitarActivar = (cliente) => {
    setClienteAActivar(cliente);
    setMostrarDialogoActivar(true);
  };

  const handleConfirmarActivar = async () => {
    if (!clienteAActivar) return;

    try {
      setActivando(true);
      await activateCliente(clienteAActivar.idCliente);
      toast.success("Cliente activado exitosamente");
      loadClientesInactivos();
      loadClientesActivos();
      setMostrarDialogoActivar(false);
      setClienteAActivar(null);
    } catch (error) {
      console.error("Error al activar cliente:", error);
      toast.error(error.message || "Error al activar el cliente");
      setMostrarDialogoActivar(false);
      setClienteAActivar(null);
    } finally {
      setActivando(false);
    }
  };

  const handleCancelarActivar = () => {
    setMostrarDialogoActivar(false);
    setClienteAActivar(null);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingCliente(null);
  };

  const handleViewDetails = (idCliente) => {
    navigate(`/clientes/${idCliente}`);
  };

  return (
    <PermissionGuard
      anyOf={Object.values(PermissionGroups.CLIENTS.permissions)}
      fallback={<AccessDenied moduleName="la gestión de clientes" />}
    >
      <div className="container mx-auto py-6 px-4">
      <div className="flex flex-col gap-6">
        {/* Header */}
        <PageHeader
          icon={<UserCircle className="h-8 w-8 text-primary" />}
          title="Clientes"
          description="Administrá tus clientes activos e inactivos"
        >
          <PermissionGuard anyOf={Object.values(PermissionGroups.CURRENT_ACCOUNT.permissions)}>
            <Button variant="outline" onClick={() => navigate("/clientes/morosos")}>
              <AlertTriangle className="mr-2 h-4 w-4 text-amber-500" />
              Clientes en Mora
            </Button>
          </PermissionGuard>
          <PermissionGuard permission="CLI_CREATE">
            <Button onClick={handleCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Cliente
            </Button>
          </PermissionGuard>
        </PageHeader>

        {/* Form */}
        <PermissionGuard anyOf={["CLI_CREATE", "CLI_UPDATE"]}>
          {showForm && (
            <ClientForm
              initialData={editingCliente}
              onSubmit={handleSubmit}
              onCancel={handleCancel}
            />
          )}
        </PermissionGuard>

        {/* Filtros */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { key: "activos",   label: "Activos",   color: "border-primary",   count: totalCountActivos },
            { key: "inactivos", label: "Inactivos", color: "border-red-500",   count: totalCountInactivos },
          ].map((card) => {
            const isActive = activeTab === card.key;
            const border = isActive ? card.color : "border-muted";
            return (
              <Card
                key={card.key}
                onClick={() => setActiveTab(card.key)}
                className={`cursor-pointer border transition rounded-md p-3 text-center ${isActive ? `${border} bg-accent/60 shadow-sm` : "border-muted hover:bg-muted/40 hover:shadow-sm"}`}
              >
                <CardHeader className="p-1">
                  <CardTitle className="text-lg font-medium">{card.label}</CardTitle>
                  {card.count > 0 && (
                    <p className="text-sm text-muted-foreground">{card.count}</p>
                  )}
                </CardHeader>
              </Card>
            );
          })}
        </div>

        {/* Contenido Activos */}
        {activeTab === "activos" && (
          <div className="space-y-4">
            {/* Search */}
            <Card>
              <CardContent className="py-4">
                <SearchBar
                  value={searchTermActivos}
                  onChange={setSearchTermActivos}
                  placeholder="Buscar por nombre, apellido, DNI, CUIT, correo o teléfono..."
                />
              </CardContent>
            </Card>

            {/* Table */}
            <ClientTable
              clientes={clientesActivos}
              onEdit={handleEdit}
              onDelete={handleSolicitarEliminar}
              onViewDetails={handleViewDetails}
              isLoading={loadingActivos}
            />

            {/* Pagination */}
            {!loadingActivos && clientesActivos.length > 0 && (
              <Card className="border-border/50 shadow-sm">
                <AuditPagination
                  metadata={{
                    pagedIndex: currentPageActivos,
                    totalPages: totalPagesActivos,
                    totalCount: totalCountActivos,
                    hasPreviousPage: currentPageActivos > 1,
                    hasNextPage: currentPageActivos < totalPagesActivos,
                  }}
                  pageSize={pageSize}
                  onPageChange={setCurrentPageActivos}
                  onPageSizeChange={handlePageSizeChange}
                />
              </Card>
            )}
          </div>
        )}

        {/* Contenido Inactivos */}
        {activeTab === "inactivos" && (
          <div className="space-y-4">
            {/* Search */}
            <Card>
              <CardContent className="py-4">
                <SearchBar
                  value={searchTermInactivos}
                  onChange={setSearchTermInactivos}
                  placeholder="Buscar por nombre, apellido, DNI, CUIT, correo o teléfono..."
                />
              </CardContent>
            </Card>

            {/* Table */}
            {loadingInactivos ? (
              <div className="flex justify-center items-center py-12">
                <span className="text-muted-foreground">
                  Cargando clientes inactivos...
                </span>
              </div>
            ) : clientesInactivos.length === 0 ? (
              <EmptyState
                icon={UserCircle}
                title="No se encontraron clientes inactivos"
                description={searchTermInactivos ? "Intentá con otro término de búsqueda" : undefined}
              />
            ) : (
              <ClientTableInactive
                clientes={clientesInactivos}
                onActivate={handleSolicitarActivar}
              />
            )}

            {/* Pagination */}
            {!loadingInactivos && clientesInactivos.length > 0 && (
              <Card className="border-border/50 shadow-sm">
                <AuditPagination
                  metadata={{
                    pagedIndex: currentPageInactivos,
                    totalPages: totalPagesInactivos,
                    totalCount: totalCountInactivos,
                    hasPreviousPage: currentPageInactivos > 1,
                    hasNextPage: currentPageInactivos < totalPagesInactivos,
                  }}
                  pageSize={pageSize}
                  onPageChange={setCurrentPageInactivos}
                  onPageSizeChange={handlePageSizeChange}
                />
              </Card>
            )}
          </div>
        )}

        {/* Diálogo de confirmación para activar */}
        <AlertDialog open={mostrarDialogoActivar} onOpenChange={setMostrarDialogoActivar}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Activar cliente?</AlertDialogTitle>
              <AlertDialogDescription>
                ¿Estás seguro de activar al cliente{" "}
                <span className="font-semibold text-foreground">
                  "{clienteAActivar?.razonSocial || `${clienteAActivar?.nombre} ${clienteAActivar?.apellido}`}"
                </span>
                ? Volverá a estar disponible en el padrón de clientes activos.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={handleCancelarActivar} disabled={activando}>
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmarActivar}
                disabled={activando}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {activando ? "Activando..." : "Activar"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Diálogo de confirmación para eliminar */}
        <AlertDialog open={mostrarDialogoEliminar} onOpenChange={setMostrarDialogoEliminar}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
              <AlertDialogDescription>
                ¿Estás seguro de eliminar al cliente{" "}
                <span className="font-semibold text-foreground">
                  "{clienteAEliminar?.razonSocial || `${clienteAEliminar?.nombre} ${clienteAEliminar?.apellido}`}"
                </span>
                ? Esta acción no se puede deshacer.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={handleCancelarEliminar} disabled={eliminando}>
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmarEliminar}
                disabled={eliminando}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {eliminando ? "Eliminando..." : "Eliminar"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
    </PermissionGuard>
  );
}
