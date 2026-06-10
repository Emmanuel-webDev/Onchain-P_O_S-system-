import { useMemo } from "react";

import { EXPLORER_URL } from "../app";

import { getItemIcon } from "../utils/helpers";

export default function HistoryScreen({
  merchantAddress,
  salesHistory = [],
  historySyncing = false,
}) {
  /* -------------------------------------------------------------------------- */
  /*                                   STATS                                    */
  /* -------------------------------------------------------------------------- */

  const todayStart = new Date();

  todayStart.setHours(0, 0, 0, 0);

  const validSales = salesHistory.filter(
    (sale) => sale?.date && !isNaN(new Date(sale.date).getTime()),
  );

  const todaySales = validSales.filter(
    (s) => new Date(s.date) >= todayStart,
  );

  const todayTotal = todaySales.reduce(
    (sum, s) => sum + (s.amount || 0),
    0,
  );

  const avgOrder =
    todaySales.length > 0
      ? todayTotal / todaySales.length
      : 0;

  const shortMerchant = merchantAddress
    ? merchantAddress.slice(0, 6) +
      "…" +
      merchantAddress.slice(-4)
    : "—";

  /* -------------------------------------------------------------------------- */
  /*                             BETTER LOADING STATE                           */
  /* -------------------------------------------------------------------------- */

  // show loader whenever syncing is active
  // especially during first fetch
  const isInitialLoading =
    merchantAddress &&
    historySyncing &&
    validSales.length === 0;

  const isBackgroundSync =
    historySyncing &&
    validSales.length > 0;

  /* -------------------------------------------------------------------------- */
  /*                           GROUP TRANSACTIONS                               */
  /* -------------------------------------------------------------------------- */

  const groupedEntries = useMemo(() => {
    const groupedSales = validSales.reduce(
      (groups, sale) => {
        const date = new Date(sale.date);

        if (isNaN(date.getTime())) return groups;

        const key = new Date(
          date.getFullYear(),
          date.getMonth(),
          date.getDate(),
        ).toISOString();

        if (!groups[key]) {
          groups[key] = [];
        }

        groups[key].push(sale);

        return groups;
      },
      {},
    );

    return Object.entries(groupedSales).sort(
      ([a], [b]) => new Date(b) - new Date(a),
    );
  }, [validSales]);

  return (
    <>
      <header className="top-bar">
        <div className="top-bar__left">
          <div className="top-bar__logo">⬡</div>

          <div>
            <div className="top-bar__title">
              Sales History
            </div>

            <div className="top-bar__sub">
              {historySyncing
                ? "Syncing latest transactions..."
                : "All verified transactions"}
            </div>
          </div>
        </div>

        <div
          className="wallet-btn"
          style={{ pointerEvents: "none" }}
        >
          <div className="wallet-avatar" />

          <span>{shortMerchant}</span>

          <div
            className="wallet-dot"
            style={{
              background: merchantAddress
                ? "var(--success)"
                : "#ccc",
            }}
          />
        </div>
      </header>

      <div className="screen__body">
        {/* SUMMARY */}

        <div className="summary-card fade-up">
          <div className="summary-card__label">
            Today's Revenue
          </div>

          <div className="summary-card__amount">
            <span className="summary-card__num">
              ${todayTotal.toFixed(2)}
            </span>

            <span className="summary-card__unit">
              USDC
            </span>
          </div>

          <div className="summary-card__stats">
            <div className="summary-stat">
              <div className="summary-stat__label">
                Transactions
              </div>

              <div className="summary-stat__value">
                {todaySales.length}
              </div>
            </div>

            <div className="summary-stat">
              <div className="summary-stat__label">
                Avg. Order
              </div>

              <div className="summary-stat__value">
                ${avgOrder.toFixed(2)}
              </div>
            </div>
          </div>
        </div>

        {/* INITIAL LOADING */}

        {isInitialLoading && (
          <div className="history-loading fade-up">
            <div className="history-loading__spinner" />

            <div className="history-loading__text">
              Fetching onchain transactions...
            </div>
          </div>
        )}

        {/* BACKGROUND SYNC INDICATOR */}

        {isBackgroundSync && (
          <div className="history-fetching fade-up">
            <div className="history-fetching__spinner" />

            <div className="history-fetching__content">
              <div className="history-fetching__title">
                Syncing latest payments...
              </div>

              <div className="history-fetching__sub">
                Reading onchain events from Base
                Sepolia
              </div>
            </div>
          </div>
        )}

        {/* EMPTY */}

        {!merchantAddress && (
          <div className="empty-state">
            <div className="empty-state__icon">
              🔗
            </div>

            <div className="empty-state__title">
              Wallet not connected
            </div>

            <div className="empty-state__sub">
              Connect merchant wallet
            </div>
          </div>
        )}

        {!isInitialLoading &&
          merchantAddress &&
          validSales.length === 0 && (
            <div className="empty-state">
              <div className="empty-state__icon">
                📭
              </div>

              <div className="empty-state__title">
                No sales yet
              </div>

              <div className="empty-state__sub">
                Transactions will appear here
              </div>
            </div>
          )}

        {/* HISTORY */}

        {validSales.length > 0 && (
          <div className="history-list">
            {groupedEntries.map(
              ([dayKey, sales]) => {
                const sectionDate = new Date(dayKey);

                const today = new Date();

                const yesterday = new Date();

                yesterday.setDate(
                  yesterday.getDate() - 1,
                );

                const isToday =
                  sectionDate.toDateString() ===
                  today.toDateString();

                const isYesterday =
                  sectionDate.toDateString() ===
                  yesterday.toDateString();

                const sectionTitle = isToday
                  ? "Today"
                  : isYesterday
                    ? "Yesterday"
                    : sectionDate.toLocaleDateString(
                        [],
                        {
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        },
                      );

                const dailyTotal = sales.reduce(
                  (sum, sale) =>
                    sum + sale.amount,
                  0,
                );

                return (
                  <div
                    key={dayKey}
                    className="history-section"
                  >
                    <div className="history-section__header">
                      <div className="history-section__title">
                        {sectionTitle}
                      </div>

                      <div className="history-section__total">
                        $
                        {dailyTotal.toFixed(2)}{" "}
                        USDC
                      </div>
                    </div>

                    {sales.map((sale, idx) => {
                      const date = new Date(
                        sale.date,
                      );

                      const timeStr =
                        date.toLocaleTimeString(
                          [],
                          {
                            hour: "2-digit",
                            minute: "2-digit",
                          },
                        );

                      const itemNames =
                        sale.items
                          ?.map((i) => i.name)
                          .join(", ") || "Sale";

                      const icon = sale.items?.[0]
                        ? getItemIcon(
                            sale.items[0].name,
                          )
                        : "🛍️";

                      const shortHash =
                        sale.txHash
                          ? sale.txHash.slice(
                              0,
                              10,
                            ) +
                            "…" +
                            sale.txHash.slice(-6)
                          : "—";

                      return (
                        <div
                          key={sale.id}
                          className="history-row"
                          style={{
                            animationDelay: `${idx * 0.04}s`,
                          }}
                          onClick={() => {
                            window.open(
                              `${EXPLORER_URL}/tx/${sale.txHash}`,
                              "_blank",
                            );
                          }}
                        >
                          <div className="history-row__icon">
                            {icon}
                          </div>

                          <div className="history-row__info">
                            <div className="history-row__items">
                              {itemNames}
                            </div>

                            <div className="history-row__time">
                              {timeStr}
                            </div>

                            <div className="history-row__hash">
                              {shortHash}
                            </div>
                          </div>

                          <div className="history-row__right">
                            <div className="history-row__amount">
                              $
                              {sale.amount.toFixed(
                                2,
                              )}
                            </div>

                            <div className="badge-verified">
                              ✓ Base
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              },
            )}
          </div>
        )}

        <div style={{ height: 20 }} />
      </div>
    </>
  );
}