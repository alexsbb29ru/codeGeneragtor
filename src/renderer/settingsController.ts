import * as bootstrap from "bootstrap"
import * as bs from "./barcodeSettings"
import * as gp from "./generalSettings"
import { indexController } from "./renderer"

//Обработка запроса на открытие модалки с настройками
export const openSettingsWindow = (settings: bs.TBarcodeParams) => {
    const setController = new SettingsController(settings)
    //Покажем модалку
    // settingsModal.modal("show")
    //Сгенерируем пункты полученных настроек в modalBody
    const modal = setController.generateSettingCat()
    return modal
}
type TDefaultColors = {
    textColor: string //Цвет текста
    background: string //Цвет фона
    symbColor: string //Цвет символов кода
}
class SettingsController {
    //Список настроек для каждого типа ШК
    public settingsTypes: bs.TBarcodeParams
    //Название блока с уровнями коррекции ошибок
    private qrCodeEclevelTitle = "Уровень коррекции ошибок"
    //Название блока с копированием изображения в буфер обмена
    private copyToClipBlockName = "Копировать в буфер обмена"
    //Tooltip для сохранения изображения в буфер
    private copyToClipboardTooltip =
        "После генерации изображения, оно будет скопировано в системный буфер обмена"
    //Tooltip для макимального количества символов
    private maxSybolsTooltip =
        "Максимальное количество символов, доступное для генерации кода"
    //Название блока с тумблером переключения в dark mode
    private darkModeBlockName = "Тёмная тема"
    //Название блока с выбором генерации по ctrl+enter или просто enter
    private isCtrlEnterBlockName = "Генерация по ctrl+enter"
    //Tooltip для блока с выбором кнопок генерации
    private isCtrlEnterTooltip = `Если true (стоит галочка), то используется сочетание клавиш CTRL+Enter.\n
    Иначе используется клавиша Enter`
    //Название блока с указанием максимального количества символов
    private maxSybolsBlockName = "Макс. кол-во символов"
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
        const title = "Настройки"
        let catBody = `<table class="table table-borderless">`
        const code128block = `<tr>
            <th scope="row" class="settingsKey">${this.settingsTypes.code128.bcid}</th>
            <td id="${this.settingsTypes.code128.bcid}Cat" class="settingsValue">
                <div class="form-check">
                    <input type="checkbox" class="form-check-input" id="showText128">
                    <label class="form-check-label" for="showText128">Отображать текст</label>
                </div>
            </td>
        </tr>`
        const qrCodeBlock = `<tr>
            <th scope="row" class="settingsKey">${this.settingsTypes.qrcode.bcid}</th>
            <td>${this.qrCodeEclevelTitle}</td>
        </tr>
        <tr>
            <td></td>
            <td id="${this.settingsTypes.qrcode.bcid}Cat" class="settingsValue">
                <div class="form-group">
                    <select class="form-select lighter-select" id="qrCodeEclevels">
                    <option></option>
                    </select>
                </div>
            </td>
            <td>
                
            </td>
        </tr>`
        const gen_copyToClip = `<tr>
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
        const darkModeBlock = `<tr>
            <th scope="row" class="settingsKey"></th>
            <td class="settingsValue">
                <div class="form-check">
                    <input type="checkbox" class="form-check-input" id="isDarkMode">
                    <label class="form-check-label" for="isDarkMode">${this.darkModeBlockName}</label>
                </div>
            </td>
        </tr>`
        const generateShortcut = `<tr>
            <th scope="row" class="settingsKey"></th>
            <td class="settingsValue">
                <div class="form-check">
                    <input type="checkbox" class="form-check-input" id="isCtrlEnter">
                    <label class="form-check-label" for="isCtrlEnter">${this.isCtrlEnterBlockName}</label>
                </div>
            </td>
            <td>
                <div class="settingsTooltip" data-bs-toggle="tooltip" title="${this.isCtrlEnterTooltip}">
                    <span>
                        <svg width="1em" height="1em" viewBox="0 0 16 16" class="bi bi-question-circle" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                            <path fill-rule="evenodd" d="M8 15A7 7 0 1 0 8 1a7 7 0 0 0 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                            <path d="M5.25 6.033h1.32c0-.781.458-1.384 1.36-1.384.685 0 1.313.343 1.313 1.168 0 .635-.374.927-.965 1.371-.673.489-1.206 1.06-1.168 1.987l.007.463h1.307v-.355c0-.718.273-.927 1.01-1.486.609-.463 1.244-.977 1.244-2.056 0-1.511-1.276-2.241-2.673-2.241-1.326 0-2.786.647-2.754 2.533zm1.562 5.516c0 .533.425.927 1.01.927.609 0 1.028-.394 1.028-.927 0-.552-.42-.94-1.029-.94-.584 0-1.009.388-1.009.94z"/>
                        </svg>
                    </span>
                </div>
            </td>
        </tr>`
        const maxSymbolsBlock = `<tr>
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

