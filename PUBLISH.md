# Инструкция по публикации в npm

## Подготовка

1. **Обновите package.json:**
   - Укажите правильный `author` (ваше имя и email)
   - Обновите `repository.url` на реальный URL вашего GitHub репозитория
   - Обновите `homepage` и `bugs.url` на реальные URL
   - Проверьте, что имя пакета уникально (если `mcp-openproject-standalone` уже занято, измените имя)

2. **Проверьте имя пакета:**
   ```bash
   npm search mcp-openproject-standalone
   ```
   Если пакет с таким именем уже существует, измените `name` в `package.json` на уникальное (например, `@yourusername/mcp-openproject-standalone`)

## Публикация

### 1. Создайте аккаунт на npm (если еще нет)

Перейдите на https://www.npmjs.com/signup и создайте аккаунт.

### 2. Войдите в npm через командную строку

```bash
npm login
```

Введите ваш username, password и email.

### 3. Проверьте, что вы вошли в систему

```bash
npm whoami
```

Должно показать ваше имя пользователя.

### 4. Проверьте содержимое пакета перед публикацией

```bash
npm pack
```

Это создаст `.tgz` файл, который будет опубликован. Распакуйте и проверьте содержимое.

### 5. Опубликуйте пакет

```bash
npm publish
```

Если вы используете scoped пакет (например, `@yourusername/mcp-openproject-standalone`), используйте:

```bash
npm publish --access public
```

### 6. Проверьте публикацию

После публикации проверьте, что пакет доступен:

```bash
npm view mcp-openproject-standalone
```

Или откройте в браузере: https://www.npmjs.com/package/mcp-openproject-standalone

## Установка пакета

После публикации пользователи смогут установить пакет:

```bash
npm install -g mcp-openproject-standalone
```

Или локально:

```bash
npm install mcp-openproject-standalone
```

## Обновление пакета

При внесении изменений:

1. Обновите версию в `package.json` (следуйте [Semantic Versioning](https://semver.org/)):
   - `1.0.1` - для патчей (bug fixes)
   - `1.1.0` - для новых функций (backward compatible)
   - `2.0.0` - для breaking changes

2. Опубликуйте новую версию:
   ```bash
   npm publish
   ```

## Использование после установки

После установки через npm, пользователи могут использовать пакет в конфигурации MCP:

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

## Важные замечания

- **Имя пакета должно быть уникальным** - проверьте доступность перед публикацией
- **Версия должна следовать Semantic Versioning**
- **Не публикуйте секреты** - убедитесь, что `.npmignore` исключает `.env` и другие чувствительные файлы
- **README.md важен** - он будет отображаться на странице пакета в npm

