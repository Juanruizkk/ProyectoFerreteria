import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Edit, Trash2, CheckCircle, XCircle } from "lucide-react"

export default function ProductTable({ productos, onEditar, onEliminar, onToggleEstado }) {
  const [productoAEliminar, setProductoAEliminar] = useState(null)

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Marca</TableHead>
            <TableHead>Precio</TableHead>
            <TableHead>Stock</TableHead>
            <TableHead>Mínimo</TableHead>
            <TableHead>Categoría</TableHead>
            <TableHead>Ubicación</TableHead>
            <TableHead>Venta sin stock</TableHead>
            <TableHead>Descripción</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {productos.length === 0 ? (
            <TableRow><TableCell colSpan={10} className="text-center py-6 text-muted-foreground">No hay productos</TableCell></TableRow>
          ) : (
            productos.map((producto) => (
              <TableRow key={producto.id}>
                <TableCell>{producto.nombre}</TableCell>
                <TableCell>{producto.marca}</TableCell>
                <TableCell>${producto.precio.toLocaleString()}</TableCell>
                <TableCell>{producto.stock}</TableCell>
                <TableCell>{producto.stockMinimo ?? producto.stock_minimo ?? 0}</TableCell>
                <TableCell><Badge variant="outline">{producto.categoria}</Badge></TableCell>
                <TableCell><Badge variant="outline">{producto.ubicacion}</Badge></TableCell>
                <TableCell>{producto.ventaSinStock ? <Badge className="border-green-600 text-green-700 gap-1"><CheckCircle className="h-4 w-4"/>Permitida</Badge> : <Badge className="border-red-400 text-red-400 gap-1"><XCircle className="h-4 w-4"/>No</Badge>}</TableCell>
                <TableCell className="max-w-[200px] truncate">{producto.descripcion}</TableCell>
                <TableCell className="text-right space-x-2">
                  <Button size="sm" variant="outline" onClick={() => onEditar(producto)} className="gap-1"><Edit className="h-4 w-4"/>Editar</Button>
                  {producto.activo ? (
                    <Button size="sm" variant="outline" className="text-destructive gap-1" onClick={() => onEliminar(producto.id)}><Trash2 className="h-4 w-4"/>Eliminar</Button>
                  ) : (
                    <Button size="sm" variant="outline" className="text-green-600 gap-1" onClick={() => onToggleEstado(producto.id)}>Reactivar</Button>
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
