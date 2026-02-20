import { useState, useEffect, useCallback } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { useGameStore } from '../store/gameStore';
import { getProgram } from '../utils/anchor';
import { subscribeToTableAccount, subscribeToLogs } from '../utils/websocket';
import Card from './Card';
import ActionButtons from './ActionButtons';
import { Table, GameState } from '../types';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

export default function PokerTable() {
  const { publicKey, signTransaction, sendTransaction } = useWallet();
  const { connection } = useConnection();
  const { currentTable, updateTable, getMyPlayerAtTable, setCurrentTable } = useGameStore();
  const [loading, setLoading] = useState(false);

  const myPlayer = getMyPlayerAtTable();

  useEffect(() => {
    if (!currentTable || !connection) return;

    // Subscribe to table account changes
    const tablePDA = new PublicKey(currentTable.creator); // Simplified - should be actual PDA
    const unsubscribeAccount = subscribeToTableAccount(
      connection,
      tablePDA,
      (table) => {
        updateTable(table);
      }
    );

    // Subscribe to program logs
    const PROGRAM_ID = new PublicKey('Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS');
    const unsubscribeLogs = subscribeToLogs(
      connection,
      PROGRAM_ID,
      (log) => {
        console.log('Program log:', log);
        // Parse events and update state
        refreshTable();
      }
    );

    return () => {
      unsubscribeAccount();
      unsubscribeLogs();
    };
  }, [currentTable, connection, updateTable]);

  const refreshTable = useCallback(async () => {
    if (!currentTable) return;
    
    try {
      const program = getProgram(connection, { publicKey, signTransaction, sendTransaction } as any);
      // Fetch updated table state
      // This would need the actual table PDA
      // For now, we'll just log
      console.log('Refreshing table state...');
    } catch (error) {
      console.error('Error refreshing table:', error);
    }
  }, [currentTable, connection, publicKey, signTransaction, sendTransaction]);

  const handleStartGame = async () => {
    if (!publicKey || !signTransaction) {
      toast.error('Please connect your wallet');
      return;
    }

    try {
      setLoading(true);
      const program = getProgram(connection, { publicKey, signTransaction, sendTransaction } as any);
      
      // Get table PDA (simplified)
      const tablePDA = new PublicKey(currentTable!.creator);

      const tx = await program.methods
        .startGame()
        .accounts({
          table: tablePDA,
          authority: publicKey,
        })
        .rpc();

      toast.success('Game started!');
      refreshTable();
    } catch (error: any) {
      console.error('Start game error:', error);
      toast.error(error.message || 'Failed to start game');
    } finally {
      setLoading(false);
    }
  };

  if (!currentTable) {
    return <div>No table selected</div>;
  }

  const isMyTurn = currentTable.currentPlayer !== null && 
                   myPlayer && 
                   currentTable.currentPlayer === myPlayer.seat;

  return (
    <div className="max-w-7xl mx-auto">
      {/* Table Info */}
      <div className="bg-casino-black/50 rounded-lg p-4 mb-6 border border-casino-gold/20">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-casino-gold">
              Table #{currentTable.tableId}
            </h2>
            <div className="text-sm text-gray-400 mt-1">
              Blinds: {currentTable.smallBlind / 1e9} / {currentTable.bigBlind / 1e9} SOL
              {' • '}
              Pot: {currentTable.pot / 1e9} SOL
              {' • '}
              Round: {GameState[currentTable.gameState]}
            </div>
          </div>
          
          {currentTable.gameState === GameState.Waiting && (
            <button
              onClick={handleStartGame}
              disabled={loading || currentTable.playerCount < 2}
              className="px-6 py-3 bg-casino-gold text-black font-semibold rounded-lg hover:bg-casino-gold-light disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Starting...' : 'Start Game'}
            </button>
          )}
        </div>
      </div>

      {/* Poker Table */}
      <div className="relative bg-casino-felt rounded-full border-8 border-casino-gold/50 p-12 min-h-[600px]">
        {/* Community Cards */}
        <div className="flex justify-center gap-2 mb-8">
          {currentTable.communityCards.map((card, index) => (
            <Card key={index} card={card} size="md" />
          ))}
        </div>

        {/* Pot Display */}
        <div className="text-center mb-8">
          <div className="inline-block bg-casino-black/80 rounded-lg px-6 py-3 border border-casino-gold/50">
            <div className="text-sm text-gray-400">Pot</div>
            <div className="text-2xl font-bold text-casino-gold">
              {(currentTable.pot / 1e9).toFixed(4)} SOL
            </div>
          </div>
        </div>

        {/* Player Seats */}
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 9 }, (_, i) => {
            const player = currentTable.players[i];
            const isActive = player !== null;
            const isCurrentPlayer = currentTable.currentPlayer === i;
            const isDealer = currentTable.dealerPosition === i;
            const isSmallBlind = currentTable.smallBlindPosition === i;
            const isBigBlind = currentTable.bigBlindPosition === i;
            const isMe = myPlayer && player && player.pubkey.equals(myPlayer.pubkey);

            return (
              <div
                key={i}
                className={`relative bg-casino-black/50 rounded-lg p-4 border-2 ${
                  isCurrentPlayer
                    ? 'border-casino-gold glow'
                    : isActive
                    ? 'border-casino-gold/30'
                    : 'border-gray-700/30'
                }`}
              >
                {isActive && player ? (
                  <>
                    <div className="text-center">
                      <div className="text-sm font-semibold text-casino-gold">
                        {isMe ? 'You' : `Player ${i + 1}`}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        Stack: {(player.stack / 1e9).toFixed(4)} SOL
                      </div>
                      {player.bet > 0 && (
                        <div className="text-xs text-yellow-400 mt-1">
                          Bet: {(player.bet / 1e9).toFixed(4)} SOL
                        </div>
                      )}
                      {player.hasFolded && (
                        <div className="text-xs text-red-400 mt-1">Folded</div>
                      )}
                      {player.isAllIn && (
                        <div className="text-xs text-orange-400 mt-1">All-In</div>
                      )}
                    </div>

                    {/* Player Cards */}
                    {isMe && (
                      <div className="flex gap-1 justify-center mt-2">
                        <Card
                          card={player.holeCards[0]}
                          faceUp={currentTable.gameState === GameState.Showdown || currentTable.gameState === GameState.Finished}
                          size="sm"
                        />
                        <Card
                          card={player.holeCards[1]}
                          faceUp={currentTable.gameState === GameState.Showdown || currentTable.gameState === GameState.Finished}
                          size="sm"
                        />
                      </div>
                    )}

                    {/* Position Badges */}
                    <div className="absolute top-1 right-1 flex gap-1">
                      {isDealer && (
                        <span className="text-xs bg-blue-600 text-white px-1 rounded">D</span>
                      )}
                      {isSmallBlind && (
                        <span className="text-xs bg-yellow-600 text-white px-1 rounded">SB</span>
                      )}
                      {isBigBlind && (
                        <span className="text-xs bg-orange-600 text-white px-1 rounded">BB</span>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="text-center text-gray-500 text-sm">Empty</div>
                )}
              </div>
            );
          })}
        </div>

        {/* Action Buttons (for current player) */}
        {isMyTurn && myPlayer && (
          <div className="mt-8 flex justify-center">
            <ActionButtons
              table={currentTable}
              player={myPlayer}
              onActionComplete={refreshTable}
            />
          </div>
        )}

        {/* Turn Indicator */}
        {currentTable.currentPlayer !== null && !isMyTurn && (
          <div className="text-center mt-4 text-casino-gold font-semibold">
            Waiting for player {currentTable.currentPlayer + 1}...
          </div>
        )}
      </div>
    </div>
  );
}
