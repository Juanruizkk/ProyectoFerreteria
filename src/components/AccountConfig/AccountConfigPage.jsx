import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import AccountConfigTable from "./AccountConfigTable";
import CreateAccountConfigForm from "./CreateAccountConfigForm";
import EditAccountConfigForm from "./EditAccountConfigForm";
import {
  fetchAccountConfigs,
  createAccountConfig,
  updateAccountConfig,
  toggleAccountConfigState,
} from "@/services/AccountConfigQueries";

export default function AccountConfigPage() {
  const [activeTab, setActiveTab] = useState("activas");

  // Configuraciones activas
  const [configsActivas, setConfigsActivas] = useState([]);
  const [loadingActivas, setLoadingActivas] = useState(false);

  // Configuraciones inactivas
  const [configsInactivas, setConfigsInactivas] = useState([]);
  const [loadingInactivas, setLoadingInactivas] = useState(false);

  // Form state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingConfig, setEditingConfig] = useState(null);

  // Load configuraciones activas
  useEffect(() => {
    if (activeTab === "activas") {
      loadConfigsActivas();
    }
  }, [activeTab]);

  // Load configuraciones inactivas
  useEffect(() => {
    if (activeTab === "inactivas") {
      loadConfigsInactivas();
    }
  }, [activeTab]);

  const loadConfigsActivas = async () => {
    try {
      setLoadingActivas(true);
      const data = await fetchAccountConfigs(true);
      setConfigsActivas(data || []);
    } catch (error) {
      console.error("Error al cargar configuraciones activas:", error);
      toast.error("Error al cargar configuraciones activas");
    } finally {
      setLoadingActivas(false);
    }
  };

  const loadConfigsInactivas = async () => {
    try {
      setLoadingInactivas(true);
      const data = await fetchAccountConfigs(false);
      setConfigsInactivas(data || []);
    } catch (error) {
      console.error("Error al cargar configuraciones inactivas:", error);
      toast.error("Error al cargar configuraciones inactivas");
    } finally {
      setLoadingInactivas(false);
    }
  };

  const handleCreate = () => {
    setShowCreateForm(true);
    setShowEditForm(false);
  };

  const handleEdit = (config) => {
    setEditingConfig(config);
    setShowEditForm(true);
    setShowCreateForm(false);
  };

  const handleCreateSubmit = async (formData) => {
    try {
      await createAccountConfig(formData);
      toast.success("Configuración creada exitosamente");
      setShowCreateForm(false);
      loadConfigsActivas();
    } catch (error) {
      console.error("Error al crear configuración:", error);
      toast.error(error.message || "Error al crear la configuración");
    }
  };

  const handleEditSubmit = async (formData) => {
    try {
      await updateAccountConfig(formData);
      toast.success("Configuración actualizada exitosamente");
      setShowEditForm(false);
      setEditingConfig(null);
      loadConfigsActivas();
    } catch (error) {
      console.error("Error al actualizar configuración:", error);
      toast.error(error.message || "Error al actualizar la configuración");
    }
  };

  const handleToggleState = async (configId, newState) => {
    try {
      await toggleAccountConfigState(configId, newState);
      toast.success(
        newState
          ? "Configuración activada exitosamente"
          : "Configuración desactivada exitosamente"
      );

      // Reload both lists
      if (activeTab === "activas") {
        await loadConfigsActivas();
      } else {
        await loadConfigsInactivas();
      }
    } catch (error) {
      console.error("Error al cambiar estado de configuración:", error);
      toast.error(error.message || "Error al cambiar el estado de la configuración");
    }
  };

  const handleCancelCreate = () => {
    setShowCreateForm(false);
  };

  const handleCancelEdit = () => {
    setShowEditForm(false);
    setEditingConfig(null);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">
          Configuración de Cuenta Corriente
        </h1>
        {!showCreateForm && !showEditForm && (
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Crear Configuración de CC
          </Button>
        )}
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <CreateAccountConfigForm
          onSubmit={handleCreateSubmit}
          onCancel={handleCancelCreate}
        />
      )}

      {/* Edit Form */}
      {showEditForm && editingConfig && (
        <EditAccountConfigForm
          config={editingConfig}
          onSubmit={handleEditSubmit}
          onCancel={handleCancelEdit}
        />
      )}

      {/* Tabs for Active/Inactive */}
      {!showCreateForm && !showEditForm && (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="activas">
              Configuraciones Activas ({configsActivas.length})
            </TabsTrigger>
            <TabsTrigger value="inactivas">
              Configuraciones Inactivas ({configsInactivas.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="activas" className="space-y-4">
            {loadingActivas ? (
              <div className="text-center py-8">
                Cargando configuraciones activas...
              </div>
            ) : (
              <AccountConfigTable
                configs={configsActivas}
                onEdit={handleEdit}
                onToggleState={handleToggleState}
                isActive={true}
              />
            )}
          </TabsContent>

          <TabsContent value="inactivas" className="space-y-4">
            {loadingInactivas ? (
              <div className="text-center py-8">
                Cargando configuraciones inactivas...
              </div>
            ) : (
              <AccountConfigTable
                configs={configsInactivas}
                onEdit={handleEdit}
                onToggleState={handleToggleState}
                isActive={false}
              />
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
