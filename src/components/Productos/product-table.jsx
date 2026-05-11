import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useUnidadesMedida } from "@/contexts/UnidadesMedidaContext"
import PermissionGuard from "@/components/PermissionGuard"
import { usePermission } from "@/hooks/usePermission"
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
import { Edit, Trash2, CheckCircle, XCircle, RefreshCw, Barcode, Package, Sliders, History } from "lucide-react"
import BarcodeManagerDialog from "./BarcodeManagerDialog"
import EmptyState from "@/components/Common/EmptyState"

function StockCell({ stock, stockMinimo, idUnidadMedida }) {
  const { formatCantidad } = useUnidadesMedida()
  const minimo = stockMinimo ?? 0
  const sinStock = stock === 0
  const bajoMinimo = stock <= minimo

  const badgeClass = sinStock
    ? "bg-red-100 text-red-700 border-red-200"
    : bajoMinimo
    ? "bg-amber-100 text-amber-700 border-amber-200"
    : "bg-green-100 text-green-700 border-green-200"

  return (
    <div className="flex flex-col gap-0.5">
      <span className={`inline-flex items-center justify-center rounded-md border text-sm font-medium px-1.5 py-0.5 ${badgeClass}`}>
        {formatCantidad(stock, idUnidadMedida)}
      </span>
      <span className="text-xs text-muted-foreground">mín {formatCantidad(minimo, idUnidadMedida)}</span>
    </div>
  )
}

