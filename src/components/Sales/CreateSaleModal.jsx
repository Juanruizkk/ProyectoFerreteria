import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  User,
  Plus,
  Search,
  ShoppingCart,
  Minus,
  X,
  AlertTriangle,
} from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { createSale, fetchAvailableProducts } from "@/services/SaleQueries";
import SelectClientModal from "./SelectClientModal";
import { toast } from "sonner";

export default function CreateSaleModal({ open, onOpenChange, onSaleCreated }) {
  const {
    items,
    addItem,
    incrementQuantity,
    decrementQuantity,
    removeItem,
    clearCart,
    total,
    totalItems,
  } = useCart();

  const [selectedClient, setSelectedClient] = useState(null);
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchProduct, setSearchProduct] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);

  useEffect(() => {
    if (open) {
      loadProducts();
      setSelectedClient(null);
      setPaymentMethod("");
      clearCart();
    }
  }, [open]);

  useEffect(() => {
    if (searchProduct.trim() === "") {
      setFilteredProducts(products);
    } else {
      const search = searchProduct.toLowerCase();
      const filtered = products.filter(
        (p) =>
          p.nombre?.toLowerCase().includes(search) ||
          p.categoria?.toLowerCase().includes(search) ||
          p.codigoBarras?.toLowerCase().includes(search)
      );
      setFilteredProducts(filtered);
    }
  }, [searchProduct, products]);

  const loadProducts = async () => {
    setLoadingProducts(true);
    try {
      const data = await fetchAvailableProducts();
      setProducts(data);
      setFilteredProducts(data);
    } catch (error) {
      console.error("Error al cargar productos:", error);
      toast.error("Error al cargar productos");
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleClientSelected = (client) => {
    setSelectedClient(client);
    setIsClientModalOpen(false);
  };

  const handleAddProduct = (product) => {
    if (!product.venderSinStock && product.stock <= 0) {
      toast.error("Producto sin stock disponible");
      return;
    }

    addItem(product, 1);
    toast.success(`${product.nombre} agregado al carrito`);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
    }).format(amount);
  };

  const checkCreditLimit = () => {
    if (!selectedClient || paymentMethod !== "Cuenta Corriente") {
      return { exceeds: false, excess: 0 };
    }

    const clientLimit = selectedClient.limiteCredito || 0;
    const currentBalance = selectedClient.saldoActual || 0;
    const newBalance = currentBalance + total;

    if (newBalance > clientLimit) {
      return { exceeds: true, excess: newBalance - clientLimit };
    }

    return { exceeds: false, excess: 0 };
  };

  const creditCheck = checkCreditLimit();

  const canFinalizeSale = () => {
    return selectedClient && paymentMethod && items.length > 0;
  };

  const handleFinalizeSale = async () => {
    if (!canFinalizeSale()) {
      toast.error("Complete todos los campos requeridos");
      return;
    }

    setLoading(true);
    try {
      const saleData = {
        idCliente: selectedClient.id || selectedClient.idCliente,
        medioPago: paymentMethod,
        items: items.map((item) => ({
          idProducto: item.id || item.idProducto,
          cantidad: item.quantity,
          precioUnitario: item.precio || item.price,
        })),
      };

      const result = await createSale(saleData);

      if (result.ventaPendiente) {
        toast.warning(
          `Venta PENDIENTE. Excede límite de crédito en ${formatCurrency(result.excesoCredito)}`,
          { duration: 5000 }
        );
      } else {
        toast.success("Venta realizada exitosamente");
      }

      clearCart();
      onSaleCreated();
    } catch (error) {
      console.error("Error al crear venta:", error);
      toast.error(error.message || "Error al crear la venta");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    clearCart();
    setSelectedClient(null);
    setPaymentMethod("");
    onOpenChange(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-7xl h-[90vh] p-0 gap-0 overflow-hidden">
          <DialogHeader className="px-6 py-4 border-b">
            <DialogTitle className="text-2xl font-bold">
              Nueva Venta
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 h-[calc(90vh-140px)] overflow-hidden">
            {/* COLUMNA 1: CLIENTE */}
            <div className="lg:col-span-3 border-r flex flex-col">
              <div className="p-4 border-b">
                <h3 className="text-sm font-semibold mb-3">Cliente</h3>
                <Button
                  onClick={() => setIsClientModalOpen(true)}
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {selectedClient ? "Cambiar" : "Seleccionar"}
                </Button>
              </div>

              <div className="p-4 flex-1">
                {!selectedClient ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <User className="w-12 h-12 text-muted-foreground mb-3" />
                    <p className="text-sm text-muted-foreground">
                      No hay cliente seleccionado
                    </p>
                  </div>
                ) : (
                  <Card className="p-4">
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">
                          Nombre
                        </p>
                        <p className="font-semibold">
                          {selectedClient.nombre} {selectedClient.apellido}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">
                          DNI/CUIT
                        </p>
                        <p className="font-mono text-sm">
                          {selectedClient.dni || selectedClient.cuit}
                        </p>
                      </div>

                      {selectedClient.tipoPago === "Cuenta Corriente" && (
                        <>
                          <Separator />
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">
                              Saldo Actual
                            </p>
                            <p className="text-lg font-bold text-orange-600">
                              {formatCurrency(selectedClient.saldoActual || 0)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-2">
                              Límite de Crédito
                            </p>
                            <div className="space-y-1">
                              <div className="flex justify-between text-xs">
                                <span>
                                  {formatCurrency(
                                    selectedClient.saldoActual || 0
                                  )}
                                </span>
                                <span>
                                  {formatCurrency(
                                    selectedClient.limiteCredito || 0
                                  )}
                                </span>
                              </div>
                              <div className="h-2 bg-muted rounded-full overflow-hidden">
                                <div
                                  className={`h-full ${
                                    ((selectedClient.saldoActual || 0) /
                                      (selectedClient.limiteCredito || 1)) *
                                      100 >=
                                    90
                                      ? "bg-destructive"
                                      : ((selectedClient.saldoActual || 0) /
                                          (selectedClient.limiteCredito || 1)) *
                                          100 >=
                                        70
                                      ? "bg-orange-500"
                                      : "bg-green-500"
                                  }`}
                                  style={{
                                    width: `${Math.min(((selectedClient.saldoActual || 0) / (selectedClient.limiteCredito || 1)) * 100, 100)}%`,
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </Card>
                )}
              </div>
            </div>

            {/* COLUMNA 2: PRODUCTOS */}
            <div className="lg:col-span-5 border-r flex flex-col">
              <div className="p-4 border-b">
                <h3 className="text-sm font-semibold mb-3">Productos</h3>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar productos..."
                    value={searchProduct}
                    onChange={(e) => setSearchProduct(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <ScrollArea className="flex-1 px-4 py-2">
                {loadingProducts ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Cargando productos...
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredProducts.map((product) => (
                      <Card
                        key={product.id || product.idProducto}
                        className="p-3 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold truncate">
                              {product.nombre}
                            </h4>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-xs">
                                {product.categoria}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                Stock: {product.stock}
                              </span>
                            </div>
                            <p className="text-xl font-bold text-primary mt-1">
                              {formatCurrency(
                                product.precio || product.price || 0
                              )}
                            </p>
                          </div>
                          <Button
                            onClick={() => handleAddProduct(product)}
                            size="icon"
                            className="shrink-0"
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>

            {/* COLUMNA 3: CARRITO */}
            <div className="lg:col-span-4 flex flex-col">
              <div className="p-4 border-b">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold">Carrito</h3>
                  <Badge variant="outline">
                    {totalItems}{" "}
                    {totalItems === 1 ? "producto" : "productos"}
                  </Badge>
                </div>
              </div>

              <ScrollArea className="flex-1 px-4 py-2">
                {items.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <ShoppingCart className="w-12 h-12 text-muted-foreground mb-3" />
                    <p className="text-sm text-muted-foreground">
                      Carrito vacío
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {items.map((item) => (
                      <Card
                        key={item.id || item.idProducto}
                        className="p-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-sm truncate">
                              {item.nombre || item.name}
                            </h4>
                            <p className="text-sm text-muted-foreground mt-0.5">
                              {formatCurrency(item.precio || item.price || 0)}{" "}
                              c/u
                            </p>
                          </div>
                          <Button
                            onClick={() =>
                              removeItem(item.id || item.idProducto)
                            }
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 shrink-0"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center gap-2">
                            <Button
                              onClick={() =>
                                decrementQuantity(item.id || item.idProducto)
                              }
                              variant="outline"
                              size="icon"
                              className="h-7 w-7"
                            >
                              <Minus className="w-3 h-3" />
                            </Button>
                            <span className="font-semibold w-8 text-center">
                              {item.quantity}
                            </span>
                            <Button
                              onClick={() =>
                                incrementQuantity(item.id || item.idProducto)
                              }
                              variant="outline"
                              size="icon"
                              className="h-7 w-7"
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                          </div>
                          <p className="font-bold">
                            {formatCurrency(
                              (item.precio || item.price || 0) * item.quantity
                            )}
                          </p>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </ScrollArea>

              <div className="p-4 border-t space-y-4">
                <div>
                  <label className="text-xs font-semibold mb-2 block">
                    Forma de Pago
                  </label>
                  <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar método" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Efectivo">Efectivo</SelectItem>
                      <SelectItem value="Tarjeta de Crédito">
                        Tarjeta de Crédito
                      </SelectItem>
                      <SelectItem value="Tarjeta de Débito">
                        Tarjeta de Débito
                      </SelectItem>
                      <SelectItem value="Transferencia">
                        Transferencia
                      </SelectItem>
                      {selectedClient?.tipoPago === "Cuenta Corriente" && (
                        <SelectItem value="Cuenta Corriente">
                          Cuenta Corriente
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {creditCheck.exceeds && (
                  <Alert variant="destructive">
                    <AlertTriangle className="w-4 h-4" />
                    <AlertDescription className="text-sm">
                      Excede el límite de crédito en{" "}
                      <strong>{formatCurrency(creditCheck.excess)}</strong>.
                      Quedará pendiente de autorización.
                    </AlertDescription>
                  </Alert>
                )}

                <div className="flex items-center justify-between py-3 border-t">
                  <span className="text-sm font-semibold">TOTAL</span>
                  <span className="text-2xl font-bold">
                    {formatCurrency(total)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="px-6 py-3 border-t">
            <Button
              onClick={handleCancel}
              variant="outline"
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleFinalizeSale}
              disabled={!canFinalizeSale() || loading}
            >
              {loading ? "Procesando..." : "Finalizar Venta"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <SelectClientModal
        open={isClientModalOpen}
        onOpenChange={setIsClientModalOpen}
        onClientSelected={handleClientSelected}
      />
    </>
  );
}
