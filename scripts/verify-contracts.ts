import { ethers } from 'hardhat'
import * as fs from 'fs'
import * as path from 'path'

async function main() {
  console.log('🔍 Verifying Deployed Contracts on MegaETH Mainnet')
  console.log('='.repeat(80))
  console.log('')

  // Load the most recent deployment
  const deploymentsPath = path.join(__dirname, '../deployments')
  const deploymentFiles = fs
    .readdirSync(deploymentsPath)
    .filter((f) => f.includes('megaeth-mainnet') && f.endsWith('.json'))
    .sort()
    .reverse()

  if (deploymentFiles.length === 0) {
    console.error('❌ No deployment files found!')
    process.exit(1)
  }

  const latestDeployment = JSON.parse(fs.readFileSync(path.join(deploymentsPath, deploymentFiles[0]), 'utf8'))

  console.log('📋 Latest Deployment:')
  console.log('─'.repeat(80))
  console.log('File:', deploymentFiles[0])
  console.log('Timestamp:', latestDeployment.timestamp)
  console.log('Network:', latestDeployment.network)
  console.log('Chain ID:', latestDeployment.chainId)
  console.log('')

  const contracts = latestDeployment.contracts || []

  if (contracts.length === 0) {
    console.error('❌ No contracts found in deployment file!')
    process.exit(1)
  }

  console.log('📦 Contracts to Verify:')
  console.log('─'.repeat(80))
  contracts.forEach((contract: any) => {
    console.log(`  ${contract.name}: ${contract.address}`)
  })
  console.log('')

  // Check if hardhat-verify is available
  try {
    require.resolve('@nomiclabs/hardhat-etherscan')
  } catch {
    console.log('⚠️  @nomiclabs/hardhat-etherscan not found')
    console.log('   Install it with: npm install --save-dev @nomiclabs/hardhat-etherscan')
    console.log('')
    console.log('📋 Manual Verification Commands:')
    console.log('─'.repeat(80))
    contracts.forEach((contract: any) => {
      console.log('')
      console.log(`# ${contract.name}`)
      console.log(`npx hardhat verify --network megaeth_mainnet \\`)
      console.log(`  ${contract.address} \\`)
      if (contract.constructorArgs && contract.constructorArgs.length > 0) {
        contract.constructorArgs.forEach((arg: any) => {
          console.log(`  ${typeof arg === 'string' ? `"${arg}"` : arg} \\`)
        })
      }
      if (contract.libraries) {
        console.log(`  --libraries ${JSON.stringify(contract.libraries)}`)
      } else {
        console.log('')
      }
    })
    process.exit(0)
  }

  console.log('🔍 Verifying Contracts...')
  console.log('─'.repeat(80))
  console.log('')

  const hre = require('hardhat')

  for (const contract of contracts) {
    console.log(`\n📝 Verifying ${contract.name}...`)
    console.log('   Address:', contract.address)
    console.log('   Constructor Args:', contract.constructorArgs || [])
    if (contract.libraries) {
      console.log('   Libraries:', JSON.stringify(contract.libraries))
    }

    try {
      await hre.run('verify:verify', {
        address: contract.address,
        constructorArguments: contract.constructorArgs || [],
        libraries: contract.libraries || {},
      })
      console.log(`   ✅ ${contract.name} verified successfully!`)
    } catch (error: any) {
      if (error.message.includes('Already Verified')) {
        console.log(`   ✅ ${contract.name} already verified!`)
      } else {
        console.log(`   ❌ ${contract.name} verification failed:`)
        console.log(`      ${error.message}`)
        console.log('')
        console.log('   Manual verification command:')
        console.log(
          `   npx hardhat verify --network megaeth_mainnet ${contract.address} ${(contract.constructorArgs || []).join(
            ' '
          )}`
        )
        if (contract.libraries) {
          console.log(`   --libraries ${JSON.stringify(contract.libraries)}`)
        }
      }
    }
  }

  console.log('\n' + '='.repeat(80))
  console.log('🎉 Verification Complete!')
  console.log('='.repeat(80))
  console.log('')

  console.log('📋 Contract Addresses:')
  console.log('─'.repeat(80))
  contracts.forEach((contract: any) => {
    console.log(`${contract.name}:`)
    console.log(`  Address: ${contract.address}`)
    console.log(`  Explorer: https://megaeth.blockscout.com/address/${contract.address}`)
    console.log('')
  })

  console.log('🔗 View on Blockscout:')
  console.log('─'.repeat(80))
  contracts.forEach((contract: any) => {
    console.log(`  ${contract.name}: https://megaeth.blockscout.com/address/${contract.address}`)
  })
  console.log('')
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ Verification failed:', error)
    process.exit(1)
  })
