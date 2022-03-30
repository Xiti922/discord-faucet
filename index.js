const dotenv = require('dotenv').config();
const axios = require('axios');
const Discord = require('discord.js');

global.Buffer = global.Buffer || require('buffer').Buffer;

const AugustaInfo = require('./conf/chain.info.augusta');
const ConstantineInfo = require('./conf/chain.info.constantine');
const TitusInfo = require('./conf/chain.info.titus');

// Config parser
let config;
if (dotenv.error) {
  throw dotenv.error
} else {
  config = dotenv.parsed;
}

if (typeof btoa === 'undefined') {
  global.btoa = function (str) {
    return Buffer.from(str, 'binary').toString('base64');
  };
}

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

const FaucetAuth = [
  {user: config.AUTH_USER_AUGUSTA, key: config.AUTH_AUGUSTA},
  {user: config.AUTH_USER_CONSTANTINE, key: config.AUTH_CONSTANTINE},
  {user: config.AUTH_USER_TITUS, key: config.AUTH_TITUS}
];

const endpoints = [
  ChainInfo.augusta.faucets[0],
  ChainInfo.constantine.faucets[0],
  ChainInfo.titus.faucets[0]
];

const DEFAULT_ERROR_MSG = 'I don\'t understand, tell me more 🤔 \n**Example request:** `!faucet archway1znhxr5j4ty5rz09z49thrj7gnxpm9jl5nnmvjx`';
const DEFAULT_HELP_MSG = '\n**Usage:** `!faucet {address}` \n**Example request:** `!faucet archway1znhxr5j4ty5rz09z49thrj7gnxpm9jl5nnmvjx`';
const DEFAULT_SUCCESS_MSG_PREFIX = 'Your faucet claim has been processed 🎉, check your new balances at: ';
const DEFAULT_NETWORK_ERROR_MSG = 'Oops, we\'re having trouble connecting to one of the faucet networks.\nPlease wait a bit and try again 🤔';
const NETWORK_ERROR_MSG_PREFIX = 'Request failed to faucet network: ';

const client = new Discord.Client();

async function requestHandler(endpoint, request, headers = null) {
  const apiClient = axios.create();
  let success = false;
  try {
    if (headers) {
      await apiClient.post(endpoint, request, {headers});
    } else {
      await apiClient.post(endpoint, request);
    }
    success = true;
    return success;
  } catch (e) {
    console.log(e, headers);
    return success;
  }
}

async function faucetClaim(address = null) {
  if (!address) {
    return DEFAULT_ERROR_MSG;
  }

  let requests = [
    {address: address, coins: ['10000000' + ChainInfo.augusta.currencies[0].coinMinimalDenom]},
    {address: address, coins: ['10000000' + ChainInfo.constantine.currencies[0].coinMinimalDenom]},
    {address: address, coins: ['10000000' + ChainInfo.titus.currencies[0].coinMinimalDenom]}
  ];

  try {
    let responseMsg = '', successes = 0;
    for (let i = 0; i < requests.length; i++) {
      let headers, success;
      if (FaucetAuth[i].user && FaucetAuth[i].key) {
        headers = {Authorization: 'Basic ' + btoa(FaucetAuth[i].user + ':' + FaucetAuth[i].key)};
        success = await requestHandler(endpoints[i], requests[i], {headers});
      } else {
        success = await requestHandler(endpoints[i], requests[i]);
      }
      // Success / Network error
      if (success) {
        responseMsg += "\n" + DEFAULT_SUCCESS_MSG_PREFIX + "\n- " + BlockExplorers[i] + address;
        ++successes
      } else {
        responseMsg += "\n- " + NETWORK_ERROR_MSG_PREFIX + endpoints[i] + '';
      }
      // Return status replies
      if (i == (requests.length-1)) {
        return responseMsg;
      }
    }
  } catch (e) {
    console.log(e);
    return DEFAULT_NETWORK_ERROR_MSG;
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
