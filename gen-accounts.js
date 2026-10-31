// Usage: node gen-accounts.js [count] [password]
// Reads proxies.txt (one per line, e.g. socks5://user:pass@1.2.3.4:1080)
// and writes accounts.json with realistic names, one proxy per bot.
const fs = require('fs')
const count = parseInt(process.argv[2] || '20', 10)
const password = process.argv[3] || null

const first = ['Alex','Jake','Liam','Noah','Ethan','Mason','Lucas','Owen','Caleb','Ryan','Tyler','Dylan','Aiden','Jayden','Logan','Nathan','Evan','Cole','Blake','Hunter','Max','Leo','Finn','Ezra','Kai','Zane','Troy','Sean','Cody','Seth','Emma','Mia','Zoe','Lily','Ella','Ava','Chloe','Nora','Ruby','Skye']
const tail = ['_','','x','YT','MC','Gamer','Pro','Plays','Crafts','Builds','HD','_xD','TV','_9','Miner','Dev']

function rnd(a) { return a[Math.floor(Math.random() * a.length)] }
function makeName() {
  const styles = [
    () => rnd(first) + rnd(tail) + Math.floor(Math.random() * 99),
    () => rnd(first) + '_' + rnd(first) + (Math.random() < 0.5 ? Math.floor(Math.random() * 999) : ''),
    () => rnd(first) + rnd(tail) + (2003 + Math.floor(Math.random() * 8)),
    () => rnd(first).toLowerCase() + Math.floor(Math.random() * 9999)
  ]
  let n = rnd(styles)()
  return n.slice(0, 16)
}

let proxies = []
if (fs.existsSync('proxies.txt')) {
  proxies = fs.readFileSync('proxies.txt', 'utf8').split('\n').map(s => s.trim()).filter(s => s && !s.startsWith('#'))
}
if (proxies.length < count) {
  console.warn(`WARNING: only ${proxies.length} proxies for ${count} bots. Extra bots will use the VM's own IP.`)
}

// Optional: put your own names (one per line) in names.txt and they are used first.
let customNames = []
if (fs.existsSync('names.txt')) {
  customNames = fs.readFileSync('names.txt', 'utf8').split('\n').map(s => s.trim()).filter(s => /^[A-Za-z0-9_]{3,16}$/.test(s))
}

const used = new Set()
const accounts = []
for (let i = 0; i < count; i++) {
  let name = customNames[i]
  if (!name) { do { name = makeName() } while (used.has(name.toLowerCase())) }
  used.add(name.toLowerCase())
  accounts.push({ username: name, auth: 'offline', password, proxy: proxies[i] || null })
}
fs.writeFileSync('accounts.json', JSON.stringify(accounts, null, 2))
console.log(`Wrote accounts.json with ${accounts.length} bots:`)
accounts.forEach(a => console.log(`  ${a.username.padEnd(18)} ${a.proxy || '(no proxy)'}`))
