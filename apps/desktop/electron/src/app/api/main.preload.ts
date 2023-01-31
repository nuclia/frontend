import { contextBridge, ipcRenderer, shell } from 'electron';
import { machineIdSync } from 'node-machine-id';
import { Auth } from 'googleapis';

contextBridge.exposeInMainWorld('electron', {
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  platform: process.platform,
  openExternal: (url: string) => shell.openExternal(url),
  close: () => ipcRenderer.send('close'),
  getMachineId: () => machineIdSync(true),
  quitAndReInstall: () => ipcRenderer.send('quitAndReInstall'),
  google: {
    getToken: async (credentials: any) => {
      const auth = new Auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/drive.readonly'],
      });
      return await auth.getAccessToken();
    },
  },
});
