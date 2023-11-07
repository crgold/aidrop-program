use anchor_lang::prelude::*;
use anchor_spl::token;
use anchor_spl::token::{Token, TokenAccount, Mint, MintTo, Transfer};

declare_id!("52ThXWX6Syd6ahz57FyBxJvoh6hf1HvWFTTDwWT5nNzw");

#[program]
pub mod airdrop_program {
    use super::*;

    pub fn initialize_mint(ctx: Context<InitializeMint>, _decimals: u8) -> Result<()> {
        msg!("Token mint initialized: {}", ctx.accounts.token_mint.key());
        Ok(())
    }

    pub fn airdrop(ctx: Context<Airdrop>, amount: u64) -> Result<()> {
        let mint_bump = *ctx.bumps.get("mint_authority").unwrap();
        let mint_seeds = &["mint-authority".as_bytes(), &[mint_bump]];
        let signer = &[&mint_seeds[..]];

        msg!("Airdropping {} tokens..", amount);
        let mint_to_cex = ctx.accounts.mint_to_ctx().with_signer(signer);
        let _ = token::mint_to(mint_to_cex, amount);

        msg!("Airdrop complete!");

        Ok(())
    }

    pub fn initialize_staking_pool(ctx: Context<InitializeStakePool>) -> Result<()> {
        let staking_pool = &mut ctx.accounts.staking_pool;
        staking_pool.vault_token_account = ctx.accounts.vault_token_account.key();
        staking_pool.pool_authority = ctx.accounts.pool_authority.key();
        staking_pool.balance = 0;
        Ok(())
    }

    pub fn initialize_state_account(ctx: Context<InitializeStateAccount>) -> Result<()> {
        let stake_account = &mut ctx.accounts.state_account;
        stake_account.owner = ctx.accounts.user.key();
        msg!("State account initialized: {}", stake_account.key());
        Ok(())
    }

    pub fn deposit(ctx: Context<Deposit>, amount: u64) -> Result<()> {
        let state_account = &mut ctx.accounts.state_account;
        let staking_pool = &mut ctx.accounts.staking_pool;

        state_account.balance += amount;
        staking_pool.balance += amount;
        msg!("User account balance: {}", state_account.balance);
        msg!("Pool balance: {}", staking_pool.balance);

        let deposit_cex = ctx.accounts.deposit_ctx();
        let _ = token::transfer(deposit_cex, amount);
        Ok(())
    }

    pub fn withdraw(ctx: Context<Withdraw>, amount: u64) -> Result<()> {
        require_gte!(ctx.accounts.state_account.balance, amount, StakingError::YouBroke);
        let state_account = &mut ctx.accounts.state_account;
        let staking_pool = &mut ctx.accounts.staking_pool;

        state_account.balance -= amount;
        staking_pool.balance -= amount;
        msg!("User account balance: {}", state_account.balance);
        msg!("Pool balance: {}", staking_pool.balance);

        let mint_bump = *ctx.bumps.get("pool_authority").unwrap();
        let mint_seeds = &["pool-authority".as_bytes(), &[mint_bump]];
        let signer = &[&mint_seeds[..]];

        let withdraw_cex = ctx.accounts.withdraw_ctx().with_signer(signer);
        let _ = token::transfer(withdraw_cex, amount);
        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(_decimals: u8)]
pub struct InitializeMint<'info> {
    #[account(
        init, 
        mint::authority = mint_authority,
        mint::decimals = _decimals,
        seeds = ["token-mint".as_bytes()], 
        bump, 
        payer = payer)]
    pub token_mint: Account<'info, Mint>,
    /// CHECK: using as signer
    #[account(seeds = ["mint-authority".as_bytes()], bump)]
    pub mint_authority: AccountInfo<'info>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub rent: Sysvar<'info, Rent>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>
}

#[derive(Accounts)]
pub struct Airdrop<'info> {
    #[account(mut, seeds = ["token-mint".as_bytes()], bump)]
    pub token_mint: Account<'info, Mint>,
    /// CHECK: using as signer
    #[account(mut, seeds = ["mint-authority".as_bytes()], bump)]
    pub mint_authority: AccountInfo<'info>,
    #[account(mut)]
    pub user: Signer<'info>,
    #[account(
        mut, 
        token::mint = token_mint,
        token::authority = user
    )]
    pub user_token_account: Account<'info, TokenAccount>,
    pub rent: Sysvar<'info, Rent>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>
}

