use anchor_lang::prelude::*;
use crate::state::*;
use crate::error::PokerError;

#[derive(Accounts)]
pub struct LeaveTable<'info> {
    #[account(mut)]
    pub table: Account<'info, Table>,
    
    #[account(mut)]
    pub player: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<LeaveTable>) -> Result<()> {
    require!(
        ctx.accounts.table.game_state == GameState::Waiting || 
        ctx.accounts.table.game_state == GameState::Finished,
        PokerError::CannotLeaveDuringGame
    );

    let player_key = ctx.accounts.player.key();
    let mut player_seat: Option<u8> = None;

    // Find player
    for (seat, player_opt) in ctx.accounts.table.players.iter().enumerate() {
        if let Some(player) = player_opt {
            if player.pubkey == player_key {
                player_seat = Some(seat as u8);
                break;
            }
        }
    }

    let seat = player_seat.ok_or(PokerError::PlayerNotFound)?;

    // Remove player
    ctx.accounts.table.players[seat as usize] = None;
    ctx.accounts.table.player_count = ctx.accounts.table.player_count.checked_sub(1).ok_or(PokerError::MathOverflow)?;

    // Refund stack (simplified - in production transfer from escrow)
    msg!("Player {} left table {}", player_key, ctx.accounts.table.table_id);
    Ok(())
}
