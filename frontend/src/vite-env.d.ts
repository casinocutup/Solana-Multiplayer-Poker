/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SOLANA_RPC_URL: string;
  readonly VITE_SOLANA_WS_URL: string;
  readonly VITE_SOLANA_NETWORK: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
