#!/usr/bin/env node

const logger = require('./logger');

logger.info('Initializing Discord faucet bot...');

const axios = require('axios');
const Discord = require('discord.js');

const dotenv = require('dotenv').config();
if (dotenv.error) {
  throw dotenv.error
}
const config = dotenv.parsed;

const DEFAULT_ERROR_MSG = 'I don\'t understand, tell me more 🤔 \n**Example request:** `!faucet archway1znhxr5j4ty5rz09z49thrj7gnxpm9jl5nnmvjx`';
const DEFAULT_HELP_MSG = '\n**Usage:** `!faucet {address}` \n**Example request:** `!faucet archway1znhxr5j4ty5rz09z49thrj7gnxpm9jl5nnmvjx`';

class Chain {
  constructor(chainName) {
    this.chainName = chainName;

    const chainInfo = require(`./conf/chain.info.${chainName}`);
    this.explorer = `https://explorer.${chainName}-1.archway.tech/account`;
    this.coinMinimalDenom = chainInfo.currencies[0].coinMinimalDenom;

    const auth = {
      username: config[`AUTH_USER_${chainName.toUpperCase()}`],
      password: config[`AUTH_${chainName.toUpperCase()}`]
    };

    this.faucet = axios.create({
      baseURL: chainInfo.faucets[0],
      timeout: 5 * 60 * 1000, // 5 minutes,
      auth
    });

    logger.debug(`Chain ${chainName} initialized`);
  }

  async faucetClaim(address) {
    await this.faucet.post('/', {
      address,
      coins: [`10000000${this.coinMinimalDenom}`]
    });
  }
}

const Chains = ['augusta', 'constantine', 'titus'].map(chainName => new Chain(chainName));

async function faucetClaim(address, metadata) {
  const faucetLogger = logger.child({ address, ...metadata });
  faucetLogger.info(`Requesting funds`);
  faucetProfiler = faucetLogger.startTimer();

  const requests = Chains.map(async chain => {
    const { chainName } = chain;
    const chainLogger = faucetLogger.child({ chainName });
    const chainProfiler = chainLogger.startTimer();
    try {
      chainLogger.info('Sending claim request');
      await chain.faucetClaim(address);
      return `- Faucet claim was processed 🎉, check your new balances at: ${chain.explorer}/${address}`;
    } catch (e) {
      chainLogger.error('Claim request failed', { reason: e });
      return `- Request to faucet on ${chain.chainName} network failed`;
    } finally {
      chainProfiler.done('Claim request finished');
    }
  });

  const messages = await Promise.all(requests);
  faucetProfiler.done('Faucet request finished');

  return `\n${messages.join('\n')}`;
}

function isArchwayAddress(address) {
  const regexp = new RegExp('^(archway)1([a-z0-9]+)$');
  return regexp.test(address);
}

const client = new Discord.Client();

client.on('ready', () => {
  logger.info(`Logged in as ${client.user.tag}! Waiting for messages...`);
});

// Bot handler
// Usage: !faucet {address}
client.on('message', async message => {
  const {
    id: messageId,
    channel: { name: channelName = '' } = {},
    author: { username: authorUsername } = {},
    content: messageContent = ''
  } = message;

  logger.verbose(`Message received`, { messageId, channelName, authorUsername, messageContent });

  if (!channelName.endsWith('faucet')) return;

  const content = messageContent.trim().split(' ');
  const [command, address] = content;
  if (command !== '!faucet') return;

  if (content.length !== 2) {
    return message.reply(DEFAULT_ERROR_MSG);
  }
  if (!isArchwayAddress(address)) {
    return message.reply(DEFAULT_HELP_MSG);
  }

  let claimResponse = await faucetClaim(address, { messageId, authorUsername });
  return message.reply(claimResponse);
});

client.login(config.DISCORD_TOKEN);
