import { createContext, useContext, useState, useCallback } from "react";

const CartContext = createContext();

/**
 * Provider del contexto del carrito de compras
 * Maneja todos los items del carrito y cálculos asociados
 */
export function CartProvider({ children }) {
  const [items, setItems] = useState([]);

  /**
   * Agrega un producto al carrito
   * Si el producto ya existe, incrementa la cantidad
   * @param {Object} product - Producto a agregar
   * @param {number} quantity - Cantidad a agregar (default: 1)
   */
  const addItem = useCallback((product, quantity = 1) => {
    setItems((prevItems) => {
      const existingItem = prevItems.find(
        (item) => item.id === product.id || item.idProducto === product.idProducto
      );

      if (existingItem) {
        // Si ya existe, incrementar cantidad
        return prevItems.map((item) =>
          (item.id === product.id || item.idProducto === product.idProducto)
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }

      // Si no existe, agregarlo
      return [
        ...prevItems,
        {
          ...product,
          id: product.id ?? product.idProducto,
          quantity,
        },
      ];
    });
  }, []);

  /**
   * Elimina un producto del carrito
   * @param {number} productId - ID del producto a eliminar
   */
  const removeItem = useCallback((productId) => {
    setItems((prevItems) =>
      prevItems.filter(
        (item) => item.id !== productId && item.idProducto !== productId
      )
    );
  }, []);

  /**
   * Actualiza la cantidad de un producto en el carrito
   * @param {number} productId - ID del producto
   * @param {number} newQuantity - Nueva cantidad
   */
  const updateQuantity = useCallback((productId, newQuantity) => {
    if (newQuantity <= 0) {
      // Si la cantidad es 0 o negativa, eliminar el item
      removeItem(productId);
      return;
    }

    setItems((prevItems) =>
      prevItems.map((item) =>
        (item.id === productId || item.idProducto === productId)
          ? { ...item, quantity: newQuantity }
          : item
      )
    );
  }, [removeItem]);

  /**
   * Incrementa la cantidad de un producto
   * @param {number} productId - ID del producto
   */
  const incrementQuantity = useCallback((productId) => {
    setItems((prevItems) =>
      prevItems.map((item) =>
        (item.id === productId || item.idProducto === productId)
          ? { ...item, quantity: item.quantity + 1 }
          : item
      )
    );
  }, []);

  /**
   * Decrementa la cantidad de un producto
   * Si llega a 0, elimina el item
   * @param {number} productId - ID del producto
   */
  const decrementQuantity = useCallback((productId) => {
    setItems((prevItems) => {
      const item = prevItems.find(
        (i) => i.id === productId || i.idProducto === productId
      );

      if (!item) return prevItems;

      if (item.quantity <= 1) {
        // Si es 1 o menos, eliminar
        return prevItems.filter(
          (i) => i.id !== productId && i.idProducto !== productId
        );
      }

      // Decrementar
      return prevItems.map((i) =>
        (i.id === productId || i.idProducto === productId)
          ? { ...i, quantity: i.quantity - 1 }
          : i
      );
    });
  }, []);

  /**
   * Limpia todo el carrito
   */
  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  /**
   * Obtiene la cantidad total de items en el carrito
   */
  const getTotalItems = useCallback(() => {
    return items.reduce((total, item) => total + item.quantity, 0);
  }, [items]);

  /**
   * Calcula el total del carrito
   */
  const getTotal = useCallback(() => {
    return items.reduce((total, item) => {
      const price = item.precio ?? item.price ?? 0;
      return total + price * item.quantity;
    }, 0);
  }, [items]);

  /**
   * Obtiene un item específico del carrito
   * @param {number} productId - ID del producto
   */
  const getItem = useCallback((productId) => {
    return items.find(
      (item) => item.id === productId || item.idProducto === productId
    );
  }, [items]);

  /**
   * Verifica si un producto está en el carrito
   * @param {number} productId - ID del producto
   */
  const isInCart = useCallback((productId) => {
    return items.some(
      (item) => item.id === productId || item.idProducto === productId
    );
  }, [items]);

  const value = {
    items,
    addItem,
    removeItem,
    updateQuantity,
    incrementQuantity,
    decrementQuantity,
    clearCart,
    getTotalItems,
    getTotal,
    getItem,
    isInCart,
    itemCount: items.length,
    total: getTotal(),
    totalItems: getTotalItems(),
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

/**
 * Hook para usar el contexto del carrito
 * @returns {Object} Contexto del carrito con todas sus funciones
 */
export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart debe ser usado dentro de un CartProvider");
  }

  return context;
}
