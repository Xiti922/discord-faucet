#!/usr/bin/env node

const dotenv = require('dotenv').config();
const axios = require('axios');
const Discord = require('discord.js');

const AugustaInfo = require('./conf/chain.info.augusta');
const ConstantineInfo = require('./conf/chain.info.constantine');
const TitusInfo = require('./conf/chain.info.titus');

// Config parser
if (dotenv.error) {
  throw dotenv.error
}

const config = dotenv.parsed;

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
  { user: config.AUTH_USER_AUGUSTA, key: config.AUTH_AUGUSTA },
  { user: config.AUTH_USER_CONSTANTINE, key: config.AUTH_CONSTANTINE },
  { user: config.AUTH_USER_TITUS, key: config.AUTH_TITUS }
];

const endpoints = [
  ChainInfo.augusta.faucets[0],
  ChainInfo.constantine.faucets[0],
  ChainInfo.titus.faucets[0]
];

const DEFAULT_ERROR_MSG = 'I don\'t understand, tell me more 🤔 \n**Example request:** `!faucet archway1znhxr5j4ty5rz09z49thrj7gnxpm9jl5nnmvjx`';
const DEFAULT_HELP_MSG = '\n**Usage:** `!faucet {address}` \n**Example request:** `!faucet archway1znhxr5j4ty5rz09z49thrj7gnxpm9jl5nnmvjx`';
const DEFAULT_SUCCESS_MSG_PREFIX = 'Faucet claim was processed 🎉, check your new balances at: ';
const DEFAULT_NETWORK_ERROR_MSG = 'Oops, we\'re having trouble connecting to one of the faucet networks.\nPlease wait a bit and try again 🤔';
const NETWORK_ERROR_MSG_PREFIX = 'Request failed to faucet network: ';

const client = new Discord.Client();

async function requestHandler(endpoint, request, headers = null) {
  const apiClient = axios.create();
  try {
    if (headers) {
      await apiClient.post(endpoint, request, headers);
    } else {
      await apiClient.post(endpoint, request);
    }
    return true;
  } catch (e) {
    console.log(e, headers);
    return false;
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
    let responseMsg = '';

    for (let i = 0; i < requests.length; i++) {
      const headers = {
        auth: {
          username: FaucetAuth[i].user,
          password: FaucetAuth[i].key
        }
      };
      const success = await requestHandler(endpoints[i], requests[i], headers);
      // Success / Network error
      if (success) {
        responseMsg += "\n- " + DEFAULT_SUCCESS_MSG_PREFIX + " " + BlockExplorers[i] + address;
      } else {
        responseMsg += "\n- " + NETWORK_ERROR_MSG_PREFIX + endpoints[i] + '';
      }
      // Return status replies
      if (i == (requests.length - 1)) {
        return responseMsg;
      }
    }
  } catch (e) {
    // console.log(e);
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
