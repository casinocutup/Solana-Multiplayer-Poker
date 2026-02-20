import { Connection, PublicKey } from '@solana/web3.js';
import { Program } from '@coral-xyz/anchor';
import { PROGRAM_ID } from './anchor';
import { useGameStore } from '../store/gameStore';
import {
  PlayerJoinedEvent,
  GameStartedEvent,
  ActionTakenEvent,
  RoundEndedEvent,
  PotDistributedEvent,
  CardRevealedEvent,
  Table,
} from '../types';

export function subscribeToProgram(
  connection: Connection,
  program: Program,
  onEvent: (event: any) => void
): () => void {
  const subscriptionId = connection.onProgramAccountChange(
    PROGRAM_ID,
    (accountInfo, context) => {
      // Parse account data and update store
      try {
        const table = program.coder.accounts.decode('table', accountInfo.data);
        onEvent(table);
      } catch (error) {
        console.error('Error parsing account data:', error);
      }
    },
    'confirmed'
  );

  return () => {
    connection.removeProgramAccountChangeListener(subscriptionId);
  };
}

export function subscribeToTableAccount(
  connection: Connection,
  tablePDA: PublicKey,
  onUpdate: (table: Table) => void
): () => void {
  const subscriptionId = connection.onAccountChange(
    tablePDA,
    (accountInfo, context) => {
      // Parse table account data
      // This would need the actual deserialization logic
      // For now, we'll use a placeholder
      console.log('Table account updated:', accountInfo.data);
    },
    'confirmed'
  );

  return () => {
    connection.removeAccountChangeListener(subscriptionId);
  };
}

export function subscribeToLogs(
  connection: Connection,
  programId: PublicKey,
  onLog: (log: string) => void
): () => void {
  const subscriptionId = connection.onLogs(
    programId,
    (logs, context) => {
      onLog(logs.logs.join('\n'));
    },
    'confirmed'
  );

  return () => {
    connection.removeOnLogsListener(subscriptionId);
  };
}

// Parse Anchor events from transaction logs
export function parseEventFromLogs(logs: string[]): any {
  // In production, use Anchor's event parser
  // For now, we'll look for event signatures in logs
  const eventLogs = logs.filter(log => log.includes('Program log:'));
  
  // Parse events (simplified - in production use proper deserialization)
  for (const log of eventLogs) {
    if (log.includes('PlayerJoinedEvent')) {
      // Parse player joined event
    } else if (log.includes('GameStartedEvent')) {
      // Parse game started event
    } else if (log.includes('ActionTakenEvent')) {
      // Parse action taken event
    }
  }
  
  return null;
}
