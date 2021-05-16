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
    //Open settings page
    ipcMain.on("window:open-settings", (event: IpcMainEvent, args: any) => {
        if (win) win.webContents.send("window:open-settings", args)
    })
    //Open history page
    ipcMain.on("window:open-history", (event: IpcMainEvent, args: any) => {
        if (win) win.webContents.send("window:open-history", args)
    })
    //Change settings on settings page
    ipcMain.on("window:change-settings", (event: IpcMainEvent, args: any) => {
        if (win) win.webContents.send("window:change-settings", args)
    })
    //Set history position to main text input
    ipcMain.on("window:set-history", (event: IpcMainEvent, args: any) => {
        if (win) win.webContents.send("window:set-history", args)
    })
    //Clear history
    ipcMain.on("window:clear-history", (event: IpcMainEvent, args: any) => {
        if (win) win.webContents.send("window:clear-history", args)
    })
    //Open about
    ipcMain.on("window:open-about", (event: IpcMainEvent, args: any) => {
        args.version = `Версия: ${app.getVersion()}`
        if (win) win.webContents.send("window:open-about", args)
    })
    ipcMain.on("window:open-about-modal", (event: IpcMainEvent, args: any) => {
        if (win) win.webContents.send("window:open-about-modal", args)
    })
    //Open URL
    ipcMain.on("url:open-url", (event: IpcMainEvent, stringURL: string) => {
        shell.openExternal(stringURL)
    })
    //Open multi code generate page
    ipcMain.on(
        "window:open-multi-gen",
        (event: IpcMainEvent, downloadFolderPath: string) => {
            if (win)
                win.webContents.send(
                    "window:open-multi-gen",
                    downloadFolderPath
                )
        }
    )
    //Generate all codes
    ipcMain.on("window:generate-codes", (event: IpcMainEvent, args: any) => {
        if (win) win.webContents.send("window:generate-codes", args)
    })

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
