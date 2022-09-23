require('dotenv').config()
const axios = require('axios')
const Contract = require('web3-eth-contract')
const { ethers } = require('ethers')

const contractAddress = process.env.CONTRACT_ADDRESS
const contrancABI = require('./abi.json')

const GAS_PRICE = '20000000000'
//console.log(abi)
//const usdcContract = new web3.eth.Contract(contrancABI.abi, contractAddress)
Contract.setProvider(process.env.SHINE_WS)
const contract = new Contract(contrancABI.abi, contractAddress)
// console.log(contract.events)
const provider = new ethers.providers.JsonRpcProvider(process.env.SHINE_RPC)
let signer = new ethers.Wallet(process.env.ACCOUNT_PRIVATE_KEY, provider)
const usdcContract = new ethers.Contract(
  contractAddress,
  contrancABI.abi,
  signer,
)

const fetchPriceFeed = async () => {
  const priceData = await axios.get('https://api.coincap.io/v2/assets/tether')
  if (!!priceData) {
    //console.log(`Price data is ${priceData.data.data.priceUsd * 1e18}`)
    return priceData.data && priceData.data.data.priceUsd * 1e18
  } else {
    return null
  }
}

contract.events.NewJob({}, async (err, event) => {
  if (err) {
    return console.log(`error: ${err}`)
  }
  try {
    //console.log(event)
    const jobId = event.returnValues.jobId
    console.log(`jobId: ${jobId}`)
    const data = await fetchPriceFeed()

    console.log(`data: ${data}`)
    if (!!data) {
      const tx = await usdcContract.updatePrice(data.toString(), jobId, {
        gasPrice: GAS_PRICE,
      })
      const receipt = await tx.wait()

      console.log(`Transaction Done, receipt: ${receipt.transactionHash}`)
    }
  } catch (error) {
    console.log(`error: ${error}`)
  }
})
