const electron = require("electron")
const { ipcRenderer } = electron

//Модалка с настройками
const settingsModal = $("#settingsModal")
//Тело модалки с настройками. Все элементы настроек загружаются туда
const settingsModalBody = $("#settingsModalBody")
//Список настроек для каждого типа ШК
let settingsTypes
//Кнопка закрытия модалки
let closeSettingslBtn = $("#closeSettingslBtn")
//Кнопка применения настроек
let confirmSettingsBtn = $("#confirmSettings")
//Название блока с копированием изображения в буфер обмена
let copyToClipBlockName = "Копировать в буфер обмена"
//Tooltip для сохранения изображения в буфер
let copyToClipboardTooltip = "После генерации изображения, оно будет скопировано в системный буфер обмена"
//Tooltip для макимального количества символов
let maxSybolsTooltip = "Максимальное количество символов, доступное для генерации кода"
//Название блока с тумблером переключения в dark mode
let darkModeBlockName = "Тёмная тема"
//Название блока с указанием максимального количества символов
let maxSybolsBlockName = "Макс. кол-во символов"
//Стандартные цвета
let defaultColorsTable = {
    textColor: "#000000", //Цвет текста
    background: "#FFFFFF", //Цвет фона
    symbColor: "#000000" //Цвет символов кода
}

//Обработка запроса на открытие модалки с настройками
ipcRenderer.on("window:open-settings", (event, settings) => {
    //Запишем полученные настройки
    settingsTypes = settings
    //Покажем модалку
    settingsModal.modal("show")
    //Сгенерируем пункты полученных настроек в modalBody
    generateSettingCat()
})
//Обработка закрытия модалки
settingsModal.on("hide.bs.modal", (e) => {
    //Отправим запрос на применения настроек в ipcMain, а далее в indexController
    ipcRenderer.send("window:change-settings", settingsTypes)
})

/**
 * Generate settings positions by received settings
 */
