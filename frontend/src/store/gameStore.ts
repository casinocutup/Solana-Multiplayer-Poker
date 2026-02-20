import { create } from 'zustand';
import { PublicKey } from '@solana/web3.js';
import { Table, Player, Card, GameState, ActionType } from '../types';

interface GameStore {
  currentTable: Table | null;
  myPlayer: Player | null;
  myPublicKey: PublicKey | null;
  tables: Table[];
  isConnected: boolean;
  
  setCurrentTable: (table: Table | null) => void;
  setMyPlayer: (player: Player | null) => void;
  setMyPublicKey: (pubkey: PublicKey | null) => void;
  setTables: (tables: Table[]) => void;
  updateTable: (table: Table) => void;
  setIsConnected: (connected: boolean) => void;
  
  // Helper to get my player at current table
  getMyPlayerAtTable: () => Player | null;
}

export const useGameStore = create<GameStore>((set, get) => ({
  currentTable: null,
  myPlayer: null,
  myPublicKey: null,
  tables: [],
  isConnected: false,

  setCurrentTable: (table) => set({ currentTable: table }),
  setMyPlayer: (player) => set({ myPlayer: player }),
  setMyPublicKey: (pubkey) => set({ myPublicKey: pubkey }),
  setTables: (tables) => set({ tables }),
  updateTable: (table) => {
    const state = get();
    if (state.currentTable && state.currentTable.tableId === table.tableId) {
      set({ currentTable: table });
    }
    set({
      tables: state.tables.map(t => t.tableId === table.tableId ? table : t),
    });
  },
  setIsConnected: (connected) => set({ isConnected: connected }),

  getMyPlayerAtTable: () => {
    const state = get();
    if (!state.currentTable || !state.myPublicKey) return null;
    
    return state.currentTable.players.find(
      p => p && p.pubkey.equals(state.myPublicKey!)
    ) || null;
  },
}));
