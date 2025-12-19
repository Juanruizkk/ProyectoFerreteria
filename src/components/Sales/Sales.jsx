import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShoppingCart, Plus, AlertCircle } from "lucide-react";
import { usePermission } from "@/hooks/usePermission";
import { PermissionGroups } from "@/config/permissions";
import { CartProvider } from "@/contexts/CartContext";
import CreateSaleModal from "./CreateSaleModal";
import PermissionGuard from "@/components/PermissionGuard";

export default function Sales() {
  const { hasPermission } = usePermission();
  const [activeTab, setActiveTab] = useState("todas");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const canCreate = hasPermission(PermissionGroups.SALES.permissions.CREATE);

  const handleSaleCreated = () => {
    setIsCreateModalOpen(false);
  };

  return (
    <CartProvider>
      <div className="container mx-auto py-6 px-4">
        <div className="flex flex-col gap-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <ShoppingCart className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-3xl font-bold">Ventas</h1>
                <p className="text-muted-foreground">
                  Gestión de ventas y punto de venta
                </p>
              </div>
            </div>
            <PermissionGuard permission="VEN_CREATE">
              <Button onClick={() => setIsCreateModalOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Nueva Venta
              </Button>
            </PermissionGuard>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="todas">Todas las Ventas</TabsTrigger>
              <TabsTrigger value="pendientes">Ventas Pendientes</TabsTrigger>
            </TabsList>

            {/* Tab Todas las Ventas */}
            <TabsContent value="todas" className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-8 text-center">
                <ShoppingCart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">
                  Historial de Ventas
                </h3>
                <p className="text-muted-foreground mb-4">
                  Aquí se mostrará el listado de todas las ventas realizadas
                </p>
                <p className="text-sm text-muted-foreground">
                  Funcionalidad disponible cuando se implementen los endpoints correspondientes en el backend
                </p>
              </div>
            </TabsContent>

            {/* Tab Ventas Pendientes */}
            <TabsContent value="pendientes" className="space-y-4">
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-8 text-center">
                <AlertCircle className="h-16 w-16 text-orange-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2 text-orange-900">
                  Ventas Pendientes de Autorización
                </h3>
                <p className="text-orange-700 mb-4">
                  Aquí se mostrarán las ventas que exceden el límite de crédito y requieren autorización
                </p>
                <p className="text-sm text-orange-600">
                  Funcionalidad disponible cuando se implementen los endpoints correspondientes en el backend
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Modal de crear venta */}
        <CreateSaleModal
          open={isCreateModalOpen}
          onOpenChange={setIsCreateModalOpen}
          onSaleCreated={handleSaleCreated}
        />
      </div>
    </CartProvider>
  );
}
