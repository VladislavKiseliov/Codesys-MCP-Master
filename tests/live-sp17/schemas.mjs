// Dump a compact signature of every tool: name(param:type[enum]*, ...)  (* = required)
import { spawn } from 'node:child_process'
const dir = 'C:\\Users\\vladi\\OneDrive\\Desktop\\Codesys-MCP-Master'
const child = spawn(process.execPath, [dir + '\\dist\\bin.js', '--no-auto-launch'], { cwd: dir })
let buf = ''
child.stdout.on('data', (d) => {
  buf += d
  const line = buf.split('\n').find((l) => l.includes('"id":2'))
  if (!line) return
  for (const t of JSON.parse(line).result.tools) {
    const req = new Set(t.inputSchema.required ?? [])
    const ps = Object.entries(t.inputSchema.properties ?? {})
      .filter(([k]) => k !== 'install')
      .map(([k, v]) => `${k}${req.has(k) ? '*' : ''}:${v.enum ? v.enum.join('|') : v.type ?? '?'}`)
    console.log(`${t.name}(${ps.join(', ')})`)
  }
  child.kill(); process.exit(0)
})
const send = (m) => child.stdin.write(JSON.stringify(m) + '\n')
send({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'x', version: '0' } } })
send({ jsonrpc: '2.0', method: 'notifications/initialized' })
send({ jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} })
