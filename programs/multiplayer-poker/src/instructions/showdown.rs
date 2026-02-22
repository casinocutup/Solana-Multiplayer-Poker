use anchor_lang::prelude::*;
use crate::state::*;
use crate::error::PokerError;

#[derive(Accounts)]
pub struct Showdown<'info> {
    #[account(mut)]
    pub table: Account<'info, Table>,
    
    pub authority: Signer<'info>,
}

pub fn handler(ctx: Context<Showdown>) -> Result<()> {
    let table = &mut ctx.accounts.table;

    require!(table.game_state == GameState::Showdown, PokerError::InvalidGameState);

    // Reveal all active players' hole cards
    for (seat, player) in table.get_active_players() {
        if let Some(player_mut) = table.get_player_mut(seat) {
            // In production, verify commitment before revealing
            // For now, cards are already set during deal
            
            emit!(CardRevealedEvent {
                table_id: table.table_id,
                player: player_mut.pubkey,
                seat,
                cards: [
                    player_mut.hole_cards[0].unwrap(),
                    player_mut.hole_cards[1].unwrap(),
                ],
            });
        }
    }

    // Determine winners (simplified - in production implement proper hand evaluation)
    // For now, we'll just mark for distribution
    table.game_state = GameState::Finished;

    msg!("Showdown completed at table {}", table.table_id);
    Ok(())
}
