import electron from "electron"
const { ipcRenderer } = electron
import * as bs from "./barcodeSettings"
import * as gp from "./generalSettings"

//Обработаем вызов и откроем модалку
ipcRenderer.on("window:init-multi-gen", (event, folderPath) => {
    let multiGen = new MultiGenerate(folderPath)
    multiGen.initModal()
})

class MultiGenerate {
    private folderPath: string
    constructor(folderPath: string) {
        this.folderPath = folderPath
    }

    public initModal() {
        let title: string = "Множественная генерация"
        let body: string = `<div class="form-floating">
              <textarea class="form-control" name="multiGenerateTextBlock" id="multiGenerateTextBlock"
                placeholder="Введите данные через ;"></textarea>
              <label for="multiGenerateTextBlock">Введите данные через ;</label>
            </div>
            <span id="generagteFolderPath" class="saveFolderPath">${this.folderPath}</span>`
        let generateBtn = new gp.ModalButton(
            "confirmMultiGenBtn",
            "Сгенерировать",
            "btn-primary",
            null,
            false
        )

        let buttons = new Array<gp.ModalButton>(generateBtn)
        let modal = new gp.MainModal("", title, body, buttons)
        ipcRenderer.send("window:open-multigen-modal", modal)

        document.getElementById("mainModal")?.addEventListener(
            "show.bs.modal",
            () => {
                if (gp.getCurrentModal() === gp.ModalTypes.multiGenerate)
                    this.initHandlers()
            },
            { once: true }
        )
    }
    public initHandlers() {
        let confirmMultiGenBtn = <HTMLButtonElement>(
            document.getElementById("confirmMultiGenBtn")
        )

        confirmMultiGenBtn.addEventListener("click", () => {
            let multiGenerateTextBlock = <HTMLTextAreaElement>(
                document.getElementById("multiGenerateTextBlock")
            )
            //Распарсим текст по разделителю и отправим его дальше для генерации
            let codesArr = multiGenerateTextBlock.value
                .trim()
                .replace(/(\r\n|\n|\r)/gm, "")
                .split(";")
            codesArr.forEach((code, index) => {
                if (!code) codesArr.splice(index, 1)
            })

            if (codesArr.length > 0) {
                let spinner = <HTMLElement>(
                    document.getElementById("generateFilesSpinner")
                )
                if (spinner.style.display === "none")
                    spinner.style.display = "block"

                ipcRenderer.send("window:generate-codes", codesArr)
            }
        })
    }
}
