import React from "react";
import ReactDOM from "react-dom/client";
import { WagmiProvider, createConfig, http } from "wagmi";
import { baseSepolia } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConnectKitProvider, getDefaultConfig } from "connectkit";
import App from "./app";
import "./index.css";

// ── Config via getDefaultConfig — exactly as per ConnectKit docs ──────────────
const config = createConfig(
  getDefaultConfig({
    chains: [baseSepolia],

    ssr: false,

    transports: {
      [baseSepolia.id]: http("https://sepolia.base.org"),
    },

    walletConnectProjectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID,

    appName: "Base POS",
    appDescription: "Onchain Point of Sale on Base",

    appUrl: typeof window !== "undefined" ? window.location.origin : "",

    appIcon:
      typeof window !== "undefined"
        ? `${window.location.origin}/favicon.ico`
        : "",
  }),
);
const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <WagmiProvider config={config} reconnectOnMount={false}>
      <QueryClientProvider client={queryClient}>
        <ConnectKitProvider
          theme="auto"
          mode="light"
          customTheme={{
            "--ck-font-family": '"DM Sans", sans-serif',
            "--ck-border-radius": "16px",
            "--ck-accent-color": "#0052FF",
            "--ck-accent-text-color": "#ffffff",
          }}
        >
          <App />
        </ConnectKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  </React.StrictMode>,
);