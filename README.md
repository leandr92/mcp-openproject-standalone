# Standalone MCP Server for OpenProject

[🇷🇺 Русский](#русский) | [🇬🇧 English](#english)

---

<a name="русский"></a>
# 🇷🇺 Русский

Standalone MCP-сервер для интеграции OpenProject с Cursor IDE. Работает полностью локально, без необходимости развертывани дополнительного сервера для обработки.

## Описание

Этот MCP-сервер позволяет Cursor IDE напрямую взаимодействовать с вашим экземпляром OpenProject через Model Context Protocol. Сервер работает полностью локально и не требует развертывания на облачных платформах.

## Установка

### Установка через npm (рекомендуется, после публикации)

После публикации пакета в npm, установите его глобально:

```bash
npm install -g mcp-openproject-standalone
```

Или локально в проект:

```bash
npm install mcp-openproject-standalone
```

Зависимости установятся автоматически вместе с пакетом.

### Установка из исходников

Если вы клонировали репозиторий или хотите использовать локальную версию:

#### Автоматическая установка зависимостей

Зависимости устанавливаются **автоматически** при первом запуске MCP-сервера. Просто настройте конфигурацию MCP (см. ниже), и при первом подключении зависимости будут установлены автоматически.

#### Ручная установка зависимостей (опционально)

Если хотите установить зависимости вручную заранее:

```bash
npm install
```

**Примечание:** Если вы планируете использовать вариант с `npm link` (см. ниже), то нужно сделать скрипт исполняемым:
```bash
chmod +x index.js
```

Если вы используете вариант с `node index.js` в конфигурации MCP, то этот шаг не обязателен.

## Обновление пакета

После первичной установки пакет можно обновить до последней версии.

### Обновление при использовании npx

Если вы используете `npx` в конфигурации MCP, пакет автоматически обновляется до последней версии при каждом запуске. Дополнительных действий не требуется.

### Обновление при глобальной установке

Если вы установили пакет глобально через `npm install -g`, обновите его командой:

```bash
npm update -g mcp-openproject-standalone
```

Или переустановите последнюю версию:

```bash
npm install -g mcp-openproject-standalone@latest
```

### Обновление при локальной установке

Если пакет установлен локально в проект:

```bash
npm update mcp-openproject-standalone
```

Или переустановите последнюю версию:

```bash
npm install mcp-openproject-standalone@latest
```

### Проверка текущей версии

Чтобы узнать текущую установленную версию:

```bash
npm list -g mcp-openproject-standalone
```

Или для локальной установки:

```bash
npm list mcp-openproject-standalone
```

Чтобы узнать последнюю доступную версию в npm:

```bash
npm view mcp-openproject-standalone version
```

### После обновления

После обновления пакета перезапустите Cursor IDE, чтобы изменения вступили в силу.

## Настройка в Cursor

Добавьте следующую конфигурацию в файл MCP Cursor (`~/.cursor/mcp.json` или `~/.config/cursor/mcp.json`):

### Автоматическая установка через npx (рекомендуется)

Используйте `npx` для автоматической установки и запуска пакета. Если пакет не установлен, `npx` автоматически скачает и запустит его:

```json
{
  "mcpServers": {
    "openproject": {
      "command": "npx",
      "args": [
        "-y",
        "mcp-openproject-standalone"
      ],
      "env": {
        "OPENPROJECT_BASE_URL": "https://your-openproject-instance.com",
        "OPENPROJECT_API_KEY": "your-api-token-here"
      }
    }
  }
}
```

**Преимущества:**
- ✅ Автоматическая установка пакета при первом запуске
- ✅ Не требует предварительной установки
- ✅ Автоматическое обновление до последней версии
- ✅ Кэширование пакета для последующих запусков

**Примечание:** Флаг `-y` автоматически подтверждает установку пакета без запроса.

### Если установили через npm (глобально или локально)

Если вы уже установили пакет глобально:

```bash
npm install -g mcp-openproject-standalone
```

Тогда в конфигурации можно использовать:

```json
{
  "mcpServers": {
    "openproject": {
      "command": "mcp-openproject-standalone",
      "env": {
        "OPENPROJECT_BASE_URL": "https://your-openproject-instance.com",
        "OPENPROJECT_API_KEY": "your-api-token-here"
      }
    }
  }
}
```

**Примечание:** При глобальной установке (`npm install -g`) команда `mcp-openproject-standalone` будет доступна из любого места. При локальной установке используйте полный путь к `node_modules/.bin/mcp-openproject-standalone` или используйте `npx mcp-openproject-standalone`.

### Если используете локальную версию из исходников

#### Вариант 1: Через npm link

```bash
npm link
```

Тогда в конфигурации можно использовать:

```json
{
  "mcpServers": {
    "openproject": {
      "command": "mcp-openproject-standalone",
      "env": {
        "OPENPROJECT_BASE_URL": "https://your-openproject-instance.com",
        "OPENPROJECT_API_KEY": "your-api-token-here"
      }
    }
  }
}
```

#### Вариант 2: Прямой путь к файлу

```json
{
  "mcpServers": {
    "openproject": {
      "command": "node",
      "args": [
        "/absolute/path/to/mcp-openproject-standalone/index.js"
      ],
      "env": {
        "OPENPROJECT_BASE_URL": "https://your-openproject-instance.com",
        "OPENPROJECT_API_KEY": "your-api-token-here"
      }
    }
  }
}
```

## Доступные функции

1. **list_projects** - Получить список всех проектов
2. **get_project** - Получить детали проекта по ID
3. **list_work_packages** - Получить список задач в проекте
4. **get_work_package** - Получить детали задачи по ID
5. **create_work_package** - Создать новую задачу
6. **update_work_package** - Обновить существующую задачу
7. **list_statuses** - Получить список всех доступных статусов в OpenProject
8. **get_available_statuses** - Получить доступные статусы для конкретной задачи (workflow). Возвращает текущий статус и все статусы, которые можно установить для этой задачи

## Переменные окружения

Переменные окружения можно задать двумя способами:

### 1. В конфигурации MCP (рекомендуется)

Добавьте секцию `env` в конфигурацию MCP в файле `~/.cursor/mcp.json` или `~/.config/cursor/mcp.json`:

```json
{
  "mcpServers": {
    "openproject": {
      "command": "node",
      "args": ["/absolute/path/to/mcp-openproject-standalone/index.js"],
      "env": {
        "OPENPROJECT_BASE_URL": "https://your-openproject-instance.com",
        "OPENPROJECT_API_KEY": "your-api-token-here"
      }
    }
  }
}
```

Этот способ удобен, так как все настройки хранятся в одном месте.

### 2. Через системные переменные окружения

Также можно задать переменные окружения в системе перед запуском:

```bash
export OPENPROJECT_BASE_URL="https://your-openproject-instance.com"
export OPENPROJECT_API_KEY="your-api-token-here"
```

**Поддерживаемые переменные:**
- `OPENPROJECT_BASE_URL` или `OPENPROJECT_URL` - URL вашего OpenProject
- `OPENPROJECT_API_KEY` или `OPENPROJECT_API_TOKEN` - API токен из OpenProject

## Использование

После настройки вы сможете использовать в Cursor:

- "Покажи мне все проекты из OpenProject"
- "Покажи все задачи в проекте с ID 123"
- "Создай задачу в проекте 1 с названием 'Новая задача'"
- "Обнови задачу #123"
- "Покажи все доступные статусы"
- "Какие статусы можно установить для задачи #123?"

## Преимущества

- ✅ Полностью standalone - работает локально
- ✅ Не требует развертывания на Netlify
- ✅ Поддержка чтения и записи (CRUD операции)
- ✅ Простая установка и настройка
- ✅ Полный контроль над кодом

---

<a name="english"></a>
# 🇬🇧 English

Standalone MCP server for integrating OpenProject with Cursor IDE. Works completely locally, without the need to deploy on Netlify or other cloud platforms.

## Description

This MCP server allows Cursor IDE to directly interact with your OpenProject instance through the Model Context Protocol. The server runs completely locally and does not require deployment on cloud platforms.

## Installation

### Install via npm (Recommended, after publication)

After the package is published to npm, install it globally:

```bash
npm install -g mcp-openproject-standalone
```

Or locally in a project:

```bash
npm install mcp-openproject-standalone
```

Dependencies will be installed automatically with the package.

### Install from source

If you cloned the repository or want to use a local version:

#### Automatic dependency installation

Dependencies are installed **automatically** on the first run of the MCP server. Simply configure the MCP settings (see below), and dependencies will be installed automatically on first connection.

#### Manual dependency installation (Optional)

If you want to install dependencies manually in advance:

```bash
npm install
```

**Note:** If you plan to use the `npm link` option (see below), you need to make the script executable:
```bash
chmod +x index.js
```

If you use the `node index.js` option in the MCP configuration, this step is not required.

## Updating the Package

After the initial installation, you can update the package to the latest version.

### Updating when using npx

If you use `npx` in the MCP configuration, the package is automatically updated to the latest version on each run. No additional action is required.

### Updating with global installation

If you installed the package globally via `npm install -g`, update it with:

```bash
npm update -g mcp-openproject-standalone
```

Or reinstall the latest version:

```bash
npm install -g mcp-openproject-standalone@latest
```

### Updating with local installation

If the package is installed locally in a project:

```bash
npm update mcp-openproject-standalone
```

Or reinstall the latest version:

```bash
npm install mcp-openproject-standalone@latest
```

### Checking current version

To see the currently installed version:

```bash
npm list -g mcp-openproject-standalone
```

Or for local installation:

```bash
npm list mcp-openproject-standalone
```

To see the latest available version on npm:

```bash
npm view mcp-openproject-standalone version
```

### After updating

After updating the package, restart Cursor IDE for the changes to take effect.

## Configuration in Cursor

Add the following configuration to the MCP Cursor file (`~/.cursor/mcp.json` or `~/.config/cursor/mcp.json`):

### Automatic installation via npx (Recommended)

Use `npx` for automatic installation and running of the package. If the package is not installed, `npx` will automatically download and run it:

```json
{
  "mcpServers": {
    "openproject": {
      "command": "npx",
      "args": [
        "-y",
        "mcp-openproject-standalone"
      ],
      "env": {
        "OPENPROJECT_BASE_URL": "https://your-openproject-instance.com",
        "OPENPROJECT_API_KEY": "your-api-token-here"
      }
    }
  }
}
```

**Advantages:**
- ✅ Automatic package installation on first run
- ✅ No pre-installation required
- ✅ Automatic update to latest version
- ✅ Package caching for subsequent runs

**Note:** The `-y` flag automatically confirms package installation without prompting.

### If installed via npm (globally or locally)

If you have already installed the package globally:

```bash
npm install -g mcp-openproject-standalone
```

Then in the configuration you can use:

```json
{
  "mcpServers": {
    "openproject": {
      "command": "mcp-openproject-standalone",
      "env": {
        "OPENPROJECT_BASE_URL": "https://your-openproject-instance.com",
        "OPENPROJECT_API_KEY": "your-api-token-here"
      }
    }
  }
}
```

**Note:** With global installation (`npm install -g`), the `mcp-openproject-standalone` command will be available from anywhere. With local installation, use the full path to `node_modules/.bin/mcp-openproject-standalone` or use `npx mcp-openproject-standalone`.

### If using local version from source

#### Option 1: Via npm link

```bash
npm link
```

Then in the configuration you can use:

```json
{
  "mcpServers": {
    "openproject": {
      "command": "mcp-openproject-standalone",
      "env": {
        "OPENPROJECT_BASE_URL": "https://your-openproject-instance.com",
        "OPENPROJECT_API_KEY": "your-api-token-here"
      }
    }
  }
}
```

#### Option 2: Direct path to file

```json
{
  "mcpServers": {
    "openproject": {
      "command": "node",
      "args": [
        "/absolute/path/to/mcp-openproject-standalone/index.js"
      ],
      "env": {
        "OPENPROJECT_BASE_URL": "https://your-openproject-instance.com",
        "OPENPROJECT_API_KEY": "your-api-token-here"
      }
    }
  }
}
```

## Available Functions

1. **list_projects** - Get a list of all projects
2. **get_project** - Get project details by ID
3. **list_work_packages** - Get a list of work packages in a project
4. **get_work_package** - Get work package details by ID
5. **create_work_package** - Create a new work package
6. **update_work_package** - Update an existing work package
7. **list_statuses** - Get a list of all available statuses in OpenProject
8. **get_available_statuses** - Get available statuses for a specific work package (workflow). Returns the current status and all statuses that can be set for this work package

## Environment Variables

Environment variables can be set in two ways:

### 1. In MCP Configuration (Recommended)

Add the `env` section to the MCP configuration in the file `~/.cursor/mcp.json` or `~/.config/cursor/mcp.json`:

```json
{
  "mcpServers": {
    "openproject": {
      "command": "node",
      "args": ["/absolute/path/to/mcp-openproject-standalone/index.js"],
      "env": {
        "OPENPROJECT_BASE_URL": "https://your-openproject-instance.com",
        "OPENPROJECT_API_KEY": "your-api-token-here"
      }
    }
  }
}
```

This method is convenient as all settings are stored in one place.

### 2. Via System Environment Variables

You can also set environment variables in the system before running:

```bash
export OPENPROJECT_BASE_URL="https://your-openproject-instance.com"
export OPENPROJECT_API_KEY="your-api-token-here"
```

**Supported variables:**
- `OPENPROJECT_BASE_URL` or `OPENPROJECT_URL` - URL of your OpenProject instance
- `OPENPROJECT_API_KEY` or `OPENPROJECT_API_TOKEN` - API token from OpenProject

## Usage

After configuration, you can use in Cursor:

- "Show me all projects from OpenProject"
- "Show all work packages in project with ID 123"
- "Create a work package in project 1 with title 'New Task'"
- "Update work package #123"
- "Show all available statuses"
- "What statuses can be set for work package #123?"

## Advantages

- ✅ Fully standalone - works locally
- ✅ No deployment on Netlify required
- ✅ Read and write support (CRUD operations)
- ✅ Simple installation and configuration
- ✅ Full control over the code
