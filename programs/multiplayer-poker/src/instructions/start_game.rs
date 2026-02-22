use anchor_lang::prelude::*;
use crate::state::*;
use crate::error::PokerError;
use anchor_lang::solana_program::keccak;

#[derive(Accounts)]
pub struct StartGame<'info> {
    #[account(mut)]
    pub table: Account<'info, Table>,
    
    pub authority: Signer<'info>,
}

pub fn handler(ctx: Context<StartGame>) -> Result<()> {
    let table = &mut ctx.accounts.table;
    let clock = Clock::get()?;

    require!(table.game_state == GameState::Waiting, PokerError::InvalidGameState);
    require!(table.player_count >= 2, PokerError::NotEnoughPlayers);

    // Set dealer button (rotate from previous or start at 0)
    let active_players: Vec<u8> = table.get_active_players().iter().map(|(s, _)| *s).collect();
    table.dealer_position = active_players[0];
    
    // Set small blind and big blind positions
    let dealer_idx = active_players.iter().position(|&s| s == table.dealer_position).unwrap();
    table.small_blind_position = active_players[(dealer_idx + 1) % active_players.len()];
    table.big_blind_position = active_players[(dealer_idx + 2) % active_players.len()];

    // Post blinds
    if let Some(sb_player) = table.get_player_mut(table.small_blind_position) {
        let sb_amount = sb_player.stack.min(table.small_blind);
        sb_player.stack = sb_player.stack.checked_sub(sb_amount).ok_or(PokerError::MathOverflow)?;
        sb_player.bet = sb_amount;
        if sb_player.stack == 0 {
            sb_player.is_all_in = true;
        }
    }

    if let Some(bb_player) = table.get_player_mut(table.big_blind_position) {
        let bb_amount = bb_player.stack.min(table.big_blind);
        bb_player.stack = bb_player.stack.checked_sub(bb_amount).ok_or(PokerError::MathOverflow)?;
        bb_player.bet = bb_amount;
        if bb_player.stack == 0 {
            bb_player.is_all_in = true;
        }
    }

    table.pot = table.small_blind + table.big_blind;
    table.last_raise_amount = table.big_blind;
    table.min_raise = table.big_blind;

    // Deal hole cards (simplified randomness using clock + table state)
    // In production, use commitment scheme or VRF
    let mut seed = clock.unix_timestamp.to_le_bytes().to_vec();
    seed.extend_from_slice(&table.table_id.to_le_bytes());
    seed.extend_from_slice(&clock.slot.to_le_bytes());

    let mut deck = generate_deck();
    shuffle_deck(&mut deck, &seed);

    // Deal cards to each active player
    let mut card_idx = 0;
    for (seat, _) in table.get_active_players() {
        if let Some(player) = table.get_player_mut(seat) {
            if card_idx + 1 < deck.len() {
                player.hole_cards[0] = Some(deck[card_idx]);
                player.hole_cards[1] = Some(deck[card_idx + 1]);
                // Create commitment hash (in production, use proper commitment)
                let mut commit_data = player.hole_cards[0].unwrap().to_u8().to_le_bytes().to_vec();
                commit_data.extend_from_slice(&player.hole_cards[1].unwrap().to_u8().to_le_bytes());
                commit_data.extend_from_slice(&seed);
                let hash = keccak::hash(&commit_data);
                player.hole_cards_committed = hash.to_bytes();
                card_idx += 2;
            }
        }
    }

    // Set first player to act (after big blind)
    table.current_player = table.get_next_active_player(table.big_blind_position);
    table.game_state = GameState::PreFlop;
    table.round = Round::PreFlop;
    table.last_action_at = clock.unix_timestamp;

    // Reset all players' acted status
    for player_opt in &mut table.players {
        if let Some(player) = player_opt {
            player.has_acted = false;
        }
    }

    emit!(GameStartedEvent {
        table_id: table.table_id,
        dealer_position: table.dealer_position,
        small_blind_position: table.small_blind_position,
        big_blind_position: table.big_blind_position,
    });

    msg!("Game started at table {}", table.table_id);
    Ok(())
}

fn generate_deck() -> Vec<Card> {
    let mut deck = Vec::new();
    for suit in [Suit::Clubs, Suit::Diamonds, Suit::Hearts, Suit::Spades] {
        for rank in [
            Rank::Two, Rank::Three, Rank::Four, Rank::Five, Rank::Six,
            Rank::Seven, Rank::Eight, Rank::Nine, Rank::Ten,
            Rank::Jack, Rank::Queen, Rank::King, Rank::Ace,
        ] {
            deck.push(Card::new(suit, rank));
        }
    }
    deck
}

fn shuffle_deck(deck: &mut Vec<Card>, seed: &[u8]) {
    // Simple Fisher-Yates shuffle using seed for randomness
    let mut rng_seed = 0u64;
    for (i, &byte) in seed.iter().enumerate() {
        rng_seed ^= (byte as u64) << (i % 8 * 8);
    }

    for i in (1..deck.len()).rev() {
        rng_seed = rng_seed.wrapping_mul(1103515245).wrapping_add(12345);
        let j = (rng_seed as usize) % (i + 1);
        deck.swap(i, j);
    }
}
