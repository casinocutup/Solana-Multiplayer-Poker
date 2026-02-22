use anchor_lang::prelude::*;

/// Poker table state
#[account]
pub struct Table {
    pub creator: Pubkey,
    pub table_id: u64,
    pub small_blind: u64,
    pub big_blind: u64,
    pub max_players: u8,
    pub buy_in: u64,
    pub game_state: GameState,
    pub dealer_position: u8,
    pub small_blind_position: u8,
    pub big_blind_position: u8,
    pub current_player: Option<u8>,
    pub pot: u64,
    pub community_cards: [Option<Card>; 5],
    pub round: Round,
    pub last_raise_amount: u64,
    pub min_raise: u64,
    pub players: [Option<Player>; 9],
    pub player_count: u8,
    pub created_at: i64,
    pub last_action_at: i64,
    pub action_timeout: i64,
}

impl Table {
    pub const MAX_SIZE: usize = 8 + // discriminator
        32 + // creator
        8 + // table_id
        8 + // small_blind
        8 + // big_blind
        1 + // max_players
        8 + // buy_in
        1 + // game_state
        1 + // dealer_position
        1 + // small_blind_position
        1 + // big_blind_position
        1 + 32 + // current_player (Option<u8>)
        8 + // pot
        (1 + 2) * 5 + // community_cards [Option<Card>; 5]
        1 + // round
        8 + // last_raise_amount
        8 + // min_raise
        (1 + Player::MAX_SIZE) * 9 + // players [Option<Player>; 9]
        1 + // player_count
        8 + // created_at
        8 + // last_action_at
        8; // action_timeout

    pub fn get_player(&self, seat: u8) -> Option<&Player> {
        if seat as usize >= self.players.len() {
            return None;
        }
        self.players[seat as usize].as_ref()
    }

    pub fn get_player_mut(&mut self, seat: u8) -> Option<&mut Player> {
        if seat as usize >= self.players.len() {
            return None;
        }
        self.players[seat as usize].as_mut()
    }

    pub fn get_active_players(&self) -> Vec<(u8, &Player)> {
        self.players
            .iter()
            .enumerate()
            .filter_map(|(i, p)| p.as_ref().map(|p| (i as u8, p)))
            .filter(|(_, p)| p.is_active())
            .collect()
    }

    pub fn get_next_active_player(&self, from_seat: u8) -> Option<u8> {
        let active_players: Vec<u8> = self.get_active_players().iter().map(|(s, _)| *s).collect();
        if active_players.is_empty() {
            return None;
        }

        // Find next player after from_seat
        for &seat in &active_players {
            if seat > from_seat {
                return Some(seat);
            }
        }
        // Wrap around to first player
        active_players.first().copied()
    }

    pub fn get_active_player_count(&self) -> u8 {
        self.get_active_players().len() as u8
    }
}

/// Player state at a table
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy)]
pub struct Player {
    pub pubkey: Pubkey,
    pub seat: u8,
    pub stack: u64,
    pub bet: u64,
    pub hole_cards: [Option<Card>; 2],
    pub hole_cards_committed: [u8; 32], // Commitment hash for fairness
    pub is_all_in: bool,
    pub has_folded: bool,
    pub has_acted: bool,
    pub last_action: Option<ActionType>,
}

impl Player {
    pub const MAX_SIZE: usize = 32 + // pubkey
        1 + // seat
        8 + // stack
        8 + // bet
        (1 + 2) * 2 + // hole_cards [Option<Card>; 2]
        32 + // hole_cards_committed
        1 + // is_all_in
        1 + // has_folded
        1 + // has_acted
        1 + 1; // last_action (Option<ActionType>)

    pub fn is_active(&self) -> bool {
        !self.has_folded && self.stack > 0
    }

    pub fn can_act(&self, table: &Table) -> bool {
        if !self.is_active() {
            return false;
        }
        if self.is_all_in {
            return false;
        }
        // Check if it's this player's turn
        if let Some(current) = table.current_player {
            if current == self.seat {
                return true;
            }
        }
        false
    }
}

/// Playing card
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Debug, PartialEq, Eq)]
pub struct Card {
    pub suit: Suit,
    pub rank: Rank,
}

impl Card {
    pub fn new(suit: Suit, rank: Rank) -> Self {
        Self { suit, rank }
    }

    pub fn to_u8(&self) -> u8 {
        (self.suit as u8) * 13 + (self.rank as u8)
    }

    pub fn from_u8(value: u8) -> Self {
        Self {
            suit: Suit::from_u8(value / 13),
            rank: Rank::from_u8(value % 13),
        }
    }
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Debug, PartialEq, Eq)]
pub enum Suit {
    Clubs = 0,
    Diamonds = 1,
    Hearts = 2,
    Spades = 3,
}

impl Suit {
    pub fn from_u8(value: u8) -> Self {
        match value {
            0 => Suit::Clubs,
            1 => Suit::Diamonds,
            2 => Suit::Hearts,
            3 => Suit::Spades,
            _ => Suit::Clubs,
        }
    }
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Debug, PartialEq, Eq, PartialOrd, Ord)]
pub enum Rank {
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

impl Rank {
    pub fn from_u8(value: u8) -> Self {
        match value {
            0 => Rank::Two,
            1 => Rank::Three,
            2 => Rank::Four,
            3 => Rank::Five,
            4 => Rank::Six,
            5 => Rank::Seven,
            6 => Rank::Eight,
            7 => Rank::Nine,
            8 => Rank::Ten,
            9 => Rank::Jack,
            10 => Rank::Queen,
            11 => Rank::King,
            12 => Rank::Ace,
            _ => Rank::Two,
        }
    }
}

/// Game state
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Debug, PartialEq)]
pub enum GameState {
    Waiting = 0,
    Starting = 1,
    PreFlop = 2,
    Flop = 3,
    Turn = 4,
    River = 5,
    Showdown = 6,
    Finished = 7,
}

/// Betting round
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Debug, PartialEq)]
pub enum Round {
    PreFlop = 0,
    Flop = 1,
    Turn = 2,
    River = 3,
}

/// Player action type
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Debug, PartialEq)]
pub enum ActionType {
    Fold = 0,
    Check = 1,
    Call = 2,
    Raise = 3,
    AllIn = 4,
}

/// Events emitted by the program
#[event]
pub struct PlayerJoinedEvent {
    pub table_id: u64,
    pub player: Pubkey,
    pub seat: u8,
    pub stack: u64,
}

#[event]
pub struct GameStartedEvent {
    pub table_id: u64,
    pub dealer_position: u8,
    pub small_blind_position: u8,
    pub big_blind_position: u8,
}

#[event]
pub struct ActionTakenEvent {
    pub table_id: u64,
    pub player: Pubkey,
    pub seat: u8,
    pub action_type: ActionType,
    pub amount: u64,
    pub new_pot: u64,
    pub round: Round,
}

#[event]
pub struct RoundEndedEvent {
    pub table_id: u64,
    pub round: Round,
    pub community_cards: [Option<Card>; 5],
}

#[event]
pub struct PotDistributedEvent {
    pub table_id: u64,
    pub winners: Vec<Pubkey>,
    pub amounts: Vec<u64>,
}

#[event]
pub struct CardRevealedEvent {
    pub table_id: u64,
    pub player: Pubkey,
    pub seat: u8,
    pub cards: [Card; 2],
}
