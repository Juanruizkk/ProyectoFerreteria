import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Edit, Trash2, Package, AlertTriangle, MapPin, Tag, Sliders, History } from "lucide-react"
import { useUnidadesMedida } from "@/contexts/UnidadesMedidaContext"
import PermissionGuard from "@/components/PermissionGuard"
import { usePermission } from "@/hooks/usePermission"

export default function ProductList({ productos, onEditar, onEliminar, onToggleEstado, onAjustarStock, onVerHistorial, isLoading }) {
  const { formatCantidad } = useUnidadesMedida()
  const { hasPermission } = usePermission()
  const hasAnyAction = hasPermission("PROD_UPDATE") || hasPermission("PROD_STOCK_IN") || hasPermission("PROD_BARCODE") || hasPermission("PROD_DELETE")
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-3">
              <div className="h-5 w-40 bg-muted animate-pulse rounded" />
              <div className="h-4 w-24 bg-muted animate-pulse rounded mt-1" />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="h-8 w-28 bg-muted animate-pulse rounded" />
              <div className="grid grid-cols-2 gap-4">
                <div className="h-4 w-16 bg-muted animate-pulse rounded" />
                <div className="h-4 w-16 bg-muted animate-pulse rounded" />
              </div>
              <div className="space-y-2">
                <div className="h-4 w-32 bg-muted animate-pulse rounded" />
                <div className="h-4 w-28 bg-muted animate-pulse rounded" />
              </div>
              <div className="flex gap-2 pt-2">
                <div className="h-8 flex-1 bg-muted animate-pulse rounded" />
                <div className="h-8 w-20 bg-muted animate-pulse rounded" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (productos.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Package className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No hay productos</h3>
          <p className="text-muted-foreground text-center">No se encontraron productos que coincidan con tu búsqueda.</p>
        </CardContent>
      </Card>
    )
  }

  const getStockStatus = (producto) => {
    const stockMin = producto.stockMinimo ?? producto.stock_minimo ?? 0
    if (producto.stock === 0) return { variant: "destructive", text: "Sin Stock", icon: AlertTriangle }
    else if (producto.stock <= stockMin) return { variant: "secondary", text: "Stock Bajo", icon: AlertTriangle }
    else return { variant: "default", text: "En Stock", icon: Package }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {productos.map((producto) => {
        const stockStatus = getStockStatus(producto)
        const StockIcon = stockStatus.icon
        return (
          <Card key={producto.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3 flex justify-between items-start">
              <div>
                <CardTitle className="text-lg">{producto.nombre}</CardTitle>
                <p className="text-sm text-muted-foreground">{producto.marca}</p>
              </div>
              <Badge variant={stockStatus.variant} className="gap-1 ml-2">
                <StockIcon className="h-3 w-3" />{stockStatus.text}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              {producto.descripcion && <p className="text-sm text-muted-foreground line-clamp-2">{producto.descripcion}</p>}
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-primary">${producto.precio.toLocaleString()}</span>
                <span className="text-xs text-muted-foreground">ID: {producto.id}</span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-muted-foreground">Stock:</span><p className="font-semibold">{formatCantidad(producto.stock, producto.idUnidadMedida)}</p></div>
                <div><span className="text-muted-foreground">Mínimo:</span><p className="font-semibold">{formatCantidad(producto.stockMinimo ?? producto.stock_minimo ?? 0, producto.idUnidadMedida)}</p></div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex gap-2 items-center"><Tag className="h-4 w-4 text-muted-foreground"/><span>Categoría:</span><Badge variant="outline">{producto.categoria}</Badge></div>
                <div className="flex gap-2 items-center"><MapPin className="h-4 w-4 text-muted-foreground"/><span>Ubicación:</span><Badge variant="outline">{producto.ubicacion}</Badge></div>
              </div>
              {hasAnyAction && <div className="flex gap-2 pt-2 flex-wrap">
                <PermissionGuard permission="PROD_UPDATE">
                  <Button variant="outline" size="sm" onClick={() => onEditar(producto)} className="flex-1 gap-2"><Edit className="h-4 w-4"/>Editar</Button>
                </PermissionGuard>
                <PermissionGuard permission="PROD_STOCK_IN">
                  <Button variant="outline" size="sm" onClick={() => onAjustarStock?.(producto)} className="gap-2">
                    <Sliders className="h-4 w-4"/>Stock
                  </Button>
                </PermissionGuard>
                <PermissionGuard permission="PROD_STOCK_IN">
                  <Button variant="outline" size="sm" onClick={() => onVerHistorial?.(producto)} className="gap-2">
                    <History className="h-4 w-4"/>Historial
                  </Button>
                </PermissionGuard>
                <PermissionGuard permission="PROD_DELETE">
                  {producto.activo ? (
                    <Button variant="outline" size="sm" onClick={() => onEliminar(producto)} className="gap-2 text-destructive"><Trash2 className="h-4 w-4"/>Eliminar</Button>
                  ) : (
                    <Button variant="outline" size="sm" onClick={() => onToggleEstado(producto.id)} className="gap-2 text-green-600">Reactivar</Button>
                  )}
                </PermissionGuard>
              </div>}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
