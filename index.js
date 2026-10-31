const mineflayer = require('mineflayer')
const { SocksClient } = require('socks')
const fs = require('fs')
const path = require('path')

const config = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf8'))
const accountsPath = path.join(__dirname, 'accounts.json')
if (!fs.existsSync(accountsPath)) {
  console.error('accounts.json not found. Copy accounts.example.json to accounts.json and edit it.')
  process.exit(1)
}
const accounts = JSON.parse(fs.readFileSync(accountsPath, 'utf8'))
const sleep = ms => new Promise(r => setTimeout(r, ms))
const log = (name, msg) => console.log(`[${new Date().toISOString()}] [${name}] ${msg}`)

function parseProxy(str) {
  if (!str) return null
  const u = new URL(str)
  return {
    host: u.hostname,
    port: parseInt(u.port, 10),
    type: u.protocol.startsWith('socks4') ? 4 : 5,
    userId: u.username ? decodeURIComponent(u.username) : undefined,
    password: u.password ? decodeURIComponent(u.password) : undefined
  }
}

function startBot(acc, state) {
  const proxy = parseProxy(acc.proxy)
  const opts = {
    host: config.host,
    port: config.port,
    username: acc.username,
    auth: acc.auth || 'microsoft',
    version: config.version || undefined,
    profilesFolder: path.join(__dirname, 'profiles', acc.username.replace(/[^a-z0-9_.@-]/gi, '_')),
    hideErrors: true
  }

  if (proxy) {
    opts.connect = client => {
      SocksClient.createConnection({
        proxy,
        command: 'connect',
        destination: { host: config.host, port: config.port }
      }).then(info => {
        client.setSocket(info.socket)
        client.emit('connect')
      }).catch(err => client.emit('error', err))
    }
  }

  const bot = mineflayer.createBot(opts)
  let afkTimer = null

  bot.once('spawn', () => {
    state.attempts = 0
    log(acc.username, 'Joined the server.')
    if (acc.password) {
      setTimeout(() => {
        bot.chat(`/login ${acc.password}`)
        bot.chat(`/register ${acc.password} ${acc.password}`)
      }, 3000)
    }
    afkTimer = setInterval(() => {
      if (!bot.entity) return
      const yaw = Math.random() * Math.PI * 2
      const pitch = (Math.random() - 0.5) * 0.6
      bot.look(yaw, pitch, true)
      bot.setControlState('jump', true)
      setTimeout(() => bot.setControlState('jump', false), 300)
    }, config.antiAfkIntervalSeconds * 1000)
  })

  bot.on('kicked', reason => log(acc.username, `Kicked: ${typeof reason === 'string' ? reason : JSON.stringify(reason)}`))
  bot.on('error', err => log(acc.username, `Error: ${err.message}`))
  bot.once('end', async reason => {
    if (afkTimer) clearInterval(afkTimer)
    state.attempts++
    const wait = Math.min(config.reconnectBaseSeconds * 2 ** (state.attempts - 1), config.reconnectMaxSeconds)
    const jitter = Math.floor(Math.random() * 10)
    log(acc.username, `Disconnected (${reason}). Reconnecting in ${wait + jitter}s...`)
    await sleep((wait + jitter) * 1000)
    startBot(acc, state)
  })
}

;(async () => {
  log('main', `Starting ${accounts.length} bot(s) for ${config.host}:${config.port}`)
  for (const acc of accounts) {
    startBot(acc, { attempts: 0 })
    await sleep(config.loginDelaySeconds * 1000) // staggered logins
  }
})()

process.on('uncaughtException', e => console.error('Uncaught:', e.message))
process.on('unhandledRejection', e => console.error('Unhandled:', e && e.message))
