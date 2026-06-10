import { useEffect, useRef } from "react";
import { EXPLORER_URL } from "../app";

export default function SuccessScreen({ sale, onNewSale }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (sale) spawnConfetti(containerRef.current);
  }, [sale]);

  if (!sale) return null;

  const shortHash =
    sale.txHash && sale.txHash !== "—"
      ? sale.txHash.slice(0, 10) + "…" + sale.txHash.slice(-6)
      : "—";

  const shortFrom =
    sale.buyer && sale.buyer !== "—"
      ? sale.buyer.slice(0, 6) + "…" + sale.buyer.slice(-4)
      : "—";

  const itemNames = sale.items?.map((i) => i.name).join(", ") || "";
  const isDemo = sale.txHash?.startsWith("0xdemo");

  return (
    <div className="screen__body success-body">
      <div ref={containerRef} className="confetti-container" />

      <div className="success-check">
        <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>

      <div className="success-text fade-up">
        <h1 className="success-text__title">Payment Received</h1>
        <div className="success-text__amount">
          <USDCIcon />
          <span className="success-text__num">{sale.amount.toFixed(2)}</span>
          <span className="success-text__unit">USDC</span>
        </div>
        <div className="success-text__items">{itemNames}</div>
      </div>

      <div className="eas-card glass-card fade-up-2">
        <div className="eas-card__header">
          <span className="eas-card__label">Onchain Attestation</span>
          <span className="badge-verified">✓ Verified</span>
        </div>
        <div className="eas-card__rows">
          <div className="eas-row">
            <span>Network</span>
            <span>Base Sepolia</span>
          </div>
          <div className="eas-row">
            <span>Tx Hash</span>
            <span className="mono">{shortHash}</span>
          </div>
          <div className="eas-row">
            <span>Block</span>
            <span className="mono">{sale.block}</span>
          </div>
          <div className="eas-row">
            <span>From</span>
            <span className="mono">{shortFrom}</span>
          </div>
        </div>
      </div>

      <div className="success-actions fade-up-3">
        {!isDemo && (
          <button
            className="btn-secondary"
            onClick={() => window.open(`${EXPLORER_URL}/tx/${sale.txHash}`, "_blank")}
          >
            View on Basescan ↗
          </button>
        )}
        <button className="btn-primary" onClick={onNewSale}>
          New Sale
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

function USDCIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="16" fill="#2775CA" />
      <path d="M20.5 18.3c0-2.1-1.3-2.8-3.8-3.1-1.8-.2-2.2-.7-2.2-1.5s.6-1.3 1.8-1.3c1.1 0 1.7.4 2 1.3.1.2.2.3.4.3h.9c.3 0 .5-.2.5-.5v-.1c-.3-1.4-1.4-2.4-2.8-2.6V9.5c0-.3-.2-.5-.5-.6H16c-.3 0-.5.2-.5.6v1.3c-1.7.2-2.8 1.3-2.8 2.8 0 2 1.2 2.7 3.7 3 1.7.3 2.3.7 2.3 1.6s-.8 1.5-1.9 1.5c-1.5 0-2-.6-2.3-1.5-.1-.2-.2-.3-.4-.3h-.9c-.3 0-.5.2-.5.5v.1c.3 1.5 1.3 2.5 3 2.8v1.3c0 .3.2.5.5.6h.9c.3 0 .5-.2.5-.6v-1.3c1.8-.3 3-.1 3.4-2.8z" fill="white" />
    </svg>
  );
}

function spawnConfetti(container) {
  if (!container) return;
  container.innerHTML = "";
  const colors = ["#0052FF", "#7B61FF", "#00C853", "#FFD700", "#FF6B6B", "#2775CA"];
  for (let i = 0; i < 55; i++) {
    const piece = document.createElement("div");
    piece.className = "confetti-piece";
    piece.style.cssText = `
      left: ${Math.random() * 100}%;
      width: ${Math.random() * 8 + 5}px;
      height: ${Math.random() * 8 + 5}px;
      background: ${colors[Math.floor(Math.random() * colors.length)]};
      animation-delay: ${Math.random() * 0.6}s;
      animation-duration: ${Math.random() * 0.8 + 1.4}s;
      border-radius: ${Math.random() > 0.5 ? "50%" : "2px"};
    `;
    container.appendChild(piece);
  }
  setTimeout(() => { container.innerHTML = ""; }, 3000);
}