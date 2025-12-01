import { ethers } from 'hardhat'
import * as fs from 'fs'
import * as path from 'path'

// Import deployed addresses from core
const FACTORY_ADDRESS = '0x7F72e9C9B8E2B7FaD3C2c2dacDCD28797Bbfa182' // NEW v0.8.12 Factory
const WETH9_ADDRESS = '0x4200000000000000000000000000000000000006' // Proper WETH9 contract with deposit/withdraw

interface ContractDeployment {
  name: string
  address: string
  constructorArgs: any[]
  libraries?: { [key: string]: string }
}

interface PeripheryDeployment {
  swapRouter: string
  nonfungiblePositionManager: string
  nonfungibleTokenPositionDescriptor: string
  nftDescriptorLibrary: string
  quoterV2: string
  factory: string
  weth9: string
  deployer: string
  network: string
  chainId: number
  timestamp: string
  contracts: ContractDeployment[]
}

async function main() {
  console.log('🚀 Deploying Uniswap V3 Periphery Contracts to MegaETH Testnet...')
  console.log('='.repeat(70))

  const [deployer] = await ethers.getSigners()
  console.log('\n📍 Deployment Info:')
  console.log('Deployer Address:', deployer.address)

  const balance = await deployer.getBalance()
  console.log('Account Balance:', ethers.utils.formatEther(balance), 'ETH')

  if (balance.lt(ethers.utils.parseEther('0.01'))) {
    console.warn('⚠️  Warning: Low balance. Make sure you have enough ETH for deployment.')
  }

  console.log('\n📋 Using Core Contracts:')
  console.log('Factory:', FACTORY_ADDRESS)
  console.log('WETH9:', WETH9_ADDRESS)

  // // Step 1: Deploy SwapRouter
  // console.log('\n' + '='.repeat(70))
  // console.log('📦 Step 1: Deploying SwapRouter...')
  // console.log('='.repeat(70))

  // const SwapRouter = await ethers.getContractFactory('SwapRouter')
  // const swapRouter = await SwapRouter.deploy(FACTORY_ADDRESS, WETH9_ADDRESS, {
  //   gasPrice: 2000000,
  //   gasLimit: 900000000,
  // })
  // await swapRouter.deployed()

  // console.log('✅ SwapRouter deployed to:', swapRouter.address)
  // console.log('📝 Transaction hash:', swapRouter.deployTransaction.hash)
  // console.log('⏳ Waiting for 3 block confirmations...')
  // await swapRouter.deployTransaction.wait(3)
  // console.log('✅ SwapRouter deployment confirmed!')

  // Step 2: Deploy NFTDescriptor library
  console.log('\n' + '='.repeat(70))
  console.log('📦 Step 2: Deploying NFTDescriptor Library...')
  console.log('='.repeat(70))

  const NFTDescriptorLibrary = await ethers.getContractFactory('NFTDescriptor')
  const nftDescriptorLibrary = await NFTDescriptorLibrary.deploy({
    gasPrice: 2000000,
    gasLimit: 900000000,
  })
  await nftDescriptorLibrary.deployed()

  console.log('✅ NFTDescriptor Library deployed to:', nftDescriptorLibrary.address)
  console.log('📝 Transaction hash:', nftDescriptorLibrary.deployTransaction.hash)
  console.log('⏳ Waiting for 3 block confirmations...')
  await nftDescriptorLibrary.deployTransaction.wait(3)
  console.log('✅ NFTDescriptor Library deployment confirmed!')

  // Step 3: Deploy NonfungibleTokenPositionDescriptor (with library linking)
  console.log('\n' + '='.repeat(70))
  console.log('📦 Step 3: Deploying NonfungibleTokenPositionDescriptor...')
  console.log('='.repeat(70))

  // Link the NFTDescriptor library
  const NonfungibleTokenPositionDescriptor = await ethers.getContractFactory('NonfungibleTokenPositionDescriptor', {
    libraries: {
      NFTDescriptor: nftDescriptorLibrary.address,
    },
  })

  // Convert "ETH" to bytes32 for nativeCurrencyLabel
  const nativeCurrencyLabelBytes = ethers.utils.formatBytes32String('ETH')

  const nftDescriptor = await NonfungibleTokenPositionDescriptor.deploy(WETH9_ADDRESS, nativeCurrencyLabelBytes, {
    gasPrice: 2000000,
    gasLimit: 900000000,
  })
  await nftDescriptor.deployed()

  console.log('✅ NonfungibleTokenPositionDescriptor deployed to:', nftDescriptor.address)
  console.log('📝 Transaction hash:', nftDescriptor.deployTransaction.hash)
  console.log('⏳ Waiting for 3 block confirmations...')
  await nftDescriptor.deployTransaction.wait(3)
  console.log('✅ Descriptor deployment confirmed!')

  // Step 4: Deploy NonfungiblePositionManager
  console.log('\n' + '='.repeat(70))
  console.log('📦 Step 4: Deploying NonfungiblePositionManager...')
  console.log('='.repeat(70))

  const NonfungiblePositionManager = await ethers.getContractFactory('NonfungiblePositionManager')
  const positionManager = await NonfungiblePositionManager.deploy(FACTORY_ADDRESS, WETH9_ADDRESS, nftDescriptor.address, {
    gasPrice: 2000000,
    gasLimit: 900000000,
  })
  await positionManager.deployed()

  console.log('✅ NonfungiblePositionManager deployed to:', positionManager.address)
  console.log('📝 Transaction hash:', positionManager.deployTransaction.hash)
  console.log('⏳ Waiting for 3 block confirmations...')
  await positionManager.deployTransaction.wait(3)
  console.log('✅ Position Manager deployment confirmed!')

  // // Step 5: Deploy QuoterV2
  // console.log('\n' + '='.repeat(70))
  // console.log('📦 Step 5: Deploying QuoterV2...')
  // console.log('='.repeat(70))

  // const QuoterV2 = await ethers.getContractFactory('QuoterV2')
  // const quoterV2 = await QuoterV2.deploy(FACTORY_ADDRESS, WETH9_ADDRESS, {
  //   gasPrice: 2000000,
  //   gasLimit: 900000000,
  // })
  // await quoterV2.deployed()

  // console.log('✅ QuoterV2 deployed to:', quoterV2.address)
  // console.log('📝 Transaction hash:', quoterV2.deployTransaction.hash)
  // console.log('⏳ Waiting for 3 block confirmations...')
  // await quoterV2.deployTransaction.wait(3)
  // console.log('✅ QuoterV2 deployment confirmed!')

  // Save deployment info
  const deploymentInfo: PeripheryDeployment = {
    swapRouter: swapRouter.address,
    nonfungiblePositionManager: positionManager.address,
    nonfungibleTokenPositionDescriptor: nftDescriptor.address,
    nftDescriptorLibrary: nftDescriptorLibrary.address,
    quoterV2: quoterV2.address,
    factory: FACTORY_ADDRESS,
    weth9: WETH9_ADDRESS,
    deployer: deployer.address,
    network: 'MegaETH Testnet',
    chainId: 6343,
    timestamp: new Date().toISOString(),
    contracts: [
      // {
      //   name: 'SwapRouter',
      //   address: swapRouter.address,
      //   constructorArgs: [FACTORY_ADDRESS, WETH9_ADDRESS],
      // },
      {
        name: 'NFTDescriptor',
        address: nftDescriptorLibrary.address,
        constructorArgs: [],
      },
      {
        name: 'NonfungibleTokenPositionDescriptor',
        address: nftDescriptor.address,
        constructorArgs: [WETH9_ADDRESS, nativeCurrencyLabelBytes],
        libraries: { NFTDescriptor: nftDescriptorLibrary.address },
      },
      {
        name: 'NonfungiblePositionManager',
        address: positionManager.address,
        constructorArgs: [FACTORY_ADDRESS, WETH9_ADDRESS, nftDescriptor.address],
      },
      // {
      //   name: 'QuoterV2',
      //   address: quoterV2.address,
      //   constructorArgs: [FACTORY_ADDRESS, WETH9_ADDRESS],
      // },
    ],
  }

  const deploymentPath = path.join(__dirname, '../deployments')
  if (!fs.existsSync(deploymentPath)) {
    fs.mkdirSync(deploymentPath, { recursive: true })
  }

  const filename = `periphery-megaeth-testnet-${Date.now()}.json`
  fs.writeFileSync(path.join(deploymentPath, filename), JSON.stringify(deploymentInfo, null, 2))

  console.log('\n💾 Deployment info saved to:', `deployments/${filename}`)

  // Print verification commands
  console.log('\n📝 Verification Commands:')
  console.log('─'.repeat(70))
  deploymentInfo.contracts.forEach((contract) => {
    console.log(`\n# ${contract.name}`)
    console.log(`npx hardhat verify --network mega-testnet ${contract.address} ${contract.constructorArgs.join(' ')}`)
    if (contract.libraries) {
      console.log(`# Libraries: ${JSON.stringify(contract.libraries)}`)
    }
  })
  console.log('─'.repeat(70))

  // Final Summary
  console.log('\n' + '='.repeat(70))
  console.log('🎉 PERIPHERY DEPLOYMENT COMPLETE!')
  console.log('='.repeat(70))
  console.log('\n📋 Deployment Summary:')
  console.log('─'.repeat(70))
  console.log('Network:                    MegaETH Testnet (Chain ID: 6343)')
  console.log('Deployer:                  ', deployer.address)
  console.log('─'.repeat(70))
  console.log('SwapRouter:                ', swapRouter.address)
  console.log('PositionManager:           ', positionManager.address)
  console.log('PositionDescriptor:        ', nftDescriptor.address)
  console.log('NFTDescriptor Library:     ', nftDescriptorLibrary.address)
  console.log('QuoterV2:                  ', quoterV2.address)
  console.log('─'.repeat(70))
  console.log('Factory (from core):       ', FACTORY_ADDRESS)
  console.log('WETH9:                     ', WETH9_ADDRESS)
  console.log('─'.repeat(70))

  console.log('\n📚 Next Steps:')
  console.log('1. Verify contracts on Blockscout (manually)')
  console.log('2. Create liquidity positions using the PositionManager')
  console.log('3. Execute swaps using the SwapRouter')
  console.log('4. Build a frontend to interact with these contracts')

  console.log('\n💡 Example: Add Liquidity')
  console.log(`   positionManager.mint({`)
  console.log(`     token0: MUSDC,`)
  console.log(`     token1: MWETH,`)
  console.log(`     fee: 3000,`)
  console.log(`     tickLower: -887220,`)
  console.log(`     tickUpper: 887220,`)
  console.log(`     amount0Desired: ...,`)
  console.log(`     amount1Desired: ...,`)
  console.log(`     ...`)
  console.log(`   })`)

  console.log('\n🔗 View on Explorer:')
  console.log(`   SwapRouter: https://megaeth-testnet-v2.blockscout.com/address/${swapRouter.address}`)
  console.log(`   PositionManager: https://megaeth-testnet-v2.blockscout.com/address/${positionManager.address}`)
  console.log(`   Descriptor: https://megaeth-testnet-v2.blockscout.com/address/${nftDescriptor.address}`)
  console.log(`   QuoterV2: https://megaeth-testnet-v2.blockscout.com/address/${quoterV2.address}`)

  console.log('\n' + '='.repeat(70))
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ Deployment failed:', error)
    process.exit(1)
  })
