use anchor_lang::prelude::*;
use crate::state::*;
use crate::error::PokerError;

#[derive(Accounts)]
#[instruction(table_id: u64)]
pub struct CreateTable<'info> {
    #[account(
        init,
        payer = creator,
        space = Table::MAX_SIZE,
        seeds = [b"table", creator.key().as_ref(), &table_id.to_le_bytes()],
        bump
    )]
    pub table: Account<'info, Table>,
    
    #[account(mut)]
    pub creator: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<CreateTable>,
    table_id: u64,
    small_blind: u64,
    big_blind: u64,
    max_players: u8,
    buy_in: u64,
) -> Result<()> {
    require!(max_players >= 2 && max_players <= 9, PokerError::InvalidSeat);
    require!(big_blind > small_blind, PokerError::InvalidAction);
    require!(buy_in >= big_blind * 10, PokerError::InvalidAction); // Minimum 10 big blinds

    let table = &mut ctx.accounts.table;
    let clock = Clock::get()?;

    table.creator = ctx.accounts.creator.key();
    table.table_id = table_id;
    table.small_blind = small_blind;
    table.big_blind = big_blind;
    table.max_players = max_players;
    table.buy_in = buy_in;
    table.game_state = GameState::Waiting;
    table.dealer_position = 0;
    table.small_blind_position = 0;
    table.big_blind_position = 0;
    table.current_player = None;
    table.pot = 0;
    table.community_cards = [None; 5];
    table.round = Round::PreFlop;
    table.last_raise_amount = 0;
    table.min_raise = big_blind;
    table.players = [None; 9];
    table.player_count = 0;
    table.created_at = clock.unix_timestamp;
    table.last_action_at = clock.unix_timestamp;
    table.action_timeout = 60; // 60 seconds

    msg!("Table created: {}", table_id);
    Ok(())
}
