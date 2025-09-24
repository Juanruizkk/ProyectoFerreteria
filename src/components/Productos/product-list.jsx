
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Edit, Trash2, Package, AlertTriangle, MapPin, Tag } from "lucide-react"

export default function ProductList({
  productos,
  onEditar,
  onEliminar,
}) {
  const [productoAEliminar, setProductoAEliminar] = useState(null)

  const confirmarEliminacion = (producto) => {
    setProductoAEliminar(producto)
  }

  const handleEliminar = () => {
    if (productoAEliminar) {
      onEliminar(productoAEliminar.id)
      setProductoAEliminar(null)
    }
  }

  const getStockStatus = (producto) => {
    if (producto.stock === 0) {
      return { variant: "destructive", text: "Sin Stock", icon: AlertTriangle }
    } else if (producto.stock <= producto.stock_minimo) {
      return { variant: "secondary", text: "Stock Bajo", icon: AlertTriangle }
    } else {
      return { variant: "default", text: "En Stock", icon: Package }
    }
  }

  if (productos.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Package className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No hay productos</h3>
          <p className="text-muted-foreground text-center">
            No se encontraron productos que coincidan con tu búsqueda.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {productos.map((producto) => {
          const stockStatus = getStockStatus(producto)
          const StockIcon = stockStatus.icon

          return (
            <Card key={producto.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg text-balance">{producto.nombre}</CardTitle>
                    <p className="text-sm text-muted-foreground font-medium">{producto.marca}</p>
                  </div>
                  <Badge variant={stockStatus.variant} className="gap-1 ml-2">
                    <StockIcon className="h-3 w-3" />
                    {stockStatus.text}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Descripción */}
                {producto.descripcion && (
                  <p className="text-sm text-muted-foreground line-clamp-2">{producto.descripcion}</p>
                )}

                {/* Precio */}
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-primary">${producto.precio.toLocaleString()}</span>
                  <span className="text-xs text-muted-foreground">ID: {producto.id}</span>
                </div>

                {/* Stock */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Stock:</span>
                    <p className="font-semibold">{producto.stock} unidades</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Mínimo:</span>
                    <p className="font-semibold">{producto.stockMinimo} unidades</p>
                  </div>
                </div>

                {/* Categoría y Ubicación */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Tag className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Categoría:</span>
                    <Badge variant="outline">{producto.categoria}</Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Ubicación:</span>
                    <Badge variant="outline">{producto.ubicacion}</Badge>
                  </div>
                </div>

                {/* Botones de acción */}
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEditar(producto)}
                    className="flex-1 gap-2">
                    <Edit className="h-4 w-4" />
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => confirmarEliminacion(producto)}
                    className="gap-2 text-destructive hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                    Eliminar
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      {/* Dialog de confirmación para eliminar */}
      <AlertDialog
        open={!!productoAEliminar}
        onOpenChange={() => setProductoAEliminar(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente el producto{" "}
              <strong>"{productoAEliminar?.nombre}"</strong> del inventario.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleEliminar}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
