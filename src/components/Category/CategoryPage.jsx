import { useRef, useState } from "react"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Layers, Plus } from "lucide-react"
import PermissionGuard from "@/components/PermissionGuard"
import AccessDenied from "@/components/Common/AccessDenied"
import { PermissionGroups } from "@/config/permissions"
import CategoryManager from "./CategoryManager"
import LocationManager from "./LocationManager"
import TipoMovimientoManager from "./TipoMovimientoManager"
import UnidadesMedidaManager from "./UnidadesMedidaManager"

const NEW_BUTTON_LABEL = {
  "categorias": "Nueva Categoría",
  "ubicaciones": "Nueva Ubicación",
  "tipos-movimiento": "Nuevo Tipo",
  "unidades-medida": "Nueva Unidad",
}

export default function CategoryPage() {
  const [activeTab, setActiveTab] = useState("categorias")
  const catRef = useRef(null)
  const locRef = useRef(null)
  const tiposRef = useRef(null)
  const unidadesRef = useRef(null)

  const handleNew = () => {
    if (activeTab === "categorias") catRef.current?.openCreate()
    if (activeTab === "ubicaciones") locRef.current?.openCreate()
    if (activeTab === "tipos-movimiento") tiposRef.current?.openCreate()
    if (activeTab === "unidades-medida") unidadesRef.current?.openCreate()
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
                Administra categorías, ubicaciones y tipos de movimiento de stock
              </p>
            </div>
          </div>
          <Button onClick={handleNew}>
            <Plus className="h-4 w-4 mr-2" />
            {NEW_BUTTON_LABEL[activeTab] ?? "Nuevo"}
          </Button>
        </div>

        {/* Filtros */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { key: "categorias",       label: "Categorías",           color: "border-primary" },
            { key: "ubicaciones",      label: "Ubicaciones",          color: "border-amber-500" },
            { key: "tipos-movimiento", label: "Tipos de Movimiento",  color: "border-violet-500" },
            { key: "unidades-medida",  label: "Unidades de Medida",   color: "border-teal-500" },
          ].map((tab) => {
            const isActive = activeTab === tab.key
            return (
              <Card
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`cursor-pointer border transition rounded-md p-3 text-center ${isActive ? `${tab.color} bg-accent/60 shadow-sm` : "border-muted hover:bg-muted/40 hover:shadow-sm"}`}
              >
                <CardHeader className="p-1">
                  <CardTitle className="text-lg font-medium">{tab.label}</CardTitle>
                </CardHeader>
              </Card>
            )
          })}
        </div>

        {activeTab === "categorias" && <CategoryManager ref={catRef} />}
        {activeTab === "ubicaciones" && <LocationManager ref={locRef} />}
        {activeTab === "tipos-movimiento" && <TipoMovimientoManager ref={tiposRef} />}
        {activeTab === "unidades-medida" && <UnidadesMedidaManager ref={unidadesRef} />}
      </div>
    </PermissionGuard>
  )
}
