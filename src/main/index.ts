import {
    app,
    BrowserWindow,
    ipcMain,
    IpcMainEvent,
    shell,
    globalShortcut,
} from "electron"
import path from "path"

const devMode: string = "develop"
const releaseMode: string = "release"
const appMode: string = releaseMode
let win: BrowserWindow | null

const createWindow = (startPage: string): void => {
    win = new BrowserWindow({
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
    })

    if (appMode === devMode) {
        globalShortcut.register("CommandOrControl+R", () => {})
        globalShortcut.register("CommandOrControl+Shift+I", () => {})
    }

    win.loadFile(startPage)

    win.webContents.openDevTools()
    win.once("ready-to-show", win.show)
    win.on("closed", () => {
        win = null
    })
    //! -------------- Settings modal -----------------------
    //Prepare settings page
    ipcMain.on(
        "window:prepare-settings-page",
        (_event: IpcMainEvent, args: any) => {
            if (win) win.webContents.send("window:open-settings", args)
        }
    )
    ipcMain.on(
        "window:open-settings-modal",
        (_event: IpcMainEvent, args: any) => {
            if (win) win.webContents.send("window:open-settings-modal", args)
        }
    )
    //Change settings on settings page
    ipcMain.on("window:change-settings", (_event: IpcMainEvent, args: any) => {
        if (win) win.webContents.send("window:change-settings", args)
    })

    //! ------------------ History modal -------------------
    //Open history page
    ipcMain.on(
        "window:init-history-modal",
        (_event: IpcMainEvent, args: any) => {
            if (win) win.webContents.send("window:init-history-modal", args)
        }
    )
    ipcMain.on(
        "window:open-history-modal",
        (_event: IpcMainEvent, modal: any) => {
            if (win) win.webContents.send("window:open-history-modal", modal)
        }
    )

    //Set history position to main text input
    ipcMain.on(
        "window:set-history",
        (_event: IpcMainEvent, selectedText: string) => {
            if (win) win.webContents.send("window:set-history", selectedText)
        }
    )
    //Clear history
    ipcMain.on("window:clear-history", (_event: IpcMainEvent, args: any) => {
        if (win) win.webContents.send("window:clear-history", args)
    })

    //! ----------------- About modal -----------------------
    //Open about
    ipcMain.on("window:init-about", (_event: IpcMainEvent, args: any) => {
        args.version = `Версия: ${app.getVersion()}`
        if (win) win.webContents.send("window:init-about", args)
    })
    ipcMain.on("window:open-about-modal", (_event: IpcMainEvent, args: any) => {
        if (win) win.webContents.send("window:open-about-modal", args)
    })
    //Open URL
    ipcMain.on("url:open-url", (_event: IpcMainEvent, stringURL: string) => {
        shell.openExternal(stringURL)
    })

    //! --------------- Multi generate modal ------------------
    //Open multi code generate page
    ipcMain.on(
        "window:init-multi-gen",
        (_event: IpcMainEvent, downloadFolderPath: string) => {
            if (win)
                win.webContents.send(
                    "window:init-multi-gen",
                    downloadFolderPath
                )
        }
    )
    ipcMain.on("window:open-multigen-modal", (_event: IpcMainEvent, args) => {
        if (win) win.webContents.send("window:open-multigen-modal", args)
    })
    //Generate all codes
    ipcMain.on("window:generate-codes", (_event: IpcMainEvent, args: any) => {
        if (win) win.webContents.send("window:generate-codes", args)
    })

    // ------------------ Other --------------------

    require("@electron/remote/main").initialize()
}

app.on("ready", () => createWindow("index.html"))
app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit()
})

app.allowRendererProcessReuse = false

app.on("activate", () => {
    if (win == null) createWindow("index.html")
})
