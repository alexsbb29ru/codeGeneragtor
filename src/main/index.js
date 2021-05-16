"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const devMode = "develop";
const releaseMode = "release";
const appMode = releaseMode;
let win;
const createWindow = (startPage) => {
    win = new electron_1.BrowserWindow({
        width: 700,
        height: 380,
        minHeight: 390,
        minWidth: 700,
        icon: __dirname + "/images/iconMax.png",
        webPreferences: {
            contextIsolation: false,
            nodeIntegration: true,
            enableRemoteModule: true,
        },
        autoHideMenuBar: true,
        frame: false,
        show: false,
    });
    if (appMode === devMode) {
        electron_1.globalShortcut.register("CommandOrControl+R", () => { });
        electron_1.globalShortcut.register("CommandOrControl+Shift+I", () => { });
    }
    win.loadFile(startPage);
    win.webContents.openDevTools();
    win.once("ready-to-show", win.show);
    win.on("closed", () => {
        win = null;
    });
    //Open settings page
    electron_1.ipcMain.on("window:open-settings", (event, args) => {
        if (win)
            win.webContents.send("window:open-settings", args);
    });
    //Open history page
    electron_1.ipcMain.on("window:open-history", (event, args) => {
        if (win)
            win.webContents.send("window:open-history", args);
    });
    //Change settings on settings page
    electron_1.ipcMain.on("window:change-settings", (event, args) => {
        if (win)
            win.webContents.send("window:change-settings", args);
    });
    //Set history position to main text input
    electron_1.ipcMain.on("window:set-history", (event, args) => {
        if (win)
            win.webContents.send("window:set-history", args);
    });
    //Clear history
    electron_1.ipcMain.on("window:clear-history", (event, args) => {
        if (win)
            win.webContents.send("window:clear-history", args);
    });
    //Open about
    electron_1.ipcMain.on("window:open-about", (event, args) => {
        args.version = `Версия: ${electron_1.app.getVersion()}`;
        if (win)
            win.webContents.send("window:open-about", args);
    });
    electron_1.ipcMain.on("window:open-about-modal", (event, args) => {
        if (win)
            win.webContents.send("window:open-about-modal", args);
    });
    //Open URL
    electron_1.ipcMain.on("url:open-url", (event, stringURL) => {
        electron_1.shell.openExternal(stringURL);
    });
    //Open multi code generate page
    electron_1.ipcMain.on("window:open-multi-gen", (event, downloadFolderPath) => {
        if (win)
            win.webContents.send("window:open-multi-gen", downloadFolderPath);
    });
    //Generate all codes
    electron_1.ipcMain.on("window:generate-codes", (event, args) => {
        if (win)
            win.webContents.send("window:generate-codes", args);
    });
    require("@electron/remote/main").initialize();
};
electron_1.app.on("ready", () => createWindow("index.html"));
electron_1.app.on("window-all-closed", () => {
    if (process.platform !== "darwin")
        electron_1.app.quit();
});
electron_1.app.allowRendererProcessReuse = false;
electron_1.app.on("activate", () => {
    if (win == null)
        createWindow("index.html");
});
