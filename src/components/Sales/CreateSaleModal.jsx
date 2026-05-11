import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
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
  Download,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useUnidadesMedida } from "@/contexts/UnidadesMedidaContext";
import { createSale, fetchAvailableProducts, fetchAllClients, exportarVentaPdf, downloadPendingSalePdf } from "@/services/SaleQueries";
import { createCliente } from "@/services/ClienteQueries";
import { getCurrentAccountSummary } from "@/services/CurrentAccountQueries";
import ClientForm from "@/components/Clientes/ClientForm";
import { toast } from "sonner";

export default function CreateSaleModal({ open, onOpenChange, onSaleCreated }) {
  const {
    items,
    addItem,
    updateQuantity,
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
  const [categoriaFiltro, setCategoriaFiltro] = useState("todas");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [loadingCCBalance, setLoadingCCBalance] = useState(false);
  // Datos reales de la CC del cliente seleccionado (cargados desde movements)
  const [ccData, setCCData] = useState({ saldoActual: 0, limiteCredito: 0, creditoDisponible: 0 });

  // Modal secundario para crear cliente
  const [isCreateClientModalOpen, setIsCreateClientModalOpen] = useState(false);

  // Modal de éxito y descarga
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdSale, setCreatedSale] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const { getAbreviatura, esDecimal, formatCantidad } = useUnidadesMedida();

  useEffect(() => {
    if (open) {
      loadProducts();
      loadClients();
      setSelectedClient(null);
      setPaymentMethod("");
      setCCData({ saldoActual: 0, limiteCredito: 0, creditoDisponible: 0 });
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

    // Filtro por categoría
    if (categoriaFiltro !== "todas") {
      filtered = filtered.filter((p) => p.categoria === categoriaFiltro);
    }

    // Filtro por búsqueda de texto
    if (searchProduct.trim() !== "") {
      const search = searchProduct.toLowerCase();
      filtered = filtered.filter((p) => {
        const matchesText =
          p.nombre?.toLowerCase().includes(search) ||
          p.marca?.toLowerCase().includes(search) ||
          p.categoria?.toLowerCase().includes(search);

        const matchesBarcode = p.codigoBarras?.some(
          (cb) => cb.codigo?.toLowerCase().includes(search)
        );

        return matchesText || matchesBarcode;
      });
    }

    setFilteredProducts(filtered);
  }, [searchProduct, availabilityFilter, categoriaFiltro, products]);

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
    try {
      const data = await fetchAllClients();
      setClients(data);
    } catch (error) {
      console.error("Error al cargar clientes:", error);
      toast.error("Error al cargar clientes");
    }
  };

  const loadCCData = async (clientId) => {
    try {
      setLoadingCCBalance(true);
      const summary = await getCurrentAccountSummary(clientId);
      const saldoActual = summary?.latest?.saldoActual ?? 0;
      const limiteCuenta = summary?.latest?.limiteCuenta ?? summary?.opening?.limiteCuenta ?? 0;
      setCCData({
        saldoActual,
        limiteCredito: limiteCuenta,
        creditoDisponible: limiteCuenta + Math.max(0, -saldoActual),
      });
    } catch (error) {
      console.error("Error al cargar datos de cuenta corriente:", error);
      setCCData({ saldoActual: 0, limiteCredito: 0, creditoDisponible: 0 });
    } finally {
      setLoadingCCBalance(false);
    }
  };

  const handleClientSelect = (clientId) => {
    const client = clients.find(c => (c.id || c.idCliente).toString() === clientId);
    setSelectedClient(client);
    setSearchClient("");
    setCCData({ saldoActual: 0, limiteCredito: 0, creditoDisponible: 0 });
    if (client?.tieneCuentaCorriente) {
      loadCCData(client.id || client.idCliente);
    }
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
        text: `Stock: ${formatCantidad(stock, product.idUnidadMedida)}`,
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
    // Usar los valores reales cargados desde los movimientos de CC
    const clientLimit = ccData.limiteCredito;
    const currentBalance = ccData.saldoActual;
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
        items: items.map((item) => ({
          IdProducto: item.id || item.idProducto,
          Cantidad: parseFloat(item.quantity),
        })),
      };

      const result = await createSale(saleData);

      // Guardar la venta creada para el modal de éxito
      setCreatedSale(result);

      // Mostrar modal de éxito
      setShowSuccessModal(true);

      // Limpiar el carrito
      clearCart();

      // Notificar al componente padre
      onSaleCreated();
    } catch (error) {
      console.error("Error al crear venta:", error);
      toast.error(error.message || "Error al crear la venta");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!createdSale) return;

    setIsDownloading(true);
    try {
      // Verificar si es una venta normal o pendiente
      if (createdSale.estado === "Pendiente de Autorización" || createdSale.idVentaPendiente) {
        // Usar idVentaPendiente si está disponible, sino id
        const pendingSaleId = createdSale.idVentaPendiente || createdSale.id;
        if (!pendingSaleId) {
          throw new Error("No se pudo obtener el ID de la venta pendiente");
        }
        await downloadPendingSalePdf(
          pendingSaleId,
          createdSale.codigoVenta
        );
      } else {
        await exportarVentaPdf(createdSale.idVenta || createdSale.id);
      }
      toast.success("Comprobante descargado exitosamente");
    } catch (error) {
      toast.error("Error al descargar el comprobante", {
        description: error.message,
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false);
    setCreatedSale(null);
    onOpenChange(false);
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
          <DialogHeader className="px-6 py-0 border-b min-h-[44px] flex justify-center">
            <DialogTitle className="text-2xl font-bold">
              Nueva Venta
            </DialogTitle>
          </DialogHeader>

          {/* LAYOUT: dos columnas fijas */}
          <div className="flex h-[calc(90vh-140px)] overflow-hidden">

            {/* COLUMNA IZQUIERDA: Cliente + Productos */}
            <div className="flex flex-col flex-1 border-r min-h-0 overflow-hidden">

              {/* SECCIÓN CLIENTE */}
              <div className="p-4 border-b bg-muted/30 shrink-0">
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Cliente
                </h3>

                {!selectedClient ? (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
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
                ) : (
                  <Card className="px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-semibold truncate">
                            {selectedClient.nombre
                              ? `${selectedClient.nombre} ${selectedClient.apellido}`
                              : selectedClient.razonSocial}
                          </span>
                          <span className="text-muted-foreground shrink-0">·</span>
                          <span className="text-sm text-muted-foreground font-mono shrink-0">
                            {selectedClient.dni || selectedClient.cuit}
                          </span>
                        </div>

                        {selectedClient.tieneCuentaCorriente && (
                          <div className="flex gap-4 text-sm">
                            {loadingCCBalance ? (
                              <span className="text-muted-foreground text-xs">Cargando datos de CC...</span>
                            ) : (
                              <>
                                <div>
                                  <span className="text-muted-foreground">Crédito disponible: </span>
                                  <span className="font-bold text-green-700">{formatCurrency(ccData.creditoDisponible)}</span>
                                </div>
                                {ccData.saldoActual > 0 && (
                                  <div>
                                    <span className="text-muted-foreground">Deuda actual: </span>
                                    <span className="font-medium text-orange-600">
                                      {formatCurrency(ccData.saldoActual)}
                                    </span>
                                  </div>
                                )}
                                {ccData.saldoActual < 0 && (
                                  <div>
                                    <span className="text-muted-foreground">Saldo a favor: </span>
                                    <span className="font-medium text-blue-600">
                                      {formatCurrency(Math.abs(ccData.saldoActual))}
                                    </span>
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        )}
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => setSelectedClient(null)} className="shrink-0">
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </Card>
                )}
              </div>

              {/* SECCIÓN PRODUCTOS */}
              <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
                <div className="p-3 border-b bg-muted/30 space-y-2 shrink-0">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold">Productos</h3>
                    {!loadingProducts && (
                      <span className="text-xs text-muted-foreground">
                        {filteredProducts.length} resultado{filteredProducts.length !== 1 ? "s" : ""}
                      </span>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                      <Input
                        type="text"
                        placeholder="Nombre, marca, código..."
                        value={searchProduct}
                        onChange={(e) => setSearchProduct(e.target.value)}
                        className="pl-9 h-8 text-sm"
                        autoComplete="off"
                      />
                    </div>
                    <Select value={categoriaFiltro} onValueChange={setCategoriaFiltro}>
                      <SelectTrigger className="w-40 h-8 text-sm shrink-0">
                        <SelectValue placeholder="Categoría" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todas">Todas</SelectItem>
                        {[...new Set(products.map((p) => p.categoria).filter(Boolean))]
                          .sort()
                          .map((cat) => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <RadioGroup
                    value={availabilityFilter}
                    onValueChange={setAvailabilityFilter}
                    className="flex gap-3"
                  >
                    {[
                      { value: "todos",           label: "Disponibles" },
                      { value: "con_stock",        label: "Con stock"   },
                      { value: "venta_sin_stock",  label: "Sin stock"   },
                    ].map(({ value, label }) => (
                      <div key={value} className="flex items-center gap-1.5">
                        <RadioGroupItem value={value} id={value} className="h-3.5 w-3.5" />
                        <Label htmlFor={value} className="text-xs cursor-pointer text-muted-foreground">
                          {label}
                        </Label>
                      </div>
                    ))}
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
                        const productId = product.id || product.idProducto;
                        const cartItem = items.find(i => (i.id || i.idProducto) === productId);
                        const stockEfectivo = Math.max(0, (product.stock ?? 0) - (cartItem?.quantity ?? 0));
                        const productConStockEfectivo = { ...product, stock: stockEfectivo };

                        const badge = getProductAvailabilityBadge(productConStockEfectivo);
                        const buttonInfo = getProductButton(productConStockEfectivo);
                        const ButtonIcon = buttonInfo.icon;
                        const BadgeIcon = badge.icon;

                        return (
                          <Card
                            key={productId}
                            className="px-3 py-2 hover:shadow-md transition-shadow"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              {/* Nombre — absorbe el espacio sobrante */}
                              <h4 className="font-semibold text-sm truncate flex-1 min-w-0">
                                {product.nombre}
                              </h4>

                              {/* Marca */}
                              {product.marca && (
                                <span className="text-xs text-muted-foreground shrink-0 hidden lg:block max-w-[100px] truncate">
                                  {product.marca}
                                </span>
                              )}

                              {/* Categoría */}
                              <Badge variant="outline" className="text-xs shrink-0">
                                {product.categoria}
                              </Badge>

                              {/* Stock */}
                              <Badge
                                variant="outline"
                                className={`text-xs shrink-0 flex items-center gap-1 ${badge.className}`}
                              >
                                {BadgeIcon && <BadgeIcon className="w-3 h-3" />}
                                {badge.text}
                              </Badge>

                              {/* Precio */}
                              <span className="text-sm font-bold text-primary shrink-0 whitespace-nowrap">
                                {formatCurrency(product.precio || product.price || 0)}
                                <span className="text-xs font-normal text-muted-foreground ml-0.5">
                                  /{getAbreviatura(product.idUnidadMedida)}
                                </span>
                              </span>

                              {/* Botón */}
                              <Button
                                onClick={() => handleAddProduct(product)}
                                variant={buttonInfo.variant}
                                size="sm"
                                disabled={buttonInfo.disabled}
                                className="shrink-0 h-7 px-2 text-xs"
                              >
                                <ButtonIcon className="w-3 h-3 mr-1" />
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
            </div>

            {/* COLUMNA DERECHA: Carrito + Pago */}
            <div className="flex flex-col flex-1 min-h-0 overflow-hidden">

              {/* Header carrito */}
              <div className="p-4 border-b bg-muted/30 shrink-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <ShoppingCart className="h-4 w-4" />
                    Carrito
                  </h3>
                  <Badge variant="outline">
                    {totalItems} {totalItems === 1 ? "producto" : "productos"}
                  </Badge>
                </div>
              </div>

              {/* Items del carrito */}
              <div className={`px-4 py-2 flex-1 min-h-0 ${items.length > 0 ? "overflow-y-auto" : "flex items-center justify-center"}`}>
                {items.length === 0 ? (
                  <div className="flex flex-col items-center justify-center text-center">
                    <ShoppingCart className="w-12 h-12 text-muted-foreground mb-3" />
                    <p className="text-sm text-muted-foreground">Carrito vacío</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {items.map((item) => (
                      <Card key={item.id || item.idProducto} className="px-3 py-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <h4 className="font-semibold text-sm truncate flex-1 min-w-0">
                            {item.nombre || item.name}
                          </h4>
                          <span className="text-sm text-muted-foreground shrink-0 whitespace-nowrap">
                            {formatCurrency(item.precio || item.price || 0)}
                            <span className="text-muted-foreground/60 mx-0.5">/</span>
                            <span className={`text-xs font-medium ${esDecimal(item.idUnidadMedida) ? "text-primary" : ""}`}>
                              {getAbreviatura(item.idUnidadMedida)}
                            </span>
                          </span>
                          <Button
                            onClick={() => removeItem(item.id || item.idProducto)}
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 shrink-0"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center gap-1.5">
                            <Button
                              onClick={() => {
                                const step = esDecimal(item.idUnidadMedida) ? 0.1 : 1;
                                const next = parseFloat((item.quantity - step).toFixed(2));
                                updateQuantity(item.id || item.idProducto, next);
                              }}
                              variant="outline"
                              size="icon"
                              className="h-7 w-7"
                            >
                              <Minus className="w-3 h-3" />
                            </Button>
                            <Input
                              type="number"
                              min={esDecimal(item.idUnidadMedida) ? "0.01" : "1"}
                              step={esDecimal(item.idUnidadMedida) ? "0.01" : "1"}
                              value={item.quantity}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value);
                                if (!isNaN(val) && val > 0)
                                  updateQuantity(item.id || item.idProducto, parseFloat(val.toFixed(2)));
                              }}
                              className="w-16 h-7 text-center text-sm px-1 transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                            />
                            <Badge
                              variant="outline"
                              className={`text-xs font-bold shrink-0 ${
                                esDecimal(item.idUnidadMedida)
                                  ? "bg-amber-50 text-amber-700 border-amber-300"
                                  : "bg-muted text-muted-foreground border-border"
                              }`}
                            >
                              {getAbreviatura(item.idUnidadMedida)}
                            </Badge>
                            <Button
                              onClick={() => {
                                const step = esDecimal(item.idUnidadMedida) ? 0.1 : 1;
                                const next = parseFloat((item.quantity + step).toFixed(2));
                                updateQuantity(item.id || item.idProducto, next);
                              }}
                              variant="outline"
                              size="icon"
                              className="h-7 w-7"
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                          </div>
                          <p className="font-bold">
                            {formatCurrency((item.precio || item.price || 0) * parseFloat(item.quantity))}
                          </p>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>

              {/* Forma de pago + Total */}
              <div className="px-4 py-2 border-t space-y-2 bg-muted/30 shrink-0">
                <div className="flex items-center gap-3">
                  <label className="text-xs font-semibold shrink-0">Forma de Pago</label>
                  <Select
                    value={paymentMethod}
                    onValueChange={setPaymentMethod}
                    disabled={loadingCCBalance}
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue
                        placeholder={loadingCCBalance ? "Cargando cuenta corriente..." : "Seleccionar método"}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Efectivo">Efectivo</SelectItem>
                      {selectedClient?.tieneCuentaCorriente && (
                        <SelectItem value="Cuenta Corriente">Cuenta Corriente</SelectItem>
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

                <div className="flex items-center justify-between pt-2 border-t">
                  <span className="text-sm font-semibold">TOTAL</span>
                  <span className="text-2xl font-bold">{formatCurrency(total)}</span>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="px-6 py-0 border-t min-h-[44px] flex items-center">
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
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Procesando...
                </>
              ) : "Finalizar Venta"}
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

      {/* Modal de éxito con descarga */}
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex flex-col items-center text-center space-y-2">
              <div className="rounded-full bg-green-100 p-3">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <DialogTitle className="text-2xl">
                {createdSale?.estado === "Pendiente de Autorización"
                  ? "Venta Pendiente de Autorización"
                  : "¡Venta Exitosa!"}
              </DialogTitle>
              <DialogDescription>
                {createdSale?.estado === "Pendiente de Autorización" ? (
                  <div className="space-y-2">
                    <p>La venta excede el límite de crédito del cliente.</p>
                    <p className="text-sm">Requiere autorización del administrador.</p>
                  </div>
                ) : (
                  "La venta se ha registrado correctamente en el sistema."
                )}
              </DialogDescription>
            </div>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Información de la venta */}
            {createdSale && (
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Código:</span>
                  <span className="font-semibold">{createdSale.codigoVenta}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total:</span>
                  <span className="font-bold text-lg">
                    {formatCurrency(createdSale.total)}
                  </span>
                </div>
                {createdSale.estado && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Estado:</span>
                    <Badge
                      className={
                        createdSale.estado === "Pendiente de Autorización"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-green-100 text-green-800"
                      }
                    >
                      {createdSale.estado}
                    </Badge>
                  </div>
                )}
              </div>
            )}

            {/* Botones de acción */}
            <div className="flex flex-col gap-2">
              <Button
                onClick={handleDownloadPdf}
                disabled={isDownloading}
                className="w-full"
              >
                {isDownloading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Descargando...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Descargar Comprobante PDF
                  </>
                )}
              </Button>
              <Button
                onClick={handleCloseSuccessModal}
                variant="outline"
                className="w-full"
              >
                Cerrar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
