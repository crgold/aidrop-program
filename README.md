# Solana Airdrop and Staking Program

This program is implemented using the Anchor framework and provides functionality for initializing a token mint, performing airdrops, initializing a staking pool, initializing state accounts, depositing tokens, and withdrawing tokens. The README provides an overview of the program, its structure, and usage instructions.

## Table of Contents

- [Overview](#overview)
- [Program Structure](#program-structure)
- [Instructions](#instructions)
- [Accounts](#accounts)
- [Error Codes](#error-codes)
- [Testing](#testing)
- [Usage](#usage)
- [Contributing](#contributing)
- [License](#license)

## Overview

The Airdrop Program is a Solana smart contract that enables various operations related to token management. It provides functionality for initializing a token mint, performing airdrops, initializing staking pools, initializing state accounts, depositing tokens into staking pools, and withdrawing tokens from staking pools.

This program is built using the Anchor framework, which simplifies the development of Solana smart contracts. It leverages the Solana Token Program and System Program for token management and system-level interactions.

## Program Structure

The program is organized into several modules and instructions:

1. `initialize_mint`: Initializes a new token mint.
2. `airdrop`: Performs an airdrop of tokens to a user.
3. `initialize_staking_pool`: Initializes a staking pool.
4. `initialize_state_account`: Initializes a state account for a user.
5. `deposit`: Deposits tokens into a staking pool.
6. `withdraw`: Withdraws tokens from a staking pool.

The program defines various account structures that are used in different instructions to manage token minting, staking pools, state accounts, and user accounts.

## Instructions

### `initialize_mint`

- Initializes a new token mint.
- Requires the mint authority to be specified.
- Invoked with an `_decimals` parameter for the number of decimal places.
- The payer account is required for covering the transaction fee.

### `airdrop`

- Performs an airdrop of tokens to a user's account.
- Requires the mint authority and user account to be specified as signers.
- The user's token account must be provided.
- The amount of tokens to airdrop is specified as the `amount` parameter.

### `initialize_staking_pool`

- Initializes a staking pool.
- Requires a token mint, pool authority, and user account as signers.
- The staking pool account is created and initialized.
- A vault token account is created and associated with the specified mint.

### `initialize_state_account`

- Initializes a state account for a user.
- Requires the user account to be specified as a signer.
- The state account is created and associated with the user.

### `deposit`

- Deposits tokens into a staking pool.
- Requires the user, staking pool, and user token account as signers.
- The user's token account balance is updated.
- Tokens are transferred from the user to the staking pool.

### `withdraw`

- Withdraws tokens from a staking pool.
- Requires the user, staking pool, and pool authority as signers.
- The user's token account balance is updated.
- Tokens are transferred from the staking pool to the user.

## Accounts

The program defines various account structures used for managing different aspects of the program, including:

- `Mint`: Represents the token mint.
- `TokenAccount`: Represents a user's token account.
- `StakingPool`: Represents a staking pool.
- `StateAccount`: Represents a user's state account.

The program also uses system-level accounts for rent calculation and system-level interactions.

## Error Codes

The program defines a custom error code:

- `YouBroke`: Indicates that the user does not have enough tokens in their account to make a withdrawal.

## Testing

The program includes a test suite for validating its functionality. The test suite includes the following test cases:

1. **Create Mint:** Initializes a new token mint with a specified number of decimal places.

2. **Create Staking Pool:** Initializes a staking pool.

3. **Airdrop Tokens:** Performs an airdrop of tokens to a user's account.

4. **Airdropping More Tokens:** Performs another airdrop with a larger amount of tokens.

5. **Create State Account for User:** Initializes a state account for a user.

6. **Deposit Tokens:** Deposits tokens into a staking pool.

7. **Withdraw Tokens:** Withdraws tokens from a staking pool.

8. **Cannot Withdraw More Tokens Than Owned:** Validates that a user cannot withdraw more tokens than they own, triggering the custom error code.

These test cases demonstrate the program's functionality and ensure it operates as expected.

## Usage

To use this Solana program, you should:

1. Deploy the program on the Solana blockchain.

2. Interact with the program using Solana SDK tools and libraries or other Solana-compatible tools.

For specific usage examples, refer to the test suite and code samples provided.

## Contributing

Contributions to this Solana program are welcome. You can contribute by submitting issues, proposing feature enhancements, or making pull requests to the program's repository.

## License

This program is released under the [MIT License](LICENSE).
