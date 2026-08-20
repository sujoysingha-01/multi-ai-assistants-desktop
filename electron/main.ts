import { app, BrowserWindow, globalShortcut, ipcMain, Tray, Menu } from 'electron'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

process.env.DIST = path.join(__dirname, '../dist')
process.env.VITE_PUBLIC = app.isPackaged ? process.env.DIST : path.join(process.env.DIST, '../public')

let win: BrowserWindow | null
let tray: Tray | null
const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']

function createWindow() {
  Menu.setApplicationMenu(null) // Remove the default File/Edit/View menu

  win = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC, 'electron-vite.svg'),
    width: 1200,
    height: 800,
    frame: false, // Removes the native Windows header
    backgroundColor: '#18181b', // Prevents white flash/background
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      webviewTag: true, // Essential for embedding providers
      nodeIntegration: true,
      contextIsolation: false,
    },
  })

  // Test active push message to Renderer-process.
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', (new Date).toLocaleString())
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    win.loadFile(path.join(process.env.DIST, 'index.html'))
  }

  // Prevent window from actually destroying on close (e.g. via Taskbar or Alt+F4)
  win.on('close', (event) => {
    // @ts-ignore
    if (!app.isQuiting) {
      event.preventDefault()
      win?.hide()
    }
    return false
  })

  let currentShortcut = 'CommandOrControl+Shift+Space';
  globalShortcut.register(currentShortcut, () => {
    if (win) {
      if (win.isDestroyed()) {
        createWindow();
        return;
      }
      if (win.isVisible() && win.isFocused()) {
        win.hide()
      } else {
        win.show()
        win.focus()
      }
    } else {
      createWindow()
    }
  })

  ipcMain.on('update-shortcut', (event, newShortcut) => {
    if (currentShortcut) {
      globalShortcut.unregister(currentShortcut);
    }
    currentShortcut = newShortcut;
    globalShortcut.register(currentShortcut, () => {
      if (win) {
        if (win.isDestroyed()) {
          createWindow();
          return;
        }
        if (win.isVisible() && win.isFocused()) {
          win.hide()
        } else {
          win.show()
          win.focus()
        }
      } else {
        createWindow()
      }
    });
  });

  ipcMain.on('window-minimize', () => {
    if (!win?.isDestroyed()) win?.minimize()
  })
  
  ipcMain.on('window-maximize', () => {
    if (win?.isDestroyed()) return
    if (win?.isMaximized()) {
      win.unmaximize()
    } else {
      win?.maximize()
    }
  })

  ipcMain.on('window-close', () => {
    if (!win?.isDestroyed()) win?.hide() 
  })

  // Auto-start handlers
  ipcMain.handle('get-autostart', () => {
    return app.getLoginItemSettings().openAtLogin;
  })

  ipcMain.on('set-autostart', (event, enable) => {
    app.setLoginItemSettings({
      openAtLogin: enable,
      path: app.getPath('exe') // Required on Windows
    });
  })

  // Setup System Tray
  const iconPath = path.join(process.env.VITE_PUBLIC, 'electron-vite.svg')
  tray = new Tray(iconPath)
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Open Multi-AI', click: () => {
      if (win?.isDestroyed()) createWindow()
      else win?.show()
    }},
    { type: 'separator' },
    { label: 'Quit', click: () => {
      // @ts-ignore
      app.isQuiting = true
      app.quit()
    }}
  ])
  tray.setToolTip('Multi-AI Assistant')
  tray.setContextMenu(contextMenu)
  tray.on('click', () => {
    if (win?.isDestroyed()) createWindow()
    else win?.show()
  })
}

app.on('window-all-closed', () => {
  // On windows we keep it running in the tray, so do not quit on close.
})

app.on('will-quit', () => {
  globalShortcut.unregisterAll()
})

app.whenReady().then(createWindow)
