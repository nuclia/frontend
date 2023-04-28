import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electron', {
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  platform: process.platform,
  openExternal: (url: string) => ipcRenderer.send('openExternal', url),
  close: () => ipcRenderer.send('close'),
  quitAndReInstall: () => ipcRenderer.send('quitAndReInstall'),
  debug: () => ipcRenderer.send('debug'),
  startLocalServer: () => ipcRenderer.send('local-server'),
});
