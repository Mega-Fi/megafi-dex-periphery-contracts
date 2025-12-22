import { ethers } from 'hardhat'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config()

// ABI for reading position data
const POSITION_MANAGER_ABI = [
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'tokenId',
        type: 'uint256',
      },
    ],
    name: 'positions',
    outputs: [
      {
        internalType: 'uint96',
        name: 'nonce',
        type: 'uint96',
      },
      {
        internalType: 'address',
        name: 'operator',
        type: 'address',
      },
      {
        internalType: 'address',
        name: 'token0',
        type: 'address',
      },
      {
        internalType: 'address',
        name: 'token1',
        type: 'address',
      },
      {
        internalType: 'uint24',
        name: 'fee',
        type: 'uint24',
      },
      {
        internalType: 'int24',
        name: 'tickLower',
        type: 'int24',
      },
      {
        internalType: 'int24',
        name: 'tickUpper',
        type: 'int24',
      },
      {
        internalType: 'uint128',
        name: 'liquidity',
        type: 'uint128',
      },
      {
        internalType: 'uint256',
        name: 'feeGrowthInside0LastX128',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'feeGrowthInside1LastX128',
        type: 'uint256',
      },
      {
        internalType: 'uint128',
        name: 'tokensOwed0',
        type: 'uint128',
      },
      {
        internalType: 'uint128',
        name: 'tokensOwed1',
        type: 'uint128',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'tokenId',
        type: 'uint256',
      },
    ],
    name: 'ownerOf',
    outputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
]

async function main() {
  // Get contract address and token ID from environment variables
  // Usage: POSITION_MANAGER_ADDRESS=0x... TOKEN_ID=1 npx hardhat run scripts/read-position.ts --network <network>
  const contractAddress = process.env.POSITION_MANAGER_ADDRESS || ''
  const tokenId = process.env.TOKEN_ID || ''

  if (!contractAddress) {
    console.error('❌ Error: Contract address is required!')
    console.log('\nUsage (inline environment variables):')
    console.log(
      '  POSITION_MANAGER_ADDRESS=0x... TOKEN_ID=1 npx hardhat run scripts/read-position.ts --network <network>'
    )
    console.log('\nExample:')
    console.log(
      '  POSITION_MANAGER_ADDRESS=0xf2cA31CEfDD5B0814AB728A9C8358747dDd5da83 TOKEN_ID=1 npx hardhat run scripts/read-position.ts --network megaeth_mainnet'
    )
    console.log('\nOr set POSITION_MANAGER_ADDRESS and TOKEN_ID in your .env file')
    process.exit(1)
  }

  if (!tokenId) {
    console.error('❌ Error: Token ID is required!')
    console.log('\nUsage (inline environment variables):')
    console.log(
      '  POSITION_MANAGER_ADDRESS=0x... TOKEN_ID=1 npx hardhat run scripts/read-position.ts --network <network>'
    )
    console.log('\nExample:')
    console.log(
      '  POSITION_MANAGER_ADDRESS=0xf2cA31CEfDD5B0814AB728A9C8358747dDd5da83 TOKEN_ID=1 npx hardhat run scripts/read-position.ts --network megaeth_mainnet'
    )
    process.exit(1)
  }

  console.log('📖 Reading NFT Position Data')
  console.log('='.repeat(70))
  console.log('\n📍 Contract Address:', contractAddress)
  console.log('🆔 Token ID:', tokenId)

  const [signer] = await ethers.getSigners()
  console.log('🔗 Connected from:', signer.address)

  // Get network info
  const network = await ethers.provider.getNetwork()
  console.log('🌐 Network:', network.name, '(Chain ID:', network.chainId.toString() + ')')
  console.log('')

  // Create contract instance
  const positionManager = new ethers.Contract(contractAddress, POSITION_MANAGER_ABI, signer)

  try {
    console.log('📋 Reading Position Data...')
    console.log('─'.repeat(70))

    // Read owner
    try {
      const owner = await positionManager.ownerOf(tokenId)
      console.log('✅ Owner:', owner)
    } catch (error: any) {
      console.log('❌ Owner: Error -', error.message)
    }

    // Read position data
    try {
      const position = await positionManager.positions(tokenId)
      console.log('\n📊 Position Details:')
      console.log('  Nonce:', position.nonce.toString())
      console.log('  Operator:', position.operator)
      console.log('  Token0:', position.token0)
      console.log('  Token1:', position.token1)
      console.log('  Fee:', position.fee.toString(), '(0.01% = 100, 0.05% = 500, 0.3% = 3000, 1% = 10000)')
      console.log('  Tick Lower:', position.tickLower.toString())
      console.log('  Tick Upper:', position.tickUpper.toString())
      console.log('  Liquidity:', position.liquidity.toString())
      console.log('  Fee Growth Inside 0 Last X128:', position.feeGrowthInside0LastX128.toString())
      console.log('  Fee Growth Inside 1 Last X128:', position.feeGrowthInside1LastX128.toString())
      console.log('  Tokens Owed 0:', position.tokensOwed0.toString())
      console.log('  Tokens Owed 1:', position.tokensOwed1.toString())
    } catch (error: any) {
      console.log('❌ Position Data: Error -', error.message)
    }

    console.log('─'.repeat(70))
    console.log('\n✅ Successfully read position data!')
  } catch (error: any) {
    console.error('\n❌ Error reading contract:', error.message)
    if (error.code === 'CALL_EXCEPTION') {
      console.error('   Make sure the contract address and token ID are correct.')
    }
    process.exit(1)
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ Script failed:', error)
    process.exit(1)
  })
