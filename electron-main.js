const { app, BrowserWindow, globalShortcut } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1920,
        height: 1080,
        fullscreen: true,
        autoHideMenuBar: true,
        icon: path.join(__dirname, 'icon.png'),
        backgroundColor: '#050508',
        title: 'John Dungeons',
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            sandbox: true
        }
    });

    // Load the built Vite output
    mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));

    mainWindow.on('closed', () => { mainWindow = null; });

    // Toggle fullscreen with F11
    globalShortcut.register('F11', () => {
        mainWindow.setFullScreen(!mainWindow.isFullScreen());
    });

    // DevTools with F12 (dev only)
    globalShortcut.register('F12', () => {
        mainWindow.webContents.toggleDevTools();
    });

    // ESC exits fullscreen (not the app)
    globalShortcut.register('Escape', () => {
        if (mainWindow.isFullScreen()) {
            mainWindow.setFullScreen(false);
        }
    });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => { app.quit(); });
app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
app.on('will-quit', () => { globalShortcut.unregisterAll(); });
