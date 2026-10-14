const { app, BrowserWindow, dialog, ipcMain } = require('electron');
const { spawn } = require('node:child_process');
const path = require('node:path');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 960,
    minHeight: 640,
    backgroundColor: '#f6f7f2',
    title: 'TMLauncher',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  mainWindow.loadFile('index.html');
}

app.whenReady().then(() => {
  ipcMain.handle('choose-executable', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'Choose a Trackmania executable',
      properties: ['openFile'],
      filters: [{ name: 'Windows applications', extensions: ['exe'] }]
    });
    return result.canceled ? null : result.filePaths[0];
  });
  ipcMain.handle('launch-game', async (_event, executablePath) => {
    try {
      const child = spawn(executablePath, [], { detached: true, stdio: 'ignore' });
      child.unref();
      return { ok: true };
    } catch (error) {
      return { ok: false, message: error.message };
    }
  });
  createWindow();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
