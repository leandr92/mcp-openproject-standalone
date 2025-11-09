# Standalone MCP Server for OpenProject

Standalone MCP-сервер для интеграции OpenProject с Cursor IDE. Работает полностью локально, без необходимости развертывания на Netlify или других облачных платформах.

## Описание

Этот MCP-сервер позволяет Cursor IDE напрямую взаимодействовать с вашим экземпляром OpenProject через Model Context Protocol. Сервер работает полностью локально и не требует развертывания на облачных платформах.

## Установка

### Автоматическая установка (рекомендуется)

Зависимости устанавливаются **автоматически** при первом запуске MCP-сервера. Просто настройте конфигурацию MCP (см. ниже), и при первом подключении зависимости будут установлены автоматически.

### Ручная установка (опционально)

Если хотите установить зависимости вручную заранее:

```bash
npm install
```

**Примечание:** Если вы планируете использовать вариант с `npm link` (см. ниже), то нужно сделать скрипт исполняемым:
```bash
chmod +x index.js
```

Если вы используете вариант с `node index.js` в конфигурации MCP, то этот шаг не обязателен.

## Настройка в Cursor

Добавьте следующую конфигурацию в файл MCP Cursor (`~/.cursor/mcp.json` или `~/.config/cursor/mcp.json`):

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

**Или если установили глобально через npm link:**

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

