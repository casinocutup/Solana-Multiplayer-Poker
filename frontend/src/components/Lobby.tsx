import { useState, useEffect } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { PublicKey, SystemProgram } from '@solana/web3.js';
import * as anchor from '@coral-xyz/anchor';
import { useGameStore } from '../store/gameStore';
import { getProgram, getTablePDA } from '../utils/anchor';
import toast from 'react-hot-toast';

export default function Lobby() {
  const { publicKey, signTransaction, sendTransaction } = useWallet();
  const { connection } = useConnection();
  const { tables, setCurrentTable, setTables } = useGameStore();
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState<number | null>(null);

  // Form state for creating table
  const [tableId, setTableId] = useState(Math.floor(Math.random() * 1000000));
  const [smallBlind, setSmallBlind] = useState(1000);
  const [bigBlind, setBigBlind] = useState(2000);
  const [maxPlayers, setMaxPlayers] = useState(6);
  const [buyIn, setBuyIn] = useState(100000);

  useEffect(() => {
    // Load tables (simplified - in production, fetch from program)
    // For now, we'll use mock data
    loadTables();
  }, []);

  const loadTables = async () => {
    // In production, fetch all tables from program
    // For now, use empty array
    setTables([]);
  };

  const handleCreateTable = async () => {
    if (!publicKey || !signTransaction) {
      toast.error('Please connect your wallet');
      return;
    }

    try {
      setCreating(true);
      const program = getProgram(connection, { publicKey, signTransaction, sendTransaction } as any);
      const [tablePDA, bump] = getTablePDA(publicKey, tableId);

      const tx = await program.methods
        .createTable(
          new anchor.BN(tableId),
          new anchor.BN(smallBlind),
          new anchor.BN(bigBlind),
          maxPlayers,
          new anchor.BN(buyIn)
        )
        .accounts({
          table: tablePDA,
          creator: publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      toast.success('Table created!');
      
      // Join the table immediately
      await handleJoinTable(tableId, 0);
    } catch (error: any) {
      console.error('Create table error:', error);
      toast.error(error.message || 'Failed to create table');
    } finally {
      setCreating(false);
    }
  };

  const handleJoinTable = async (tableIdNum: number, seat: number) => {
    if (!publicKey || !signTransaction) {
      toast.error('Please connect your wallet');
      return;
    }

    try {
      setJoining(tableIdNum);
      const program = getProgram(connection, { publicKey, signTransaction, sendTransaction } as any);
      
      // Find table PDA (simplified - in production, store creator)
      // For now, assume we're joining our own table
      const [tablePDA] = getTablePDA(publicKey, tableIdNum);

      const tx = await program.methods
        .joinTable(seat)
        .accounts({
          table: tablePDA,
          player: publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      toast.success(`Joined table at seat ${seat}`);
      
      // Load table and set as current
      const table = await program.account.table.fetch(tablePDA);
      setCurrentTable(table as any);
    } catch (error: any) {
      console.error('Join table error:', error);
      toast.error(error.message || 'Failed to join table');
    } finally {
      setJoining(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Create Table Form */}
        <div className="lg:col-span-1">
          <div className="bg-casino-black/50 rounded-lg p-6 border border-casino-gold/20">
            <h2 className="text-2xl font-bold text-casino-gold mb-4">Create Table</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Table ID
                </label>
                <input
                  type="number"
                  value={tableId}
                  onChange={(e) => setTableId(parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-2 bg-casino-black border border-casino-gold/30 rounded-lg text-white focus:outline-none focus:border-casino-gold"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Small Blind (lamports)
                </label>
                <input
                  type="number"
                  value={smallBlind}
                  onChange={(e) => setSmallBlind(parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-2 bg-casino-black border border-casino-gold/30 rounded-lg text-white focus:outline-none focus:border-casino-gold"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Big Blind (lamports)
                </label>
                <input
                  type="number"
                  value={bigBlind}
                  onChange={(e) => setBigBlind(parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-2 bg-casino-black border border-casino-gold/30 rounded-lg text-white focus:outline-none focus:border-casino-gold"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Max Players
                </label>
                <input
                  type="number"
                  min="2"
                  max="9"
                  value={maxPlayers}
                  onChange={(e) => setMaxPlayers(parseInt(e.target.value) || 2)}
                  className="w-full px-4 py-2 bg-casino-black border border-casino-gold/30 rounded-lg text-white focus:outline-none focus:border-casino-gold"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Buy-In (lamports)
                </label>
                <input
                  type="number"
                  value={buyIn}
                  onChange={(e) => setBuyIn(parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-2 bg-casino-black border border-casino-gold/30 rounded-lg text-white focus:outline-none focus:border-casino-gold"
                />
              </div>

              <button
                onClick={handleCreateTable}
                disabled={creating}
                className="w-full px-6 py-3 bg-casino-gold text-black font-semibold rounded-lg hover:bg-casino-gold-light disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {creating ? 'Creating...' : 'Create & Join Table'}
              </button>
            </div>
          </div>
        </div>

        {/* Tables List */}
        <div className="lg:col-span-2">
          <div className="bg-casino-black/50 rounded-lg p-6 border border-casino-gold/20">
            <h2 className="text-2xl font-bold text-casino-gold mb-4">Active Tables</h2>
            
            {tables.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <p>No active tables. Create one to get started!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {tables.map((table) => (
                  <div
                    key={table.tableId}
                    className="bg-casino-black/30 rounded-lg p-4 border border-casino-gold/10 hover:border-casino-gold/30 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-casino-gold">
                          Table #{table.tableId}
                        </h3>
                        <div className="text-sm text-gray-400 mt-1">
                          <span>Blinds: {table.smallBlind / 1e9} / {table.bigBlind / 1e9} SOL</span>
                          <span className="mx-2">•</span>
                          <span>Players: {table.playerCount} / {table.maxPlayers}</span>
                          <span className="mx-2">•</span>
                          <span>Buy-in: {table.buyIn / 1e9} SOL</span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleJoinTable(table.tableId, 0)}
                        disabled={joining === table.tableId || table.playerCount >= table.maxPlayers}
                        className="px-4 py-2 bg-casino-gold text-black font-semibold rounded-lg hover:bg-casino-gold-light disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {joining === table.tableId ? 'Joining...' : 'Join'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
