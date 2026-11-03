# Живая проверка инструментов на SP17

Результат: [SP17-report.md](SP17-report.md) — 73 из 132 инструментов, 125 вызовов (2026-11-03).

Прямой MCP-клиент без модели: вызывает инструменты сервера по списку, токенов не тратит.

- `mcp.mjs` — клиент. `node mcp.mjs schema <tool...>` печатает схемы; `node mcp.mjs run <calls.json>` выполняет вызовы в одной сессии. `MCP_LOG=results.jsonl` пишет журнал (id, инструмент, статус, время, ответ). Путь к серверу — `MCP_DIR`, доп. аргументы — `MCP_ARGS` (JSON-массив). По умолчанию сервер привязан к SP17 Patch 3 в `Program Files (x86)\CODESYS 3.5.17.30(1)`.
- `schemas.mjs` → `sigs.txt` — сигнатуры всех инструментов (`*` = обязательный параметр).
- `gen.mjs` генерирует `g3-7.json`, `g8a.json`, `g8b.json`, `g9-11.json`; `g0-2.json`, `g8c.json`, `g4r.json` написаны вручную. Порядок: `g0-2` → `g3-7` → `g8a` (включить и подтвердить симуляцию) → `g8b` → `g8c` → `g9-11`; `g4r` — повтор проверки компиляции.
- `report.mjs` собирает отчёт из `results.jsonl` и `sigs.txt`.

Пути в JSON писать с двойными обратными слэшами в файле; генерация через `node -e` в bash теряет слэши.

Безопасность: только тестовый проект, второй CODESYS рядом (`launch_codesys otherInstances=leave`), онлайн — только после подтверждённого `set_simulation_mode`, к реальным ПЛК не подключаться.

Не проверено (59 инструментов) — список в конце отчёта. Безопасно добавить офлайн: `import_plcopen_xml`, `import_native`, `list_all_signatures`, `list_all_datatypes`, `get_symbol_config_settings`, `get_signature_crc`, `set_exclude_from_build`, `set_build_properties`, `get_library_reference`, `list_project_users`, `open_project_archive`, `save_as_compiled_library`.
