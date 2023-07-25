import { ipcRenderer as ipc } from "electron"

export const initTitleBar = () => {
    if (document.readyState == "complete") {
        const titleBar = document.getElementById("windowTitle")

        if (titleBar) {
            titleBar.innerHTML = `<span>${document.title}</span>`
            handleWindowControls()
        }
    }
}

function handleWindowControls() {
    // Make minimise/maximise/restore/close buttons work when they are clicked
    const minBtn = document.getElementById("min-button")
    if (minBtn)
        minBtn.addEventListener("click", () => {
            ipc.send("minimize")
            // win.minimize()
        })

    const maxBtn = document.getElementById("max-button")
    if (maxBtn)
        maxBtn.addEventListener("click", () => {
            ipc.send("maximize")

            document.body.classList.add("maximized")
            // win.maximize()
        })

    const restoreBtn = document.getElementById("restore-button")
    if (restoreBtn)
        restoreBtn.addEventListener("click", () => {
            ipc.send("unmaximize")

            document.body.classList.remove("maximized")
            // win.unmaximize()
        })

    const closeBtn = document.getElementById("close-button")
    if (closeBtn)
        closeBtn.addEventListener("click", () => {
            ipc.send("close")
            // win.close()
        })

    // Toggle maximise/restore buttons when maximisation/unmaximisation occurs
    ipc.on("isMaximized", () => toggleMaxRestoreButtons(true))
    ipc.on("isRestored", () => toggleMaxRestoreButtons(false))

    function toggleMaxRestoreButtons(isMaximized: boolean) {
        if (isMaximized) {
            document.body.classList.add("maximized")
        } else {
            document.body.classList.remove("maximized")
        }
    }
}
