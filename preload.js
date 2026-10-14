const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('desktopAPI', {
  chooseExecutable: () => ipcRenderer.invoke('choose-executable'),
  launchGame: (executablePath) => ipcRenderer.invoke('launch-game', executablePath)
});
