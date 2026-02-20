import { useState } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { PublicKey, SystemProgram } from '@solana/web3.js';
import * as anchor from '@coral-xyz/anchor';
import { getProgram } from '../utils/anchor';
import { Table, Player, ActionType } from '../types';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

interface ActionButtonsProps {
  table: Table;
  player: Player;
  onActionComplete: () => void;
}

export default function ActionButtons({ table, player, onActionComplete }: ActionButtonsProps) {
  const { publicKey, signTransaction, sendTransaction } = useWallet();
  const { connection } = useConnection();
  const [acting, setActing] = useState(false);
  const [raiseAmount, setRaiseAmount] = useState(table.minRaise);

  const currentBet = table.players
    .filter(p => p !== null)
    .map(p => p!.bet)
    .reduce((max, bet) => Math.max(max, bet), 0);

  const toCall = Math.max(0, currentBet - player.bet);
  const canCheck = toCall === 0;
  const canCall = toCall > 0 && toCall <= player.stack;
  const canRaise = player.stack > toCall + table.minRaise;

  const handleAction = async (actionType: ActionType, amount?: number) => {
    if (!publicKey || !signTransaction) {
      toast.error('Please connect your wallet');
      return;
    }

    try {
      setActing(true);
      const program = getProgram(connection, { publicKey, signTransaction, sendTransaction } as any);
      
      // Get table PDA (simplified)
      const tablePDA = new PublicKey(table.creator);

      const tx = await program.methods
        .action(actionType, amount ? new anchor.BN(amount) : null)
        .accounts({
          table: tablePDA,
          player: publicKey,
        })
        .rpc();

      toast.success(`Action: ${ActionType[actionType]}`);
      onActionComplete();
    } catch (error: any) {
      console.error('Action error:', error);
      toast.error(error.message || 'Failed to perform action');
    } finally {
      setActing(false);
    }
  };

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="bg-casino-black/90 rounded-lg p-6 border-2 border-casino-gold shadow-xl"
    >
      <div className="text-center mb-4">
        <div className="text-sm text-gray-400">Your Turn</div>
        <div className="text-lg font-bold text-casino-gold">
          {toCall > 0 ? `To Call: ${(toCall / 1e9).toFixed(4)} SOL` : 'Check Available'}
        </div>
      </div>

      <div className="flex gap-3 flex-wrap justify-center">
        <button
          onClick={() => handleAction(ActionType.Fold)}
          disabled={acting}
          className="px-6 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Fold
        </button>

        {canCheck && (
          <button
            onClick={() => handleAction(ActionType.Check)}
            disabled={acting}
            className="px-6 py-3 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Check
          </button>
        )}

        {canCall && (
          <button
            onClick={() => handleAction(ActionType.Call)}
            disabled={acting}
            className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Call {toCall > 0 && `(${(toCall / 1e9).toFixed(4)} SOL)`}
          </button>
        )}

        {canRaise && (
          <div className="flex gap-2 items-center">
            <input
              type="number"
              value={raiseAmount / 1e9}
              onChange={(e) => setRaiseAmount((parseFloat(e.target.value) || 0) * 1e9)}
              min={table.minRaise / 1e9}
              max={player.stack / 1e9}
              step={table.bigBlind / 1e9}
              className="w-24 px-3 py-2 bg-casino-black border border-casino-gold/30 rounded text-white text-sm"
            />
            <button
              onClick={() => handleAction(ActionType.Raise, raiseAmount)}
              disabled={acting || raiseAmount < table.minRaise}
              className="px-6 py-3 bg-casino-gold text-black font-semibold rounded-lg hover:bg-casino-gold-light disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Raise
            </button>
          </div>
        )}

        <button
          onClick={() => handleAction(ActionType.AllIn)}
          disabled={acting || player.stack === 0}
          className="px-6 py-3 bg-orange-600 text-white font-semibold rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          All-In ({(player.stack / 1e9).toFixed(4)} SOL)
        </button>
      </div>

      {acting && (
        <div className="text-center mt-4 text-casino-gold text-sm">
          Processing action...
        </div>
      )}
    </motion.div>
  );
}
