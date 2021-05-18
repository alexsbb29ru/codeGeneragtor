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
    //! -------------- Settings modal -----------------------
    //Prepare settings page
    electron_1.ipcMain.on("window:prepare-settings-page", (_event, args) => {
        if (win)
            win.webContents.send("window:open-settings", args);
    });
    electron_1.ipcMain.on("window:open-settings-modal", (_event, args) => {
        if (win)
            win.webContents.send("window:open-settings-modal", args);
    });
    //Change settings on settings page
    electron_1.ipcMain.on("window:change-settings", (_event, args) => {
        if (win)
            win.webContents.send("window:change-settings", args);
    });
    //! ------------------ History modal -------------------
    //Open history page
    electron_1.ipcMain.on("window:init-history-modal", (_event, args) => {
        if (win)
            win.webContents.send("window:init-history-modal", args);
    });
    electron_1.ipcMain.on("window:open-history-modal", (_event, modal) => {
        if (win)
            win.webContents.send("window:open-history-modal", modal);
    });
    //Set history position to main text input
    electron_1.ipcMain.on("window:set-history", (_event, selectedText) => {
        if (win)
            win.webContents.send("window:set-history", selectedText);
    });
    //Clear history
    electron_1.ipcMain.on("window:clear-history", (_event, args) => {
        if (win)
            win.webContents.send("window:clear-history", args);
    });
    //! ----------------- About modal -----------------------
    //Open about
    electron_1.ipcMain.on("window:init-about", (_event, args) => {
        args.version = `Версия: ${electron_1.app.getVersion()}`;
        if (win)
            win.webContents.send("window:init-about", args);
    });
    electron_1.ipcMain.on("window:open-about-modal", (_event, args) => {
        if (win)
            win.webContents.send("window:open-about-modal", args);
    });
    //Open URL
    electron_1.ipcMain.on("url:open-url", (_event, stringURL) => {
        electron_1.shell.openExternal(stringURL);
    });
    //! --------------- Multi generate modal ------------------
    //Open multi code generate page
    electron_1.ipcMain.on("window:init-multi-gen", (_event, downloadFolderPath) => {
        if (win)
            win.webContents.send("window:init-multi-gen", downloadFolderPath);
    });
    electron_1.ipcMain.on("window:open-multigen-modal", (_event, args) => {
        if (win)
            win.webContents.send("window:open-multigen-modal", args);
    });
    //Generate all codes
    electron_1.ipcMain.on("window:generate-codes", (_event, args) => {
        if (win)
            win.webContents.send("window:generate-codes", args);
    });
    // ------------------ Other --------------------
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
