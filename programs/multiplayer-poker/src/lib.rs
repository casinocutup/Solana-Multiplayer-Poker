use anchor_lang::prelude::*;

pub mod error;
pub mod instructions;
pub mod state;

use instructions::*;
use state::*;

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod multiplayer_poker {
    use super::*;

    /// Create a new poker table
    pub fn create_table(
        ctx: Context<CreateTable>,
        table_id: u64,
        small_blind: u64,
        big_blind: u64,
        max_players: u8,
        buy_in: u64,
    ) -> Result<()> {
        instructions::create_table::handler(ctx, table_id, small_blind, big_blind, max_players, buy_in)
    }

    /// Join a poker table
    pub fn join_table(ctx: Context<JoinTable>, seat: u8) -> Result<()> {
        instructions::join_table::handler(ctx, seat)
    }

    /// Leave a poker table (refund if possible)
    pub fn leave_table(ctx: Context<LeaveTable>) -> Result<()> {
        instructions::leave_table::handler(ctx)
    }

    /// Start a new game (deal cards, set dealer button)
    pub fn start_game(ctx: Context<StartGame>) -> Result<()> {
        instructions::start_game::handler(ctx)
    }

    /// Player action (fold, check, call, raise, all-in)
    pub fn action(ctx: Context<Action>, action_type: ActionType, amount: Option<u64>) -> Result<()> {
        instructions::action::handler(ctx, action_type, amount)
    }

    /// Showdown - reveal cards and determine winners
    pub fn showdown(ctx: Context<Showdown>) -> Result<()> {
        instructions::showdown::handler(ctx)
    }

    /// Distribute pot to winners
    pub fn distribute_pot(ctx: Context<DistributePot>) -> Result<()> {
        instructions::distribute_pot::handler(ctx)
    }
}
