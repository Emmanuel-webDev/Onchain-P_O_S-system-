import { useState, useRef } from "react";
import { useModal } from "connectkit";
import { useAccount } from "wagmi";
import { getItemIcon, escapeHtml } from "../utils/helpers";

export default function BasketScreen({
  basket,
  setBasket,
  merchantAddress,
  showToast,
  onCheckout,
  startCheckoutMode,
}) {
  const [itemName, setItemName] = useState("");
  const [itemPrice, setItemPrice] = useState("");
  const { setOpen } = useModal();
  const priceRef = useRef(null);

  const isFormValid =
    itemName.trim().length > 0 &&
    !isNaN(parseFloat(itemPrice)) &&
    parseFloat(itemPrice) > 0;

  const getTotal = () =>
    basket.reduce((sum, i) => sum + i.price, 0);

  function addItem() {
    if (!isFormValid) return;
    const price = Math.round(parseFloat(itemPrice) * 100) / 100;
    setBasket((prev) => [
      ...prev,
      {
        id: Date.now() + Math.random(),
        name: itemName.trim(),
        price,
        icon: getItemIcon(itemName.trim()),
      },
    ]);
    setItemName("");
    setItemPrice("");
  }

  function removeItem(id) {
    setBasket((prev) => prev.filter((i) => i.id !== id));
  }

  async function handleCheckout() {
    if (basket.length === 0) return;
    if (!merchantAddress) {
      showToast("Connect merchant wallet first.", "error");
      return;
    }
    startCheckoutMode();
    onCheckout();
  }

  const total = getTotal();

  return (
    <>
      <header className="top-bar">
        <div className="top-bar__left">
          <div className="top-bar__logo">⬡</div>
          <div>
            <div className="top-bar__title">Base_P.OS</div>
            <div className="top-bar__sub">Base Sepolia Testnet</div>
          </div>
        </div>
        <button
          className="wallet-btn"
          onClick={() => setOpen(true)}
        >
          <div className="wallet-avatar" />
          <span className="wallet-label">
            {merchantAddress
              ? merchantAddress.slice(0, 6) + "…" + merchantAddress.slice(-4)
              : "Connect Wallet"}
          </span>
          <div
            className="wallet-dot"
            style={{ background: merchantAddress ? "var(--success)" : "#ccc" }}
          />
        </button>
      </header>

      <div className="screen__body">
        {/* Add form */}
        <div className="add-form glass-card fade-up">
          <div className="add-form__row">
            <input
              className="add-form__name"
              type="text"
              placeholder="Item name"
              autoComplete="off"
              maxLength={60}
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  priceRef.current?.focus();
                }
              }}
            />
            <div className="add-form__price-wrap">
              <span className="add-form__currency">USDC</span>
              <input
                ref={priceRef}
                className="add-form__price"
                type="number"
                inputMode="decimal"
                placeholder="0.00"
                step="0.01"
                min="0.01"
                value={itemPrice}
                onChange={(e) => setItemPrice(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && isFormValid) {
                    e.preventDefault();
                    addItem();
                  }
                }}
              />
            </div>
          </div>
          <button
            className="add-form__btn"
            disabled={!isFormValid}
            onClick={addItem}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add Item
          </button>
        </div>

        {/* Basket label */}
        {basket.length > 0 && (
          <div className="section-label fade-up-1">
            Basket · {basket.length} item{basket.length !== 1 ? "s" : ""}
          </div>
        )}

        {/* Empty state */}
        {basket.length === 0 && (
          <div className="empty-state fade-up-2">
            <div className="empty-state__icon">🛒</div>
            <div className="empty-state__title">Cart is empty</div>
            <div className="empty-state__sub">Add items above to get started</div>
          </div>
        )}

        {/* Basket list */}
        <div className="basket-list">
          {basket.map((item) => (
            <div className="basket-item" key={item.id}>
              <div className="basket-item__icon">{item.icon}</div>
              <div className="basket-item__info">
                <div className="basket-item__name">{item.name}</div>
                <div className="basket-item__meta">USDC · Base Sepolia</div>
              </div>
              <div className="basket-item__price">${item.price.toFixed(2)}</div>
              <button
                className="basket-item__remove"
                aria-label="Remove"
                onClick={() => removeItem(item.id)}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#E53E3E" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          ))}
        </div>

        <div style={{ height: 130 }} />
      </div>

      {/* Checkout footer */}
      {basket.length > 0 && (
        <div className="checkout-footer">
          <div className="checkout-footer__total">
            <span className="checkout-footer__label">Total</span>
            <div className="checkout-footer__amount">
              <USDCIcon />
              <span>{total.toFixed(2)}</span>
              <span className="checkout-footer__unit">USDC</span>
            </div>
          </div>
          <button className="btn-primary" onClick={handleCheckout}>
            Checkout · ${total.toFixed(2)}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}
    </>
  );
}

function USDCIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="16" fill="#2775CA" />
      <path d="M20.5 18.3c0-2.1-1.3-2.8-3.8-3.1-1.8-.2-2.2-.7-2.2-1.5s.6-1.3 1.8-1.3c1.1 0 1.7.4 2 1.3.1.2.2.3.4.3h.9c.3 0 .5-.2.5-.5v-.1c-.3-1.4-1.4-2.4-2.8-2.6V9.5c0-.3-.2-.5-.5-.6H16c-.3 0-.5.2-.5.6v1.3c-1.7.2-2.8 1.3-2.8 2.8 0 2 1.2 2.7 3.7 3 1.7.3 2.3.7 2.3 1.6s-.8 1.5-1.9 1.5c-1.5 0-2-.6-2.3-1.5-.1-.2-.2-.3-.4-.3h-.9c-.3 0-.5.2-.5.5v.1c.3 1.5 1.3 2.5 3 2.8v1.3c0 .3.2.5.5.6h.9c.3 0 .5-.2.5-.6v-1.3c1.8-.3 3-.1 3.4-2.8z" fill="white" />
    </svg>
  );
}