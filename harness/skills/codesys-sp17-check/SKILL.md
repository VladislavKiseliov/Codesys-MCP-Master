---
name: codesys-sp17-check
description: Полная проверка MCP-сервера Codesys-MCP-Master на CODESYS 3.5 SP17 на отдельном тестовом проекте, с отчётом. Используй, когда пользователь просит проверить CODESYS MCP, прогнать тесты SP17 или проверить кириллицу в CODESYS.
---

# Проверка Codesys-MCP-Master на SP17

Ты прогоняешь инструменты MCP-сервера CODESYS по шагам и записываешь результат каждого. Цель — узнать, что на SP17 работает, а что нет. Чинить ничего не нужно: только проверять и записывать.

## Правила безопасности (обязательны)

1. Работай ТОЛЬКО с тестовым проектом из этого скилла. Никогда не открывай и не меняй другие проекты.
2. НИКОГДА не подключайся к реальному контроллеру. Онлайн-шаги (группа 8) выполняй только после того, как `set_simulation_mode` подтвердил, что симуляция включена. Если подтвердить не удалось — пропусти всю группу 8 со статусом SKIP.
3. Не вызывай: `download_to_device` вне симуляции, `scan_network_devices`, `verify_device_reachable`, `rebind_device_to_scan_result`, `add_device_user`, `plc_file_*`, `source_download`, `source_upload`, `create_boot_application`, `reset_application`, `update_device_type`, `restart_runtime_ssh`, `read_running_version_*`, `release_project_version`, `install_device_description`, `remove_device_description`.
4. Если CODESYS спрашивает про другие открытые экземпляры или несохранённые проекты — остановись и спроси пользователя.
5. Если нужного инструмента нет в твоём списке (сервер запущен с `--tools` без этой группы), отметь шаг как SKIP с причиной «инструмент отключён».
6. Ошибка одного шага не останавливает проверку: запиши её и переходи к следующему шагу. Если упал шаг, от которого зависят следующие (например, создание проекта), отметь зависящие шаги как SKIP с причиной.

## Экономия токенов (обязательно)

Каждый вызов инструмента — новый запрос к модели со всей историей чата, поэтому длинный прогон в одном чате очень дорогой.

1. Выполняй только те группы, которые назвал пользователь (например «группы 6–8»). Если он не назвал — выполни группы 0–3 и остановись, предложив продолжить в НОВОМ чате.
2. После каждой группы сразу дописывай её результаты в файл отчёта (см. «Отчёт»), чтобы прогресс не терялся и следующий чат мог продолжить.
3. В начале нового чата прочитай существующий отчёт и продолжай со следующей невыполненной группы. Если тестовый проект уже создан — открой его через `open_project`, не создавай заново.
4. Не вызывай `get_all_pou_code` и большие чтения, если шаг этого не требует. Читай только нужный объект через `get_text_lines`.
5. Не пересказывай вывод инструментов целиком — только статус и ошибку.

## Подготовка

- Папка: `E:\Project\codesys-test`. Если пользователь назвал другую — используй её.
- Проект: `<папка>\SP17Check.project`. Если он уже существует, спроси пользователя, можно ли его перезаписать, или возьми имя `SP17Check-<номер>.project`.
- Перед началом скажи пользователю, какую папку и какой проект используешь.

## Как записывать результат

По каждому шагу запоминай: номер, инструмент, статус (`OK` / `FAIL` / `SKIP` / `EXPECTED-FAIL`), коротко что проверялось, и при FAIL — точный текст ошибки (первые 300 символов). `EXPECTED-FAIL` — для инструментов, помеченных «SP21+», если они упали из-за отсутствия API в SP17.

## Шаги

### 0. Состояние
- 0.1 `get_codesys_status` — сервер отвечает, какой режим и состояние.
- 0.2 Если CODESYS не запущен — `launch_codesys`.

### 1. Проект
- 1.1 `create_project` — создать `SP17Check.project` в тестовой папке. Запиши, какое устройство создалось.
- 1.2 `save_project`.
- 1.3 `get_project_info`, затем `set_project_info` (Author = `SP17 test`), затем снова `get_project_info` — значение сохранилось.
- 1.4 `get_compiler_version`.
- 1.5 `list_project_libraries`.
- 1.6 `list_applications`.
- 1.7 `close_project`, затем `open_project` того же файла.

