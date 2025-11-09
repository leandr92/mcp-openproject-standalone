# Standalone MCP Server for OpenProject

Standalone MCP-сервер для интеграции OpenProject с Cursor IDE. Работает полностью локально, без необходимости развертывания на Netlify или других облачных платформах.

## Описание

Этот MCP-сервер позволяет Cursor IDE напрямую взаимодействовать с вашим экземпляром OpenProject через Model Context Protocol. Сервер работает полностью локально и не требует развертывания на облачных платформах.

## Установка

1. Установите зависимости:
```bash
npm install
```

2. Сделайте скрипт исполняемым:
```bash
chmod +x index.js
```

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

## Переменные окружения

- `OPENPROJECT_BASE_URL` или `OPENPROJECT_URL` - URL вашего OpenProject
- `OPENPROJECT_API_KEY` или `OPENPROJECT_API_TOKEN` - API токен из OpenProject

## Использование

После настройки вы сможете использовать в Cursor:

- "Покажи мне все проекты из OpenProject"
- "Покажи все задачи в проекте с ID 123"
- "Создай задачу в проекте 1 с названием 'Новая задача'"
- "Обнови задачу #123"

## Преимущества

- ✅ Полностью standalone - работает локально
- ✅ Не требует развертывания на Netlify
- ✅ Поддержка чтения и записи (CRUD операции)
- ✅ Простая установка и настройка
- ✅ Полный контроль над кодом

