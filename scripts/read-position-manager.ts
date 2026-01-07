import { ethers } from 'hardhat'
import * as dotenv from 'dotenv'
import * as fs from 'fs'
import * as path from 'path'

// Load environment variables
dotenv.config()

// Try to load full ABI from artifacts for better function decoding
let FULL_ABI: any[] = []
try {
  const artifactPath = path.join(
    __dirname,
    '../artifacts/contracts/NonfungiblePositionManager.sol/NonfungiblePositionManager.json'
  )
  if (fs.existsSync(artifactPath)) {
    const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'))
    FULL_ABI = artifact.abi || []
  }
} catch (e) {
  // If we can't load the full ABI, we'll use the minimal one
}

// ABI for reading state variables and multicall
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
  {
    inputs: [
      {
        internalType: 'bytes[]',
        name: 'data',
        type: 'bytes[]',
      },
    ],
    name: 'multicall',
    outputs: [
      {
        internalType: 'bytes[]',
        name: 'results',
        type: 'bytes[]',
      },
    ],
    stateMutability: 'payable',
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
    console.log('\nFor multicall execution:')
    console.log(
      '  MULTICALL_DATA=\'["0x...", "0x..."]\' npx hardhat run scripts/read-position-manager.ts --network <network>'
    )
    console.log('  MULTICALL_EXECUTE=true to execute as transaction (default: simulation)')
    console.log('  MULTICALL_PRIVATE_KEY=0x... to use a specific private key for transactions')
    console.log('  MULTICALL_ADDRESS=0x... to use a specific address (must be in hardhat config)')
    console.log('  MULTICALL_GAS_LIMIT=<number> to set custom gas limit (default: 5M if estimation fails)')
    console.log('\nExample for liquidity provision:')
    console.log(
      '  POSITION_MANAGER_ADDRESS=0x... MULTICALL_EXECUTE=true MULTICALL_PRIVATE_KEY=0x... MULTICALL_DATA=\'["0x...", "0x..."]\' npx hardhat run scripts/read-position-manager.ts --network <network>'
    )
    console.log('\nOr set POSITION_MANAGER_ADDRESS in your .env file')
    process.exit(1)
  }

  console.log('📖 Reading NonfungiblePositionManager State Variables')
  console.log('='.repeat(70))
  console.log('\n📍 Contract Address:', contractAddress)

  // Get custom signer if private key or address is provided
  let signer: ethers.Signer
  const customPrivateKey = process.env.MULTICALL_PRIVATE_KEY || process.env.PRIVATE_KEY
  const customAddress = process.env.MULTICALL_ADDRESS

  if (customPrivateKey) {
    // Use custom private key to create signer
    const wallet = new ethers.Wallet(customPrivateKey, ethers.provider)
    signer = wallet
    console.log('🔑 Using custom private key signer')
    console.log('🔗 Connected from:', signer.address)

    // Verify balance
    const balance = await ethers.provider.getBalance(signer.address)
    console.log('💰 Balance:', ethers.utils.formatEther(balance), 'ETH')
    if (balance.eq(0)) {
      console.log('⚠️  Warning: Account has zero balance. Transaction may fail.')
    }
  } else if (customAddress) {
    // Try to find a signer with this address
    const signers = await ethers.getSigners()
    const matchingSigner = signers.find((s) => s.address.toLowerCase() === customAddress.toLowerCase())
    if (matchingSigner) {
      signer = matchingSigner
      console.log('🔗 Using signer with address:', signer.address)
    } else {
      console.log('⚠️  Warning: Address', customAddress, 'not found in available signers')
      console.log('   Falling back to default signer')
      signer = signers[0]
      console.log('🔗 Connected from:', signer.address)
    }
  } else {
    // Use default signer
    const [defaultSigner] = await ethers.getSigners()
    signer = defaultSigner
    console.log('🔗 Connected from:', signer.address)
  }

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

    // Multicall demonstration
    console.log('\n' + '='.repeat(70))
    console.log('🔄 Multicall Execution')
    console.log('='.repeat(70))

    // Check if multicall data is provided via environment variable
    const multicallDataEnv = process.env.MULTICALL_DATA
    const executeAsTransaction = process.env.MULTICALL_EXECUTE === 'true'

    if (multicallDataEnv) {
      console.log('\n📥 Executing multicall from MULTICALL_DATA environment variable...')
      try {
        // Parse JSON array of hex strings
        const multicallData = JSON.parse(multicallDataEnv)
        if (!Array.isArray(multicallData)) {
          throw new Error('MULTICALL_DATA must be a JSON array of hex strings')
        }

        console.log(`📊 Executing ${multicallData.length} calls via multicall...`)

        // Try to identify function selectors
        console.log('\n🔍 Analyzing calls:')
        console.log('─'.repeat(70))
        const abiToUse = FULL_ABI.length > 0 ? FULL_ABI : POSITION_MANAGER_ABI
        const iface = new ethers.utils.Interface(abiToUse)

        const stateChangingFunctions: string[] = []
        const deadlineWarnings: string[] = []
        const currentTimestamp = Math.floor(Date.now() / 1000)

        multicallData.forEach((data: string, index: number) => {
          if (data && data.length >= 10) {
            const selector = data.slice(0, 10)
            console.log(`Call ${index + 1}: Selector ${selector}`)
            try {
              // Try to find matching function
              const fragment = iface.getFunction(selector)
              if (fragment) {
                const isStateChanging = fragment.stateMutability !== 'view' && fragment.stateMutability !== 'pure'
                if (isStateChanging) {
                  stateChangingFunctions.push(fragment.name)
                }
                console.log(`   Function: ${fragment.name} ${isStateChanging ? '🔴 (state-changing)' : '🟢 (view)'}`)
                try {
                  const decoded = iface.decodeFunctionData(fragment, data)

                  // Check for deadline in mint/increaseLiquidity functions
                  if (fragment.name === 'mint' && decoded.length > 0 && Array.isArray(decoded[0])) {
                    const params = decoded[0]
                    if (params.deadline) {
                      const deadline = ethers.BigNumber.isBigNumber(params.deadline)
                        ? params.deadline.toNumber()
                        : parseInt(params.deadline.toString())
                      const deadlineDate = new Date(deadline * 1000)
                      const isExpired = deadline < currentTimestamp
                      console.log(`   ⏰ Deadline: ${deadline} (${deadlineDate.toISOString()})`)
                      if (isExpired) {
                        const expiredBy = currentTimestamp - deadline
                        deadlineWarnings.push(
                          `Call ${index + 1} (${fragment.name}): Deadline expired ${expiredBy}s ago (${Math.floor(
                            expiredBy / 60
                          )} minutes)`
                        )
                        console.log(`   ⚠️  DEADLINE EXPIRED! Current time: ${currentTimestamp}, Deadline: ${deadline}`)
                      } else {
                        const timeUntilDeadline = deadline - currentTimestamp
                        console.log(`   ✅ Deadline valid (${Math.floor(timeUntilDeadline / 60)} minutes remaining)`)
                      }
                    }
                  } else if (fragment.name === 'increaseLiquidity' && decoded.length > 0 && Array.isArray(decoded[0])) {
                    const params = decoded[0]
                    if (params.deadline) {
                      const deadline = ethers.BigNumber.isBigNumber(params.deadline)
                        ? params.deadline.toNumber()
                        : parseInt(params.deadline.toString())
                      const deadlineDate = new Date(deadline * 1000)
                      const isExpired = deadline < currentTimestamp
                      console.log(`   ⏰ Deadline: ${deadline} (${deadlineDate.toISOString()})`)
                      if (isExpired) {
                        const expiredBy = currentTimestamp - deadline
                        deadlineWarnings.push(
                          `Call ${index + 1} (${fragment.name}): Deadline expired ${expiredBy}s ago (${Math.floor(
                            expiredBy / 60
                          )} minutes)`
                        )
                        console.log(`   ⚠️  DEADLINE EXPIRED! Current time: ${currentTimestamp}, Deadline: ${deadline}`)
                      } else {
                        const timeUntilDeadline = deadline - currentTimestamp
                        console.log(`   ✅ Deadline valid (${Math.floor(timeUntilDeadline / 60)} minutes remaining)`)
                      }
                    }
                  }

                  console.log(
                    `   Args: ${JSON.stringify(
                      decoded,
                      (key, value) => {
                        if (typeof value === 'bigint') return value.toString()
                        if (ethers.BigNumber.isBigNumber(value)) return value.toString()
                        return value
                      },
                      2
                    )}`
                  )
                } catch (e: any) {
                  console.log(`   ⚠️  Could not decode args: ${e.message}`)
                }
              } else {
                console.log(`   ⚠️  Unknown function selector`)
              }
            } catch (e: any) {
              console.log(`   ⚠️  Could not identify function: ${e.message}`)
            }
          } else {
            console.log(`Call ${index + 1}: Invalid data (too short)`)
          }
        })

        // Show deadline warnings
        if (deadlineWarnings.length > 0) {
          console.log('\n⚠️  DEADLINE WARNINGS:')
          console.log('─'.repeat(70))
          deadlineWarnings.forEach((warning) => console.log(`   ${warning}`))
          console.log('─'.repeat(70))
          console.log('💡 Tip: Update the deadline in your multicall data to a future timestamp')
          console.log(`   Current timestamp: ${currentTimestamp}`)
          console.log(`   Suggested deadline: ${currentTimestamp + 3600} (1 hour from now)`)
        }
        console.log('─'.repeat(70))

        // Warn if state-changing operations detected but not executing as transaction
        if (stateChangingFunctions.length > 0 && !executeAsTransaction) {
          console.log(
            `\n⚠️  Warning: Detected ${
              stateChangingFunctions.length
            } state-changing operation(s): ${stateChangingFunctions.join(', ')}`
          )
          console.log('   These operations require actual transactions, not simulations.')
        }

        if (executeAsTransaction) {
          console.log('\n💸 Executing as transaction (not simulation)...')
          console.log('─'.repeat(70))
          console.log('📤 Transaction will be sent from:', await signer.getAddress())

          // Check balance before transaction
          const balance = await ethers.provider.getBalance(await signer.getAddress())
          const gasPrice = await ethers.provider.getGasPrice()
          console.log('💰 Account balance:', ethers.utils.formatEther(balance), 'ETH')
          console.log('⛽ Current gas price:', ethers.utils.formatUnits(gasPrice, 'gwei'), 'gwei')
          console.log('─'.repeat(70))

          try {
            // Estimate gas first
            let gasEstimate
            try {
              gasEstimate = await positionManager.estimateGas.multicall(multicallData)
              console.log(`⛽ Estimated gas: ${gasEstimate.toString()}`)
            } catch (estError: any) {
              console.log(`⚠️  Could not estimate gas: ${estError.message}`)

              // Check for specific error reasons
              if (estError.message.includes('Transaction too old') || estError.reason === 'Transaction too old') {
                console.log('\n🔴 ERROR: Transaction deadline has expired!')
                console.log('   The deadline in your multicall data is in the past.')
                console.log('   You need to regenerate the multicall data with a new deadline.')
                console.log(`   Current timestamp: ${Math.floor(Date.now() / 1000)}`)
                console.log(`   Suggested deadline: ${Math.floor(Date.now() / 1000) + 3600} (1 hour from now)`)
              } else if (estError.message.includes('execution reverted')) {
                console.log('\n🔴 ERROR: Transaction would revert during execution!')
                console.log('   This usually means:')
                console.log('   1. Missing token approvals (approve PositionManager to spend tokens)')
                console.log('   2. Insufficient token balance')
                console.log('   3. Invalid parameters (tick range, amounts, etc.)')
                console.log('   4. Pool already exists with different parameters')

                // Try to decode revert reason if available
                if (estError.data && estError.data !== '0x') {
                  try {
                    if (estError.data.startsWith('0x08c379a0')) {
                      const decoded = ethers.utils.defaultAbiCoder.decode(['string'], '0x' + estError.data.slice(10))
                      console.log(`   Revert reason: ${decoded[0]}`)
                    }
                  } catch (e) {
                    // Can't decode, that's okay
                  }
                }
              }

              console.log('   Proceeding with default gas limit (5M gas)...')
              console.log('   💡 Tip: Set MULTICALL_GAS_LIMIT=<number> to use a custom gas limit')
            }

            // Use custom gas limit if provided, otherwise use estimate or reasonable default
            const customGasLimit = process.env.MULTICALL_GAS_LIMIT
              ? ethers.BigNumber.from(process.env.MULTICALL_GAS_LIMIT)
              : null

            const defaultGasLimit = ethers.BigNumber.from('1000000') // 5M gas - reasonable default for multicall
            const gasLimit = customGasLimit || (gasEstimate ? gasEstimate.mul(120).div(100) : defaultGasLimit)

            console.log(`⛽ Using gas limit: ${gasLimit.toString()}`)

            // Calculate and show estimated cost
            const estimatedCost = gasPrice.mul(gasLimit)
            console.log(`💵 Estimated cost: ${ethers.utils.formatEther(estimatedCost)} ETH`)

            // Warn if cost is high
            if (estimatedCost.gt(ethers.utils.parseEther('0.1'))) {
              console.log(`⚠️  Warning: Estimated cost is high (${ethers.utils.formatEther(estimatedCost)} ETH)`)
              console.log('   Consider checking if gas estimation failed and transaction will actually succeed')
            }

            const tx = await positionManager.multicall(multicallData, {
              gasLimit: gasLimit,
            })
            console.log('📝 Transaction hash:', tx.hash)
            console.log('⏳ Waiting for confirmation...')
            const receipt = await tx.wait()
            console.log(`✅ Transaction confirmed in block ${receipt.blockNumber}`)
            console.log(`⛽ Gas used: ${receipt.gasUsed.toString()}`)

            // Calculate actual cost
            const actualCost = receipt.gasUsed.mul(receipt.effectiveGasPrice || gasPrice)
            console.log(`💵 Transaction cost: ${ethers.utils.formatEther(actualCost)} ETH`)

            // Try to decode events if any
            if (receipt.logs && receipt.logs.length > 0) {
              console.log(`\n📋 Emitted ${receipt.logs.length} event(s)`)
            }
          } catch (txError: any) {
            console.error('❌ Transaction failed:', txError.message)
            if (txError.transaction) {
              console.log('   Transaction hash:', txError.transaction.hash)
            }
            if (txError.receipt) {
              console.log('   Block:', txError.receipt.blockNumber)
            }

            // Check if it's a balance issue
            if (txError.message.includes('insufficient funds') || txError.code === 'INSUFFICIENT_FUNDS') {
              console.log('\n💡 INSUFFICIENT FUNDS ERROR:')
              console.log('─'.repeat(70))

              // Try to extract the amounts from the error
              const errorMatch = txError.message.match(/have (\d+) want (\d+)/)
              if (errorMatch) {
                const have = ethers.BigNumber.from(errorMatch[1])
                const want = ethers.BigNumber.from(errorMatch[2])
                const shortfall = want.sub(have)
                console.log(`   Current balance: ${ethers.utils.formatEther(have)} ETH`)
                console.log(`   Required: ${ethers.utils.formatEther(want)} ETH`)
                console.log(`   Shortfall: ${ethers.utils.formatEther(shortfall)} ETH`)
                console.log(`\n   You need to add at least ${ethers.utils.formatEther(shortfall)} ETH to this account`)
              } else {
                console.log('   Ensure the account has sufficient ETH for gas fees')
              }
              console.log('─'.repeat(70))
            }

            // Check for deadline errors
            if (txError.message.includes('Transaction too old') || txError.reason === 'Transaction too old') {
              console.log('\n🔴 DEADLINE ERROR:')
              console.log('─'.repeat(70))
              console.log('   The transaction deadline has expired.')
              console.log('   You need to regenerate the multicall data with a new deadline.')
              console.log(`   Current timestamp: ${Math.floor(Date.now() / 1000)}`)
              console.log(`   Suggested deadline: ${Math.floor(Date.now() / 1000) + 3600} (1 hour from now)`)
              console.log('─'.repeat(70))
            }

            throw txError
          }
        } else {
          console.log('\n🔍 Simulating multicall (callStatic)...')
          try {
            const results = await positionManager.callStatic.multicall(multicallData)
            console.log(`✅ Multicall simulation successful! Received ${results.length} results`)

            console.log('\n📋 Results:')
            console.log('─'.repeat(70))
            results.forEach((result: string, index: number) => {
              console.log(`Call ${index + 1}: ${result}`)
              if (result && result !== '0x') {
                // Try to decode if we can identify the function
                try {
                  const selector = multicallData[index]?.slice(0, 10)
                  if (selector) {
                    const abiToUse = FULL_ABI.length > 0 ? FULL_ABI : POSITION_MANAGER_ABI
                    const decodeIface = new ethers.utils.Interface(abiToUse)
                    const fragment = decodeIface.getFunction(selector)
                    if (fragment) {
                      const decoded = decodeIface.decodeFunctionResult(fragment, result)
                      console.log(
                        `   Decoded: ${JSON.stringify(
                          decoded,
                          (key, value) => {
                            if (typeof value === 'bigint') return value.toString()
                            if (ethers.BigNumber.isBigNumber(value)) return value.toString()
                            return value
                          },
                          2
                        )}`
                      )
                    }
                  }
                } catch (e) {
                  // Can't decode, that's okay
                }
              }
            })
          } catch (simError: any) {
            console.error('❌ Multicall simulation failed:', simError.message)

            // Check if we detected state-changing operations
            if (stateChangingFunctions.length > 0) {
              console.log(`\n🔴 Detected state-changing operations: ${stateChangingFunctions.join(', ')}`)
              console.log('   These cannot be simulated and must be executed as transactions.')
            }

            console.log('\n💡 To execute as a transaction, run:')
            console.log(
              `   MULTICALL_EXECUTE=true MULTICALL_DATA='${multicallDataEnv}' npx hardhat run scripts/read-position-manager.ts --network <network>`
            )

            // Try to get more details about the error
            if (simError.data && simError.data !== '0x') {
              console.log('\n📋 Error data:', simError.data)
              // Try to decode error if it's a standard revert
              try {
                if (simError.data.startsWith('0x08c379a0')) {
                  // Error(string) selector
                  const decoded = ethers.utils.defaultAbiCoder.decode(['string'], '0x' + simError.data.slice(10))
                  console.log('   Decoded error message:', decoded[0])
                } else if (simError.data.startsWith('0x4e487b71')) {
                  // Panic(uint256) selector
                  const panicCode = ethers.BigNumber.from('0x' + simError.data.slice(10))
                  console.log('   Panic code:', panicCode.toString())
                }
              } catch (e) {
                // Can't decode, that's okay
              }
            }

            // Check common failure reasons
            console.log('\n🔍 Common reasons for failure:')
            console.log('   1. Missing token approvals (ERC20 approve needed)')
            console.log('   2. Insufficient token balance')
            console.log('   3. Insufficient ETH balance (for WETH operations)')
            console.log('   4. Invalid parameters (tick range, amounts, etc.)')
            console.log('   5. Deadline expired')
            console.log("   6. Pool doesn't exist or not initialized")

            if (simError.transaction) {
              console.log('\n📋 Transaction would be sent from:', simError.transaction.from)
              console.log('   To:', simError.transaction.to)
            }
          }
        }
      } catch (error: any) {
        console.error('❌ Error executing multicall:', error.message)
        if (error.code === 'CALL_EXCEPTION') {
          console.error('\n💡 This might be because:')
          console.error('   1. One of the calls in multicall is reverting')
          console.error('   2. The function requires a transaction (not simulation)')
          console.error('   3. Missing approvals or insufficient balance')
          console.error('\n   Try: MULTICALL_EXECUTE=true to execute as a transaction')
        }
      }
    } else {
      // Demonstrate multicall by batching multiple read calls
      console.log('\n💡 Demonstrating multicall by batching read operations...')
      try {
        const iface = new ethers.utils.Interface(POSITION_MANAGER_ABI)

        // Encode multiple function calls
        const calls = [
          iface.encodeFunctionData('factory'),
          iface.encodeFunctionData('WETH9'),
          iface.encodeFunctionData('name'),
          iface.encodeFunctionData('symbol'),
          iface.encodeFunctionData('totalSupply'),
        ]

        console.log(`📊 Executing ${calls.length} calls via multicall...`)
        const startTime = Date.now()
        const results = await positionManager.callStatic.multicall(calls)
        const endTime = Date.now()

        console.log(`✅ Multicall executed successfully in ${endTime - startTime}ms!`)
        console.log(`📊 Received ${results.length} results`)

        console.log('\n📋 Decoded Results:')
        console.log('─'.repeat(70))

        // Decode and display results
        const factory = iface.decodeFunctionResult('factory', results[0])
        const weth9 = iface.decodeFunctionResult('WETH9', results[1])
        const name = iface.decodeFunctionResult('name', results[2])
        const symbol = iface.decodeFunctionResult('symbol', results[3])
        const totalSupply = iface.decodeFunctionResult('totalSupply', results[4])

        console.log('✅ Factory:', factory[0])
        console.log('✅ WETH9:', weth9[0])
        console.log('✅ Name:', name[0])
        console.log('✅ Symbol:', symbol[0])
        console.log('✅ Total Supply:', totalSupply[0].toString())

        console.log('\n💡 To execute custom multicall data, set MULTICALL_DATA environment variable:')
        console.log(
          '   MULTICALL_DATA=\'["0x...", "0x..."]\' npx hardhat run scripts/read-position-manager.ts --network <network>'
        )
        console.log('   Where each string is the encoded function data (hex string)')
      } catch (error: any) {
        console.error('❌ Error executing multicall demonstration:', error.message)
        if (error.code === 'CALL_EXCEPTION') {
          console.error('   This might be a view function call issue. Trying with transaction simulation...')
        }
      }
    }
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