### 2. Объекты и код
- 2.1 `create_folder` — папка `Test`.
- 2.2 `create_pou` — программа `PRG_Test` (ST) в `Test`, с объявлением `VAR nCounter : INT; bFlag : BOOL; END_VAR` и кодом `nCounter := nCounter + 1;`.
- 2.3 `create_pou` — функциональный блок `FB_Test` (ST) с входом `bStart : BOOL` и выходом `bDone : BOOL`.
- 2.4 `create_pou` — функция `F_Add` (ST), возвращает INT, входы `a, b : INT`, код `F_Add := a + b;`.
- 2.5 `create_method` — метод `Run` в `FB_Test`.
- 2.6 `create_property` — свойство `Value : INT` в `FB_Test`.
- 2.7 `create_action` — действие `Reset` в `PRG_Test`.
- 2.8 `create_interface` — интерфейс `I_Test`.
- 2.9 `create_dut` — структура `ST_Data` (`nValue : INT; rTemp : REAL;`) и перечисление `E_Mode` (`Off, Manual, Auto`).
- 2.10 `create_gvl` — `GVL_Test` с `gnValue : INT;`.
- 2.11 `create_persistent_vars` — (SP21+, ожидается EXPECTED-FAIL).
- 2.12 `set_pou_code` — заменить код `PRG_Test` на `nCounter := nCounter + 1;\nbFlag := nCounter > 10;`.
- 2.13 `get_text_lines` для реализации `PRG_Test` — текст совпадает с записанным.
- 2.14 `edit_text_lines` — вставить строку `gnValue := nCounter;` в конец реализации `PRG_Test` (используй `GVL_Test.gnValue`, если нужно), затем `get_text_lines` — строка на месте.
- 2.15 `get_all_pou_code` — все созданные объекты есть в выводе.
- 2.16 `find_references` для `nCounter`.
- 2.17 `rename_symbol` `nCounter` → `nCycles`: сначала пробный запуск (dry run), затем настоящий; потом `find_references` для `nCycles`.
- 2.18 `rename_object` — `F_Add` → `F_Sum`.
- 2.19 `move_object` — `F_Sum` из `Test` в корень приложения.
- 2.20 `create_pou` — временная программа `PRG_Delete`, затем `delete_object` для неё.

### 3. Кириллица (главная проблема — запиши каждый результат подробно)
Для каждого шага сравни прочитанный текст с записанным символ в символ. При расхождении запиши в отчёт ОБА текста и коды первых 10 символов прочитанного (например `U+00D0 U+009F ...`) — это нужно для диагностики.
- 3.1 `set_pou_code` для `PRG_Test`: в объявление добавь комментарий `// Счётчик циклов`, в реализацию — первой строкой `(* Проверка кириллицы: Привет, мир! ёЁ *)`. Затем `get_text_lines` для объявления и реализации.
- 3.2 Литерал строки: добавь в `GVL_Test` переменную `wsText : WSTRING := "Привет";` (через `set_pou_code` или `edit_text_lines`), прочитай обратно.
- 3.3 `edit_text_lines`: вставь строку `// Комментарий через edit_text_lines` в реализацию `PRG_Test`, прочитай обратно.
- 3.4 `create_pou` — программа `PRG_Kirill` с комментарием в объявлении `// Создано с кириллицей`, прочитай обратно.
- 3.5 `find_references` для `wsText` — в выводе кириллица не испорчена.
- 3.6 `create_text_list` — список `TL_Test` с текстом `Насос включён`, если инструмент позволяет задать текст; прочитай результат.
- 3.7 `save_project_as` — сохранить копию в `<папка>\Кириллица\SP17Check_копия.project`. Затем снова `open_project` исходного `SP17Check.project`.
- 3.8 `get_all_pou_code` — кириллица из шагов 3.1–3.4 в выводе выглядит правильно.

### 4. Компиляция
- 4.1 `compile_project` — без ошибок (если ошибки — запиши их и исправь только тестовый код, чтобы продолжить).
- 4.2 Внеси намеренную ошибку: в реализацию `PRG_Test` добавь `nUnknown := 1;`. `compile_project` — ошибка найдена; `get_compile_messages` — сообщение есть, текст читаемый.
- 4.3 Убери ошибку, `compile_project` — снова без ошибок.
- 4.4 `application_build` (generate_code).
- 4.5 `clean_all`, затем `compile_project`.
- 4.6 `get_build_properties` для `PRG_Test`.

