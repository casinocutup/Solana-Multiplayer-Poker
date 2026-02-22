import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { MultiplayerPoker } from "../target/types/multiplayer_poker";
import { PublicKey, SystemProgram, Keypair } from "@solana/web3.js";
import { expect } from "chai";

describe("multiplayer-poker", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.MultiplayerPoker as Program<MultiplayerPoker>;
  const creator = provider.wallet;
  const player1 = Keypair.generate();
  const player2 = Keypair.generate();

  const tableId = new anchor.BN(Math.floor(Math.random() * 1000000));
  const smallBlind = new anchor.BN(1000);
  const bigBlind = new anchor.BN(2000);
  const maxPlayers = 6;
  const buyIn = new anchor.BN(100000);

  let tablePDA: PublicKey;
  let tableBump: number;

  before(async () => {
    // Airdrop SOL to test players
    const airdrop1 = await provider.connection.requestAirdrop(player1.publicKey, 2 * anchor.web3.LAMPORTS_PER_SOL);
    const airdrop2 = await provider.connection.requestAirdrop(player2.publicKey, 2 * anchor.web3.LAMPORTS_PER_SOL);
    await provider.connection.confirmTransaction(airdrop1);
    await provider.connection.confirmTransaction(airdrop2);

    // Derive table PDA
    [tablePDA, tableBump] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("table"),
        creator.publicKey.toBuffer(),
        tableId.toArrayLike(Buffer, "le", 8),
      ],
      program.programId
    );
  });

  it("Creates a table", async () => {
    const tx = await program.methods
      .createTable(tableId, smallBlind, bigBlind, maxPlayers, buyIn)
      .accounts({
        table: tablePDA,
        creator: creator.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    const table = await program.account.table.fetch(tablePDA);
    expect(table.tableId.toString()).to.equal(tableId.toString());
    expect(table.smallBlind.toString()).to.equal(smallBlind.toString());
    expect(table.bigBlind.toString()).to.equal(bigBlind.toString());
    expect(table.maxPlayers).to.equal(maxPlayers);
    expect(table.playerCount).to.equal(0);
  });

  it("Player joins table", async () => {
    const seat = 0;
    const tx = await program.methods
      .joinTable(seat)
      .accounts({
        table: tablePDA,
        player: player1.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([player1])
      .rpc();

    const table = await program.account.table.fetch(tablePDA);
    expect(table.playerCount).to.equal(1);
    expect(table.players[seat]).to.not.be.null;
  });

  it("Second player joins table", async () => {
    const seat = 1;
    const tx = await program.methods
      .joinTable(seat)
      .accounts({
        table: tablePDA,
        player: player2.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([player2])
      .rpc();

    const table = await program.account.table.fetch(tablePDA);
    expect(table.playerCount).to.equal(2);
  });

  it("Starts a game", async () => {
    const tx = await program.methods
      .startGame()
      .accounts({
        table: tablePDA,
        authority: creator.publicKey,
      })
      .rpc();

    const table = await program.account.table.fetch(tablePDA);
    expect(table.gameState).to.not.equal(0); // Not Waiting
    expect(table.dealerPosition).to.not.be.undefined;
  });

  it("Player takes action (call)", async () => {
    const actionType = { call: {} };
    const tx = await program.methods
      .action(actionType, null)
      .accounts({
        table: tablePDA,
        player: player1.publicKey,
      })
      .signers([player1])
      .rpc();

    const table = await program.account.table.fetch(tablePDA);
    const player = table.players[0];
    expect(player.hasActed).to.be.true;
  });
});
