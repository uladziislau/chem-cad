# HANDOFF: деплой static-spa проектов на yoga (serverus)

Дата: 2026-11-15. Сессия chem-cad/serverus deploys.

## Что уже сделано и проверено

| Проект | Статус | URL | Коммит |
|---|---|---|---|
| chem-cad | ЖИВОЙ | https://chem-cad.uladzislau.space/ (200) | 7303208 |
| compass | ЖИВОЙ | https://compass.uladzislau.space/ (200, health зелёный) | serverus 4818eb3 + 6da8c3b |
| cad | ЖИВОЙ | https://cad.uladzislau.space/ (200) | serverus fdc1a29 |

Все три — через `pnpm ops deploy --project <id>` из `~/Projects/serverus`.

## Ключевой баг, который был починен (ВАЖНО для будущих деплоев)

`ForbiddenMarkerCheck` (`~/Projects/serverus/domain/modules/projects/steps/forbiddenpath.check.ts`)
собирал `grep -lFr -e '<marker>'` внутри двойных кавычек ssh-аргумента.
Бэктики в маркерах (`roles:[`admin`]`) локальный `bash -c` раскрывал как
command substitution ДО ssh → до ноды доходил урезанный паттерн `roles:[]`,
который матчил легитимный `roles:[],source:…` в публичном бандле → вечный
ложный fail health. Фикс: `escapeOuter` экранирует `` \` `` `$` `"` `'`
для внешнего shell. Коммит `4818eb3`, тесты 5/5.

## Serverus deploy-факты (проверено на живом)

- `pnpm ops deploy --project <id>` из `~/Projects/serverus`; требует **чистый git** serverus.
- `localCommands` и `artifacts.from` резолвятся из **корня serverus** → нужен `cd ../<proj>` / `../<proj>/dist/`.
- `artifacts.to` → `/var/www/<id>/`. Если каталог root-owned → в artifact добавить `"sudo": true` (rsync идёт через `sudo rsync`).
- `remoteCommands` бегут на ноде: `sudo -n restorecon -R /var/www/<id>` после rsync.
- Нода yoga = `uladzislau@192.168.1.100` (см. `data/modules/infrastructure/cluster.json`).
- Deploy-спеки живут в `data/modules/projects/projects.json` → `deploy` секция проекта.

## Текущая задача: локальные порты БЕЗ публикации

Пользователь: «можем просто настроить порты без публикации, без продакшн-выводов».
Medicina НЕ публикуется (lint красный на pre-existing ошибках — не трогать).

Нужно для каждого проекта: rsync `dist` → `/var/www/<id>/` на yoga + блок `:<port>` в `/etc/caddy/Caddyfile` + `systemctl reload caddy`. БЕЗ tunnel ingress, БЕЗ публичных доменов.

### Уже готово в live Caddyfile (проверено `sudo grep` на yoga)
- `:8200` serverus-ui, `:8201` cad, `:8202` compass — слушают.
- Блоки `:8203+` в `configurations/caddy/sites/projects.conf` — это SOURCE-файл, НЕ подключён к live Caddyfile. Живой `/etc/caddy/Caddyfile` сейчас имеет только 8200/8201/8202 + доменные блоки.

### Проекты для локального деплоя (порты из реестра)

| id | port | dist index.html | Статус dist |
|---|---|---|---|
| conceptico | 8204 | `angular/dist/index.html` (НЕ корень!) | собран |
| infinity | 8205 | `dist/index.html` | собран |
| insight | 8206 | `dist/app/browser/index.html` | собран |
| math-education-platform | 8208 | `dist/app/browser/index.csr.html` (имя НЕ index.html!) | собран |
| mixonomix | 8210 | `dist/app/browser/index.html` | собран |
| atelier | 8211 | dist ПУСТОЙ — build был запущен, убит по просьбе пользователя | нужен `pnpm run build` |
| sound.studio | 8212 | `dist/browser/index.html` | собран |

### Внимание на нестандартные пути
- conceptico: `from` должен быть `../conceptico/angular/dist/` (не `dist/`).
- math-education-platform: entry-файл `index.csr.html`, не `index.html` — Caddy `try_files` надо учесть.
- insight/mixonomix/sound.studio: `dist/app/browser/` или `dist/browser/` — не корень dist.

### Порядок работы для следующего агента
1. Для каждого проекта добавить `deploy` секцию в `projects.json`: localCommands (`cd ../<proj> && pnpm run build`), artifacts (`from` = реальный путь к dist с index.html, `to=/var/www/<id>/`, `sudo:true`), health (`ports:[port]`, url `http://localhost:port/` или без url — PortCheck достаточно).
2. `pnpm ops deploy --project <id>` — rsync + restorecon.
3. Добавить блок в `/etc/caddy/Caddyfile` на yoga: `:<port> { root * /var/www/<id>; try_files {path} /index.html; file_server }` + `sudo systemctl reload caddy`. Для math-edu try_files → `/index.csr.html`.
4. `pnpm ops health --project <id>` — PortCheck.
5. Коммитить `projects.json` после каждой спеки (deploy требует чистый git).

### Не делать
- НЕ публиковать (нет tunnel ingress, нет `*.uladzislau.space` доменов).
- НЕ трогать medicina (lint красный, pre-existing).
- НЕ чинить lint-ошибки в чужих репо без запроса.
