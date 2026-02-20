import { Program, AnchorProvider, Idl } from '@coral-xyz/anchor';
import { Connection, PublicKey } from '@solana/web3.js';
import { Wallet } from '@solana/wallet-adapter-base';
import idl from '../idl/multiplayer_poker.json';

export const PROGRAM_ID = new PublicKey('Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS');

export function getProgram(connection: Connection, wallet: Wallet): Program {
  const provider = new AnchorProvider(
    connection,
    wallet as any,
    { commitment: 'confirmed' }
  );
  return new Program(idl as Idl, PROGRAM_ID, provider);
}

export function getTablePDA(creator: PublicKey, tableId: number): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from('table'),
      creator.toBuffer(),
      Buffer.from(tableId.toString()),
    ],
    PROGRAM_ID
  );
}
