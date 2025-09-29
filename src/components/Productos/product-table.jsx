// src/components/Productos/product-table.jsx
import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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
import { Badge } from "@/components/ui/badge"
import { Edit, Trash2, CheckCircle, XCircle } from "lucide-react"

export default function ProductTable({ productos, onEditar, onEliminar }) {
  const [productoAEliminar, setProductoAEliminar] = useState(null)

  const handleEliminar = () => {
    if (productoAEliminar) {
      onEliminar(productoAEliminar.id)
      setProductoAEliminar(null)
    }
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Marca</TableHead>
              <TableHead>Precio</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Stock Mínimo</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead>Ubicación</TableHead>
              <TableHead>Venta sin stock</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead>Cod. de Barras</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {productos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-6 text-muted-foreground">
                  No hay productos disponibles
                </TableCell>
              </TableRow>
            ) : (
              productos.map((producto) => (
                <TableRow key={producto.id}>
                  <TableCell className="font-medium">{producto.nombre}</TableCell>
                  <TableCell>{producto.marca}</TableCell>
                  <TableCell>${producto.precio.toLocaleString()}</TableCell>
                  <TableCell>{producto.stock}</TableCell>
                  <TableCell>{producto.stockMinimo ?? producto.stock_minimo ?? 0}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{producto.categoria}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{producto.ubicacion}</Badge>
                  </TableCell>
                  <TableCell>
                    {producto.ventaSinStock ? (
                      <Badge className="border-green-600 text-green-700 gap-1">
                        <CheckCircle className="h-4 w-4" />
                        Permitida
                      </Badge>
                    ) : (
                      <Badge className="border-red-400 text-red-400 gap-1">
                        <XCircle className="h-4 w-4" />
                        No permitida
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate">
                    {producto.descripcion}
                  </TableCell>
                 {/*  <TableCell>{producto.codigoBarras}</TableCell> */}
                  <TableCell className="text-right space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onEditar(producto)}
                      className="gap-1"
                    >
                      <Edit className="h-4 w-4" />
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-destructive gap-1"
                      onClick={() => setProductoAEliminar(producto)}
                    >
                      <Trash2 className="h-4 w-4" />
                      Eliminar
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Dialogo de confirmación */}
      <AlertDialog
        open={!!productoAEliminar}
        onOpenChange={() => setProductoAEliminar(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              ¿Desea desactivar el producto{" "}
              <strong>"{productoAEliminar?.nombre}"</strong>?
            </AlertDialogTitle>
            <AlertDialogDescription>
              No estará disponible en el inventario ni en nuevas operaciones,
              aunque seguirá guardado en el sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleEliminar}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