### 5. Задачи
- 5.1 `list_tasks`.
- 5.2 `create_task` — `TestTask`, циклическая, 100 мс.
- 5.3 `configure_task` — интервал 50 мс.
- 5.4 `add_pou_to_task` — `PRG_Test` в `TestTask`; `list_tasks` — вызов есть.
- 5.5 `remove_pou_from_task`; `list_tasks` — вызова нет.

### 6. Устройство (без подключения)
- 6.1 `get_device_identification`.
- 6.2 `list_device_parameters` (только чтение).
- 6.3 `get_plc_settings`.
- 6.4 `list_device_repository` — с фильтром по имени `Control Win`.

### 7. Библиотеки
- 7.1 `add_library` — `Util`.
- 7.2 `list_project_libraries` — `Util` есть.
- 7.3 `remove_library` — `Util`; `list_project_libraries` — нет.
- 7.4 `download_missing_libraries` — (SP21+, ожидается EXPECTED-FAIL).

### 8. Симуляция (только при подтверждённой симуляции, см. правила)
- 8.1 `compile_project` без ошибок. Убедись, что `PRG_Test` вызывается в задаче (MainTask), если нет — `add_pou_to_task`.
- 8.2 `set_simulation_mode` — включить; затем прочитать режим и убедиться, что он включён. Если нет — SKIP для всей группы.
- 8.3 `connect_to_device` (в симуляции).
- 8.4 `download_to_device` (в симуляции).
- 8.5 `start_stop_application` — старт; `get_application_state` — running.
- 8.6 `read_variable` — `PRG_Test.nCycles` (после переименования в 2.17).
- 8.7 `read_variables` — `PRG_Test.nCycles`, `PRG_Test.bFlag`.
- 8.8 `monitor_variables` — `PRG_Test.nCycles` 5 секунд, значение растёт.
- 8.9 `write_variable` — `GVL_Test.gnValue := 42`, прочитать обратно.
- 8.10 `write_variables` — две переменные за раз.
- 8.11 `read_variable` — `GVL_Test.wsText`: кириллица читается правильно.
- 8.12 `force_variables` — `PRG_Test.bFlag := TRUE`; `list_forced_variables`; `unforce_variables`.
- 8.13 `check_online_change`.
- 8.14 `start_stop_application` — стоп; `disconnect_from_device`.
- 8.15 `set_simulation_mode` — выключить.

### 9. Экспорт и сравнение
- 9.1 `export_plcopen_xml` — весь проект в `<папка>\export\SP17Check.xml`.
- 9.2 `export_native` — `PRG_Test` в `<папка>\export\`.
- 9.3 `mirror_export` — в папку по умолчанию; открой один `.st`-файл и проверь, что кириллица из группы 3 в нём правильная.
- 9.4 `save_project_archive` — в `<папка>\export\`.
- 9.5 `compare_projects` — с копией из шага 3.7.

### 10. Конфигурация символов
- 10.1 `create_symbol_config`.
- 10.2 `set_symbol_access` — `GVL_Test.gnValue` ReadWrite.
- 10.3 `list_configured_symbols` — переменная есть.

### 11. Завершение
- 11.1 `save_project`.
- 11.2 `close_project`.
- 11.3 НЕ вызывай `shutdown_codesys`, если пользователь не попросил.

## Отчёт

Файл отчёта один на всю проверку: `<папка>\SP17-report.md`. Дописывай в него после каждой группы. Когда все группы выполнены, приведи файл к итоговому виду:

1. Структура отчёта:
   - шапка: дата, версия CODESYS (из `get_codesys_status` / `get_device_identification`), путь к проекту;
   - итог: сколько OK / FAIL / SKIP / EXPECTED-FAIL;
   - таблица всех шагов: `| № | Инструмент | Статус | Что проверялось | Ошибка |`;
   - отдельный раздел «Кириллица» со всеми расхождениями из группы 3 (записанный текст, прочитанный текст, коды символов);
   - раздел «Сломано на SP17» — список FAIL с ошибками.
2. Коротко перескажи пользователю итог и главные проблемы, и дай путь к отчёту.
