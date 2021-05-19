import electron from "electron"
const { ipcRenderer } = electron
import bootstrap from "bootstrap"
import * as bs from "./barcodeSettings"
import * as gp from "./generalSettings"

//Обработка запроса на открытие модалки с настройками
ipcRenderer.on(
    "window:open-settings",
    (_event: Event, settings: bs.TBarcodeParams) => {
        let setController = new SettingsController(settings)
        //Покажем модалку
        // settingsModal.modal("show")
        //Сгенерируем пункты полученных настроек в modalBody
        setController.generateSettingCat()
    }
)

type TDefaultColors = {
    textColor: string //Цвет текста
    background: string //Цвет фона
    symbColor: string //Цвет символов кода
}
class SettingsController {
    //Список настроек для каждого типа ШК
    public settingsTypes: bs.TBarcodeParams
    //Название блока с копированием изображения в буфер обмена
    private copyToClipBlockName: string = "Копировать в буфер обмена"
    //Tooltip для сохранения изображения в буфер
    private copyToClipboardTooltip: string =
        "После генерации изображения, оно будет скопировано в системный буфер обмена"
    //Tooltip для макимального количества символов
    private maxSybolsTooltip: string =
        "Максимальное количество символов, доступное для генерации кода"
    //Название блока с тумблером переключения в dark mode
    private darkModeBlockName: string = "Тёмная тема"
    //Название блока с указанием максимального количества символов
    private maxSybolsBlockName: string = "Макс. кол-во символов"
    //Стандартные цвета
    private defaultColorsTable: TDefaultColors = {
        textColor: "#000000", //Цвет текста
        background: "#FFFFFF", //Цвет фона
        symbColor: "#000000", //Цвет символов кода
    }
    constructor(settings: bs.TBarcodeParams) {
        this.settingsTypes = settings
    }

