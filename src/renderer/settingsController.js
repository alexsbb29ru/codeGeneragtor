"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = __importDefault(require("electron"));
const { ipcRenderer } = electron_1.default;
const bootstrap_1 = __importDefault(require("bootstrap"));
const gp = __importStar(require("./generalSettings"));
//Обработка запроса на открытие модалки с настройками
ipcRenderer.on("window:open-settings", (_event, settings) => {
    let setController = new SettingsController(settings);
    //Покажем модалку
    // settingsModal.modal("show")
    //Сгенерируем пункты полученных настроек в modalBody
    setController.generateSettingCat();
});
class SettingsController {
    constructor(settings) {
        //Название блока с копированием изображения в буфер обмена
        this.copyToClipBlockName = "Копировать в буфер обмена";
        //Tooltip для сохранения изображения в буфер
        this.copyToClipboardTooltip = "После генерации изображения, оно будет скопировано в системный буфер обмена";
        //Tooltip для макимального количества символов
        this.maxSybolsTooltip = "Максимальное количество символов, доступное для генерации кода";
        //Название блока с тумблером переключения в dark mode
        this.darkModeBlockName = "Тёмная тема";
        //Название блока с указанием максимального количества символов
        this.maxSybolsBlockName = "Макс. кол-во символов";
        //Стандартные цвета
        this.defaultColorsTable = {
            textColor: "#000000",
            background: "#FFFFFF",
            symbColor: "#000000", //Цвет символов кода
        };
        /**
         * Generate settings positions by received settings
         */
        this.generateSettingCat = () => {
            var _a;
            let title = "Настройки";
            let catBody = `<table class="table table-borderless">`;
            let code128block = `<tr>
            <th scope="row" class="settingsKey">${this.settingsTypes.code128.bcid}</th>
            <td id="${this.settingsTypes.code128.bcid}Cat" class="settingsValue">
                <div class="form-check">
                    <input type="checkbox" class="form-check-input" id="showText128">
                    <label class="form-check-label" for="showText128">Отображать текст</label>
                </div>
            </td>
        </tr>`;
            let gen_copyToClip = `<tr>
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
        </tr>`;
            let darkModeBlock = `<tr>
            <th scope="row" class="settingsKey"></th>
            <td class="settingsValue">
                <div class="form-check">
                    <input type="checkbox" class="form-check-input" id="isDarkMode">
                    <label class="form-check-label" for="isDarkMode">${this.darkModeBlockName}</label>
                </div>
            </td>
        </tr>`;
            let maxSymbolsBlock = `<tr>
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
        </tr>`;
            let colorsBlock = `<tr>
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
                        <button type="button" class="btn btn-outline-secondary" id="setDefColors">Восстановить дефолтные цвета</button>
                    </div>
                </div>
            </td>
        </tr>`;
            catBody += code128block;
            catBody += gen_copyToClip;
            catBody += darkModeBlock;
            catBody += maxSymbolsBlock;
            catBody += colorsBlock;
            catBody += "</table>";
            let modal = new gp.MainModal("", title, catBody, []);
            ipcRenderer.send("window:open-settings-modal", modal);
            (_a = document.getElementById("mainModal")) === null || _a === void 0 ? void 0 : _a.addEventListener("show.bs.modal", () => {
                if (gp.getCurrentModal() === gp.ModalTypes.settings)
                    this.initInputs();
            }, { once: true });
        };
        /**
         * Init inputs to apply changes
         */
        this.initInputs = () => {
            var _a;
            var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
            var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
                return new bootstrap_1.default.Tooltip(tooltipTriggerEl);
            });
            //Bool - показывать или нет текст ШК code128
            let showText128 = (document.getElementById("showText128"));
            //Bool - сохранять в буфер обмена сгенерированное изображение или нет
            let copyToClip = (document.getElementById("isCopyToClip"));
            //Bool - включение темной темы
            let darkMode = document.getElementById("isDarkMode");
            //Максимальное количество символов
            let maxSybolsInput = (document.getElementById("maxSybolsInput"));
            //Обработчик изменения чекбокса отображения текста code128
            showText128.addEventListener("change", () => {
                this.settingsTypes.code128.includetext = showText128.checked;
            });
            //Обработчик изменения чекбокса копирвоания в буфер обмена
            copyToClip.addEventListener("change", () => {
                this.settingsTypes.general.copyImageToClipboard = copyToClip.checked;
            });
            //Обработчик изменения темы оформления
            darkMode.addEventListener("change", () => {
                this.settingsTypes.general.isDarkMode = darkMode.checked;
            });
            //Обработчик изменения максимального количества символов
            maxSybolsInput.addEventListener("change", () => {
                if ((parseFloat(maxSybolsInput.value) ^ 0) !==
                    parseFloat(maxSybolsInput.value))
                    maxSybolsInput.value = (parseFloat(maxSybolsInput.value) ^ 0).toString();
                if (parseFloat(maxSybolsInput.value) >
                    this.settingsTypes.general.codeSymbolLength.maxLength)
                    maxSybolsInput.value =
                        this.settingsTypes.general.codeSymbolLength.maxLength.toString();
                if (parseFloat(maxSybolsInput.value) <
                    this.settingsTypes.general.codeSymbolLength.minLength)
                    maxSybolsInput.value =
                        this.settingsTypes.general.codeSymbolLength.minLength.toString();
                this.settingsTypes.general.codeSymbolLength.currentLength =
                    parseFloat(maxSybolsInput.value);
            });
            this.initColorControls();
            //Применим начальное значение для чекбокса из полученных настроек
            showText128.checked = this.settingsTypes.code128.includetext;
            copyToClip.checked = this.settingsTypes.general.copyImageToClipboard;
            darkMode.checked = this.settingsTypes.general.isDarkMode;
            maxSybolsInput.value =
                this.settingsTypes.general.codeSymbolLength.currentLength.toString();
            //Обработка закрытия модалки
            (_a = document.getElementById("mainModal")) === null || _a === void 0 ? void 0 : _a.addEventListener("hide.bs.modal", (e) => {
                if (gp.getCurrentModal() === gp.ModalTypes.settings)
                    //Отправим запрос на применения настроек в ipcMain, а далее в indexController
                    ipcRenderer.send("window:change-settings", this.settingsTypes);
            }, { once: true });
        };
        /**
         *  Инициализация параметров для выбора цвета
         */
        this.initColorControls = () => {
            //Цвет текста кода
            let fontColor = document.getElementById("fontColor");
            //Цвет фона кода
            let backColor = document.getElementById("backColor");
            //Цвет символов кода
            let symbColor = document.getElementById("symbColor");
            //Кнопка восстановления стандартных цветов
            let setDefColorsBtn = (document.getElementById("setDefColors"));
            fontColor === null || fontColor === void 0 ? void 0 : fontColor.addEventListener("change", (e) => {
                if (e.target)
                    this.settingsTypes.general.color.fontColor = e.target.value;
            });
            backColor.addEventListener("change", (e) => {
                if (e.target)
                    this.settingsTypes.general.color.background = e.target.value;
            });
            symbColor.addEventListener("change", (e) => {
                this.settingsTypes.general.color.symbolsColor = (e.target).value;
            });
            setDefColorsBtn.addEventListener("click", (e) => {
                fontColor.value = this.defaultColorsTable.textColor;
                backColor.value = this.defaultColorsTable.background;
                symbColor.value = this.defaultColorsTable.symbColor;
                fontColor.dispatchEvent(new Event("change"));
                backColor.dispatchEvent(new Event("change"));
                symbColor.dispatchEvent(new Event("change"));
            });
            fontColor.value = this.settingsTypes.general.color.fontColor;
            backColor.value = this.settingsTypes.general.color.background;
            symbColor.value = this.settingsTypes.general.color.symbolsColor;
        };
        this.settingsTypes = settings;
    }
}
