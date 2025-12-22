import { ethers } from 'hardhat'
import * as fs from 'fs'
import * as path from 'path'

// Import deployed addresses from core
const FACTORY_ADDRESS = '0xbd4Ca451E3d28d053E7BE2738623Ed3d91709aa3' // NEW v0.8.12 Factory
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

interface DeployOptions {
  gasPrice?: ethers.BigNumber
  defaultGasLimit?: ethers.BigNumber
  confirmations?: number
  bufferPercent?: number
}

/**
 * Helper function to estimate gas and deploy a contract
 */
async function deployWithGasEstimation(
  contractFactory: ethers.ContractFactory,
  deployer: ethers.Signer,
  contractName: string,
  constructorArgs: any[] = [],
  options: DeployOptions = {}
): Promise<ethers.Contract> {
  const {
    gasPrice = ethers.BigNumber.from('1000000'), // 0.001 gwei default
    defaultGasLimit = ethers.BigNumber.from('500000000'), // 500M default
    confirmations = 3,
    bufferPercent = 50, // 50% buffer
  } = options

  console.log(`\n📦 Deploying ${contractName}...`)
  console.log('Using gas price:', ethers.utils.formatUnits(gasPrice, 'gwei'), 'gwei')

  // Estimate gas first
  let gasEstimate
  try {
    const deployData = contractFactory.getDeployTransaction(...constructorArgs)
    gasEstimate = await deployer.provider!.estimateGas({
      data: deployData.data,
      from: await deployer.getAddress(),
    })
    console.log('✅ Estimated gas:', gasEstimate.toString())
  } catch (error: any) {
    console.warn('⚠️  Could not estimate gas:', error.message)
    console.log(`Using default gas limit: ${defaultGasLimit.toString()}`)
  }

  // Use estimated gas + buffer, or default if estimation failed
  const gasLimit = gasEstimate
    ? gasEstimate.mul(100 + bufferPercent).div(100) // Add buffer
    : defaultGasLimit

  console.log('Using gas limit:', gasLimit.toString())
  console.log('')

  // Deploy the contract
  console.log('⏳ Deploying contract...')
  const contract = await contractFactory.deploy(...constructorArgs, {
    gasPrice: gasPrice,
    gasLimit: gasLimit,
  })

  console.log('📝 Transaction hash:', contract.deployTransaction.hash)
  console.log(`⏳ Waiting for ${confirmations} block confirmations...`)
  await contract.deployTransaction.wait(confirmations)
  console.log(`✅ ${contractName} deployed to:`, contract.address)
  console.log(`✅ ${contractName} deployment confirmed!`)

  return contract
}