export default function ProductTable({ productos, isLoading = false, onEditar, onEliminar, onToggleEstado, onToggleVentaSinStock, onGestionarCodigosBarras, onAjustarStock, onVerHistorial }) {
  const [confirmVss, setConfirmVss] = useState({ open: false, producto: null })
  const [barcodeDialog, setBarcodeDialog] = useState({ open: false, producto: null })
  const { hasPermission } = usePermission()
  const hasAnyAction = hasPermission("PROD_UPDATE") || hasPermission("PROD_STOCK_IN") || hasPermission("PROD_BARCODE") || hasPermission("PROD_DELETE")

  const abrirConfirmVss = (producto) => setConfirmVss({ open: true, producto })
  const cerrarConfirmVss = () => setConfirmVss({ open: false, producto: null })

  const confirmarToggleVss = () => {
    if (confirmVss.producto) onToggleVentaSinStock(confirmVss.producto)
    cerrarConfirmVss()
  }

  const vssActual = confirmVss.producto?.ventaSinStock

  return (
    <TooltipProvider delayDuration={300}>
      <div className="rounded-md border">
        <Table className="table-fixed w-full">
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="w-[12%]">Código</TableHead>
              <TableHead className="w-[22%]">Producto</TableHead>
              <TableHead className="w-[10%]">Precio</TableHead>
              <TableHead className="w-[10%]">Stock</TableHead>
              <TableHead className="w-[20%]">Categoría / Ubicación</TableHead>
              <TableHead className="w-[10%] text-center">V. sin stock</TableHead>
              {hasAnyAction && <TableHead className="w-[20%] text-right">Acciones</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><div className="h-4 w-24 bg-muted animate-pulse rounded" /></TableCell>
                  <TableCell><div className="h-4 w-32 bg-muted animate-pulse rounded" /></TableCell>
                  <TableCell><div className="h-4 w-16 bg-muted animate-pulse rounded" /></TableCell>
                  <TableCell><div className="h-4 w-10 bg-muted animate-pulse rounded" /></TableCell>
                  <TableCell><div className="h-5 w-20 bg-muted animate-pulse rounded" /></TableCell>
                  <TableCell><div className="h-5 w-8 bg-muted animate-pulse rounded mx-auto" /></TableCell>
                  <TableCell><div className="h-8 w-24 bg-muted animate-pulse rounded ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : productos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={hasAnyAction ? 7 : 6}>
                  <EmptyState icon={Package} title="No hay productos" />
                </TableCell>
              </TableRow>
            ) : (
              productos.map((producto) => {
                const codigos = producto.codigoBarras ?? producto.codigosBarras ?? []
                return (
                  <TableRow key={producto.id} className="hover:bg-muted/30 transition-colors">
                    {/* Código de barra */}
                    <TableCell>
                      {codigos.length === 0 ? (
                        <span className="text-muted-foreground text-xs">—</span>
                      ) : (
                        <div className="flex flex-col gap-0.5">
                          {codigos.slice(0, 2).map((cb) => (
                            <span key={cb.codigo} className="text-xs font-mono truncate">
                              {cb.codigo}
                            </span>
                          ))}
                          {codigos.length > 2 && (
                            <span className="text-xs text-muted-foreground">+{codigos.length - 2} más</span>
                          )}
                        </div>
                      )}
                    </TableCell>

                    {/* Producto: nombre + marca + tooltip descripción */}
                    <TableCell>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="cursor-default">
                            <p className="font-medium leading-tight truncate">{producto.nombre}</p>
                            <p className="text-xs text-muted-foreground truncate">{producto.marca}</p>
                          </div>
                        </TooltipTrigger>
                        {producto.descripcion && (
                          <TooltipContent side="right" className="max-w-[220px]">
                            <p className="text-xs">{producto.descripcion}</p>
                          </TooltipContent>
                        )}
                      </Tooltip>
                    </TableCell>

                    {/* Precio */}
                    <TableCell className="font-medium">
                      ${producto.precio.toLocaleString()}
                    </TableCell>

                    {/* Stock */}
                    <TableCell>
                      <StockCell
                        stock={producto.stock}
                        stockMinimo={producto.stockMinimo ?? producto.stock_minimo}
                        idUnidadMedida={producto.idUnidadMedida}
                      />
                    </TableCell>

                    {/* Categoría + Ubicación */}
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        {producto.categoria && (
                          <Badge variant="outline" className="w-fit text-xs">{producto.categoria}</Badge>
                        )}
                        {producto.ubicacion && (
                          <Badge variant="outline" className="w-fit text-xs">{producto.ubicacion}</Badge>
                        )}
                      </div>
                    </TableCell>

                    {/* Venta sin stock: ícono clickeable solo con PROD_UPDATE */}
                    <TableCell className="text-center">
                      {hasPermission("PROD_UPDATE") ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              onClick={() => abrirConfirmVss(producto)}
                              className="mx-auto flex items-center justify-center rounded-full p-1 hover:bg-muted transition-colors"
                            >
                              {producto.ventaSinStock
                                ? <CheckCircle className="h-4 w-4 text-green-600" />
                                : <XCircle className="h-4 w-4 text-red-400" />
                              }
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>
                            {producto.ventaSinStock ? "Desactivar venta sin stock" : "Activar venta sin stock"}
                          </TooltipContent>
                        </Tooltip>
                      ) : (
                        <span className="mx-auto flex items-center justify-center">
                          {producto.ventaSinStock
                            ? <CheckCircle className="h-4 w-4 text-green-600" />
                            : <XCircle className="h-4 w-4 text-red-400" />
                          }
                        </span>
                      )}
                    </TableCell>

                    {/* Acciones */}
                    {hasAnyAction && <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1 flex-nowrap">
                        <PermissionGuard permission="PROD_UPDATE">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button size="sm" variant="outline" onClick={() => onEditar(producto)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Editar</TooltipContent>
                          </Tooltip>
                        </PermissionGuard>
                        <PermissionGuard permission="PROD_STOCK_IN">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button size="sm" variant="outline" onClick={() => onAjustarStock?.(producto)}>
                                <Sliders className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Ajustar Stock</TooltipContent>
                          </Tooltip>
                        </PermissionGuard>
                        <PermissionGuard permission="PROD_STOCK_IN">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button size="sm" variant="outline" onClick={() => onVerHistorial?.(producto)}>
                                <History className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Ver Historial</TooltipContent>
                          </Tooltip>
                        </PermissionGuard>
                        <PermissionGuard permission="PROD_BARCODE">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button size="sm" variant="outline" onClick={() => setBarcodeDialog({ open: true, producto })}>
                                <Barcode className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Códigos de barra</TooltipContent>
                          </Tooltip>
                        </PermissionGuard>
                        <PermissionGuard permission="PROD_DELETE">
                          {producto.activo ? (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button size="sm" variant="outline" className="text-destructive" onClick={() => onEliminar(producto)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Desactivar</TooltipContent>
                            </Tooltip>
                          ) : (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button size="sm" variant="outline" className="text-green-600" onClick={() => onToggleEstado(producto.id)}>
                                  <RefreshCw className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Reactivar</TooltipContent>
                            </Tooltip>
                          )}
                        </PermissionGuard>
                      </div>
                    </TableCell>}
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Dialog gestión códigos de barra */}
      <BarcodeManagerDialog
        open={barcodeDialog.open}
        producto={barcodeDialog.producto}
        onClose={() => setBarcodeDialog({ open: false, producto: null })}
        onSave={onGestionarCodigosBarras}
      />

      {/* Confirm dialog venta sin stock */}
      <AlertDialog open={confirmVss.open} onOpenChange={(open) => !open && cerrarConfirmVss()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {vssActual ? "¿Desactivar venta sin stock?" : "¿Activar venta sin stock?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {vssActual
                ? <>El producto <span className="font-semibold text-foreground">"{confirmVss.producto?.nombre}"</span> dejará de poder venderse cuando no tenga unidades disponibles.</>
                : <>El producto <span className="font-semibold text-foreground">"{confirmVss.producto?.nombre}"</span> podrá venderse aunque no tenga unidades en stock.</>
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cerrarConfirmVss}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmarToggleVss}>
              {vssActual ? "Sí, desactivar" : "Sí, activar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </TooltipProvider>
  )
}
