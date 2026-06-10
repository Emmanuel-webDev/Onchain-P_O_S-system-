import { useState, useRef, useEffect, useCallback } from "react";
import { useAccount, useDisconnect, useConnectors } from "wagmi";
import { createPublicClient, http } from "viem";
import { baseSepolia } from "viem/chains";

import BasketScreen from "./screens/basketScreen";
import InvoiceScreen from "./screens/invoiceScreen";
import SuccessScreen from "./screens/successScreen";
import HistoryScreen from "./screens/historyScreen";
import BottomNav from "./components/bottomNav";
import Toast from "./components/toast";

export const EXPLORER_URL = "https://sepolia.basescan.org";

export const USDC_ADDRESS = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";

export const USDC_DECIMALS = 6;

export const POS_CONTRACT_ADDRESS = import.meta.env.VITE_POS_CONTRACT_ADDRESS;
 
export const DEPLOY_BLOCK = import.meta.env.VITE_DEPLOY_BLOCK;

export const MAX_UINT256 = BigInt(
  "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
);

export const PURCHASE_COMPLETED_EVENT = {
  type: "event",

  name: "PurchaseCompleted",

  inputs: [
    {
      type: "address",
      name: "merchant",
      indexed: true,
    },

    {
      type: "address",
      name: "customer",
      indexed: true,
    },

    {
      type: "uint256",
      name: "totalAmount",
      indexed: false,
    },

    {
      type: "string[]",
      name: "items",
      indexed: false,
    },

    {
      type: "uint256[]",
      name: "prices",
      indexed: false,
    },

    {
      type: "uint256",
      name: "timestamp",
      indexed: false,
    },

    {
      type: "bool",
      name: "isUSDC",
      indexed: false,
    },
  ],
};

export const publicClient = createPublicClient({
  chain: baseSepolia,

  transport: http("https://sepolia.base.org"),
});

