# JustNotepad

Простой и красивый блокнот на Electron. Работает на Windows, macOS и Linux.

<img width="1096" height="699" alt="notepad1" src="https://github.com/user-attachments/assets/237a953f-f8ca-4d45-8e89-cf575f143e15" />


## Возможности

- Минималистичный интерфейс без рамки с кастомным заголовком
- Темная тема (следует за системой)
- Два языка: русский и английский (автоопределение системы)
- Поиск и замена с подсветкой
- Автосохранение через 1 секунду бездействия
- Последние заметк
- 6 встроенных обоев с затемнением
- Несколько окон независимо друг от друга
- Проверка грамматики
- Масштабирование текста
- Равные отступы для удобного чтения
- Ассоциация .txt файлов после установки

<img width="1096" height="699" alt="notepad2" src="https://github.com/user-attachments/assets/56456c8f-be5a-4b87-b860-4b449ce5ce70" />
<img width="1097" height="696" alt="notepad3" src="https://github.com/user-attachments/assets/0867fc64-2c2b-477d-ac4d-6cdf6cb86955" />

## Запуск

```bash
npm install
npm start
```

## Сборка установщика

```bash
npm install --save-dev electron-builder
npm run build
```

Установщик появится в `dist/JustNotepad Setup 1.0.0.exe`.