    /**
     * Generate settings positions by received settings
     */
    public generateSettingCat = () => {
        let title: string = "Настройки"
        let catBody: string = `<table class="table table-borderless">`
        let code128block: string = `<tr>
            <th scope="row" class="settingsKey">${this.settingsTypes.code128.bcid}</th>
            <td id="${this.settingsTypes.code128.bcid}Cat" class="settingsValue">
                <div class="form-check">
                    <input type="checkbox" class="form-check-input" id="showText128">
                    <label class="form-check-label" for="showText128">Отображать текст</label>
                </div>
            </td>
        </tr>`
        let gen_copyToClip: string = `<tr>
            <th scope="row" class="settingsKey">Общие</th>
        </tr>
        <tr>
            <th scope="row" class="settingsKey"></th>
            <td class="settingsValue">
                <div class="form-check custom-checkbox">
                    <input type="checkbox" class="form-check-input" id="isCopyToClip">
                    <label class="form-check-label" for="isCopyToClip">${this.copyToClipBlockName}</label>
                </div>
            </td>
            <td>
                <div class="settingsTooltip" data-bs-toggle="tooltip" title="${this.copyToClipboardTooltip}">
                    <span>
                        <svg width="1em" height="1em" viewBox="0 0 16 16" class="bi bi-question-circle" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                            <path fill-rule="evenodd" d="M8 15A7 7 0 1 0 8 1a7 7 0 0 0 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                            <path d="M5.25 6.033h1.32c0-.781.458-1.384 1.36-1.384.685 0 1.313.343 1.313 1.168 0 .635-.374.927-.965 1.371-.673.489-1.206 1.06-1.168 1.987l.007.463h1.307v-.355c0-.718.273-.927 1.01-1.486.609-.463 1.244-.977 1.244-2.056 0-1.511-1.276-2.241-2.673-2.241-1.326 0-2.786.647-2.754 2.533zm1.562 5.516c0 .533.425.927 1.01.927.609 0 1.028-.394 1.028-.927 0-.552-.42-.94-1.029-.94-.584 0-1.009.388-1.009.94z"/>
                        </svg>
                    </span>
                </div>
            </td>
        </tr>`
        let darkModeBlock: string = `<tr>
            <th scope="row" class="settingsKey"></th>
            <td class="settingsValue">
                <div class="form-check">
                    <input type="checkbox" class="form-check-input" id="isDarkMode">
                    <label class="form-check-label" for="isDarkMode">${this.darkModeBlockName}</label>
                </div>
            </td>
        </tr>`
        let maxSymbolsBlock: string = `<tr>
            <th scope="row" class="settingsKey"></th>
            <td class="settingsValue">
                <div class="form-group">
                    <label for="maxSybolsInput">${this.maxSybolsBlockName}</label>
                    <input type="number" 
                        min="${this.settingsTypes.general.codeSymbolLength.minLength}" 
                        max="${this.settingsTypes.general.codeSymbolLength.maxLength}" 
                        class="form-control modal-input" id="maxSybolsInput">
                    <small id="symbolCountHelp" class="form-text text-muted">Максимум ${this.settingsTypes.general.codeSymbolLength.maxLength}</small>
                </div>
            </td>
            <td>
                <div class="settingsTooltip" data-bs-toggle="tooltip" title="${this.maxSybolsTooltip}">
                    <span>
                        <svg width="1em" height="1em" viewBox="0 0 16 16" class="bi bi-question-circle" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                            <path fill-rule="evenodd" d="M8 15A7 7 0 1 0 8 1a7 7 0 0 0 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                            <path d="M5.25 6.033h1.32c0-.781.458-1.384 1.36-1.384.685 0 1.313.343 1.313 1.168 0 .635-.374.927-.965 1.371-.673.489-1.206 1.06-1.168 1.987l.007.463h1.307v-.355c0-.718.273-.927 1.01-1.486.609-.463 1.244-.977 1.244-2.056 0-1.511-1.276-2.241-2.673-2.241-1.326 0-2.786.647-2.754 2.533zm1.562 5.516c0 .533.425.927 1.01.927.609 0 1.028-.394 1.028-.927 0-.552-.42-.94-1.029-.94-.584 0-1.009.388-1.009.94z"/>
                        </svg>
                    </span>
                </div>
            </td>
        </tr>`

        let colorsBlock: string = `<tr>
            <th scope="row" class="settingsKey">Выбор цвета:</th>
            <td class="settingsValue">
                <div class="form-group">
                    <div>
                        <input type="color" id="symbColor" name="symbColor"
                            value="${this.settingsTypes.general.color.symbolsColor}">
                        <label for="symbColor">Цвет символов</label>
                    </div>

                    <div>
                        <input type="color" id="backColor" name="backColor"
                                value="${this.settingsTypes.general.color.background}">
                        <label for="backColor">Цвет фона</label>
                    </div>

                    <div>
                        <input type="color" id="fontColor" name="fontColor"
                                value="${this.settingsTypes.general.color.fontColor}">
                        <label for="fontColor">Цвет текста</label>
                    </div>
                    <br/>
                    <div>
                        <button type="button" class="btn btn-secondary" id="setDefColors">Восстановить дефолтные цвета</button>
                    </div>
                </div>
            </td>
        </tr>`

        catBody += code128block
        catBody += gen_copyToClip
        catBody += darkModeBlock
        catBody += maxSymbolsBlock
        catBody += colorsBlock

        catBody += "</table>"

        let modal = new gp.MainModal("", title, catBody, [])
        ipcRenderer.send("window:open-settings-modal", modal)

        document.getElementById("mainModal")?.addEventListener(
            "show.bs.modal",
            () => {
                if (gp.getCurrentModal() === gp.ModalTypes.settings)
                    this.initInputs()
            },
            { once: true }
        )
    }

