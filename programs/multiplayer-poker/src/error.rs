use anchor_lang::prelude::*;

#[error_code]
pub enum PokerError {
    #[msg("Table is full")]
    TableFull,
    
    #[msg("Invalid seat number")]
    InvalidSeat,
    
    #[msg("Seat already occupied")]
    SeatOccupied,
    
    #[msg("Not enough players to start game")]
    NotEnoughPlayers,
    
    #[msg("Game already in progress")]
    GameInProgress,
    
    #[msg("Game not started")]
    GameNotStarted,
    
    #[msg("Not player's turn")]
    NotPlayersTurn,
    
    #[msg("Player has already acted this round")]
    AlreadyActed,
    
    #[msg("Invalid action")]
    InvalidAction,
    
    #[msg("Insufficient funds")]
    InsufficientFunds,
    
    #[msg("Raise amount too small")]
    RaiseTooSmall,
    
    #[msg("Player not found at table")]
    PlayerNotFound,
    
    #[msg("Player is all-in")]
    PlayerAllIn,
    
    #[msg("Player has folded")]
    PlayerFolded,
    
    #[msg("Cannot leave during active game")]
    CannotLeaveDuringGame,
    
    #[msg("Math overflow")]
    MathOverflow,
    
    #[msg("Action timeout")]
    ActionTimeout,
    
    #[msg("Invalid game state")]
    InvalidGameState,
    
    #[msg("Showdown required")]
    ShowdownRequired,
}