        const colorsBlock = `<tr>
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
        catBody += qrCodeBlock
        catBody += gen_copyToClip
        catBody += darkModeBlock
        catBody += generateShortcut
        catBody += maxSymbolsBlock
        catBody += colorsBlock

        catBody += "</table>"

        // ipcRenderer.send("window:open-settings-modal", modal)

        document.getElementById("mainModal")?.addEventListener(
            "show.bs.modal",
            () => {
                if (gp.getCurrentModal() === gp.ModalTypes.settings)
                    this.initInputs()
            },
            { once: true }
        )

        const modal = new gp.MainModal("", title, catBody, [])
        return modal
    }

    /**
     * Init inputs to apply changes
     */
    public initInputs = () => {
        const tooltipTriggerList = [].slice.call(
            document
                .getElementById("mainModal")
                ?.querySelectorAll('[data-bs-toggle="tooltip"]')
        )
        tooltipTriggerList.map(function (tooltipTriggerEl) {
            return new bootstrap.Tooltip(tooltipTriggerEl)
        })

        //Bool - показывать или нет текст ШК code128
        const showText128 = <HTMLInputElement>(
            document.getElementById("showText128")
        )
        //List - Select - Уровень коррекции QR-кода
        const qrCodeEclevels = <HTMLSelectElement>(
            document.getElementById("qrCodeEclevels")
        )
        //Bool - сохранять в буфер обмена сгенерированное изображение или нет
        const copyToClip = <HTMLInputElement>(
            document.getElementById("isCopyToClip")
        )
        //Bool - включение темной темы
        const darkMode = <HTMLInputElement>document.getElementById("isDarkMode")
        //Bool - выбор сочетания клавиш для генерации ШК
        const generateShortcut = <HTMLInputElement>(
            document.getElementById("isCtrlEnter")
        )
        //Максимальное количество символов
        const maxSybolsInput = <HTMLInputElement>(
            document.getElementById("maxSybolsInput")
        )
        //Обработчик изменения уровня коррекции QR-кода
        qrCodeEclevels.addEventListener("change", async () => {
            // Получим значение уровня коррекции из объекта со списком по названию уровня коррекции
            const levelCode: string = Object.getOwnPropertyDescriptor(
                this.settingsTypes.qrcode.eclevelList,
                qrCodeEclevels.value
            )?.value
            // Присвоим выбранный уровень коррекции QR-коду
            this.settingsTypes.qrcode.eclevel = levelCode
        })
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
            this.saveSettings()
        })
        //Обработчик изменения сочетания клавиш для генерацию ШК
        generateShortcut.addEventListener("change", () => {
            this.settingsTypes.general.isCtrlEnter = generateShortcut.checked
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
        this.getQrCodeEclevelList()
        this.initColorControls()

        //Применим начальное значение для чекбокса из полученных настроек
        showText128.checked = <boolean>this.settingsTypes.code128.includetext
        copyToClip.checked = this.settingsTypes.general.copyImageToClipboard
        darkMode.checked = this.settingsTypes.general.isDarkMode
        generateShortcut.checked = this.settingsTypes.general.isCtrlEnter
        maxSybolsInput.value =
            this.settingsTypes.general.codeSymbolLength.currentLength.toString()

        //Обработка закрытия модалки
        document.getElementById("mainModal")?.addEventListener(
            "hide.bs.modal",
            (e) => {
                this.saveSettings()
            },
            { once: true }
        )
    }
    /**
     * Сохранение настроек
     */
    private saveSettings() {
        if (gp.getCurrentModal() === gp.ModalTypes.settings)
            //Отправим запрос на применения настроек в ipcMain, а далее в indexController
            indexController.changeSettings(this.settingsTypes)
    }
    /**
     * Функция получения списка уровней коррекции QR-кода
     */
    private getQrCodeEclevelList = () => {
        // Получим список всех уровней коррекции
        const levelList: string[] = Object.getOwnPropertyNames(
            this.settingsTypes.qrcode.eclevelList
        )

        //List - Select - Уровень коррекции QR-кода
        const qrCodeEclevels = <HTMLSelectElement>(
            document.getElementById("qrCodeEclevels")
        )

        //Засунем все уровни коррекции в Select
        levelList.forEach((levelCode) => {
            const option = new Option()

            const levelInd = levelList.indexOf(levelCode)
            //Запишем в элементы списка уровень коррекции
            option.text = levelList[levelInd].toUpperCase()
            option.value = levelList[levelInd]
            Object.getOwnPropertyDescriptor
            //Сразу выделим нужный нам тип кода
            if (
                Object.getOwnPropertyDescriptor(
                    this.settingsTypes.qrcode.eclevelList,
                    levelCode
                )?.value === this.settingsTypes.qrcode.eclevel
            )
                option.selected = true
            //Добавим в список созданный элемент
            qrCodeEclevels.options.add(option)
        })
        //Удалим пустую строчку
        qrCodeEclevels.options.remove(0)
    }
    /**
     *  Инициализация параметров для выбора цвета
     */
    private initColorControls = () => {
        //Цвет текста кода
        const fontColor = <HTMLInputElement>document.getElementById("fontColor")
        //Цвет фона кода
        const backColor = <HTMLInputElement>document.getElementById("backColor")
        //Цвет символов кода
        const symbColor = <HTMLInputElement>document.getElementById("symbColor")
        //Кнопка восстановления стандартных цветов
        const setDefColorsBtn = <HTMLButtonElement>(
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
