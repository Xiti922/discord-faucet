# Archway Faucet Discord Bot

## Setup 
```bash
git clone git@github.com:archway-network/discord-faucet.git
cd discord-faucet
cp env.example .env
# Now edit .env to add the Discord auth token for your server
npm install
```

## Configure as a system service and start the bot
```bash
sudo cp .systemctl.service /etc/systemd/system/discordfaucet.service
# Start service
sudo systemctl start discordfaucet
# Enable service on startup
sudo systemctl enable discordfaucet
```

## Add the bot to your Discord server
- https://discordjs.guide/preparations/setting-up-a-bot-application.html
- https://discordjs.guide/preparations/adding-your-bot-to-servers.html

## Using the bot

After adding the bot to your Discord server, the `!faucet` command will become available to any channels where the bot can read and send messages.

Command Examples:
```bash
!faucet --help

# Outputs:
> Archway Faucet BOT — Today at 2:18 PM
> @Drew | Archway, 
> Usage: !faucet {address} 
> Example request: !faucet archway1znhxr5j4ty5rz09z49thrj7gnxpm9jl5nnmvjx

!faucet archway1znhxr5j4ty5rz09z49thrj7gnxpm9jl5nnmvjx

# Outputs:
> Archway Faucet BOT — Today at 2:08 PM
> @Drew | Archway, Your faucet claim has been processed 🎉, check your new balances at: 
- https://explorer.augusta-1.archway.tech/account/archway1znhxr5j4ty5rz09z49thrj7gnxpm9jl5nnmvjx
- https://explorer.constantine-1.archway.tech/account/archway1znhxr5j4ty5rz09z49thrj7gnxpm9jl5nnmvjx
- https://explorer.titus-1.archway.tech/account/archway1znhxr5j4ty5rz09z49thrj7gnxpm9jl5nnmvjx
```
