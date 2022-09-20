import { contextBridge, ipcRenderer, shell } from 'electron';
import { machineIdSync } from 'node-machine-id';

contextBridge.exposeInMainWorld('electron', {
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  platform: process.platform,
  openExternal: (url: string) => shell.openExternal(url),
  getMachineId: () => machineIdSync(true),
  close: () => ipcRenderer.send('close'),
});
