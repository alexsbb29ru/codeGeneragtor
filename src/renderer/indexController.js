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
const { clipboard, nativeImage } = electron_1.default;
const path_1 = __importDefault(require("path"));
const fs_jetpack_1 = __importDefault(require("fs-jetpack"));
const fs = __importStar(require("fs"));
const bwip_js_1 = __importDefault(require("bwip-js"));
const bootstrap_1 = __importDefault(require("bootstrap"));
const bs = __importStar(require("./barcodeSettings"));
const gp = __importStar(require("./generalSettings"));
const objectMapper_1 = require("./objectMapper");
class IndexController {
    constructor() {
        var _a;
        //Идентификатор таймера показа алерта
        this.alertTimerId = 0;
        //Выделенный текст в текстовом поле
        this.selectedText = "";
        this.initButtonsHandlers = () => {
            let savedCodesElement = (document.getElementById("savedCodesSelect"));
            savedCodesElement.addEventListener("change", async () => {
                this.inputText.value = savedCodesElement.value;
                this.inputText.dispatchEvent(new Event("change"));
                await this.generateCodesButtonsHandler();
            });
            this.inputText.addEventListener("change", () => {
                this.writeRemainingSymb();
            });
            this.inputText.addEventListener("input", async () => {
                //Выводим всплывашку с предложенной историей генерации
                await this.historySearch(this.inputText.value);
                this.writeRemainingSymb();
            });
            this.settingsButton.addEventListener("click", () => {
                this.ipcRender.send("window:prepare-settings-page", this.appSettings);
            });
            this.historyButton.addEventListener("click", async () => {
                await this.getHistoryFromStorage(true);
            });
            this.contactButton.addEventListener("click", () => {
                let aboutArgs;
                aboutArgs = {
                    modalName: gp.ModalTypes.about,
                    name: "Генератор штрих-кодов",
                    copyright: `&#169; 2019 - ${new Date().getFullYear()} 
  <a href="#" id="personLink" targetLink="https://vk.com/subbotinalexeysergeevich">Aleksey Subbotin</a>`,
                    desctiption: "",
                    version: "",
                };
                this.ipcRender.send("window:init-about", aboutArgs);
            });
            this.multiGenerateBtn.addEventListener("click", () => {
                this.ipcRender.send("window:init-multi-gen", this.downloadFolderPath);
            });
            this.genQrButton.addEventListener("click", async () => {
                await this.generateCodesButtonsHandler();
            });
            //Генерация ШК нажатием ctrl + enter
            this.inputText.addEventListener("keydown", async (e) => {
                if (e.ctrlKey && e.key === "Enter") {
                    if (this.appSettings.general.isCtrlEnter)
                        await this.generateCodesButtonsHandler();
                }
                else if (e.key === "Enter") {
                    if (!this.appSettings.general.isCtrlEnter) {
                        e.preventDefault();
                        await this.generateCodesButtonsHandler();
                    }
                }
            });
            //Обработка выделения текста для последующего копирования в буфер обмена
            this.inputText.addEventListener("mouseup", (e) => {
                var _a, _b;
                if ((_a = window.getSelection()) === null || _a === void 0 ? void 0 : _a.toString()) {
                    this.selectedText = (_b = window.getSelection()) === null || _b === void 0 ? void 0 : _b.toString();
                }
            });
            //Вызов кастомного контекстного меню
            window.addEventListener("contextmenu", (e) => {
                //Если нажата правая кнопка не в блоке для ввода текста, ничего не делаем
                if (e.target.id !== this.inputText.id) {
                    if (this.checkContextMenuShown())
                        this.hideContextMenu();
                    return;
                }
                e === null || e === void 0 ? void 0 : e.preventDefault();
                //Генерируем два пункта контекстного меню
                let copyMenuItem = new gp.ContextMenuItem("Копировать", () => {
                    if (this.inputText.selectionStart !==
                        this.inputText.selectionEnd)
                        electron_1.default.clipboard.writeText(this.selectedText);
                });
                let pasteMenuItem = new gp.ContextMenuItem("Вставить", () => {
                    let selectionStart = this.inputText.selectionStart;
                    let selectionEnd = this.inputText.selectionEnd;
                    let leftText = this.inputText.value.substring(0, selectionStart);
                    let rightText = this.inputText.value.substring(selectionEnd);
                    this.inputText.value =
                        leftText + electron_1.default.clipboard.readText() + rightText;
                });
                //Добавим в массив сделанные пункты, чтобы передать их в родительский объект
                let contextMenu = new gp.ContextMenu(new Array(copyMenuItem, pasteMenuItem));
                //Создаем и визуализируем контекстное меню
                this.makeContextMenu(contextMenu, e);
            });
            //Сохранение изображения по нажатию ctrl + s
            window.addEventListener("keydown", (e) => {
                if (e.ctrlKey && e.code == "KeyS")
                    if (!this.isModalShown())
                        this.saveButton.dispatchEvent(new Event("click"));
                //Открытие модалки настроек по нажатию ctrl + q
                if (e.ctrlKey && e.code == "KeyQ")
                    if (!this.isModalShown())
                        this.settingsButton.dispatchEvent(new Event("click"));
                //Открытие модалки истории по нажатию ctrl + j
                if (e.ctrlKey && e.code == "KeyJ")
                    if (!this.isModalShown())
                        this.historyButton.dispatchEvent(new Event("click"));
                //Открытие модалки пакетной генерации по нажатию ctrl + g
                if (e.ctrlKey && e.code == "KeyG")
                    if (!this.isModalShown())
                        this.multiGenerateBtn.dispatchEvent(new Event("click"));
                //Открытие модалки контактов по нажатию ctrl + i
                if (e.ctrlKey && e.code == "KeyI")
                    if (!this.isModalShown())
                        this.contactButton.dispatchEvent(new Event("click"));
                if (e.code === "Escape") {
                    //При нажатии Escape закрываем высплывашку с предложенной историей генерации
                    this.hideHistoryAlert();
                }
            });
            window.addEventListener("click", (e) => {
                if (e.target.id !== "historyAlert" &&
                    this.historyAlertIsShown())
                    this.hideHistoryAlert();
                if (this.checkContextMenuShown() &&
                    !e.target.classList.contains("context-menu-item"))
                    this.hideContextMenu();
            });
            //Сохранение текста в "избранное"
            let saveQrTextButton = (document.getElementById("saveQrTextButton"));
            saveQrTextButton.addEventListener("click", async () => {
                if (!this.inputText.value)
                    return;
                if (this.savedCodes.includes(this.inputText.value)) {
                    //Выводим сообщение о том, что код уже содержится в избранном
                    this.showMessageAlert("Текст уже содержится в избранном", gp.AlertCssClasses.danger);
                }
                else {
                    this.savedCodes.push(this.inputText.value);
                    await this.saveCodesToLocalStorage();
                    //Вывести сообщение об успешном добавлении в "избранное"
                    this.showMessageAlert("Текст успешно сохранен в избранном", gp.AlertCssClasses.success);
                    savedCodesElement.options.add(new Option(this.inputText.value, this.inputText.value));
                }
            });
            //Удаление элемента из "Избранного"
            let removeSavedCodeBtn = (document.getElementById("removeSavedQrBtn"));
            removeSavedCodeBtn.addEventListener("click", async () => {
                let code = savedCodesElement.value;
                if (!code)
                    return;
                this.savedCodes.splice(this.savedCodes.indexOf(code), 1);
                savedCodesElement.options.remove(savedCodesElement.selectedIndex);
                savedCodesElement.dispatchEvent(new Event("change"));
                this.inputText.dispatchEvent(new Event("change"));
                await this.saveCodesToLocalStorage();
                //Выводим сообщение об успешном удалении данных из избранного
                this.showMessageAlert("Текст успешно удален из избранного", gp.AlertCssClasses.success);
            });
            //Вывод модалки для сохранения изображения в локальное хранилище
            this.saveButton.addEventListener("click", () => {
                if (!this.qrImg.src)
                    return;
                let name = gp.ModalTypes.saveBarcode;
                let title = "Введите имя файла без расширения";
                let body = `<input class="form-control modal-input" id="fileNameInput" type="text" placeholder="Введите имя файла">
            <span id="saveFolderPath" class="saveFolderPath">${this.downloadFolderPath}</span>`;
                let dismissBtn = new gp.ModalButton("denyFileNameBtn", "Отмена", "btn-secondary", () => {
                    let fileNameInput = (document.getElementById("fileNameInput"));
                    fileNameInput.value = "";
                }, true);
                let okBtn = new gp.ModalButton("confirmFileNameBtn", "ОК", "btn-primary", () => {
                    let fileNameInput = (document.getElementById("fileNameInput"));
                    if (!fileNameInput.value)
                        return;
                    this.mainModal.hide();
                    try {
                        let fileName = this.removeCharacters(fileNameInput.value) + ".png";
                        let url = this.qrImg.src;
                        this.saveFileFunc(fileName, url);
                        //Выводим сообщение об успешном сохранении изображении
                        this.showMessageAlert("Изображение успешно сохранено!", gp.AlertCssClasses.success);
                    }
                    catch (err) {
                        console.log(err);
                    }
                }, false);
                let modalObj = new gp.MainModal(name, title, body, new Array(dismissBtn, okBtn));
                this.openModal(modalObj);
                let saveFolderPath = (document.getElementById("saveFolderPath"));
                let fileNameInput = (document.getElementById("fileNameInput"));
                saveFolderPath.textContent = this.downloadFolderPath;
                fileNameInput.value = this.removeCharacters(this.inputText.value);
                fileNameInput.focus();
                fileNameInput.select();
            });
            //Сохраняем изображение нажатием Enter в модалке
            this.mainMoadlElement.addEventListener("keydown", (e) => {
                var _a;
                if (gp.getCurrentModal() === gp.ModalTypes.saveBarcode)
                    if (e.key === "Enter")
                        (_a = document
                            .getElementById("confirmFileNameBtn")) === null || _a === void 0 ? void 0 : _a.dispatchEvent(new Event("click"));
            });
            let allModals = document.querySelectorAll(".modal");
            allModals.forEach((modal) => {
                // modal.addEventListener("")
            });
        };
        /**
         * Инициализация всех IpcRenderer
         */
        this.initIpcRenderers = () => {
            this.ipcRender.on("window:open-multigen-modal", (_event, modalObj) => {
                var _a;
                gp.setCurrentModal(gp.ModalTypes.multiGenerate);
                modalObj.name = gp.ModalTypes.multiGenerate;
                this.openModal(modalObj);
                let spinner = document.createElement("div");
                spinner.id = "generateFilesSpinner";
                spinner.style.display = "none";
                spinner.classList.add("spinner-border", "spinner-border-sm", "text-primary");
                spinner.setAttribute("role", "status");
                spinner.innerHTML = `<span class="visually-hidden">Loading...</span></div>`;
                (_a = this.mainMoadlElement
                    .querySelector(".modal-footer")) === null || _a === void 0 ? void 0 : _a.prepend(spinner);
            });
            //Обработаем запрос пакетной генерации
            this.ipcRender.on("window:generate-codes", async (_event, codesArr) => {
                await this.generateBarcode(codesArr);
            });
            //Очистка истории
            this.ipcRender.on("window:clear-history", (_event, _args) => {
                this.mainModal.hide();
                //Очищаем массив с историей генерации
                this.historyCodes = new Array();
                let fileName = new gp.GeneralParams().historyFileName;
                //Записываем историю в файл
                let data = JSON.stringify(this.historyCodes);
                this.saveDataToLocalStorage(fileName, data);
            });
            //Генерация текста, выбранного из истории
            this.ipcRender.on("window:set-history", (_event, historyText) => {
                this.mainModal.hide();
                let maxLength = this.appSettings.general.codeSymbolLength.currentLength;
                if (historyText.length > maxLength)
                    historyText = historyText.substring(0, maxLength);
                if (this.inputText.value != historyText) {
                    this.inputText.value = historyText;
                    this.inputText.dispatchEvent(new Event("change"));
                    this.genQrButton.dispatchEvent(new Event("click"));
                }
            });
            this.ipcRender.on("window:open-history-modal", (_event, modalObj) => {
                var _a, _b;
                (_a = this.mainMoadlElement
                    .querySelector(".modal-dialog")) === null || _a === void 0 ? void 0 : _a.classList.add("modal-dialog-scrollable");
                (_b = this.mainMoadlElement
                    .querySelector(".modal-dialog")) === null || _b === void 0 ? void 0 : _b.classList.remove("modal-dialog-centered");
                this.openModal(modalObj);
            });
            //Применение настроек и сохранение их в файл
            this.ipcRender.on("window:change-settings", async (_event, codeTypes) => {
                this.appSettings = codeTypes;
                await this.saveSettingsToLocalStorage();
                this.changeColorTheme(this.appSettings.general.isDarkMode);
                this.changeMaxSymbolCount(this.appSettings.general.codeSymbolLength.currentLength);
            });
            //Открытие модалки настроек
            this.ipcRender.on("window:open-settings-modal", (_event, modalObj) => {
                modalObj.name = gp.ModalTypes.settings;
                this.openModal(modalObj);
            });
            this.ipcRender.on("window:open-about-modal", (_event, modalObj) => {
                this.openModal(modalObj);
            });
        };
        /**
         * Получение списка типов кодов и добавление в Select
         */
        this.initBarcodeTypesSelect = () => {
            var _a;
            //Получим типы ШК
            let barcodeTypes = Object.getOwnPropertyNames(this.appSettings);
            //Переберем все типы ШК, создадим элементы и закинем в select
            barcodeTypes.forEach((barcodeType) => {
                var _a;
                let objectBarcodeType = barcodeType;
                if (this.appSettings[objectBarcodeType].typeName !==
                    this.appSettings.code128.typeName)
                    return;
                let option = new Option();
                let typeInd = barcodeTypes.indexOf(barcodeType);
                option.text = barcodeTypes[typeInd];
                option.value = barcodeTypes[typeInd];
                //Сразу выделим нужный нам тип кода
                if (barcodeType === this.appSettings.qrcode.bcid)
                    option.selected = true;
                (_a = this.typesSelect) === null || _a === void 0 ? void 0 : _a.options.add(option);
            });
            //Удалим первый пустой элемент
            (_a = this.typesSelect) === null || _a === void 0 ? void 0 : _a.options.remove(0);
        };
        /**
         * Получение сохраненных кодов и вывод в Select
         */
        this.getSavedCodesFromStorage = async () => {
            //Получаем имя файла с сохраненными кодами
            let filePath = new gp.GeneralParams().savedDataFileName;
            //Получаем все сохраненные коды из файла
            let data = await this.getDataFromStorage(filePath);
            if (data) {
                this.savedCodes = JSON.parse(data);
                let savedCodesElement = (document.getElementById("savedCodesSelect"));
                //Закинем их в Select
                this.savedCodes.forEach((code) => {
                    savedCodesElement.options.add(new Option(code, code));
                });
            }
        };
        /**
         * Получение настроек из локального хранилища
         */
        this.getSettingsFromStorage = async () => {
            //Получаем имя файла с настройками
            let filePath = new gp.GeneralParams().settingsFileName;
            //Получаем настройки из файла
            let data = await this.getDataFromStorage(filePath);
            if (data) {
                let sourceData = JSON.parse(data);
                new objectMapper_1.ObjectMapper().map(sourceData, this.appSettings);
                this.changeColorTheme(this.appSettings.general.isDarkMode);
                this.changeMaxSymbolCount(this.appSettings.general.codeSymbolLength.currentLength);
            }
        };
        /**
         * Получение истории генерации из локального хранилища
         * @param openDialog параметр нужен для того, чтобы передать полученные данные в модалку
         */
        this.getHistoryFromStorage = async (openDialog) => {
            //Получаем имя файла с историей генерации
            let filePath = new gp.GeneralParams().historyFileName;
            //Получаем историю генерации из файла
            let data = await this.getDataFromStorage(filePath);
            if (data) {
                this.historyCodes = JSON.parse(data);
                if (openDialog)
                    this.ipcRender.send("window:init-history-modal", this.historyCodes);
            }
        };
        /**
         * Получение данных из локального хранилища
         * @param fileName название файла, данные из которого надо получить
         * @returns Данные из указанного файла
         */
        this.getDataFromStorage = async (fileName) => {
            if (fileName) {
                let data = "";
                if (fs_jetpack_1.default.exists(fileName)) {
                    data = await fs_jetpack_1.default.readAsync(fileName);
                    // fs.readFile(fileName, (err, dataaa) => {
                    //     data = String(dataaa)
                    // })
                }
                else
                    await fs_jetpack_1.default.fileAsync(fileName);
                return data;
            }
        };
        /**
         * Запись данных в файл локального хранилища
         * @param fileName Название файла, куда надо записывать новые данные
         * @param saveData Текстовые данные, которые надо записать в файл
         */
        this.saveDataToLocalStorage = async (fileName, saveData) => {
            await fs_jetpack_1.default.writeAsync(fileName, saveData);
        };
        /**
         * Сохранение изображения в буфер обмена системы
         * @returns
         */
        this.saveImageToBuffer = () => {
            if (!this.appSettings.general.copyImageToClipboard)
                return;
            //! Костыль. Почему-то не копируется текущее изображение буфер
            setTimeout(() => {
                let img = nativeImage.createFromDataURL(this.qrImg.src);
                clipboard.writeImage(img);
                console.log("Image was generated");
            }, 100);
        };
        /**
         * Сохранение избранных данных в локальный файл
         */
        this.saveCodesToLocalStorage = async () => {
            let fileName = this.generalParams.savedDataFileName;
            let data = JSON.stringify(this.savedCodes);
            await this.saveDataToLocalStorage(fileName, data);
        };
        /**
         * Сохранение настроек в локальный файл
         */
        this.saveSettingsToLocalStorage = async () => {
            let fileName = this.generalParams.settingsFileName;
            let data = JSON.stringify(this.appSettings);
            await this.saveDataToLocalStorage(fileName, data);
        };
        /**
         * Создание файла с изображением
         * @param fileName Имя сохраняемого файла
         * @param url строка в формате Base64
         */
        this.saveFileFunc = (fileName, url) => {
            //Создадим директорию для сохранения файлов
            this.makeDir(this.downloadFolderPath);
            let pathToSave = path_1.default.join(this.downloadFolderPath, fileName);
            let base64Data = url.replace(/^data:image\/png;base64,/, "");
            fs.writeFileSync(pathToSave, base64Data, "base64");
        };
        /**
         * Создание директории по указанному пути
         * @param dirPath Путь до директории
         */
        this.makeDir = (dirPath) => {
            try {
                fs_jetpack_1.default.dir(dirPath);
            }
            catch (err) {
                // if (ex.code !== "EEXIST") throw err
            }
        };
        /**
         * Переключение тем приложения
         * @param isDarkMode выбрана темная тема?
         */
        this.changeColorTheme = (isDarkMode) => {
            let themeStyle = (document.getElementById("colorTheme"));
            if (isDarkMode) {
                themeStyle.href = new gp.GeneralParams().darkStyleLink;
                document.body.classList.add("darkBody");
                document.body.classList.remove("lightBody");
            }
            else {
                themeStyle.href = new gp.GeneralParams().lightStyleLink;
                document.body.classList.add("lightBody");
                document.body.classList.remove("darkBody");
            }
        };
        /**
         * Указание измененного количества символов в текстовом поле ввода данных для генерации
         * @param length новое количество символов в текстовом поле
         */
        this.changeMaxSymbolCount = (length) => {
            var _a;
            (_a = this.inputText) === null || _a === void 0 ? void 0 : _a.setAttribute("maxlength", length.toString());
            this.writeRemainingSymb();
        };
        /**
         * Отображение оставшегося количества символов
         */
        this.writeRemainingSymb = () => {
            var _a;
            //Высчитываем оставшее количество символов
            let remainingSymbCount = this.appSettings.general.codeSymbolLength.currentLength -
                ((_a = this.inputText) === null || _a === void 0 ? void 0 : _a.value.length);
            //Выводим на экран
            this.symbolCount.innerText = `Ост. кол-во символов: ${remainingSymbCount}`;
        };
        /**
         * Удаление недопустимых символов из строки
         * @param text входящий текст
         * @returns итоговая строка без недопустимых символов
         */
        this.removeCharacters = (text) => {
            return text.replace(/[<>:/|?*\\"]/g, "");
        };
        /**
         * Отображение модального окна с определенным содержимым
         * @param modalObject Объект модального окна с необходимым содержимым
         * @returns
         */
        this.openModal = (modalObject) => {
            //Если модалка открыта или не содержит имя, не открываем ее
            if (this.isModalShown() || !modalObject.name)
                return;
            //Элемент заголовка модалки
            let modalTitle = (this.mainMoadlElement.querySelector(".modal-title"));
            //Элемент тела модалки
            let modalBody = (this.mainMoadlElement.querySelector(".modal-body"));
            //Подвал модалки, куда кидаем кнопки, если они будут
            let modalFooter = (this.mainMoadlElement.querySelector(".modal-footer"));
            let modalExtendedHeader = (this.mainMoadlElement.querySelector(".modal-extended-header"));
            if (modalObject.extendedHeader && modalObject.extendedHeader.length > 0)
                modalExtendedHeader.innerHTML = modalObject.extendedHeader;
            //Запишем данные из объекта в соответствующие элементы
            modalTitle.innerHTML = modalObject.title;
            modalBody.innerHTML = modalObject.body;
            //Если есть кнопки, создадим их на основе массива из объекта модалки
            if (modalObject.buttons)
                modalObject.buttons.forEach((button) => {
                    let btn = document.createElement("button");
                    btn.type = "button";
                    btn.id = button.id;
                    btn.classList.add("btn", `${button.bClass}`);
                    btn.textContent = button.text;
                    if (button.handler)
                        btn.addEventListener("click", () => {
                            var _a;
                            (_a = button.handler) === null || _a === void 0 ? void 0 : _a.call(button);
                        });
                    if (button.dismiss)
                        btn.addEventListener("click", () => this.mainModal.hide());
                    modalFooter.appendChild(btn);
                });
            //Если кнопок нет, скроем футер с глаз долой
            if (modalObject.buttons.length === 0)
                modalFooter.style.display = "none";
            //Укажем имя текущей открываемой модалки
            gp.setCurrentModal(modalObject.name);
            //Откроем модалку
            this.mainModal.show();
            if (modalObject.handler)
                modalObject.handler;
        };
        /**
         * Возвращает результат в зависимости от того, выведена модалка на экран или нет
         * @returns true или false, если отображается или не отображается модалка
         */
        this.isModalShown = () => {
            var _a;
            return ((_a = document.getElementById("mainModal")) === null || _a === void 0 ? void 0 : _a.style.display) === "block";
        };
        this.showMessageAlert = (messageText, alertType) => {
            let messageAlert = document.getElementById("messageAlert");
            if (alertType) {
                messageAlert.classList.remove(gp.AlertCssClasses.danger);
                messageAlert.classList.remove(gp.AlertCssClasses.primary);
                messageAlert.classList.remove(gp.AlertCssClasses.success);
                messageAlert.classList.add(alertType);
            }
            messageAlert.textContent = messageText;
            if (this.alertTimerId) {
                clearTimeout(this.alertTimerId);
                this.alertTimerId = 0;
            }
            this.showAlert(messageAlert);
            this.alertTimerId = window.setTimeout(() => this.hideAlert(messageAlert), 2000);
        };
        this.hideHistoryAlert = () => {
            let historyAlert = document.getElementById("historyAlert");
            this.hideAlert(historyAlert);
        };
        this.showHistoryAlert = () => {
            let historyAlert = document.getElementById("historyAlert");
            this.showAlert(historyAlert);
        };
        this.historyAlertIsShown = () => {
            let historyAlert = document.getElementById("historyAlert");
            return historyAlert.classList.contains("active-alert");
        };
        this.showAlert = (alertElement) => {
            alertElement.classList.remove("disabled-alert");
            alertElement.classList.add("active-alert");
        };
        this.hideAlert = (alertElement) => {
            alertElement.classList.remove("active-alert");
            alertElement.classList.add("disabled-alert");
        };
        this.historySearch = async (searchText) => {
            let historyAlert = document.getElementById("historyAlert");
            //Сохраняем новый массив с кодами, используя Set, чтобы были убраны дубликаты
            let historyArr = [...new Set(this.historyCodes)];
            let historyListAlert = (document.getElementById("historyListAlert"));
            //Отступы сверху и снизу (костыль)
            let topBottomHeight = 10;
            //Принимаем за высоту одной строки, чтобы указать высоту всплывающего блока
            let stringHeight = 25;
            //Счетчик количества отображаемых кодов
            let counter = 0;
            //Флаг, указывающий, что происходит поиск. Возможно, понадобится, когда история будет большая
            let isSearching = false;
            //Очищаем содержимое всплывашки
            historyListAlert.innerHTML = "";
            //Инвертируем массив, чтобы недавние данные были первыми
            historyArr.reverse();
            if (!isSearching && this.inputText.value) {
                isSearching = true;
                for (let i = 0; i < historyArr.length; i++) {
                    let str = historyArr[i];
                    //Если всплывашка скрыта, откроем ее
                    if (str
                        .toLowerCase()
                        .includes(this.inputText.value.toLowerCase())) {
                        if (!this.historyAlertIsShown())
                            this.showHistoryAlert();
                        counter++;
                        //Если отображено 5 элементов, завершаем цикл, так как пока что выводим только 5 элементов
                        if (counter > 5)
                            break;
                        //Создаем элемент списка для отображаемого кода
                        const li = document.createElement("li");
                        //Обрежем отображаемое значение, если слишком много символов
                        const itemText = str.length > 30
                            ? document.createTextNode(str.substring(0, 30) + "...")
                            : document.createTextNode(str);
                        li.classList.add("list-group-item");
                        //Добавляем этот параметр, чтобы при кликах вне текстового поля и всплывашки
                        //закрывалась эта самая всплывашка
                        li.setAttribute("histListFlag", "true");
                        li.setAttribute("allText", str);
                        li.appendChild(itemText);
                        //При клике запишем значение в текстовое поле
                        li.onclick = async () => {
                            this.inputText.value = str;
                            await this.generateBarcode(str);
                            this.hideHistoryAlert();
                        };
                        historyListAlert.appendChild(li);
                    }
                }
                //Если введенное значение равно тому, что в списке и в списке всего один элемент, скроем всплывашку
                if ((historyListAlert.children.length === 1 &&
                    historyListAlert.children[0].getAttribute("allText") ===
                        this.inputText.value) ||
                    historyListAlert.children.length == 0) {
                    this.hideHistoryAlert();
                    isSearching = false;
                    return;
                }
                //Формируем высоту вслывашки
                historyAlert.style.height =
                    topBottomHeight +
                        historyListAlert.children.length * stringHeight +
                        topBottomHeight +
                        "px";
                isSearching = false;
            }
            else {
                if (this.historyAlertIsShown())
                    this.hideHistoryAlert();
            }
        };
        //----------------------------------------------Generator settings region----------------------------------------
        this.loadFontToBarcode = () => {
            bwip_js_1.default.loadFont("PT-Sans", 100, fs.readFileSync(require("path").resolve(this.appData.getAppPath()) +
                "/fonts/PTSans-Regular.ttf", "binary"));
        };
        this.generateCodesButtonsHandler = async () => {
            if (this.inputText.value) {
                await this.getHistoryFromStorage(false);
                //Добавляем код в историю запросов
                if (this.historyCodes[this.historyCodes.length - 1] !==
                    this.inputText.value)
                    this.historyCodes.push(this.inputText.value);
                let data = JSON.stringify(this.historyCodes);
                //Записываем историю в файл
                await this.saveDataToLocalStorage(this.generalParams.historyFileName, data);
                //Генерируем введенный текст
                this.generateBarcode(this.inputText.value, this.saveImageToBuffer);
            }
            //При генерации скроем всплывашку с историей кодов
            if (this.historyAlertIsShown())
                this.hideHistoryAlert();
        };
        /**
         * Генерация изображения ШК из текста
         * @param {string} text Текст для генерации ШК
         */
        this.generateBarcode = async (text, callback) => {
            //Получим выбранный тип ШК из выпадающего списка
            let type = this.typesSelect.value;
            //Получаем параметры для выбранного типа ШК из настроек приложения
            let params = this.appSettings[type];
            //Установим новые значения для цветовых свойств ШК
            params.textcolor = this.appSettings.general.color.fontColor.replace("#", "");
            params.backgroundcolor =
                this.appSettings.general.color.background.replace("#", "");
            params.barcolor = this.appSettings.general.color.symbolsColor.replace("#", "");
            //Если поступающий текст - массив, значит, это множественная генерация
            if (Array.isArray(text)) {
                for (let code of text) {
                    params.text = code.trim();
                    await this.generateSingleCode(true, params);
                }
                //Скроем модалку после завершения
                this.mainModal.hide();
            }
            else {
                params.text = text;
                await this.generateSingleCode(false, params);
            }
            if (callback)
                callback();
        };
        /**
         * Генерация одиночного изображения
         * @param isMulty проверка для множественной генерации. Нужна для непосредственного сохранения файла
         * @param params параметры для генерации ШК
         */
        this.generateSingleCode = async (isMulty, params) => {
            let promise = new Promise((resolve, reject) => {
                //Сгенерируем изображение
                bwip_js_1.default.toBuffer(params, (err, png) => {
                    if (err) {
                        // Если ошибка, выведем сообщение о неудочной генерации
                        this.showMessageAlert(`Не удалось сгенерировать ${params.bcid}`, gp.AlertCssClasses.danger);
                        console.log(err);
                    }
                    else {
                        //Конвертируем изображение в строку Base64 для дальнейшего отображения и сохранения
                        let imageSrc = "data:image/png;base64," + png.toString("base64");
                        //Если множественная генерация, то сохраним файл в директорию для сохраненных изображений
                        if (isMulty) {
                            let fileName = this.removeCharacters(params.text) + ".png";
                            this.saveFileFunc(fileName, imageSrc);
                            resolve(true);
                        }
                        else {
                            //Выведем изображение на экран с дополнительными отступами
                            //Отступы нужны для нормального сканированя ТСД с темной темой приложения
                            this.qrImg.src = imageSrc;
                            this.qrImg.style.padding = "10px";
                            this.qrImg.style.background =
                                this.appSettings.general.color.background;
                            //Чуток подправим отображение линейного ШК
                            if (params.bcid == this.appSettings.code128.bcid) {
                                this.qrImg.height = 150;
                                this.qrImg.width = this.qrImg.height * 1.67;
                            }
                            else {
                                this.qrImg.height = 220;
                                this.qrImg.width = 220;
                            }
                            resolve(true);
                        }
                    }
                });
            });
            await promise;
        };
        this.ipcRender = window.require("electron").ipcRenderer;
        this.appData = window.require("electron").remote.app;
        this.qrImg = document.getElementById("qrOutput");
        this.typesSelect = (document.getElementById("barcodeTypesSelect"));
        this.inputText = document.getElementById("qrTextForm");
        this.symbolCount = document.getElementById("symbolCount");
        this.downloadFolderPath = path_1.default.join((electron_1.default.app || electron_1.default.remote.app).getPath("downloads"), "QR Downloads");
        this.appSettings = new bs.BarcodeSettings().getSettingsParams();
        this.genQrButton = (document.getElementById("genQrButton"));
        this.settingsButton = (document.getElementById("settingsButton"));
        this.historyButton = (document.getElementById("historyButton"));
        this.multiGenerateBtn = (document.getElementById("multiGenerateBtn"));
        this.generateFilesSpinner = (document.getElementById("generateFilesSpinner"));
        this.contactButton = (document.getElementById("contactButton"));
        this.saveButton = (document.getElementById("saveQrImgButton"));
        this.mainMoadlElement = (document.getElementById("mainModal"));
        this.generalParams = new gp.GeneralParams();
        this.historyCodes = new Array();
        this.savedCodes = new Array();
        //Реализация общей модалки
        this.mainModal = new bootstrap_1.default.Modal(this.mainMoadlElement);
        //Очистка модалки при закрытии
        this.mainMoadlElement.addEventListener("hidden.bs.modal", () => {
            var _a, _b;
            ;
            (this.mainMoadlElement.querySelector(".modal-title")).innerHTML = "";
            (this.mainMoadlElement.querySelector(".modal-extended-header")).innerHTML = "";
            (this.mainMoadlElement.querySelector(".modal-body")).innerHTML = "";
            let footer = (this.mainMoadlElement.querySelector(".modal-footer"));
            footer.innerHTML = "";
            footer.removeAttribute("style");
            (_a = this.mainMoadlElement
                .querySelector(".modal-dialog")) === null || _a === void 0 ? void 0 : _a.classList.remove("modal-dialog-scrollable");
            (_b = this.mainMoadlElement
                .querySelector(".modal-dialog")) === null || _b === void 0 ? void 0 : _b.classList.add("modal-dialog-centered");
        });
        let tooltipTriggerList = [].slice.call((_a = document
            .getElementById("main")) === null || _a === void 0 ? void 0 : _a.querySelectorAll('[data-bs-toggle="tooltip"]'));
        let tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
            return new bootstrap_1.default.Tooltip(tooltipTriggerEl);
        });
    }
    async init() {
        this.initBarcodeTypesSelect();
        this.getSettingsFromStorage();
        this.getSavedCodesFromStorage();
        this.getHistoryFromStorage(false);
        this.initIpcRenderers();
        this.initButtonsHandlers();
        this.loadFontToBarcode();
    }
    /**
     * Создание и отображение контекстного меню
     * @param menuObject родительский объект контекстного меню
     * @param event событие мыши для определения координат курсора
     * @returns
     */
    makeContextMenu(menuObject, event) {
        //Если нет пунктов меню, ничего не делаем
        if (menuObject.items.length === 0)
            return;
        //Если уже есть одно контекстное меню, удалим его
        this.hideContextMenu();
        //Сохраним координаты курсора
        const { clientX: mouseX, clientY: mouseY } = event;
        //Создаем родительский блок контекстного меню
        let menuBlock = document.createElement("div");
        menuBlock.id = "contextMenu";
        //Задаем координаты положения меню
        menuBlock.style.top = `${mouseY}`;
        menuBlock.style.left = `${mouseX}`;
        menuBlock.classList.add("context-menu");
        //Заполняем пункты меню
        menuObject.items.forEach((item) => {
            let menuItem = document.createElement("div");
            menuItem.classList.add("context-menu-item");
            menuItem.innerText = item.name;
            menuItem.onclick = () => {
                item.handler();
                this.hideContextMenu();
            };
            menuBlock.appendChild(menuItem);
        });
        let main = document.getElementById("main");
        main.appendChild(menuBlock);
    }
    /**
     * Определение отображения контекстного меню
     * @returns true - меню отображается; false - меню скрыто
     */
    checkContextMenuShown() {
        let contextMenu = document.getElementById("contextMenu");
        if (contextMenu)
            return true;
        return false;
    }
    /**
     * Скрытие контекстного меню
     */
    hideContextMenu() {
        let contextMenu = document.getElementById("contextMenu");
        let main = document.getElementById("main");
        if (contextMenu)
            main.removeChild(contextMenu);
    }
}
new IndexController().init();