    /**
     * Init inputs to apply changes
     */
    public initInputs = () => {
        let tooltipTriggerList = [].slice.call(
            document
                .getElementById("mainModal")
                ?.querySelectorAll('[data-bs-toggle="tooltip"]')
        )
        let tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
            return new bootstrap.Tooltip(tooltipTriggerEl)
        })

        //Bool - показывать или нет текст ШК code128
        let showText128 = <HTMLInputElement>(
            document.getElementById("showText128")
        )
        //Bool - сохранять в буфер обмена сгенерированное изображение или нет
        let copyToClip = <HTMLInputElement>(
            document.getElementById("isCopyToClip")
        )
        //Bool - включение темной темы
        let darkMode = <HTMLInputElement>document.getElementById("isDarkMode")
        //Максимальное количество символов
        let maxSybolsInput = <HTMLInputElement>(
            document.getElementById("maxSybolsInput")
        )

        //Обработчик изменения чекбокса отображения текста code128
        showText128.addEventListener("change", () => {
            this.settingsTypes.code128.includetext = showText128.checked
        })
        //Обработчик изменения чекбокса копирвоания в буфер обмена
        copyToClip.addEventListener("change", () => {
            this.settingsTypes.general.copyImageToClipboard = copyToClip.checked
        })
        //Обработчик изменения темы оформления
        darkMode.addEventListener("change", () => {
            this.settingsTypes.general.isDarkMode = darkMode.checked
        })
        //Обработчик изменения максимального количества символов
        maxSybolsInput.addEventListener("change", () => {
            if (
                (parseFloat(maxSybolsInput.value) ^ 0) !==
                parseFloat(maxSybolsInput.value)
            )
                maxSybolsInput.value = (
                    parseFloat(maxSybolsInput.value) ^ 0
                ).toString()

            if (
                parseFloat(maxSybolsInput.value) >
                this.settingsTypes.general.codeSymbolLength.maxLength
            )
                maxSybolsInput.value =
                    this.settingsTypes.general.codeSymbolLength.maxLength.toString()

            if (
                parseFloat(maxSybolsInput.value) <
                this.settingsTypes.general.codeSymbolLength.minLength
            )
                maxSybolsInput.value =
                    this.settingsTypes.general.codeSymbolLength.minLength.toString()

            this.settingsTypes.general.codeSymbolLength.currentLength =
                parseFloat(maxSybolsInput.value)
        })

        this.initColorControls()

        //Применим начальное значение для чекбокса из полученных настроек
        showText128.checked = <boolean>this.settingsTypes.code128.includetext
        copyToClip.checked = this.settingsTypes.general.copyImageToClipboard
        darkMode.checked = this.settingsTypes.general.isDarkMode
        maxSybolsInput.value =
            this.settingsTypes.general.codeSymbolLength.currentLength.toString()

        //Обработка закрытия модалки
        document.getElementById("mainModal")?.addEventListener(
            "hide.bs.modal",
            (e) => {
                if (gp.getCurrentModal() === gp.ModalTypes.settings)
                    //Отправим запрос на применения настроек в ipcMain, а далее в indexController
                    ipcRenderer.send(
                        "window:change-settings",
                        this.settingsTypes
                    )
            },
            { once: true }
        )
    }
    /**
     *  Инициализация параметров для выбора цвета
     */
    private initColorControls = () => {
        //Цвет текста кода
        let fontColor = <HTMLInputElement>document.getElementById("fontColor")
        //Цвет фона кода
        let backColor = <HTMLInputElement>document.getElementById("backColor")
        //Цвет символов кода
        let symbColor = <HTMLInputElement>document.getElementById("symbColor")
        //Кнопка восстановления стандартных цветов
        let setDefColorsBtn = <HTMLButtonElement>(
            document.getElementById("setDefColors")
        )

        fontColor?.addEventListener("change", (e) => {
            if (e.target)
                this.settingsTypes.general.color.fontColor = (<
                    HTMLInputElement
                >e.target).value
        })

        backColor.addEventListener("change", (e) => {
            if (e.target)
                this.settingsTypes.general.color.background = (<
                    HTMLInputElement
                >e.target).value
        })

        symbColor.addEventListener("change", (e) => {
            this.settingsTypes.general.color.symbolsColor = (<HTMLInputElement>(
                e.target
            )).value
        })

        setDefColorsBtn.addEventListener("click", (e) => {
            fontColor.value = this.defaultColorsTable.textColor
            backColor.value = this.defaultColorsTable.background
            symbColor.value = this.defaultColorsTable.symbColor

            fontColor.dispatchEvent(new Event("change"))
            backColor.dispatchEvent(new Event("change"))
            symbColor.dispatchEvent(new Event("change"))
        })

        fontColor.value = this.settingsTypes.general.color.fontColor
        backColor.value = this.settingsTypes.general.color.background
        symbColor.value = this.settingsTypes.general.color.symbolsColor
    }
}
