import { createContext, useContext, useState, useCallback } from "react";

// ─── CART CONTEXT ────────────────────────────────────────────────────────────
// Drop this in src/context/CartContext.jsx
// Wrap your <App /> or <RouterProvider /> with <CartProvider>
// Use useCart() hook in any component

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);
  const [wishlist, setWishlist] = useState([]);

  // ── Cart Actions ──────────────────────────────────────────────────
  const addToCart = useCallback((product, qty = 1) => {
    setCartItems((prev) => {
      const existing = prev.find((i) => i.id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.id === product.id
            ? { ...i, qty: Math.min(i.qty + qty, 10) }
            : i
        );
      }
      return [
        ...prev,
        {
          id: product.id,
          name: product.name,
          category: product.category,
          subcat: product.subcat || product.category,
          price: product.price,
          mrp: product.mrp || product.originalPrice || product.price,
          qty,
          inStock: product.inStock !== false,
          image: product.image || (product.images && product.images[0]) || "",
        },
      ];
    });
  }, []);

  const removeFromCart = useCallback((id) => {
    setCartItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const updateQty = useCallback((id, newQty) => {
    if (newQty < 1) return;
    if (newQty > 10) return;
    setCartItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, qty: newQty } : i))
    );
  }, []);

  const clearCart = useCallback(() => setCartItems([]), []);

  const isInCart = useCallback(
    (id) => cartItems.some((i) => i.id === id),
    [cartItems]
  );

  const getQty = useCallback(
    (id) => cartItems.find((i) => i.id === id)?.qty || 0,
    [cartItems]
  );

  // ── Wishlist Actions ──────────────────────────────────────────────
  const toggleWishlist = useCallback((id) => {
    setWishlist((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  }, []);

  const isWishlisted = useCallback(
    (id) => wishlist.includes(id),
    [wishlist]
  );

  // ── Derived Values ────────────────────────────────────────────────
  const cartCount = cartItems.reduce((sum, i) => sum + i.qty, 0);
  const wishlistCount = wishlist.length;
  const subtotal = cartItems.reduce((sum, i) => sum + i.price * i.qty, 0);

  return (
    <CartContext.Provider
      value={{
        // State
        cartItems,
        wishlist,
        // Cart
        addToCart,
        removeFromCart,
        updateQty,
        clearCart,
        isInCart,
        getQty,
        // Wishlist
        toggleWishlist,
        isWishlisted,
        // Derived
        cartCount,
        wishlistCount,
        subtotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
