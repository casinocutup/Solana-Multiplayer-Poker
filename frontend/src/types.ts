import { PublicKey } from '@solana/web3.js';

export interface Table {
  creator: PublicKey;
  tableId: number;
  smallBlind: number;
  bigBlind: number;
  maxPlayers: number;
  buyIn: number;
  gameState: GameState;
  dealerPosition: number;
  smallBlindPosition: number;
  bigBlindPosition: number;
  currentPlayer: number | null;
  pot: number;
  communityCards: (Card | null)[];
  round: Round;
  lastRaiseAmount: number;
  minRaise: number;
  players: (Player | null)[];
  playerCount: number;
  createdAt: number;
  lastActionAt: number;
  actionTimeout: number;
}

export interface Player {
  pubkey: PublicKey;
  seat: number;
  stack: number;
  bet: number;
  holeCards: (Card | null)[];
  holeCardsCommitted: number[];
  isAllIn: boolean;
  hasFolded: boolean;
  hasActed: boolean;
  lastAction: ActionType | null;
}

export interface Card {
  suit: Suit;
  rank: Rank;
}

export enum Suit {
  Clubs = 0,
  Diamonds = 1,
  Hearts = 2,
  Spades = 3,
}

export enum Rank {
  Two = 0,
  Three = 1,
  Four = 2,
  Five = 3,
  Six = 4,
  Seven = 5,
  Eight = 6,
  Nine = 7,
  Ten = 8,
  Jack = 9,
  Queen = 10,
  King = 11,
  Ace = 12,
}

export enum GameState {
  Waiting = 0,
  Starting = 1,
  PreFlop = 2,
  Flop = 3,
  Turn = 4,
  River = 5,
  Showdown = 6,
  Finished = 7,
}

export enum Round {
  PreFlop = 0,
  Flop = 1,
  Turn = 2,
  River = 3,
}

export enum ActionType {
  Fold = 0,
  Check = 1,
  Call = 2,
  Raise = 3,
  AllIn = 4,
}

// Anchor events
export interface PlayerJoinedEvent {
  tableId: number;
  player: PublicKey;
  seat: number;
  stack: number;
}

export interface GameStartedEvent {
  tableId: number;
  dealerPosition: number;
  smallBlindPosition: number;
  bigBlindPosition: number;
}

export interface ActionTakenEvent {
  tableId: number;
  player: PublicKey;
  seat: number;
  actionType: ActionType;
  amount: number;
  newPot: number;
  round: Round;
}

export interface RoundEndedEvent {
  tableId: number;
  round: Round;
  communityCards: (Card | null)[];
}

export interface PotDistributedEvent {
  tableId: number;
  winners: PublicKey[];
  amounts: number[];
}

export interface CardRevealedEvent {
  tableId: number;
  player: PublicKey;
  seat: number;
  cards: [Card, Card];
}
