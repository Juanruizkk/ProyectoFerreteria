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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  User,
  Plus,
  Search,
  ShoppingCart,
  Minus,
  X,
  AlertTriangle,
  UserPlus,
  Package,
  Check,
} from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { createSale, fetchAvailableProducts, fetchAllClients } from "@/services/SaleQueries";
import { createCliente } from "@/services/ClienteQueries";
import ClientForm from "@/components/Clientes/ClientForm";
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
  const [clients, setClients] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchProduct, setSearchProduct] = useState("");
  const [searchClient, setSearchClient] = useState("");
  const [availabilityFilter, setAvailabilityFilter] = useState("todos"); // todos, con_stock, venta_sin_stock
  const [paymentMethod, setPaymentMethod] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [loadingClients, setLoadingClients] = useState(false);

  // Modal secundario para crear cliente
  const [isCreateClientModalOpen, setIsCreateClientModalOpen] = useState(false);

  useEffect(() => {
    if (open) {
      loadProducts();
      loadClients();
      setSelectedClient(null);
      setPaymentMethod("");
      clearCart();
    }
  }, [open]);

  useEffect(() => {
    let filtered = [...products]; // Crear copia para no mutar el array original

    // Filtro por disponibilidad
    const filterByAvailability = (p) => {
      const stock = p.stock ?? 0;
      const permiteVentaSinStock = p.ventaSinStock || p.venderSinStock || false;

      switch (availabilityFilter) {
        case "todos":
          // Disponibles: stock > 0 o permiten venta sin stock
          return stock > 0 || permiteVentaSinStock;
        case "con_stock":
          // Solo con stock > 0
          return stock > 0;
        case "venta_sin_stock":
          // Solo los que permiten vender sin stock (sin importar el stock actual)
          return permiteVentaSinStock;
        default:
          return true;
      }
    };

    filtered = filtered.filter(filterByAvailability);

    // Filtro por búsqueda de texto
    if (searchProduct.trim() !== "") {
      const search = searchProduct.toLowerCase();
      filtered = filtered.filter((p) => {
        // Búsqueda por nombre, marca y categoría
        const matchesText =
          p.nombre?.toLowerCase().includes(search) ||
          p.marca?.toLowerCase().includes(search) ||
          p.categoria?.toLowerCase().includes(search);

        // Búsqueda por código de barras (es un array de objetos)
        const matchesBarcode = p.codigoBarras?.some(
          (cb) => cb.codigo?.toLowerCase().includes(search)
        );

        return matchesText || matchesBarcode;
      });
    }

    setFilteredProducts(filtered);
  }, [searchProduct, availabilityFilter, products]);

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

  const loadClients = async () => {
    setLoadingClients(true);
    try {
      const data = await fetchAllClients();
      setClients(data);
    } catch (error) {
      console.error("Error al cargar clientes:", error);
      toast.error("Error al cargar clientes");
    } finally {
      setLoadingClients(false);
    }
  };

  const handleClientSelect = (clientId) => {
    const client = clients.find(c => (c.id || c.idCliente).toString() === clientId);
    setSelectedClient(client);
    setSearchClient("");
  };

  const handleCreateClient = async (clientData) => {
    try {
      const newClient = await createCliente(clientData);
      toast.success("Cliente creado exitosamente");

      // Recargar la lista de clientes
      await loadClients();

      // Seleccionar automáticamente el cliente recién creado
      setSelectedClient(newClient);

      // Cerrar el modal de creación
      setIsCreateClientModalOpen(false);
    } catch (error) {
      console.error("Error al crear cliente:", error);
      throw error; // Propagar el error para que ClientForm lo maneje
    }
  };

  const handleAddProduct = (product) => {
    // Solo bloquear si NO tiene stock Y NO permite venta sin stock
    const permiteVentaSinStock = product.ventaSinStock;

    if (!permiteVentaSinStock && product.stock <= 0) {
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

  const getProductAvailabilityBadge = (product) => {
    const stock = product.stock ?? 0;
    const permiteVentaSinStock = product.ventaSinStock || product.venderSinStock;

    // Si tiene stock mayor a 0
    if (stock > 0) {
      return {
        text: `Stock: ${stock}`,
        className: "bg-green-100 text-green-800 border-green-200",
        icon: null,
      };
    }

    // Si tiene venta sin stock habilitada (sin importar el stock)
    if (permiteVentaSinStock) {
      return {
        text: "Venta sin stock",
        className: "bg-green-100 text-green-800 border-green-200",
        icon: Check,
      };
    }

    // Si tiene stock 0 y venta sin stock desactivada
    return {
      text: "Desactivado",
      className: "bg-red-100 text-red-800 border-red-200",
      icon: null,
    };
  };

  const getProductButton = (product) => {
    const stock = product.stock || 0;
    const permiteVentaSinStock = product.ventaSinStock;

    if (stock > 0) {
      return {
        text: "Agregar",
        icon: Plus,
        disabled: false,
        variant: "default",
      };
    } else if (stock <= 0 && permiteVentaSinStock) {
      return {
        text: "Agregar",
        icon: Plus,
        disabled: false,
        variant: "default",
      };
    } else {
      return {
        text: "No disponible",
        icon: X,
        disabled: true,
        variant: "ghost",
      };
    }
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
        idMedioPago: paymentMethod === "Efectivo" ? 1 :
                     paymentMethod === "Cuenta Corriente" ? 2 : 1,
        idUsuarioVendedor: 1, // TODO: Obtener del contexto de autenticación
        items: items.map((item) => ({
          IdProducto: item.id || item.idProducto,
          Cantidad: item.quantity,
        })),
      };

      const result = await createSale(saleData);

      if (result.estado === "Pendiente de Autorización") {
        toast.warning(
          `Venta PENDIENTE. Excede límite de crédito.`,
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

  const filteredClients = clients.filter(c => {
    if (!searchClient) return true;
    const search = searchClient.toLowerCase();
    const nombre = c.nombre?.toLowerCase() || "";
    const apellido = c.apellido?.toLowerCase() || "";
    const razonSocial = c.razonSocial?.toLowerCase() || "";
    const dni = c.dni?.toLowerCase() || "";
    const cuit = c.cuit?.toLowerCase() || "";

    return nombre.includes(search) ||
           apellido.includes(search) ||
           razonSocial.includes(search) ||
           dni.includes(search) ||
           cuit.includes(search);
  });

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-7xl h-[90vh] p-0 gap-0 overflow-hidden">
          <DialogHeader className="px-6 py-4 border-b">
            <DialogTitle className="text-2xl font-bold">
              Nueva Venta
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col h-[calc(90vh-140px)]">
            {/* FILA 1: CLIENTE (Ocupa todo el ancho) */}
            <div className="border-b bg-muted/30 shrink-0">
              <div className="p-4">
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Cliente
                </h3>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Selector de cliente */}
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          placeholder="Buscar cliente por nombre, DNI, CUIT..."
                          value={searchClient}
                          onChange={(e) => setSearchClient(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                      <Button
                        onClick={() => setIsCreateClientModalOpen(true)}
                        size="default"
                        className="shrink-0"
                      >
                        <UserPlus className="w-4 h-4 mr-2" />
                        Nuevo Cliente
                      </Button>
                    </div>

                    {searchClient && filteredClients.length > 0 && (
                      <Card className="max-h-40 overflow-y-auto">
                        <div className="divide-y">
                          {filteredClients.slice(0, 5).map((client) => (
                            <button
                              key={client.id || client.idCliente}
                              onClick={() => handleClientSelect((client.id || client.idCliente).toString())}
                              className="w-full text-left p-3 hover:bg-muted transition-colors"
                            >
                              <p className="font-medium">
                                {client.nombre ? `${client.nombre} ${client.apellido}` : client.razonSocial}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {client.dni || client.cuit}
                              </p>
                            </button>
                          ))}
                        </div>
                      </Card>
                    )}
                  </div>

                  {/* Info del cliente seleccionado */}
                  <div>
                    {!selectedClient ? (
                      <div className="flex items-center justify-center h-full text-center border rounded-lg bg-card p-4">
                        <div>
                          <User className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                          <p className="text-sm text-muted-foreground">
                            No hay cliente seleccionado
                          </p>
                        </div>
                      </div>
                    ) : (
                      <Card className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 space-y-2">
                            <div>
                              <p className="font-semibold text-lg">
                                {selectedClient.nombre
                                  ? `${selectedClient.nombre} ${selectedClient.apellido}`
                                  : selectedClient.razonSocial}
                              </p>
                              <p className="text-sm text-muted-foreground font-mono">
                                {selectedClient.dni || selectedClient.cuit}
                              </p>
                            </div>

                            {selectedClient.tipoPago === "Cuenta Corriente" && (
                              <div className="flex gap-4 text-sm">
                                <div>
                                  <span className="text-muted-foreground">Saldo: </span>
                                  <span className="font-bold text-orange-600">
                                    {formatCurrency(selectedClient.saldoActual || 0)}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Límite: </span>
                                  <span className="font-medium">
                                    {formatCurrency(selectedClient.limiteCredito || 0)}
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedClient(null)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </Card>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* FILA 2: PRODUCTOS Y CARRITO (Dos columnas) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 h-full overflow-hidden min-h-0">
              {/* COLUMNA 1: PRODUCTOS */}
              <div className="border-r flex flex-col h-full min-h-0">
                <div className="p-4 border-b bg-muted/30 space-y-3">
                  <h3 className="text-sm font-semibold">Productos</h3>

                  {/* Buscador */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                    <Input
                      type="text"
                      placeholder="Buscar por nombre, marca, categoría..."
                      value={searchProduct}
                      onChange={(e) => setSearchProduct(e.target.value)}
                      className="pl-10"
                      autoComplete="off"
                    />
                  </div>

                  {/* Filtros de disponibilidad */}
                  <RadioGroup
                    value={availabilityFilter}
                    onValueChange={setAvailabilityFilter}
                    className="flex gap-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="todos" id="todos" />
                      <Label htmlFor="todos" className="text-sm cursor-pointer">
                        Disponibles (stock o venta sin stock)
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="con_stock" id="con_stock" />
                      <Label htmlFor="con_stock" className="text-sm cursor-pointer">
                        Solo con stock
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="venta_sin_stock" id="venta_sin_stock" />
                      <Label htmlFor="venta_sin_stock" className="text-sm cursor-pointer">
                        Solo venta sin stock
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="flex-1 min-h-0 overflow-y-auto px-4 py-2">
                  {loadingProducts ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Cargando productos...
                    </div>
                  ) : filteredProducts.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>No se encontraron productos</p>
                      <p className="text-xs mt-1">Intenta cambiar los filtros o la búsqueda</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {filteredProducts.map((product) => {
                        const badge = getProductAvailabilityBadge(product);
                        const buttonInfo = getProductButton(product);
                        const ButtonIcon = buttonInfo.icon;
                        const BadgeIcon = badge.icon;

                        return (
                          <Card
                            key={product.id || product.idProducto}
                            className="p-3 hover:shadow-md transition-shadow"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0 space-y-2">
                                {/* Nombre y marca */}
                                <div>
                                  <h4 className="font-semibold truncate">
                                    {product.nombre}
                                  </h4>
                                  {product.marca && (
                                    <p className="text-sm text-muted-foreground truncate">
                                      {product.marca}
                                    </p>
                                  )}
                                </div>

                                {/* Badges: categoría y disponibilidad */}
                                <div className="flex items-center gap-2 flex-wrap">
                                  <Badge variant="outline" className="text-xs">
                                    {product.categoria}
                                  </Badge>
                                  <Badge
                                    variant="outline"
                                    className={`text-xs flex items-center gap-1 ${badge.className}`}
                                  >
                                    {BadgeIcon && <BadgeIcon className="w-3 h-3" />}
                                    {badge.text}
                                  </Badge>
                                </div>

                                {/* Precio */}
                                <p className="text-lg font-bold text-primary">
                                  {formatCurrency(
                                    product.precio || product.price || 0
                                  )}
                                </p>
                              </div>

                              {/* Botón dinámico */}
                              <Button
                                onClick={() => handleAddProduct(product)}
                                variant={buttonInfo.variant}
                                size="sm"
                                disabled={buttonInfo.disabled}
                                className="shrink-0"
                              >
                                <ButtonIcon className="w-4 h-4 mr-1" />
                                {buttonInfo.text}
                              </Button>
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* COLUMNA 2: CARRITO */}
              <div className="flex flex-col h-full">
                <div className="p-4 border-b bg-muted/30">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold">Carrito</h3>
                    <Badge variant="outline">
                      {totalItems}{" "}
                      {totalItems === 1 ? "producto" : "productos"}
                    </Badge>
                  </div>
                </div>

                <div
                  className={`px-4 py-2 flex-1 min-h-0 ${items.length > 0 ? 'overflow-y-auto' : 'flex items-center justify-center'}`}
                >
                  {items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center text-center">
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
                </div>

                <div className="p-4 border-t space-y-4 bg-muted/30">
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
                        {selectedClient?.tieneCuentaCorriente && (
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

      {/* Modal secundario para crear cliente */}
      <Dialog open={isCreateClientModalOpen} onOpenChange={setIsCreateClientModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nuevo Cliente</DialogTitle>
          </DialogHeader>
          <ClientForm
            initialData={null}
            onSubmit={handleCreateClient}
            onCancel={() => setIsCreateClientModalOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
