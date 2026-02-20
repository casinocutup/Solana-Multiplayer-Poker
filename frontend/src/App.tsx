import { useState, useEffect } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useGameStore } from './store/gameStore';
import Lobby from './components/Lobby';
import PokerTable from './components/PokerTable';
import './App.css';

function App() {
  const { connected, publicKey } = useWallet();
  const { connection } = useConnection();
  const { currentTable, setMyPublicKey } = useGameStore();

  useEffect(() => {
    if (publicKey) {
      setMyPublicKey(publicKey);
    }
  }, [publicKey, setMyPublicKey]);

  return (
    <div className="min-h-screen bg-casino-dark">
      {/* Header */}
      <header className="bg-casino-darker border-b border-casino-gold/20">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold text-casino-gold text-shadow">
              🃏 Solana Multiplayer Poker
            </h1>
            <span className="text-sm text-gray-400">Real-Time Texas Hold'em</span>
          </div>
          
          <div className="flex items-center gap-4">
            {connected && publicKey && (
              <div className="text-sm text-gray-300">
                {publicKey.toString().slice(0, 8)}...{publicKey.toString().slice(-8)}
              </div>
            )}
            <WalletMultiButton className="!bg-casino-gold !text-black hover:!bg-casino-gold-light" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {!connected ? (
          <div className="max-w-2xl mx-auto text-center py-12">
            <div className="bg-casino-black/50 rounded-lg p-8 border border-casino-gold/20">
              <h2 className="text-2xl font-bold text-casino-gold mb-4">
                Connect Your Wallet
              </h2>
              <p className="text-gray-300 mb-6">
                Connect your Solana wallet to start playing multiplayer poker.
              </p>
            </div>
          </div>
        ) : currentTable ? (
          <PokerTable />
        ) : (
          <Lobby />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-casino-darker border-t border-casino-gold/20 mt-12 py-6">
        <div className="container mx-auto px-4 text-center text-sm text-gray-400">
          <p>Solana Multiplayer Poker - Real-Time Texas Hold'em dApp</p>
          <p className="mt-2">
            Built with Anchor & React. Play responsibly.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
