const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

let initialFilePath = null;

const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
    app.quit();
} else {
    app.on('second-instance', (event, commandLine) => {
        const filePath = commandLine.find(arg => arg.endsWith('.txt') && fs.existsSync(arg));
        const wins = BrowserWindow.getAllWindows();
        if (filePath && wins.length > 0) {
            const win = wins[0];
            if (win.isMinimized()) win.restore();
            win.focus();
            win.webContents.send('open-file', filePath);
        }
    });
}

function getWin(event) { return BrowserWindow.fromWebContents(event.sender); }

function createWindow() {
    const win = new BrowserWindow({
        width: 1100,
        height: 700,
        frame: false,
        backgroundColor: '#ffffff',
        show: false,
        icon: path.join(__dirname, '..', 'build', 'notes.png'),
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        }
    });

    win.removeMenu();
    win.loadFile(path.join(__dirname, 'index.html'));

    win.once('ready-to-show', () => win.show());
}

ipcMain.handle('get-initial-file', () => initialFilePath);

ipcMain.on('window-min', (event) => getWin(event).minimize());

ipcMain.on('window-max', (event) => {
    const win = getWin(event);
    win.isMaximized() ? win.unmaximize() : win.maximize();
});

ipcMain.on('window-close', (event) => getWin(event).close());

ipcMain.handle('show-save-dialog', async (event) => {
    return await dialog.showSaveDialog(getWin(event), {
        filters: [{ name: 'Текстовые файлы', extensions: ['txt'] }]
    });
});

ipcMain.handle('save-file', async (event, { filePath, content }) => {
    fs.writeFileSync(filePath, content, 'utf-8');
    return true;
});

ipcMain.handle('show-open-dialog', async (event) => {
    return await dialog.showOpenDialog(getWin(event), {
        filters: [{ name: 'Текстовые файлы', extensions: ['txt'] }],
        properties: ['openFile']
    });
});

ipcMain.handle('read-file', async (event, filePath) => {
    const content = fs.readFileSync(filePath, 'utf-8');
    return { content, filePath };
});

ipcMain.handle('open-new-window', () => createWindow());

ipcMain.handle('show-unsaved-dialog', async (event) => {
    return (await dialog.showMessageBox(getWin(event), {
        type: 'warning',
        buttons: ['Сохранить', 'Не сохранять', 'Отмена'],
        defaultId: 0,
        cancelId: 2,
        title: 'JustNotepad',
        message: 'Хотите сохранить изменения?',
        detail: 'Изменения не будут сохранены, если вы их не сохраните.'
    })).response;
});

app.whenReady().then(() => {
    const cmdFile = process.argv.find(arg => arg.endsWith('.txt') && fs.existsSync(arg));
    if (cmdFile) initialFilePath = cmdFile;

    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('open-file', (event, filePath) => {
    event.preventDefault();
    const wins = BrowserWindow.getAllWindows();
    if (wins.length > 0) {
        wins[0].webContents.send('open-file', filePath);
    } else {
        initialFilePath = filePath;
        createWindow();
    }
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});
