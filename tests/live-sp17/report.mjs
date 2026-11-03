// Builds SP17-report.md from results.jsonl and sigs.txt.
import { readFileSync, writeFileSync } from 'node:fs'
const rows = readFileSync('results.jsonl', 'utf8').trim().split('\n').map((l) => JSON.parse(l)).filter((r) => r.id && r.id !== 'L')
const all = readFileSync('sigs.txt', 'utf8').trim().split('\n').map((l) => l.split('(')[0])
const tested = new Set(rows.map((r) => r.name))

// Verdicts for the non-ok calls, by step id.
const notes = {
  '2.11': ['EXPECTED-FAIL', 'Persistent Vars через скрипт — только SP21+ (в описании инструмента помечен «SP21+»).'],
  '4.2c': ['OK', 'Ожидаемо: в коде намеренная ошибка, инструмент вернул её как ошибку («Идентификатор \'nUnknown\' не задан»).'],
  '4.2r-b': ['OK', 'Ожидаемо: намеренная ошибка найдена, 2 ошибки компиляции.'],
  '7.4': ['EXPECTED-FAIL', 'Нужен IScriptLibManObject3 — только SP21+.'],
  '8.4': ['FAIL', 'В симуляции предварительная проверка шлюза падает («gateway Guid ... is not in scriptengine.online.gateways»). С skipReachabilityCheck=true загрузка проходит (шаг 8.4r-b).'],
}
const clip = (s, n) => s.replace(/\s+/g, ' ').trim().slice(0, n).replace(/\|/g, '\\|')

let ok = 0, fail = 0, exp = 0
const table = rows.map((r) => {
  const [status, note] = notes[r.id] ?? [r.flag === 'ok' ? 'OK' : 'FAIL', '']
  if (status === 'OK') ok++; else if (status === 'FAIL') fail++; else exp++
  return `| ${r.id} | \`${r.name}\` | ${status} | ${note || clip(r.text, 110)} |`
})
const untested = all.filter((t) => !tested.has(t)).sort()

const md = `# Проверка Codesys-MCP-Master на CODESYS SP17

- Дата: 2026-11-03
- CODESYS: V3.5 SP17 Patch 3 (3.5.17.30), ScriptEngine 4.0.0.0
- Сервер: 0.19.1-ru.1 (watcher 0.7.2), режим persistent
- Проект: \`E:\\Project\\codesys-test\\full\\Full.project\`, устройство CODESYS Control Win V3 x64, онлайн-шаги — только в симуляции
- Способ: прямой MCP-клиент (\`tests/live-sp17/mcp.mjs\`), шаги скилла \`codesys-sp17-check\`

## Итог

**${tested.size} из ${all.length} инструментов проверены вживую, ${rows.length} вызовов: OK ${ok}, FAIL ${fail}, EXPECTED-FAIL ${exp}.**

- Кириллица (UTF-8-исправление) работает везде: комментарии, \`WSTRING\` в коде и **в онлайне** (запись и чтение \`"Мир"\`), \`edit_text_lines\`, поиск ссылок, путь \`Кириллица\\Full_копия.project\`, зеркало \`.st\`, PLCopenXML, русские сообщения компилятора.
- Онлайн-команды после правки \`_needs_script_context\` работают: вход, старт/стоп, чтение/запись/мониторинг/форсирование, проверка online change.
- Сломано на SP17: только \`download_to_device\` в симуляции без \`skipReachabilityCheck\` (см. ниже).
- Только SP21+: \`create_persistent_vars\`, \`download_missing_libraries\`.

## Найдено

1. **\`download_to_device\` в симуляции.** Предварительная проверка ищет шлюз устройства, а у симулятора его нет. Сервер отвечает ошибкой с подсказкой «Pass skipReachabilityCheck=true to bypass»; с этим параметром загрузка проходит. На реальном ПЛК не проверялось.
2. **\`compile_project\` проверяет только код, который вызывается из задач** — так компилирует сам CODESYS. Ошибка в POU, который не вызывается ни одной задачей, сборкой не находится (0 ошибок), но видна в \`get_compile_messages\` (фоновая проверка). Это не ошибка сервера, но агенту об этом надо знать.
3. \`list_tasks\` печатает лишнюю строку \`DeprecationWarning: callable() is removed in 3.x\` — безвредно.
4. \`list_device_parameters\` у CODESYS Control Win V3 x64 возвращает \`<none>\` — у этого устройства нет параметров; на устройствах с параметрами не проверялось.

## Все шаги

| Шаг | Инструмент | Статус | Результат |
|---|---|---|---|
${table.join('\n')}

## Не проверено (${untested.length})

Требуют реального ПЛК, сети, SSH, другого оборудования или разрушают проект, либо не входят в шаги скилла:

${untested.map((t) => `\`${t}\``).join(', ')}.
`
writeFileSync('SP17-report.md', md)
console.log('tested', tested.size, 'of', all.length, 'ok', ok, 'fail', fail, 'expected', exp, 'untested', untested.length)