impl <'info> Airdrop<'info> {
    pub fn mint_to_ctx(&self) -> CpiContext<'_,'_,'_, 'info, MintTo<'info>> {
        let cpi_program = self.token_program.to_account_info();
        let cpi_accounts = MintTo {
            mint: self.token_mint.to_account_info(),
            to: self.user_token_account.to_account_info(),
            authority: self.mint_authority.to_account_info()
        };
        CpiContext::new(cpi_program, cpi_accounts)
    }
}

#[derive(Accounts)]
pub struct InitializeStakePool<'info> {
    #[account(seeds = ["token-mint".as_bytes()], bump)]
    pub token_mint: Account<'info, Mint>,
    #[account(init, seeds = ["staking-pool".as_bytes()], bump, payer = user, space = 8 + 32 + 32 + 8)]
    pub staking_pool: Account<'info, StakingPool>,
    /// CHECK: using as signer
    #[account(seeds = ["pool-authority".as_bytes()], bump)]
    pub pool_authority: AccountInfo<'info>,
    #[account(mut)]
    pub user: Signer<'info>,
    #[account(
        init,
        seeds = ["vault-token-account".as_bytes()],
        bump,
        token::mint = token_mint,
        token::authority = pool_authority,
        payer = user)]
    pub vault_token_account: Account<'info, TokenAccount>,
    pub rent: Sysvar<'info, Rent>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct StakingPool {
    pub vault_token_account: Pubkey,
    pub pool_authority: Pubkey,
    pub balance: u64
}

#[derive(Accounts)]
pub struct InitializeStateAccount<'info> {
    #[account(init, seeds = ["state-account".as_bytes(), user.key().as_ref()], bump, payer = user, space = 8 + 32 + 32)]
    pub state_account: Account<'info, StateAccount>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>
}

#[account]
pub struct StateAccount {
    pub owner: Pubkey,
    pub balance: u64
}

#[derive(Accounts)]
pub struct Deposit<'info> {
    #[account(mut, seeds = ["state-account".as_bytes(), user.key().as_ref()], bump)]
    pub state_account: Account<'info, StateAccount>,
    #[account(mut, seeds = ["vault-token-account".as_bytes()], bump)]
    pub vault_token_account: Account<'info, TokenAccount>,
    #[account(mut, seeds = ["staking-pool".as_bytes()], bump)]
    pub staking_pool: Account<'info, StakingPool>,
    #[account(mut)]
    pub user_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

impl <'info> Deposit<'info> {
    pub fn deposit_ctx(&self) -> CpiContext<'_,'_,'_, 'info, Transfer<'info>> {
        let cpi_program = self.token_program.to_account_info();
        let cpi_accounts = Transfer {
            from: self.user_token_account.to_account_info(),
            to: self.vault_token_account.to_account_info(),
            authority: self.user.to_account_info()
        };
        CpiContext::new(cpi_program, cpi_accounts)
    }
}

#[derive(Accounts)]
pub struct Withdraw<'info> {
    #[account(mut, seeds = ["state-account".as_bytes(), user.key().as_ref()], bump)]
    pub state_account: Account<'info, StateAccount>,
    #[account(mut, seeds = ["vault-token-account".as_bytes()], bump)]
    pub vault_token_account: Account<'info, TokenAccount>,
    #[account(mut, seeds = ["staking-pool".as_bytes()], bump)]
    pub staking_pool: Account<'info, StakingPool>,
    /// CHECK: is only a signer
    #[account(seeds = ["pool-authority".as_bytes()], bump)]
    pub pool_authority: AccountInfo<'info>,
    #[account(mut)]
    pub user_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

impl <'info> Withdraw<'info> {
    pub fn withdraw_ctx(&self) -> CpiContext<'_,'_,'_, 'info, Transfer<'info>> {
        let cpi_program = self.token_program.to_account_info();
        let cpi_accounts = Transfer {
            from: self.vault_token_account.to_account_info(),
            to: self.user_token_account.to_account_info(),
            authority: self.pool_authority.to_account_info()
        };
        CpiContext::new(cpi_program, cpi_accounts)
    }
}

#[error_code]
pub enum StakingError {
    #[msg("You do not have enough tokens in your account to make this withdraw")]
    YouBroke
}
