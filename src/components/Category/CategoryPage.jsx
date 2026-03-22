import { useRef, useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Layers, Plus } from "lucide-react"
import PermissionGuard from "@/components/PermissionGuard"
import AccessDenied from "@/components/Common/AccessDenied"
import { PermissionGroups } from "@/config/permissions"
import CategoryManager from "./CategoryManager"
import LocationManager from "./LocationManager"

const NEW_BUTTON_LABEL = {
  "categorias": "Nueva Categoría",
  "ubicaciones": "Nueva Ubicación",
}

export default function CategoryPage() {
  const [activeTab, setActiveTab] = useState("categorias")
  const catRef = useRef(null)
  const locRef = useRef(null)

  const handleNew = () => {
    if (activeTab === "categorias") catRef.current?.openCreate()
    if (activeTab === "ubicaciones") locRef.current?.openCreate()
  }

  return (
    <PermissionGuard
      anyOf={Object.values(PermissionGroups.PRODUCTS.permissions)}
      fallback={<AccessDenied moduleName="la gestión de categorías y ubicaciones" />}
    >
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Layers className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Categorías de Productos</h1>
              <p className="text-muted-foreground">
                Administra categorías y ubicaciones para clasificar productos
              </p>
            </div>
          </div>
          <Button onClick={handleNew}>
            <Plus className="h-4 w-4 mr-2" />
            {NEW_BUTTON_LABEL[activeTab] ?? "Nuevo"}
          </Button>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="categorias">Categorías</TabsTrigger>
            <TabsTrigger value="ubicaciones">Ubicaciones</TabsTrigger>
          </TabsList>
          <TabsContent value="categorias" className="mt-4">
            <CategoryManager ref={catRef} />
          </TabsContent>
          <TabsContent value="ubicaciones" className="mt-4">
            <LocationManager ref={locRef} />
          </TabsContent>
        </Tabs>
      </div>
    </PermissionGuard>
  )
}
