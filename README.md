# AFK Bots for minechat.levyathan.ch

## Setup (on your VM)
1. Install Node.js 18+ (`curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt install -y nodejs`)
2. `git clone <your repo> && cd afk-bots && npm install`
3. `cp accounts.example.json accounts.json` and edit it (this file is git-ignored, never commit it).
4. First run: `node index.js`. For `microsoft` accounts, the console prints a link + code per account. Open it and sign in once; the token is cached in `profiles/`.
5. Run 24/7:
   - PM2: `sudo npm i -g pm2 && pm2 start ecosystem.config.js && pm2 save && pm2 startup`
   - or Docker: `docker build -t afk-bots . && docker run -d --restart=always -v $(pwd)/accounts.json:/app/accounts.json -v $(pwd)/profiles:/app/profiles afk-bots`

## Quick start: 20 bots with realistic names
1. `cp proxies.example.txt proxies.txt` and put 20 SOCKS5 proxies in it (one per line).
2. `node gen-accounts.js 20` (add a password as 2nd arg if the server uses /login: `node gen-accounts.js 20 MyPass123`)
3. `npm install && node index.js`
Optional: put your own names in `names.txt` (one per line, 3-16 letters/numbers/underscore). They are used first; any missing ones are auto-generated.
This only works if the server is in offline/cracked mode. Premium servers need real Microsoft accounts.

## accounts.json fields
- `username`: Microsoft email (auth `microsoft`) or in-game name (auth `offline`)
- `auth`: `microsoft` or `offline`
- `password`: optional, sent as /login (and /register) for servers with AuthMe
- `proxy`: `socks5://user:pass@host:port`, or `null` for the VM's own IP

## config.json
- `loginDelaySeconds`: gap between bot logins (keep it high to avoid connection throttling)
- `reconnectBaseSeconds` / `reconnectMaxSeconds`: exponential backoff on disconnect
- `antiAfkIntervalSeconds`: how often bots look around and jump

## Notes
- Only use accounts you own, and check the server rules on AFK bots / multiple accounts.
- Microsoft login itself goes direct, only the game connection uses the proxy.
