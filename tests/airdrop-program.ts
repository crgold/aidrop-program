import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { AirdropProgram } from "../target/types/airdrop_program";
import { Keypair, SystemProgram, PublicKey} from "@solana/web3.js"
import { TOKEN_PROGRAM_ID, getOrCreateAssociatedTokenAccount } from "@solana/spl-token"
import { assert } from "chai";

describe("airdrop-program", async () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());
  const provider = anchor.AnchorProvider.env()
  const program = anchor.workspace.AirdropProgram as Program<AirdropProgram>;

  // derive PDA of the token mint and mint authority using our seeds 
  let tokenMint = await PublicKey.findProgramAddressSync([Buffer.from("token-mint")], program.programId);
  const stakingPool = await PublicKey.findProgramAddressSync([Buffer.from("staking-pool")], program.programId);
  const mintAuthority = await PublicKey.findProgramAddressSync([Buffer.from("mint-authority")], program.programId);
  const poolAuthority = await PublicKey.findProgramAddressSync([Buffer.from("pool-authority")], program.programId);
  const vaultTokenAccount = await PublicKey.findProgramAddressSync([Buffer.from("vault-token-account")], program.programId);
  const stateAccount = await PublicKey.findProgramAddressSync([Buffer.from("state-account"), provider.wallet.publicKey.toBuffer()], program.programId);

  console.log("Token mint pda: ", tokenMint[0].toBase58());
	console.log("Mint auth pda: ", mintAuthority[0].toBase58());
  console.log("Pool auth pda: ", poolAuthority[0].toBase58());

  it("Create Mint", async () => {
    const tx = await program.methods.initializeMint(10)
    .accounts({
      tokenMint: tokenMint[0],
      mintAuthority: mintAuthority[0],
      payer: provider.wallet.publicKey,
      rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      tokenProgram: TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId
    })
    .signers([])
    .rpc()
    console.log("Initialize mint tx: ", tx);
  })

  it("Create Staking Pool", async () => {
    const tx = await program.methods.initializeStakingPool()
    .accounts({
      tokenMint: tokenMint[0],
      tokenProgram: TOKEN_PROGRAM_ID,
      stakingPool: stakingPool[0],
      poolAuthority: poolAuthority[0],
      rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      user: provider.wallet.publicKey,
      systemProgram: SystemProgram.programId,
      vaultTokenAccount: vaultTokenAccount[0]
    })
    
    .rpc()
    console.log("Initialize staking pool tx: ", tx);
  })

  it("Airdrop tokens", async () => {
    const signer = Keypair.fromSeed(Uint8Array.from([29,63,72,232,25,187,4,43,139,45,57,179,175,128,178,31,33,191,116,250,151,153,210,42,137,219,225,51,74,125,207,2,131,22,179,199,45,12,173,175,121,150,41,126,154,188,79,156,4,209,86,24,182,96,147,9,121,81,115,124,203,127,9,61].slice(0,32)));
    let userTokenAccount = await getOrCreateAssociatedTokenAccount(provider.connection, signer, tokenMint[0],provider.wallet.publicKey)
    const tx = await program.methods.airdrop(new anchor.BN(12))
    
    .accounts({
      tokenMint: tokenMint[0],
      mintAuthority: mintAuthority[0],
      user: signer.publicKey,
      userTokenAccount: userTokenAccount.address,
      rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      systemProgram: SystemProgram.programId,
      tokenProgram: TOKEN_PROGRAM_ID
    })
    .signers([])
    .rpc()
    console.log("Airdrop tx:", tx)
    console.log("Token balance is: ", (await provider.connection.getTokenAccountBalance(userTokenAccount.address)).value.amount);
  })

  it("Airdropping more tokens", async () => {
    const signer = Keypair.fromSeed(Uint8Array.from([29,63,72,232,25,187,4,43,139,45,57,179,175,128,178,31,33,191,116,250,151,153,210,42,137,219,225,51,74,125,207,2,131,22,179,199,45,12,173,175,121,150,41,126,154,188,79,156,4,209,86,24,182,96,147,9,121,81,115,124,203,127,9,61].slice(0,32)));
    let userTokenAccount = await getOrCreateAssociatedTokenAccount(provider.connection, signer, tokenMint[0],provider.wallet.publicKey);
    const tx = await program.methods.airdrop(new anchor.BN(25))
    .accounts({
      tokenMint: tokenMint[0],
      mintAuthority: mintAuthority[0],
      user: signer.publicKey,
      userTokenAccount: userTokenAccount.address,
      rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      systemProgram: SystemProgram.programId,
      tokenProgram: TOKEN_PROGRAM_ID
    })
    .signers([])
    .rpc()
    console.log("Airdrop tx:", tx)
    console.log("Token balance is: ", (await provider.connection.getTokenAccountBalance(userTokenAccount.address)).value.amount);
  })

  it("Create State Account for User", async () => {
    const tx = await program.methods.initializeStateAccount()
    .accounts({
      user: provider.wallet.publicKey,
      systemProgram: SystemProgram.programId,
      stateAccount: stateAccount[0]
    })
    .signers([])
    .rpc()
    console.log("Initialize state account tx: ", tx);
  })

  it("Deposit tokens", async () => {
    const signer = Keypair.fromSeed(Uint8Array.from([29,63,72,232,25,187,4,43,139,45,57,179,175,128,178,31,33,191,116,250,151,153,210,42,137,219,225,51,74,125,207,2,131,22,179,199,45,12,173,175,121,150,41,126,154,188,79,156,4,209,86,24,182,96,147,9,121,81,115,124,203,127,9,61].slice(0,32)));
    let userTokenAccount = await getOrCreateAssociatedTokenAccount(provider.connection, signer, tokenMint[0],provider.wallet.publicKey);
    const tx = await program.methods.deposit(new anchor.BN(10))
    .accounts({
      user: signer.publicKey,
      vaultTokenAccount: vaultTokenAccount[0],
      stakingPool: stakingPool[0],
      tokenProgram: TOKEN_PROGRAM_ID,
      userTokenAccount: userTokenAccount.address,
      stateAccount: await PublicKey.findProgramAddressSync([Buffer.from("state-account"), provider.wallet.publicKey.toBuffer()], program.programId)[0]
    })
    .signers([])
    .rpc()
    console.log("Deposit tx:", tx)
    console.log("User token balance is: ", (await provider.connection.getTokenAccountBalance(userTokenAccount.address)).value.amount);
    console.log("Pool token balance is: ", (await provider.connection.getTokenAccountBalance(vaultTokenAccount[0])).value.amount);
  })

  it("Withdraw tokens", async () => {
    const signer = Keypair.fromSeed(Uint8Array.from([29,63,72,232,25,187,4,43,139,45,57,179,175,128,178,31,33,191,116,250,151,153,210,42,137,219,225,51,74,125,207,2,131,22,179,199,45,12,173,175,121,150,41,126,154,188,79,156,4,209,86,24,182,96,147,9,121,81,115,124,203,127,9,61].slice(0,32)));
    let userTokenAccount = await getOrCreateAssociatedTokenAccount(provider.connection, signer, tokenMint[0],provider.wallet.publicKey);
    const tx = await program.methods.withdraw(new anchor.BN(5))
    .accounts({
      user: signer.publicKey,
      vaultTokenAccount: vaultTokenAccount[0],
      stakingPool: stakingPool[0],
      tokenProgram: TOKEN_PROGRAM_ID,
      userTokenAccount: userTokenAccount.address,
      stateAccount: await PublicKey.findProgramAddressSync([Buffer.from("state-account"), provider.wallet.publicKey.toBuffer()], program.programId)[0],
      poolAuthority: poolAuthority[0],
    })
    .signers([])
    .rpc()
    console.log("Withdraw tx:", tx)
    console.log("User token balance is: ", (await provider.connection.getTokenAccountBalance(userTokenAccount.address)).value.amount);
    console.log("Pool token balance is: ", (await provider.connection.getTokenAccountBalance(vaultTokenAccount[0])).value.amount);
  })

  it("Cannot withdraw more tokens than user has", async () => {
    try {
      const signer = Keypair.fromSeed(Uint8Array.from([29,63,72,232,25,187,4,43,139,45,57,179,175,128,178,31,33,191,116,250,151,153,210,42,137,219,225,51,74,125,207,2,131,22,179,199,45,12,173,175,121,150,41,126,154,188,79,156,4,209,86,24,182,96,147,9,121,81,115,124,203,127,9,61].slice(0,32)));
      let userTokenAccount = await getOrCreateAssociatedTokenAccount(provider.connection, signer, tokenMint[0],provider.wallet.publicKey);
      const tx = await program.methods.withdraw(new anchor.BN(100))
      .accounts({
        user: signer.publicKey,
        vaultTokenAccount: vaultTokenAccount[0],
        stakingPool: stakingPool[0],
        tokenProgram: TOKEN_PROGRAM_ID,
        userTokenAccount: userTokenAccount.address,
        stateAccount: await PublicKey.findProgramAddressSync([Buffer.from("state-account"), provider.wallet.publicKey.toBuffer()], program.programId)[0],
        poolAuthority: poolAuthority[0],
      })
      .signers([])
      .rpc()
  }
  catch (err) {
    assert.equal(err.error.errorMessage, "You do not have enough tokens in your account to make this withdraw")
    return;
  }
  assert.fail("This should have failed when user requests more tokens than they own");
  })
})
