import { BrowserWindow, shell, screen, ipcMain } from 'electron';
import { rendererAppName, rendererAppPort } from './constants';
import { environment } from '../environments/environment';
import { join } from 'path';
import { ChildProcessWithoutNullStreams, spawn } from 'child_process';
import { format } from 'url';
import { autoUpdater } from 'electron-updater';
import { Readable } from 'stream';

let expressAppProcess: ChildProcessWithoutNullStreams | undefined;

export default class App {
  // Keep a global reference of the window object, if you don't, the window will
  // be closed automatically when the JavaScript object is garbage collected.
  static mainWindow: Electron.BrowserWindow | null;
  static application: Electron.App;
  static BrowserWindow: typeof BrowserWindow;

  public static isDevelopmentMode() {
    const isEnvironmentSet: boolean = 'ELECTRON_IS_DEV' in process.env;
    const getFromEnvironment: boolean = parseInt(process.env.ELECTRON_IS_DEV || '0', 10) === 1;

    return isEnvironmentSet ? getFromEnvironment : !environment.production;
  }

  private static onWindowAllClosed() {
    if (process.platform !== 'darwin') {
      App.application.quit();
    }
  }

  private static onClose() {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    App.mainWindow = null;
  }

  private static onRedirect(event: any, url: string) {
    if (url !== App.mainWindow?.webContents.getURL()) {
      // this is a normal external redirect, open it in a new browser window
      event.preventDefault();
      shell.openExternal(url);
    }
  }

  private static onReady() {
    // This method will be called when Electron has finished
    // initialization and is ready to create browser windows.
    // Some APIs can only be used after this event occurs.
    App.initMainWindow();
    App.loadMainWindow();
    autoUpdater.checkForUpdatesAndNotify();
  }

  private static onActivate() {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (App.mainWindow === null) {
      App.onReady();
    }
  }

  private static initMainWindow() {
    const workAreaSize = screen.getPrimaryDisplay().workAreaSize;
    const width = Math.min(1280, workAreaSize.width || 1280);
    const height = Math.min(720, workAreaSize.height || 720);

    // Create the browser window.
    App.mainWindow = new BrowserWindow({
      width: width,
      height: height,
      show: false,
      webPreferences: {
        contextIsolation: true,
        backgroundThrottling: false,
        preload: join(__dirname, 'main.preload.js'),
      },
    });
    App.mainWindow.setMenu(null);
    App.mainWindow.center();

    // if main window is ready to show, close the splash window and show the main window
    App.mainWindow?.once('ready-to-show', () => {
      App.mainWindow?.show();
    });

    // handle all external redirects in a new browser window
    // App.mainWindow.webContents.on('will-navigate', App.onRedirect);
    // App.mainWindow.webContents.on('new-window', (event, url, frameName, disposition, options) => {
    //     App.onRedirect(event, url);
    // });

    // Emitted when the window is closed.
    App.mainWindow.on('closed', () => {
      // Dereference the window object, usually you would store windows
      // in an array if your app supports multi windows, this is the time
      // when you should delete the corresponding element.
      expressAppProcess?.kill();
      App.mainWindow = null;
    });
  }

  private static loadMainWindow() {
    if (App.mainWindow) {
      // load the index.html of the app.
      if (!App.application.isPackaged) {
        App.mainWindow.loadURL(`http://localhost:${rendererAppPort}`);
      } else {
        const url = format({
          pathname: join(__dirname, '..', rendererAppName, 'index.html'),
          protocol: 'file:',
          slashes: true,
        }).replace(/\\/g, '/');
        console.log('OPENING', url);
        App.mainWindow.loadURL(url);
        App.application.setAsDefaultProtocolClient('nuclia-desktop');

        // Protocol handler for osx
        App.application.on('open-url', function (event, url) {
          event.preventDefault();
          App.injectDeeplink(url);
          // Fullscreen window doesn't get focus automatically
          if (App.mainWindow?.isFullScreen()) {
            App.mainWindow?.focus();
          }
        });

        // Protocol handler for win32
        if (process.platform == 'win32') {
          // Keep only command line / deep linked arguments
          const url = process.argv.slice(1).pop();
          App.injectDeeplink(url);
        }
      }
    }
  }

  static main(app: Electron.App, browserWindow: typeof BrowserWindow) {
    // we pass the Electron.App object and the
    // Electron.BrowserWindow into this function
    // so this class has no dependencies. This
    // makes the code easier to write tests for

    App.BrowserWindow = browserWindow;
    App.application = app;

    App.application.on('window-all-closed', App.onWindowAllClosed); // Quit when all windows are closed.
    App.application.on('ready', App.onReady); // App is ready to load data
    App.application.on('activate', App.onActivate); // App is activated
    autoUpdater.on('update-available', () => {
      App.mainWindow?.webContents.executeJavaScript(`alert('A new update is available. Downloading now…')`);
    });
    autoUpdater.on('error', (err) => {
      App.mainWindow?.webContents.executeJavaScript(`console.log('Error in auto-updater. ${err}')`);
    });
    autoUpdater.on('update-downloaded', () => {
      App.mainWindow?.webContents.executeJavaScript(
        `if(confirm('The update is downloaded. Do you want to update now?')){window['electron'].quitAndReInstall()}`,
      );
    });

    ipcMain.on('close', () => app.quit());
    ipcMain.on('quitAndReInstall', () => autoUpdater.quitAndInstall());

    ipcMain.on('debug', () => {
      App.mainWindow?.webContents.openDevTools();
    });
    ipcMain.on('openExternal', (event, url: string) => {
      shell.openExternal(url);
    });
    ipcMain.on('local-server', () => {
      const appName = app.getPath('exe');
      const expressPath = `${__dirname}/assets/service/apps/desktop/electron/src/service/server.js`;
      expressAppProcess = spawn(appName, [expressPath], {
        env: {
          ELECTRON_RUN_AS_NODE: '1',
          ELECTRON_HOME: app.getPath('home'),
        },
      });
      function redirectOutput(x: Readable) {
        x.on('data', function (data: any) {
          const log = data.toString();
          // log on the main process + console
          console.log(log);
          data
            .toString()
            .split('\n')
            .forEach((line: string) => {
              if (line !== '') {
                App.mainWindow?.webContents.executeJavaScript('console.log(`' + line + '`)');
              }
            });
        });
      }
      redirectOutput(expressAppProcess.stdout);
      redirectOutput(expressAppProcess.stderr);
    });

    const gotTheLock = app.requestSingleInstanceLock();
    if (gotTheLock) {
      app.on('second-instance', (e, argv) => {
        // Someone tried to run a second instance, we should focus our window.

        // Protocol handler for win32
        // argv: An array of the second instance’s (command line / deep linked) arguments
        if (process.platform == 'win32') {
          // Keep only command line / deep linked arguments
          const url = argv.slice(1).pop();
          App.injectDeeplink(url);
        }

        if (App.mainWindow) {
          if (App.mainWindow.isMinimized()) {
            App.mainWindow.restore();
          }
          App.mainWindow.focus();
        }
      });
    } else {
      app.quit();
      return;
    }
  }

  static injectDeeplink(url?: string) {
    App.mainWindow?.webContents.executeJavaScript(`window.deeplink='${url || ''}';`);
  }
}
