const { app, BrowserWindow, ipcMain, shell } = require('electron')

let startPage = "index.html"
let darkTitleColor = "black"
let lightTitleColor = "white"

function createWindow() {
    let win = new BrowserWindow({
        width: 700,
        height: 380,
        minHeight: 390,
        minWidth: 700,
        icon: __dirname + "/images/barcode.png",
        webPreferences: {
            nodeIntegration: true,
            enableRemoteModule: true
        },
        autoHideMenuBar: true,
        frame:false
    });

    win.loadFile(startPage);
    //win.webContents.openDevTools();
    win.on('closed', () => {
        win = null;
    });
    //Open settings page
    ipcMain.on('window:open-settings', (event, args) => {
        win.webContents.send('window:open-settings', args)
    })
    //Open history page
    ipcMain.on('window:open-history', (event, args) => {
        win.webContents.send('window:open-history', args)
    })
    //Change settings on settings page
    ipcMain.on('window:change-settings', (event, args) => {
        win.webContents.send('window:change-settings', args)
    })
    //Set history position to main text input
    ipcMain.on('window:set-history', (event, args) => {
        win.webContents.send('window:set-history', args)
    })
    //Clear history
    ipcMain.on('window:clear-history', (event, args) => {
        win.webContents.send('window:clear-history', args)
    })
    //Open about
    ipcMain.on('window:open-about', (event, args) => {
        args.version = `Версия: ${app.getVersion()}`
        win.webContents.send('window:open-about', args)
    })
    //Open URL
    ipcMain.on('url:open-url', (event, stringURL) => {
        shell.openExternal(stringURL)
    })
}

app.on('ready', createWindow);
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin')
        app.quit()
});

app.on("activate", () => {
    if (win == null)
        createWindow("index.html")
});
