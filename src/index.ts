import { app, BrowserWindow, ipcMain, Notification, Tray, Menu, nativeImage } from 'electron';
import * as path from 'path';
import is from 'electron-is';
import { Message } from './types';

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let isQuitting: boolean;
let dontDisturb: boolean;

app.on('before-quit', () => isQuitting = true);

function createMainWindow() {
  const window = new BrowserWindow({
    width: 400,
    minWidth: 400,
    height: 700,
    minHeight: 500,
    fullscreenable: false,
    title: 'Instant Messaging',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  window.setMenuBarVisibility(false);

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Mostra/nascondi finestra',
      click: () => {
        if(window.isVisible()) {
          app.dock.hide();
          window.hide();
        } else {
          app.dock.show();
          window.show();
        }
      }
    },
    {
      label: 'Non disturbare',
      type: 'checkbox',
      click: () => dontDisturb = !dontDisturb
    },
    {
      type: 'separator'
    },
    {
      label: 'Esci',
      click: () => {
        isQuitting = true;
        app.quit();
      }
    }
  ]);

  tray = new Tray(nativeImage.createFromPath(path.join(__static, 'trayTemplate.png')));
  tray.setContextMenu(contextMenu);

  window.loadURL(
    is.dev()
      ? 'http://localhost:3000'
      : 'https://instant-messaging.vercel.app',
  );

  if (is.dev()) {
    window.webContents.openDevTools();
  }

  window.on('close', (e) => {
    if(!isQuitting) {
      e.preventDefault();
      app.dock.hide();
      window.hide();
      e.returnValue = false;
    }
  });

  window.webContents.on('devtools-opened', () => {
    window.focus();
    setImmediate(() => {
      window.focus();
    });
  });

  return window;
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    tray?.destroy();
    mainWindow = createMainWindow();
  }
});

app.on('ready', () => {
  mainWindow = createMainWindow();
});

ipcMain.on('@notifications/new_message', (event, newMessage: Message) => {
  const notification = new Notification({
    title: `Nuovo messaggio da @${newMessage.user.username}`,
    body: newMessage.content,
  });
  if(dontDisturb) {
    notification.silent = true;
  }
  notification.show();
  notification.on('click', () => {
    app.dock.show();
    mainWindow?.show();
  });
});
