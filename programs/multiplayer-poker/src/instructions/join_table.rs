use anchor_lang::prelude::*;
use crate::state::*;
use crate::error::PokerError;

#[derive(Accounts)]
pub struct JoinTable<'info> {
    #[account(mut)]
    pub table: Account<'info, Table>,
    
    #[account(mut)]
    pub player: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<JoinTable>, seat: u8) -> Result<()> {
    require!(seat < 9, PokerError::InvalidSeat);
    require!(ctx.accounts.table.game_state == GameState::Waiting, PokerError::GameInProgress);
    require!(ctx.accounts.table.player_count < ctx.accounts.table.max_players, PokerError::TableFull);
    
    // Check if seat is already occupied
    if let Some(_) = ctx.accounts.table.players[seat as usize] {
        return Err(PokerError::SeatOccupied.into());
    }

    // Check if player already at table
    for player_opt in &ctx.accounts.table.players {
        if let Some(player) = player_opt {
            if player.pubkey == ctx.accounts.player.key() {
                return Err(PokerError::InvalidAction.into());
            }
        }
    }

    // Transfer buy-in from player to table (simplified - in production use escrow)
    // For now, we'll just record the stack
    let buy_in = ctx.accounts.table.buy_in;
    
    let player = Player {
        pubkey: ctx.accounts.player.key(),
        seat,
        stack: buy_in,
        bet: 0,
        hole_cards: [None; 2],
        hole_cards_committed: [0; 32],
        is_all_in: false,
        has_folded: false,
        has_acted: false,
        last_action: None,
    };

    ctx.accounts.table.players[seat as usize] = Some(player);
    ctx.accounts.table.player_count += 1;

    emit!(PlayerJoinedEvent {
        table_id: ctx.accounts.table.table_id,
        player: ctx.accounts.player.key(),
        seat,
        stack: buy_in,
    });

    msg!("Player {} joined table {} at seat {}", ctx.accounts.player.key(), ctx.accounts.table.table_id, seat);
    Ok(())
}
