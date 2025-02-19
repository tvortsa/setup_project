# Setup-project модуль

помогает в создании файловой структуры разных проектов

опишите файловую структуру вашего проекта в файле setup.toml 
и запустите setup-project в папке с этим файлом.

вы также можете удалять папки и файлы указанные в setup.toml

делать снимок файловой системы текущей папки (игнорируя имена начинающихся на ".")
сохраняя такой снимок в файле grab_struct.toml

## Установка

для установки setup-project у вас должен быть установлен deno.js 2.0 +

```bash

deno install --global --allow-read --allow-write --allow-run --allow-env -r -f -n tvr_setup jsr:@tvortsa/setup-project

```

## Запуск

```bash

tvr_setup

```
