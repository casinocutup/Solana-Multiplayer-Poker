use anchor_lang::prelude::*;
use crate::state::*;
use crate::error::PokerError;

#[derive(Accounts)]
pub struct DistributePot<'info> {
    #[account(mut)]
    pub table: Account<'info, Table>,
    
    pub authority: Signer<'info>,
}

pub fn handler(ctx: Context<DistributePot>) -> Result<()> {
    let table = &mut ctx.accounts.table;

    require!(table.game_state == GameState::Finished, PokerError::InvalidGameState);

    // Simplified winner determination - in production, implement proper hand ranking
    let active_players = table.get_active_players();
    
    if active_players.len() == 1 {
        // Only one player left - they win
        let winner = active_players[0].1.pubkey;
        let pot = table.pot;
        
        // In production, transfer SOL from escrow to winner
        // For now, just update stack
        if let Some(player) = table.get_player_mut(active_players[0].0) {
            player.stack = player.stack.checked_add(pot).ok_or(PokerError::MathOverflow)?;
        }

        emit!(PotDistributedEvent {
            table_id: table.table_id,
            winners: vec![winner],
            amounts: vec![pot],
        });
    } else {
        // Multiple players - need hand evaluation (simplified: first active player wins)
        // In production, implement proper poker hand ranking
        let winner = active_players[0].1.pubkey;
        let pot = table.pot;
        
        if let Some(player) = table.get_player_mut(active_players[0].0) {
            player.stack = player.stack.checked_add(pot).ok_or(PokerError::MathOverflow)?;
        }

        emit!(PotDistributedEvent {
            table_id: table.table_id,
            winners: vec![winner],
            amounts: vec![pot],
        });
    }

    // Reset for next game
    table.pot = 0;
    table.game_state = GameState::Waiting;
    table.community_cards = [None; 5];
    table.current_player = None;
    
    // Reset player bets and status
    for player_opt in &mut table.players {
        if let Some(player) = player_opt {
            player.bet = 0;
            player.has_folded = false;
            player.has_acted = false;
            player.is_all_in = false;
            player.hole_cards = [None; 2];
            player.hole_cards_committed = [0; 32];
        }
    }

    msg!("Pot distributed at table {}", table.table_id);
    Ok(())
}