export default function App() {
  const [screen, setScreen] = useState("basket");

  const [basket, setBasket] = useState([]);

  const [salesHistory, setSalesHistory] = useState([]);

  const [lastSale, setLastSale] = useState(null);

  const [toast, setToast] = useState(null);

  const [checkoutPhase, setCheckoutPhase] = useState("connect");

  const [waitingText, setWaitingText] = useState("Waiting for customer…");

  const [merchantAddress, setMerchantAddress] = useState(null);

  const [customerAddress, setCustomerAddress] = useState(null);

  const [historySyncing, setHistorySyncing] = useState(false);

  const customerAddressRef = useRef(null);

  const checkoutInProgressRef = useRef(false);

  const historyStartedRef = useRef(false);

  const historyPollingRef = useRef(null);

  const latestFetchedBlockRef = useRef(null);

  const fetchingHistoryRef = useRef(false);

  const { address, isConnected, connector } = useAccount();

  const { disconnect } = useDisconnect();

  const connectors = useConnectors();

  /* -------------------------------------------------------------------------- */
  /*                           HARD DISCONNECT                                   */
  /* -------------------------------------------------------------------------- */

  const hardDisconnect = useCallback(async () => {
    try {
      for (const c of connectors) {
        try {
          await c.disconnect();
        } catch (_) {}
      }

      if (connector) {
        try {
          await connector.disconnect();
        } catch (_) {}
      }
    } catch (_) {}

    disconnect();
  }, [connector, connectors, disconnect]);

  /* -------------------------------------------------------------------------- */
  /*                         FETCH HISTORY GLOBALLY                              */
  /* -------------------------------------------------------------------------- */

  const CHUNK_SIZE = 1800n;
  const PARALLEL = 5;

  const fetchMerchantHistory = useCallback(async (merchant) => {
    if (!merchant) return;
    if (fetchingHistoryRef.current) return;

    fetchingHistoryRef.current = true;
    setHistorySyncing(true); // ← this now works because it's state not a ref

    try {
      const latestBlock = await publicClient.getBlockNumber();

      const fromBlock =
        latestFetchedBlockRef.current === null
          ? DEPLOY_BLOCK
          : latestFetchedBlockRef.current + 1n;

      // Nothing new since last fetch
      if (fromBlock > latestBlock) return;

      // ── Build all chunk ranges up front ────────────────────────────────────
      const ranges = [];
      let from = fromBlock;
      while (from <= latestBlock) {
        const to =
          from + CHUNK_SIZE - 1n > latestBlock
            ? latestBlock
            : from + CHUNK_SIZE - 1n;
        ranges.push({ from, to });
        from = to + 1n;
      }

      // ── Fetch PARALLEL chunks at a time instead of one-by-one ──────────────
      let allLogs = [];
      for (let i = 0; i < ranges.length; i += PARALLEL) {
        const batch = ranges.slice(i, i + PARALLEL);
        const results = await Promise.all(
          batch.map(({ from, to }) =>
            publicClient.getContractEvents({
              address: POS_CONTRACT_ADDRESS,
              abi: [PURCHASE_COMPLETED_EVENT],
              eventName: "PurchaseCompleted",
              args: { merchant },
              fromBlock: from,
              toBlock: to,
            }),
          ),
        );
        results.forEach((logs) => allLogs.push(...logs));
      }

      // Mark how far we've fetched so next poll only scans new blocks
      latestFetchedBlockRef.current = latestBlock;

      if (!allLogs.length) return;

      // ── Format ──────────────────────────────────────────────────────────────
      const formattedSales = allLogs.map((log) => {
        const timestamp = Number(log.args.timestamp || 0) * 1000;
        const prices = log.args.prices || [];
        const items = log.args.items || [];
        return {
          id: log.transactionHash,
          txHash: log.transactionHash,
          blockNumber: Number(log.blockNumber),
          buyer: log.args.customer,
          merchant: log.args.merchant,
          amount: Number(log.args.totalAmount) / 10 ** USDC_DECIMALS,
          timestamp,
          date: new Date(timestamp),
          items: items.map((name, i) => ({
            name,
            price: Number(prices[i] || 0n) / 10 ** USDC_DECIMALS,
          })),
        };
      });

      // ── Merge + dedupe ───────────────────────────────────────────────────────
      setSalesHistory((prev) => {
        const merged = [...formattedSales, ...prev];
        const unique = merged.filter(
          (sale, index, self) =>
            index === self.findIndex((s) => s.txHash === sale.txHash),
        );
        return unique.sort((a, b) => b.timestamp - a.timestamp);
      });
    } catch (err) {
      console.error("History fetch failed:", err);
    } finally {
      fetchingHistoryRef.current = false;
      setHistorySyncing(false);
    }
  }, []);
 

  /* -------------------------------------------------------------------------- */
  /*                        ROUTE WAGMI CONNECTIONS                              */
  /* -------------------------------------------------------------------------- */

  useEffect(() => {
    if (checkoutInProgressRef.current) {
      if (isConnected && address) {
        customerAddressRef.current = address;

        setCustomerAddress(address);
      } else {
        customerAddressRef.current = null;

        setCustomerAddress(null);
      }
    } else {
      if (isConnected && address) {
        setMerchantAddress(address);

        /* ------------------------------------------------------------------ */
        /* START GLOBAL HISTORY FETCH IMMEDIATELY                              */
        /* ------------------------------------------------------------------ */

        if (!historyStartedRef.current) {
          historyStartedRef.current = true;

          fetchMerchantHistory(address);

          historyPollingRef.current = setInterval(() => {
            fetchMerchantHistory(address);
          }, 15000);
        }
      }
    }
  }, [address, isConnected, fetchMerchantHistory]);

  /* -------------------------------------------------------------------------- */
  /*                         CLEANUP POLLING                                     */
  /* -------------------------------------------------------------------------- */

  useEffect(() => {
    return () => {
      if (historyPollingRef.current) {
        clearInterval(historyPollingRef.current);
      }
    };
  }, []);

  /* -------------------------------------------------------------------------- */
  /*                                TOAST                                        */
  /* -------------------------------------------------------------------------- */

  const showToast = useCallback((message, type = "info") => {
    setToast({
      message,

      type,

      id: Date.now(),
    });
  }, []);

  /* -------------------------------------------------------------------------- */
  /*                         START CHECKOUT                                      */
  /* -------------------------------------------------------------------------- */

  const startCheckoutMode = useCallback(async () => {
    checkoutInProgressRef.current = true;

    customerAddressRef.current = null;

    setCustomerAddress(null);

    await hardDisconnect();
  }, [hardDisconnect]);

  /* -------------------------------------------------------------------------- */
  /*                       RESET WALLET SESSION                                  */
  /* -------------------------------------------------------------------------- */

  const hardResetWalletConnection = async () => {
    try {
      await disconnect?.({
        clearState: true,
      });

      localStorage.removeItem("wagmi.store");

      Object.keys(localStorage).forEach((key) => {
        if (key.toLowerCase().includes("walletconnect")) {
          localStorage.removeItem(key);
        }
      });

      Object.keys(sessionStorage).forEach((key) => {
        if (key.toLowerCase().includes("walletconnect")) {
          sessionStorage.removeItem(key);
        }
      });
    } catch (err) {
      console.error(err);
    }
  };

  /* -------------------------------------------------------------------------- */
  /*                            ADD SALE                                         */
  /* -------------------------------------------------------------------------- */

  const addSaleToHistory = useCallback((sale) => {
    setSalesHistory((prev) => {
      if (prev.find((s) => s.id === sale.id)) {
        return prev;
      }

      return [sale, ...prev];
    });
  }, []);

  return (
    <div className="app-shell">
      {/* ------------------------------------------------------------------ */}
      {/* BASKET                                                             */}
      {/* ------------------------------------------------------------------ */}

      <div
        className={`screen ${screen === "basket" ? "active" : ""}`}
        id="screen-basket"
      >
        <BasketScreen
          basket={basket}
          setBasket={setBasket}
          merchantAddress={merchantAddress}
          showToast={showToast}
          onCheckout={() => setScreen("invoice")}
          startCheckoutMode={startCheckoutMode}
        />
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* INVOICE                                                            */}
      {/* ------------------------------------------------------------------ */}

      <div
        className={`screen ${screen === "invoice" ? "active" : ""}`}
        id="screen-invoice"
      >
        <InvoiceScreen
          basket={basket}
          setBasket={setBasket}
          merchantAddress={merchantAddress}
          customerAddress={customerAddress}
          customerAddressRef={customerAddressRef}
          checkoutPhase={checkoutPhase}
          setCheckoutPhase={setCheckoutPhase}
          waitingText={waitingText}
          setWaitingText={setWaitingText}
          showToast={showToast}
          startCheckoutMode={startCheckoutMode}
          hardResetWalletConnection={hardResetWalletConnection}
          disconnect={hardDisconnect}
          onSuccess={(sale) => {
            setLastSale(sale);

            addSaleToHistory(sale);

            setBasket([]);

            setScreen("success");

            /* -------------------------------------------------------------- */
            /* REFRESH HISTORY IMMEDIATELY AFTER PAYMENT                      */
            /* -------------------------------------------------------------- */

            if (merchantAddress) {
              fetchMerchantHistory(merchantAddress);
            }
          }}
          onBack={() => {
            hardResetWalletConnection();

            setScreen("basket");
          }}
        />
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* SUCCESS                                                            */}
      {/* ------------------------------------------------------------------ */}

      <div
        className={`screen ${screen === "success" ? "active" : ""}`}
        id="screen-success"
      >
        <SuccessScreen sale={lastSale} onNewSale={() => setScreen("basket")} />
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* HISTORY                                                            */}
      {/* ------------------------------------------------------------------ */}

      <div
        className={`screen ${screen === "history" ? "active" : ""}`}
        id="screen-history"
      >
        <HistoryScreen
          merchantAddress={merchantAddress}
          salesHistory={salesHistory}
          setSalesHistory={setSalesHistory}
          showToast={showToast}
          historySyncing={historySyncing} // ← use the state variable
        />
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* NAV                                                                */}
      {/* ------------------------------------------------------------------ */}

      {screen !== "success" && (
        <BottomNav activeTab={screen} onTab={setScreen} />
      )}

      {/* ------------------------------------------------------------------ */}
      {/* TOAST                                                              */}
      {/* ------------------------------------------------------------------ */}

      {toast && (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onDone={() => setToast(null)}
        />
      )}
    </div>
  );
}