async function main() {
  console.log('🚀 Deploying Uniswap V3 Periphery Contracts to MegaETH Mainnet...')
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

  // MegaETH mainnet gas settings
  const gasPrice = ethers.BigNumber.from('1000000') // 0.001 gwei

  // // Step 1: Deploy SwapRouter
  // console.log('\n' + '='.repeat(70))
  // console.log('📦 Step 1: Deploying SwapRouter...')
  // console.log('='.repeat(70))

  // const SwapRouter = await ethers.getContractFactory('SwapRouter')
  // const swapRouter = await deployWithGasEstimation(
  //   SwapRouter,
  //   deployer,
  //   'SwapRouter',
  //   [FACTORY_ADDRESS, WETH9_ADDRESS],
  //   { gasPrice }
  // )

  // // Step 2: Deploy NFTDescriptor library
  // console.log('\n' + '='.repeat(70))
  // console.log('📦 Step 2: Deploying NFTDescriptor Library...')
  // console.log('='.repeat(70))

  // const NFTDescriptorLibrary = await ethers.getContractFactory('NFTDescriptor')
  // const nftDescriptorLibrary = await deployWithGasEstimation(
  //   NFTDescriptorLibrary,
  //   deployer,
  //   'NFTDescriptor Library',
  //   [],
  //   { gasPrice }
  // )

  // // Step 3: Deploy NonfungibleTokenPositionDescriptor (with library linking)
  // console.log('\n' + '='.repeat(70))
  // console.log('📦 Step 3: Deploying NonfungibleTokenPositionDescriptor...')
  // console.log('='.repeat(70))

  // // Link the NFTDescriptor library
  // const NonfungibleTokenPositionDescriptor = await ethers.getContractFactory('NonfungibleTokenPositionDescriptor', {
  //   libraries: {
  //     NFTDescriptor: nftDescriptorLibrary.address,
  //   },
  // })

  // // Convert "ETH" to bytes32 for nativeCurrencyLabel
  // const nativeCurrencyLabelBytes = ethers.utils.formatBytes32String('ETH')

  // const nftDescriptor = await deployWithGasEstimation(
  //   NonfungibleTokenPositionDescriptor,
  //   deployer,
  //   'NonfungibleTokenPositionDescriptor',
  //   [WETH9_ADDRESS, nativeCurrencyLabelBytes],
  //   { gasPrice }
  // )

  // // Step 4: Deploy NonfungiblePositionManager
  // console.log('\n' + '='.repeat(70))
  // console.log('📦 Step 4: Deploying NonfungiblePositionManager...')
  // console.log('='.repeat(70))

  // const NonfungiblePositionManager = await ethers.getContractFactory('NonfungiblePositionManager')
  // const positionManager = await deployWithGasEstimation(
  //   NonfungiblePositionManager,
  //   deployer,
  //   'NonfungiblePositionManager',
  //   [FACTORY_ADDRESS, WETH9_ADDRESS, nftDescriptor.address],
  //   { gasPrice }
  // )

  // Step 5: Deploy QuoterV2
  console.log('\n' + '='.repeat(70))
  console.log('📦 Step 5: Deploying QuoterV2...')
  console.log('='.repeat(70))

  const QuoterV2 = await ethers.getContractFactory('QuoterV2')
  const quoterV2 = await deployWithGasEstimation(QuoterV2, deployer, 'QuoterV2', [FACTORY_ADDRESS, WETH9_ADDRESS], {
    gasPrice,
  })

  // Save deployment info
  const deploymentInfo = {
    // swapRouter: swapRouter.address,
    // nonfungiblePositionManager: positionManager.address,
    // nonfungibleTokenPositionDescriptor: nftDescriptor.address,
    // nftDescriptorLibrary: nftDescriptorLibrary.address,
    quoterV2: quoterV2.address,
    factory: FACTORY_ADDRESS,
    weth9: WETH9_ADDRESS,
    deployer: deployer.address,
    network: 'MegaETH Mainnet',
    chainId: 4326,
    timestamp: new Date().toISOString(),
    contracts: [
      // {
      //   name: 'SwapRouter',
      //   address: swapRouter.address,
      //   constructorArgs: [FACTORY_ADDRESS, WETH9_ADDRESS],
      // },
      // {
      //   name: 'NFTDescriptor',
      //   address: nftDescriptorLibrary.address,
      //   constructorArgs: [],
      // },
      // {
      //   name: 'NonfungibleTokenPositionDescriptor',
      //   address: nftDescriptor.address,
      //   constructorArgs: [WETH9_ADDRESS, nativeCurrencyLabelBytes],
      //   libraries: { NFTDescriptor: nftDescriptorLibrary.address },
      // },
      // {
      //   name: 'NonfungiblePositionManager',
      //   address: positionManager.address,
      //   constructorArgs: [FACTORY_ADDRESS, WETH9_ADDRESS, nftDescriptor.address],
      // },
      {
        name: 'QuoterV2',
        address: quoterV2.address,
        constructorArgs: [FACTORY_ADDRESS, WETH9_ADDRESS],
      },
    ],
  }

  const deploymentPath = path.join(__dirname, '../deployments')
  if (!fs.existsSync(deploymentPath)) {
    fs.mkdirSync(deploymentPath, { recursive: true })
  }

  const filename = `periphery-megaeth-mainnet-${Date.now()}.json`
  fs.writeFileSync(path.join(deploymentPath, filename), JSON.stringify(deploymentInfo, null, 2))

  console.log('\n💾 Deployment info saved to:', `deployments/${filename}`)

  // Print verification commands
  console.log('\n📝 Verification Commands:')
  console.log('─'.repeat(70))
  deploymentInfo.contracts.forEach((contract) => {
    console.log(`\n# ${contract.name}`)
    console.log(
      `npx hardhat verify --network megaeth_mainnet ${contract.address} ${contract.constructorArgs.join(' ')}`
    )
    if ((contract as any).libraries) {
      console.log(`# Libraries: ${JSON.stringify((contract as any).libraries)}`)
    }
  })
  console.log('─'.repeat(70))

  // Final Summary
  console.log('\n' + '='.repeat(70))
  console.log('🎉 PERIPHERY DEPLOYMENT COMPLETE!')
  console.log('='.repeat(70))
  console.log('\n📋 Deployment Summary:')
  console.log('─'.repeat(70))
  console.log('Network:                    MegaETH Mainnet (Chain ID: 4326)')
  console.log('Deployer:                  ', deployer.address)
  console.log('─'.repeat(70))
  // console.log('SwapRouter:                ', swapRouter.address)
  // console.log('PositionManager:           ', positionManager.address)
  // console.log('PositionDescriptor:        ', nftDescriptor.address)
  // console.log('NFTDescriptor Library:     ', nftDescriptorLibrary.address)
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
  // console.log(`   SwapRouter: https://megaeth.blockscout.com/address/${swapRouter.address}`)
  // console.log(`   PositionManager: https://megaeth.blockscout.com/address/${positionManager.address}`)
  // console.log(`   Descriptor: https://megaeth.blockscout.com/address/${nftDescriptor.address}`)
  console.log(`   QuoterV2: https://megaeth.blockscout.com/address/${quoterV2.address}`)

  console.log('\n' + '='.repeat(70))
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ Deployment failed:', error)
    process.exit(1)
  })
