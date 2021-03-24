import {app, BrowserWindow, ipcMain, Notification} from "electron";
const isDevelopment = process.env.NODE_ENV !== "production";

let mainWindow: BrowserWindow | null = null;

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

  window.loadURL(
    isDevelopment
      ? 'http://localhost:3000'
      : 'https://instant-messaging.vercel.app',
  );

  if (isDevelopment) {
    window.webContents.openDevTools();
  }

  window.on("closed", () => {
    mainWindow = null;
  });

  window.webContents.on("devtools-opened", () => {
    window.focus();
    setImmediate(() => {
      window.focus();
    });
  });

  return window;
}

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (mainWindow === null) {
    mainWindow = createMainWindow();
  }
});

app.on("ready", () => {
  mainWindow = createMainWindow();
});

interface Message {
  content: string,
  user: {
    username: string,
    avatar: string,
  }
}

ipcMain.on('@notifications/new_message', (event, newMessage: Message) => {
  const notification = {
    title: `Nuovo messaggio da @${newMessage.user.username}`,
    body: newMessage.content,
  };
  new Notification(notification).show();
});
