import * as gp from "./generalSettings"
import { indexController } from "./renderer"

//Обработаем вызов и откроем модалку
export const initMultiGenModal = (folderPath: string) => {
    const multiGen = new MultiGenerate(folderPath)
    const modal = multiGen.initModal()
    return modal
}

class MultiGenerate {
    private folderPath: string
    constructor(folderPath: string) {
        this.folderPath = folderPath
    }

    public initModal() {
        const title = "Множественная генерация"
        const body = `<div class="form-floating">
              <textarea class="form-control" name="multiGenerateTextBlock" id="multiGenerateTextBlock"
                placeholder="Введите данные через ;"></textarea>
              <label for="multiGenerateTextBlock">Введите данные через ;</label>
            </div>
            <span id="generagteFolderPath" class="saveFolderPath">${this.folderPath}</span>
            <div><canvas id="multiGenCanvas"></canvas></div>`

        const generateBtn = new gp.ModalButton(
            "confirmMultiGenBtn",
            "Сгенерировать",
            "btn-primary",
            () => {
                return
            },
            false
        )

        const buttons = new Array<gp.ModalButton>(generateBtn)
        const modal = new gp.MainModal(
            gp.ModalTypes.multiGenerate,
            title,
            body,
            buttons
        )

        document.getElementById("mainModal")?.addEventListener(
            "show.bs.modal",
            () => {
                if (gp.getCurrentModal() === gp.ModalTypes.multiGenerate)
                    this.initHandlers()
            },
            { once: true }
        )
        return modal
    }
    public initHandlers() {
        const confirmMultiGenBtn = <HTMLButtonElement>(
            document.getElementById("confirmMultiGenBtn")
        )

        confirmMultiGenBtn.addEventListener("click", async () => {
            const multiGenerateTextBlock = <HTMLTextAreaElement>(
                document.getElementById("multiGenerateTextBlock")
            )
            //Распарсим текст по разделителю и отправим его дальше для генерации
            const codesArr = multiGenerateTextBlock.value
                .trim()
                .replace(/(\r\n|\n|\r)/gm, "")
                .split(";")
            codesArr.forEach((code, index) => {
                if (!code) codesArr.splice(index, 1)
            })

            if (codesArr.length > 0) {
                const spinner = <HTMLElement>(
                    document.getElementById("generateFilesSpinner")
                )
                if (spinner.style.display === "none")
                    spinner.style.display = "block"

                await indexController.mulipleCodesGeneration(codesArr)
            }
        })
    }
}
