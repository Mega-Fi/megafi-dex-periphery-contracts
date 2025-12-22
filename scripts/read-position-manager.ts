import { ethers } from 'hardhat'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config()

// ABI for reading state variables
const POSITION_MANAGER_ABI = [
  {
    inputs: [],
    name: 'factory',
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
  {
    inputs: [],
    name: 'WETH9',
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
  {
    inputs: [],
    name: 'name',
    outputs: [
      {
        internalType: 'string',
        name: '',
        type: 'string',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'symbol',
    outputs: [
      {
        internalType: 'string',
        name: '',
        type: 'string',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'totalSupply',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'DOMAIN_SEPARATOR',
    outputs: [
      {
        internalType: 'bytes32',
        name: '',
        type: 'bytes32',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'PERMIT_TYPEHASH',
    outputs: [
      {
        internalType: 'bytes32',
        name: '',
        type: 'bytes32',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'baseURI',
    outputs: [
      {
        internalType: 'string',
        name: '',
        type: 'string',
      },
    ],
    stateMutability: 'pure',
    type: 'function',
  },
]

async function main() {
  // Get contract address from environment variable
  // Usage: POSITION_MANAGER_ADDRESS=0x... npx hardhat run scripts/read-position-manager.ts --network <network>
  const contractAddress = process.env.POSITION_MANAGER_ADDRESS || ''

  if (!contractAddress) {
    console.error('❌ Error: Contract address is required!')
    console.log('\nUsage (inline environment variable):')
    console.log('  POSITION_MANAGER_ADDRESS=0x... npx hardhat run scripts/read-position-manager.ts --network <network>')
    console.log('\nExample:')
    console.log(
      '  POSITION_MANAGER_ADDRESS=0xf2cA31CEfDD5B0814AB728A9C8358747dDd5da83 npx hardhat run scripts/read-position-manager.ts --network megaeth_mainnet'
    )
    console.log('\nOr set POSITION_MANAGER_ADDRESS in your .env file')
    process.exit(1)
  }

  console.log('📖 Reading NonfungiblePositionManager State Variables')
  console.log('='.repeat(70))
  console.log('\n📍 Contract Address:', contractAddress)

  const [signer] = await ethers.getSigners()
  console.log('🔗 Connected from:', signer.address)

  // Get network info
  const network = await ethers.provider.getNetwork()
  console.log('🌐 Network:', network.name, '(Chain ID:', network.chainId.toString() + ')')
  console.log('')

  // Create contract instance
  const positionManager = new ethers.Contract(contractAddress, POSITION_MANAGER_ABI, signer)

  try {
    console.log('📋 Reading State Variables...')
    console.log('─'.repeat(70))

    // Read factory address
    try {
      const factory = await positionManager.factory()
      console.log('✅ Factory Address:', factory)
    } catch (error: any) {
      console.log('❌ Factory Address: Error -', error.message)
    }

    // Read WETH9 address
    try {
      const weth9 = await positionManager.WETH9()
      console.log('✅ WETH9 Address:', weth9)
    } catch (error: any) {
      console.log('❌ WETH9 Address: Error -', error.message)
    }

    // Read name
    try {
      const name = await positionManager.name()
      console.log('✅ Name:', name)
    } catch (error: any) {
      console.log('❌ Name: Error -', error.message)
    }

    // Read symbol
    try {
      const symbol = await positionManager.symbol()
      console.log('✅ Symbol:', symbol)
    } catch (error: any) {
      console.log('❌ Symbol: Error -', error.message)
    }

    // Read total supply
    try {
      const totalSupply = await positionManager.totalSupply()
      console.log('✅ Total Supply:', totalSupply.toString())
    } catch (error: any) {
      console.log('❌ Total Supply: Error -', error.message)
    }

    // Read DOMAIN_SEPARATOR
    try {
      const domainSeparator = await positionManager.DOMAIN_SEPARATOR()
      console.log('✅ DOMAIN_SEPARATOR:', domainSeparator)
    } catch (error: any) {
      console.log('❌ DOMAIN_SEPARATOR: Error -', error.message)
    }

    // Read PERMIT_TYPEHASH
    try {
      const permitTypehash = await positionManager.PERMIT_TYPEHASH()
      console.log('✅ PERMIT_TYPEHASH:', permitTypehash)
    } catch (error: any) {
      console.log('❌ PERMIT_TYPEHASH: Error -', error.message)
    }

    // Read baseURI
    try {
      const baseURI = await positionManager.baseURI()
      console.log('✅ Base URI:', baseURI)
    } catch (error: any) {
      console.log('❌ Base URI: Error -', error.message)
    }

    console.log('─'.repeat(70))
    console.log('\n✅ Successfully read all state variables!')
  } catch (error: any) {
    console.error('\n❌ Error reading contract:', error.message)
    if (error.code === 'CALL_EXCEPTION') {
      console.error('   Make sure the contract address is correct and the contract is deployed on this network.')
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
