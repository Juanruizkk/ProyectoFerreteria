import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Edit, Trash2, CheckCircle, XCircle, RefreshCw } from "lucide-react"

export default function ProductTable({ productos, onEditar, onEliminar, onToggleEstado, isLoading }) {
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
          {isLoading ? (
            [1, 2, 3, 4, 5].map((i) => (
              <TableRow key={i}>
                <TableCell><div className="h-4 w-32 bg-muted animate-pulse rounded" /></TableCell>
                <TableCell><div className="h-4 w-20 bg-muted animate-pulse rounded" /></TableCell>
                <TableCell><div className="h-4 w-16 bg-muted animate-pulse rounded" /></TableCell>
                <TableCell><div className="h-4 w-10 bg-muted animate-pulse rounded" /></TableCell>
                <TableCell><div className="h-4 w-10 bg-muted animate-pulse rounded" /></TableCell>
                <TableCell><div className="h-5 w-20 bg-muted animate-pulse rounded" /></TableCell>
                <TableCell><div className="h-5 w-16 bg-muted animate-pulse rounded" /></TableCell>
                <TableCell><div className="h-4 w-16 bg-muted animate-pulse rounded" /></TableCell>
                <TableCell><div className="h-4 w-28 bg-muted animate-pulse rounded" /></TableCell>
                <TableCell><div className="h-8 w-16 bg-muted animate-pulse rounded ml-auto" /></TableCell>
              </TableRow>
            ))
          ) : productos.length === 0 ? (
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
                <TableCell>{producto.ventaSinStock ? <span className="flex items-center gap-1 text-green-600"><CheckCircle className="h-4 w-4"/>Permitida</span> : <span className="flex items-center gap-1 text-red-600"><XCircle className="h-4 w-4"/>No</span>}</TableCell>
                <TableCell className="max-w-[200px] truncate">{producto.descripcion}</TableCell>
                <TableCell className="text-right space-x-2">
                  <Button size="sm" variant="outline" onClick={() => onEditar(producto)}><Edit className="h-4 w-4"/></Button>
                  {producto.activo ? (
                    <Button size="sm" variant="outline" className="text-destructive" onClick={() => onEliminar(producto)}><Trash2 className="h-4 w-4"/></Button>
                  ) : (
                    <Button size="sm" variant="outline" className="text-green-600" onClick={() => onToggleEstado(producto.id)}><RefreshCw className="h-4 w-4"/></Button>
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
