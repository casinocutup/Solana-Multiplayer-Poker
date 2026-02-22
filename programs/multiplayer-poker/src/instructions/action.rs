use anchor_lang::prelude::*;
use crate::state::*;
use crate::error::PokerError;

#[derive(Accounts)]
pub struct Action<'info> {
    #[account(mut)]
    pub table: Account<'info, Table>,
    
    pub player: Signer<'info>,
}

pub fn handler(
    ctx: Context<Action>,
    action_type: ActionType,
    amount: Option<u64>,
) -> Result<()> {
    let table = &mut ctx.accounts.table;
    let clock = Clock::get()?;
    let player_key = ctx.accounts.player.key();

    require!(
        table.game_state == GameState::PreFlop ||
        table.game_state == GameState::Flop ||
        table.game_state == GameState::Turn ||
        table.game_state == GameState::River,
        PokerError::InvalidGameState
    );

    // Check timeout
    if clock.unix_timestamp - table.last_action_at > table.action_timeout {
        return Err(PokerError::ActionTimeout.into());
    }

    // Find player
    let mut player_seat: Option<u8> = None;
    for (seat, player_opt) in table.players.iter().enumerate() {
        if let Some(player) = player_opt {
            if player.pubkey == player_key {
                player_seat = Some(seat as u8);
                break;
            }
        }
    }

    let seat = player_seat.ok_or(PokerError::PlayerNotFound)?;
    let player = table.get_player_mut(seat).ok_or(PokerError::PlayerNotFound)?;

    require!(player.can_act(table), PokerError::NotPlayersTurn);
    require!(!player.has_acted, PokerError::AlreadyActed);

    let current_bet = table.get_active_players()
        .iter()
        .map(|(_, p)| p.bet)
        .max()
        .unwrap_or(0);

    let to_call = current_bet.saturating_sub(player.bet);

    match action_type {
        ActionType::Fold => {
            player.has_folded = true;
            player.has_acted = true;
        }
        ActionType::Check => {
            require!(to_call == 0, PokerError::InvalidAction);
            player.has_acted = true;
        }
        ActionType::Call => {
            require!(to_call > 0, PokerError::InvalidAction);
            let call_amount = player.stack.min(to_call);
            player.stack = player.stack.checked_sub(call_amount).ok_or(PokerError::MathOverflow)?;
            player.bet = player.bet.checked_add(call_amount).ok_or(PokerError::MathOverflow)?;
            if player.stack == 0 {
                player.is_all_in = true;
            }
            player.has_acted = true;
        }
        ActionType::Raise => {
            let raise_amount = amount.ok_or(PokerError::InvalidAction)?;
            require!(raise_amount >= table.min_raise, PokerError::RaiseTooSmall);
            let total_bet = to_call.checked_add(raise_amount).ok_or(PokerError::MathOverflow)?;
            require!(total_bet <= player.stack, PokerError::InsufficientFunds);
            
            player.stack = player.stack.checked_sub(total_bet).ok_or(PokerError::MathOverflow)?;
            player.bet = player.bet.checked_add(total_bet).ok_or(PokerError::MathOverflow)?;
            table.last_raise_amount = raise_amount;
            table.min_raise = raise_amount;
            
            // Reset all players' acted status for new betting round
            for player_opt in &mut table.players {
                if let Some(p) = player_opt {
                    if p.is_active() && p.seat != seat {
                        p.has_acted = false;
                    }
                }
            }
            
            if player.stack == 0 {
                player.is_all_in = true;
            }
            player.has_acted = true;
        }
        ActionType::AllIn => {
            let all_in_amount = player.stack;
            require!(all_in_amount > 0, PokerError::InvalidAction);
            
            player.bet = player.bet.checked_add(all_in_amount).ok_or(PokerError::MathOverflow)?;
            player.stack = 0;
            player.is_all_in = true;
            
            // If all-in is a raise, reset acted status
            if player.bet > current_bet {
                table.last_raise_amount = player.bet.saturating_sub(current_bet);
                table.min_raise = table.last_raise_amount;
                for player_opt in &mut table.players {
                    if let Some(p) = player_opt {
                        if p.is_active() && p.seat != seat {
                            p.has_acted = false;
                        }
                    }
                }
            }
            
            player.has_acted = true;
        }
    }

    // Update pot
    let total_bets: u64 = table.get_active_players().iter().map(|(_, p)| p.bet).sum();
    table.pot = total_bets;

    table.last_action_at = clock.unix_timestamp;
    player.last_action = Some(action_type);

    emit!(ActionTakenEvent {
        table_id: table.table_id,
        player: player_key,
        seat,
        action_type,
        amount: match action_type {
            ActionType::Fold | ActionType::Check => 0,
            ActionType::Call => to_call,
            ActionType::Raise => amount.unwrap_or(0),
            ActionType::AllIn => player.stack,
        },
        new_pot: table.pot,
        round: table.round,
    });

    // Check if betting round is complete
    let active_players = table.get_active_players();
    let all_acted = active_players.iter().all(|(_, p)| p.has_acted || p.is_all_in);
    let all_bets_equal = active_players.len() > 0 && {
        let first_bet = active_players[0].1.bet;
        active_players.iter().all(|(_, p)| p.bet == first_bet || p.is_all_in)
    };

    if all_acted && all_bets_equal {
        // Move to next round
        advance_round(table)?;
    } else {
        // Move to next player
        table.current_player = table.get_next_active_player(seat);
    }

    msg!("Player {} took action {:?} at table {}", player_key, action_type, table.table_id);
    Ok(())
}

fn advance_round(table: &mut Table) -> Result<()> {
    match table.round {
        Round::PreFlop => {
            // Deal flop
            table.round = Round::Flop;
            table.game_state = GameState::Flop;
            // In production, deal community cards from shuffled deck
            // For now, we'll set them to None and deal in a separate instruction
        }
        Round::Flop => {
            table.round = Round::Turn;
            table.game_state = GameState::Turn;
        }
        Round::Turn => {
            table.round = Round::River;
            table.game_state = GameState::River;
        }
        Round::River => {
            // Go to showdown
            table.game_state = GameState::Showdown;
        }
    }

    // Reset acted status for all players
    for player_opt in &mut table.players {
        if let Some(player) = player_opt {
            if player.is_active() {
                player.has_acted = false;
            }
        }
    }

    // Set first player to act (after dealer)
    table.current_player = table.get_next_active_player(table.dealer_position);

    emit!(RoundEndedEvent {
        table_id: table.table_id,
        round: table.round,
        community_cards: table.community_cards,
    });

    Ok(())
}