function generateSettingCat() {
    let catBody = `<table class="table table-borderless">`
    let code128block =
        `<tr>
        <th scope="row" class="settingsKey">${settingsTypes.code128.bcid}</th>
        <td id="${settingsTypes.code128.bcid}Cat" class="settingsValue">
            <div class="custom-control custom-checkbox">
                <input type="checkbox" class="custom-control-input" id="showText128">
                <label class="custom-control-label" for="showText128">Отображать текст</label>
            </div>
        </td>
    </tr>`
    let gen_copyToClip =
        `<tr>
        <th scope="row" class="settingsKey">Общие</th>
    </tr>
    <tr>
        <th scope="row" class="settingsKey"></th>
        <td class="settingsValue">
            <div class="custom-control custom-checkbox">
                <input type="checkbox" class="custom-control-input" id="isCopyToClip">
                <label class="custom-control-label" for="isCopyToClip">${copyToClipBlockName}</label>
            </div>
        </td>
        <td>
            <div class="settingsTooltip" data-toggle="tooltip" title="${copyToClipboardTooltip}">
                <span>
                    <svg width="1em" height="1em" viewBox="0 0 16 16" class="bi bi-question-circle" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                        <path fill-rule="evenodd" d="M8 15A7 7 0 1 0 8 1a7 7 0 0 0 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                        <path d="M5.25 6.033h1.32c0-.781.458-1.384 1.36-1.384.685 0 1.313.343 1.313 1.168 0 .635-.374.927-.965 1.371-.673.489-1.206 1.06-1.168 1.987l.007.463h1.307v-.355c0-.718.273-.927 1.01-1.486.609-.463 1.244-.977 1.244-2.056 0-1.511-1.276-2.241-2.673-2.241-1.326 0-2.786.647-2.754 2.533zm1.562 5.516c0 .533.425.927 1.01.927.609 0 1.028-.394 1.028-.927 0-.552-.42-.94-1.029-.94-.584 0-1.009.388-1.009.94z"/>
                    </svg>
                </span>
            </div>
        </td>
    </tr>`
    let darkModeBlock =
        `<tr>
            <th scope="row" class="settingsKey"></th>
            <td class="settingsValue">
                <div class="custom-control custom-checkbox">
                    <input type="checkbox" class="custom-control-input" id="isDarkMode">
                    <label class="custom-control-label" for="isDarkMode">${darkModeBlockName}</label>
                </div>
            </td>
        </tr>`
    let maxSymbolsBlock =
        `<tr>
            <th scope="row" class="settingsKey"></th>
            <td class="settingsValue">
                <div class="form-group">
                    <label for="maxSybolsInput">${maxSybolsBlockName}</label>
                    <input type="number" 
                        min="${settingsTypes.general.codeSymbolLength.minLength}" 
                        max="${settingsTypes.general.codeSymbolLength.maxLength}" 
                        class="form-control modal-input" id="maxSybolsInput">
                    <small id="symbolCountHelp" class="form-text text-muted">Максимум ${settingsTypes.general.codeSymbolLength.maxLength}</small>
                </div>
            </td>
            <td>
                <div class="settingsTooltip" data-toggle="tooltip" title="${maxSybolsTooltip}">
                    <span>
                        <svg width="1em" height="1em" viewBox="0 0 16 16" class="bi bi-question-circle" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                            <path fill-rule="evenodd" d="M8 15A7 7 0 1 0 8 1a7 7 0 0 0 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                            <path d="M5.25 6.033h1.32c0-.781.458-1.384 1.36-1.384.685 0 1.313.343 1.313 1.168 0 .635-.374.927-.965 1.371-.673.489-1.206 1.06-1.168 1.987l.007.463h1.307v-.355c0-.718.273-.927 1.01-1.486.609-.463 1.244-.977 1.244-2.056 0-1.511-1.276-2.241-2.673-2.241-1.326 0-2.786.647-2.754 2.533zm1.562 5.516c0 .533.425.927 1.01.927.609 0 1.028-.394 1.028-.927 0-.552-.42-.94-1.029-.94-.584 0-1.009.388-1.009.94z"/>
                        </svg>
                    </span>
                </div>
            </td>
        </tr>`

    let colorsBlock =
        `<tr>
            <th scope="row" class="settingsKey">Выбор цвета:</th>
            <td class="settingsValue">
                <div class="form-group">
                    <div>
                        <input type="color" id="symbColor" name="symbColor"
                            value="${settingsTypes.general.colors.symbolsColor}">
                        <label for="symbColor">Цвет символов</label>
                    </div>

                    <div>
                        <input type="color" id="backColor" name="backColor"
                                value="${settingsTypes.general.colors.background}">
                        <label for="backColor">Цвет фона</label>
                    </div>

                    <div>
                        <input type="color" id="fontColor" name="fontColor"
                                value="${settingsTypes.general.colors.fontColor}">
                        <label for="fontColor">Цвет текста</label>
                    </div>
                    <br/>
                    <div>
                        <button type="button" class="btn btn-outline-secondary" id="setDefColors">Восстановить дефолтные цвета</button>
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
    settingsModalBody.html(catBody)

    //Инициализируем инпуты для возможности изменения настроек
    initInputs()
}

/**
 * Init inputs to apply changes
 */
let initInputs = () => {
    $("[data-toggle=tooltip]").tooltip()


    //Применение настроект при нажатии вне формы
    confirmSettingsBtn.on("click", (e) => {
        closeSettingslBtn.trigger("click")
    })

    //Bool - показывать или нет текст ШК code128
    let showText128 = $("#showText128")
    //Bool - сохранять в буфер обмена сгенерированное изображение или нет
    let copyToClip = $("#isCopyToClip")
    //Bool - включение темной темы
    let darkMode = $("#isDarkMode")
    //Максимальное количество символов
    let maxSybolsInput = $("#maxSybolsInput")

    //Обработчик изменения чекбокса отображения текста code128
    showText128.on("change", () => {
        settingsTypes.code128.includetext = showText128[0].checked
    })
    //Обработчик изменения чекбокса копирвоания в буфер обмена
    copyToClip.on("change", () => {
        settingsTypes.general.copyImageToClipboard.isCopy = copyToClip[0].checked
    })
    //Обработчик изменения темы оформления
    darkMode.on("change", () => {
        settingsTypes.general.isDarkMode = darkMode[0].checked
    })
    //Обработчик изменения максимального количества символов
    maxSybolsInput.on("change", () => {
        if ((maxSybolsInput.val() ^ 0) !== maxSybolsInput.val())
            maxSybolsInput.val(maxSybolsInput.val() ^ 0)

        if (maxSybolsInput.val() > settingsTypes.general.codeSymbolLength.maxLength)
            maxSybolsInput.val(settingsTypes.general.codeSymbolLength.maxLength)

        if (maxSybolsInput.val() < settingsTypes.general.codeSymbolLength.minLength)
            maxSybolsInput.val(settingsTypes.general.codeSymbolLength.minLength)

        settingsTypes.general.codeSymbolLength.currentLength = maxSybolsInput.val()
    })

    initColorControls()

    //Применим начальное значение для чекбокса из полученных настроек
    showText128[0].checked = settingsTypes.code128.includetext
    copyToClip[0].checked = settingsTypes.general.copyImageToClipboard.isCopy
    darkMode[0].checked = settingsTypes.general.isDarkMode
    maxSybolsInput.val(settingsTypes.general.codeSymbolLength.currentLength)
}
/**
 *  Инициализация параметров для выбора цвета
 */
function initColorControls() {
    //Цвет текста кода
    let fontColor = $("#fontColor")
    //Цвет фона кода
    let backColor = $("#backColor")
    //Цвет символов кода
    let symbColor = $("#symbColor")
    //Кнопка восстановления стандартных цветов
    let setDefColorsBtn = $("#setDefColors")

    fontColor.on("change", (e) => {
        settingsTypes.general.colors.fontColor = e.target.value
    })

    backColor.on("change", (e) => {
        settingsTypes.general.colors.background = e.target.value
    })

    symbColor.on("change", (e) => {
        settingsTypes.general.colors.symbolsColor = e.target.value
    })

    setDefColorsBtn.on("click", (e) => {
        fontColor[0].value = defaultColorsTable.textColor
        backColor[0].value = defaultColorsTable.background
        symbColor[0].value = defaultColorsTable.symbColor

        fontColor.trigger("change")
        backColor.trigger("change")
        symbColor.trigger("change")
    })

    fontColor[0].value = settingsTypes.general.colors.fontColor
    backColor[0].value = settingsTypes.general.colors.background
    symbColor[0].value = settingsTypes.general.colors.symbolsColor
}



