const dotenv = require('dotenv').config();
const axios = require('axios');
const Discord = require('discord.js');

const AugustaInfo = require('./conf/chain.info.augusta');
const ConstantineInfo = require('./conf/chain.info.constantine');
const TitusInfo = require('./conf/chain.info.titus');

const ChainInfo = {
  augusta: AugustaInfo,
  constantine: ConstantineInfo,
  titus: TitusInfo
};

const BlockExplorers = [
  'https://explorer.augusta-1.archway.tech/account/', 
  'https://explorer.constantine-1.archway.tech/account/', 
  'https://explorer.titus-1.archway.tech/account/'
];

DEFAULT_ERROR_MSG = 'I don\'t understand, tell me more 🤔 \n**Example request:** `!faucet archway1znhxr5j4ty5rz09z49thrj7gnxpm9jl5nnmvjx`';
DEFAULT_HELP_MSG = '\n**Usage:** `!faucet {address}` \n**Example request:** `!faucet archway1znhxr5j4ty5rz09z49thrj7gnxpm9jl5nnmvjx`';
DEFAULT_SUCCESS_MSG_PREFIX = 'Your faucet claim has been processed 🎉, check your new balances at: ';
NETWORK_ERROR_MSG_PREFIX = 'Oops, we\'re having trouble connecting to faucet network: ';
NETWORK_ERROR_MSG_SUFFIX = "\nPlease wait a bit and try again 🤔"

// Config parser
let config;
if (dotenv.error) {
  throw dotenv.error
} else {
  config = dotenv.parsed;
}

const client = new Discord.Client();

// console.log(ChainInfo.titus.faucets[0]);
async function faucetClaim(address = null) {
  if (!address) {
    return DEFAULT_ERROR_MSG;
  }
  const apiClient = axios.create();

  let requests = [
    {address: address, coins: ['10000000' + ChainInfo.augusta.currencies[0].coinMinimalDenom]},
    {address: address, coins: ['10000000' + ChainInfo.constantine.currencies[0].coinMinimalDenom]},
    {address: address, coins: ['10000000' + ChainInfo.titus.currencies[0].coinMinimalDenom]}
  ];

  let endpoints = [
    ChainInfo.augusta.faucets[0],
    ChainInfo.constantine.faucets[0],
    ChainInfo.titus.faucets[0]
  ];

  try {
    for (let i = 0; i < requests.length; i++) {
      let res = await apiClient.post(endpoints[i], requests[i]);
      // Network error
      if (res.status !== 200 || !res['data']) {
        console.log('Error parsing result', res);
        return NETWORK_ERROR_MSG_PREFIX + endpoints[i] + NETWORK_ERROR_MSG_SUFFIX;
      }
      // 3x Success
      if (i == (requests.length-1)) {
        let successSuffix = "\n- " + BlockExplorers[0] + address;
        successSuffix += "\n- " + BlockExplorers[1] + address;
        successSuffix += "\n- " +  BlockExplorers[2] + address;
        return DEFAULT_SUCCESS_MSG_PREFIX + successSuffix;
      }
    }
  } catch (e) {
    console.log(e);
    return DEFAULT_ERROR_MSG;
  }

}

client.on('message', async (msg) => {
  // Bot handler
  if (msg.content.substring(0,7) === '!faucet') {
    
    let msgPieces = msg.content.split(' ');
    
    // E.g. !faucet {address}
    if (msgPieces.length !== 2) {
      return msg.reply(DEFAULT_ERROR_MSG);
    } else if (msgPieces[1].substring(0,7) !== 'archway') {
      return msg.reply(DEFAULT_HELP_MSG);
    }

    let userAddress = msgPieces[1].trim();
    let resolvedMsg = await faucetClaim(userAddress);
    return msg.reply(resolvedMsg);
  }
});

client.login(config.DISCORD_TOKEN);
