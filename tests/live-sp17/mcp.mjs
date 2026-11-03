// Minimal stdio MCP client for driving Codesys-MCP-Master by hand.
// Usage:
//   node mcp.mjs schema <tool> [<tool>...]   print input schemas
//   node mcp.mjs run <calls.json>             run [{name, arguments}] in one session
// Env: MCP_DIR (server checkout), MCP_ARGS (JSON array of extra server args)
import { spawn } from 'node:child_process'
import { readFileSync, appendFileSync } from 'node:fs'
import path from 'node:path'

const dir = process.env.MCP_DIR ?? 'C:\\Users\\vladi\\OneDrive\\Desktop\\Codesys-MCP-Master'
const extra = JSON.parse(process.env.MCP_ARGS ?? '[]')
const args = [
  path.join(dir, 'dist', 'bin.js'),
  '--mode', 'persistent', '--no-auto-launch',
  '--codesys-path', 'C:\\Program Files (x86)\\CODESYS 3.5.17.30(1)\\CODESYS\\Common\\CODESYS.exe',
  '--codesys-profile', 'CODESYS V3.5 SP17 Patch 3',
  ...extra,
]
const child = spawn(process.execPath, args, { cwd: dir, stdio: ['pipe', 'pipe', 'pipe'] })
child.stderr.on('data', () => {})

let buf = ''
let nextId = 1
const pending = new Map()
child.stdout.on('data', (d) => {
  buf += d.toString('utf8')
  let i
  while ((i = buf.indexOf('\n')) >= 0) {
    const line = buf.slice(0, i).trim()
    buf = buf.slice(i + 1)
    if (!line) continue
    let msg
    try { msg = JSON.parse(line) } catch { continue }
    if (msg.id !== undefined && pending.has(msg.id)) {
      pending.get(msg.id)(msg)
      pending.delete(msg.id)
    }
  }
})

function request(method, params) {
  const id = nextId++
  child.stdin.write(JSON.stringify({ jsonrpc: '2.0', id, method, params }) + '\n')
  return new Promise((resolve) => pending.set(id, resolve))
}

await request('initialize', {
  protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'claude-probe', version: '0' },
})
child.stdin.write(JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }) + '\n')

const [mode, ...rest] = process.argv.slice(2)
if (mode === 'schema') {
  const { result } = await request('tools/list', {})
  for (const t of result.tools.filter((t) => rest.includes(t.name))) {
    console.log(`## ${t.name}\n${JSON.stringify(t.inputSchema.properties, null, 1)}\nrequired: ${t.inputSchema.required}`)
  }
} else if (mode === 'run') {
  const calls = JSON.parse(readFileSync(rest[0], 'utf8'))
  for (const c of calls) {
    const t0 = Date.now()
    const msg = await request('tools/call', { name: c.name, arguments: c.arguments ?? {} })
    const text = msg.error
      ? `RPC ERROR ${JSON.stringify(msg.error)}`
      : (msg.result.content ?? []).map((x) => x.text ?? '').join('\n')
    const flag = msg.error ? 'ERROR' : msg.result?.isError ? 'ERROR' : 'ok'
    if (process.env.MCP_LOG) {
      appendFileSync(process.env.MCP_LOG, JSON.stringify({ id: c.id, name: c.name, flag, sec: (Date.now() - t0) / 1000, text }) + '\n')
    }
    console.log(`\n=== ${c.id ?? ''} ${c.name} [${flag}] ${((Date.now() - t0) / 1000).toFixed(1)}s`)
    console.log(text.length > (c.max ?? 1500) ? text.slice(0, c.max ?? 1500) + ' …' : text)
  }
}
child.kill()
process.exit(0)
