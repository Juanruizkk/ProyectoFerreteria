import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import SearchBar from "../Common/SearchBar";
import PaginationControls from "../Common/PaginationControls";
import ClientTable from "./ClientTable";
import ClientTableInactive from "./ClientTableInactive";
import ClientForm from "./ClientForm";
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

  const pageSize = 10;

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

  const handleDelete = async (idCliente) => {
    if (!confirm("¿Está seguro de que desea eliminar este cliente?")) {
      return;
    }

    try {
      await deleteCliente(idCliente);
      toast.success("Cliente eliminado exitosamente");
      loadClientesActivos();
    } catch (error) {
      console.error("Error al eliminar cliente:", error);
      toast.error(error.message || "Error al eliminar el cliente");
    }
  };

  const handleActivate = async (idCliente) => {
    if (!confirm("¿Está seguro de que desea activar este cliente?")) {
      return;
    }

    try {
      await activateCliente(idCliente);
      toast.success("Cliente activado exitosamente");
      loadClientesInactivos();
      loadClientesActivos(); // Refrescar ambos
    } catch (error) {
      console.error("Error al activar cliente:", error);
      toast.error(error.message || "Error al activar el cliente");
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingCliente(null);
  };

  const handleViewDetails = (idCliente) => {
    navigate(`/clientes/${idCliente}`);
  };

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-3xl font-bold">Clientes</h1>
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Cliente
          </Button>
        </div>

        {/* Form */}
        {showForm && (
          <ClientForm
            initialData={editingCliente}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
          />
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="activos">Activos</TabsTrigger>
            <TabsTrigger value="inactivos">Inactivos</TabsTrigger>
          </TabsList>

          {/* Tab Activos */}
          <TabsContent value="activos" className="space-y-4">
            {/* Search */}
            <SearchBar
              value={searchTermActivos}
              onChange={setSearchTermActivos}
              placeholder="Buscar por nombre, apellido, DNI, CUIT, correo o teléfono..."
            />

            {/* Table */}
            {loadingActivos ? (
              <div className="flex justify-center items-center py-12">
                <span className="text-muted-foreground">
                  Cargando clientes activos...
                </span>
              </div>
            ) : clientesActivos.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p className="text-lg">No se encontraron clientes activos</p>
                {searchTermActivos && (
                  <p className="text-sm mt-2">
                    Intenta con otro término de búsqueda
                  </p>
                )}
              </div>
            ) : (
              <>
                <ClientTable
                  clientes={clientesActivos}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onViewDetails={handleViewDetails}
                />

                {/* Pagination */}
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                  <div className="text-sm text-muted-foreground">
                    Página {currentPageActivos} de {totalPagesActivos} • Total:{" "}
                    {totalCountActivos} clientes activos
                  </div>
                  <PaginationControls
                    currentPage={currentPageActivos}
                    totalPages={totalPagesActivos}
                    onPageChange={setCurrentPageActivos}
                  />
                </div>
              </>
            )}
          </TabsContent>

          {/* Tab Inactivos */}
          <TabsContent value="inactivos" className="space-y-4">
            {/* Search */}
            <SearchBar
              value={searchTermInactivos}
              onChange={setSearchTermInactivos}
              placeholder="Buscar por nombre, apellido, DNI, CUIT, correo o teléfono..."
            />

            {/* Table */}
            {loadingInactivos ? (
              <div className="flex justify-center items-center py-12">
                <span className="text-muted-foreground">
                  Cargando clientes inactivos...
                </span>
              </div>
            ) : clientesInactivos.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p className="text-lg">No se encontraron clientes inactivos</p>
                {searchTermInactivos && (
                  <p className="text-sm mt-2">
                    Intenta con otro término de búsqueda
                  </p>
                )}
              </div>
            ) : (
              <>
                <ClientTableInactive
                  clientes={clientesInactivos}
                  onActivate={handleActivate}
                />

                {/* Pagination */}
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                  <div className="text-sm text-muted-foreground">
                    Página {currentPageInactivos} de {totalPagesInactivos} •
                    Total: {totalCountInactivos} clientes inactivos
                  </div>
                  <PaginationControls
                    currentPage={currentPageInactivos}
                    totalPages={totalPagesInactivos}
                    onPageChange={setCurrentPageInactivos}
                  />
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
