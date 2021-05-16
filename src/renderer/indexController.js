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
/**
 * Существующие типы модалок
 */
var ModalTypes;
(function (ModalTypes) {
    ModalTypes["saveBarcode"] = "saveBarcode";
    ModalTypes["settings"] = "settings";
    ModalTypes["history"] = "history";
    ModalTypes["multiGenerate"] = "multiGenerate";
    ModalTypes["about"] = "about";
})(ModalTypes || (ModalTypes = {}));
class IndexController {
    constructor() {
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
            this.inputText.addEventListener("input", () => {
                //Выводим всплывашку с предложенной историей генерации
                this.writeRemainingSymb();
            });
            this.settingsButton.addEventListener("click", () => {
                this.ipcRender.send("window:open-settings", this.appSettings);
            });
            this.historyButton.addEventListener("click", async () => {
                await this.getHistoryFromStorage(true);
            });
            this.contactButton.addEventListener("click", () => {
                let aboutArgs;
                aboutArgs = {
                    modalName: ModalTypes.about,
                    name: "Генератор штрих-кодов",
                    copyright: `&#169; 2019 - ${new Date().getFullYear()} 
  <a href="#" id="personLink" targetLink="https://vk.com/subbotinalexeysergeevich">Aleksey Subbotin</a>`,
                    desctiption: "",
                    version: "",
                };
                this.ipcRender.send("window:open-about", aboutArgs);
            });
            this.multiGenerateBtn.addEventListener("click", () => {
                this.ipcRender.send("window:open-multi-gen", this.downloadFolderPath);
            });
            this.genQrButton.addEventListener("click", async () => {
                await this.generateCodesButtonsHandler();
            });
            //Генерация ШК нажатием ctrl + enter
            this.inputText.addEventListener("keydown", async (e) => {
                if (e.ctrlKey && e.key == "Enter")
                    await this.generateCodesButtonsHandler();
            });
            window.addEventListener("keydown", (e) => {
                if (e.ctrlKey && e.code == "KeyS")
                    if (!this.isModalShown())
                        this.saveButton.dispatchEvent(new Event("click"));
                if (e.code === "Escape") {
                    //При нажатии Escape закрываем высплывашку с предложенной историей генерации
                }
            });
            //Сохранение текста в "избранное"
            let saveQrTextButton = (document.getElementById("saveQrTextButton"));
            saveQrTextButton.addEventListener("click", async () => {
                if (!this.inputText.value)
                    return;
                if (this.savedCodes.includes(this.inputText.value)) {
                    //Выводим сообщение о том, что код уже содержится в избранном
                }
                else {
                    this.savedCodes.push(this.inputText.value);
                    await this.saveCodesToLocalStorage();
                    //Вывести сообщение об успешном добавлении в "избранное"
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
            });
            //Вывод модалки для сохранения изображения в локальное хранилище
            this.saveButton.addEventListener("click", () => {
                if (!this.qrImg.src)
                    return;
                let name = ModalTypes.saveBarcode;
                let title = "Введите имя файла без расширения";
                let body = `<input class="form-control modal-input" id="fileNameInput" type="text" placeholder="Введите имя файла">
            <span id="saveFolderPath" class="saveFolderPath">${this.downloadFolderPath}</span>`;
                let dismissBtn = new gp.ModalButton("denyFileNameBtn", "Отмена", "outline-secondary", () => {
                    let fileNameInput = (document.getElementById("fileNameInput"));
                    fileNameInput.value = "";
                }, true);
                let okBtn = new gp.ModalButton("confirmFileNameBtn", "ОК", "primary", () => {
                    let fileNameInput = (document.getElementById("fileNameInput"));
                    if (!fileNameInput.value)
                        return;
                    this.mainModal.hide();
                    try {
                        let fileName = this.removeCharacters(fileNameInput.value) + ".png";
                        let url = this.qrImg.src;
                        this.saveFileFunc(fileName, url);
                        //Выводим сообщение об успешном сохранении изображении
                    }
                    catch (err) {
                        console.log(err);
                    }
                }, false);
                let modalObj = new gp.MainModal(name, title, body, new Array(dismissBtn, okBtn), false);
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
                if (this.currentModal === ModalTypes.saveBarcode)
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
            //Обработаем запрос пакетной генерации
            this.ipcRender.on("window:generate-codes", async (_event, codesArr) => {
                await this.generateBarcode(codesArr);
            });
            //Очистка истории
            this.ipcRender.on("window:clear-history", (_event, _args) => {
                //Очищаем массив с историей генерации
                this.historyCodes = new Array();
                let fileName = new gp.GeneralParams().historyFileName;
                //Записываем историю в файл
                let data = JSON.stringify(this.historyCodes);
                this.saveDataToLocalStorage(fileName, data);
            });
            //Генерация текста, выбранного из истории
            this.ipcRender.on("window:set-history", (_event, historyText) => {
                let maxLength = this.appSettings.general.codeSymbolLength.currentLength;
                if (historyText.length > maxLength)
                    historyText = historyText.substring(0, maxLength);
                if (this.inputText.value != historyText) {
                    this.inputText.value;
                    this.inputText.dispatchEvent(new Event("change"));
                    this.genQrButton.dispatchEvent(new Event("click"));
                }
            });
            //Применение настроек и сохранение их в файл
            this.ipcRender.on("window:change-settings", async (_event, codeTypes) => {
                this.appSettings = codeTypes;
                await this.saveSettingsToLocalStorage();
                this.changeColorTheme(this.appSettings.general.isDarkMode);
                this.changeMaxSymbolCount(this.appSettings.general.codeSymbolLength.currentLength);
            });
            this.ipcRender.on("window:open-about-modal", (_event, modalObj) => {
                this.openModal(modalObj);
                let personLink = document.getElementById("personLink");
                personLink === null || personLink === void 0 ? void 0 : personLink.addEventListener("click", () => {
                    let url = personLink === null || personLink === void 0 ? void 0 : personLink.getAttribute("targetLink");
                    this.ipcRender.send("url:open-url", url);
                });
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
                    this.ipcRender.send("window:open-history", this.historyCodes);
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
                if (err.code !== "EEXIST")
                    throw err;
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
                //Выключим спиннер сохранения изображений
                if (this.generateFilesSpinner.style.display === "none")
                    this.generateFilesSpinner.removeAttribute("style");
                //Скроем модалку после завершения
                this.multiGenModal.hide();
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
                    if (err)
                        console.log(err);
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
        this.multiGenModalElement = (document.getElementById("multiGenModal"));
        this.mainMoadlElement = (document.getElementById("mainModal"));
        this.generalParams = new gp.GeneralParams();
        this.historyCodes = new Array();
        this.savedCodes = new Array();
        //Создадим реализацию модалки пакетной генерации в Bootstrap
        this.multiGenModal = new bootstrap_1.default.Modal(this.multiGenModalElement);
        //Реализация общей модалки
        this.mainModal = new bootstrap_1.default.Modal(this.mainMoadlElement);
        this.currentModal = "";
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
     * Отображение модального окна с определенным содержимым
     * @param modalObject Объект модального окна с необходимым содержимым
     * @returns
     */
    openModal(modalObject) {
        var _a;
        if (((_a = this.mainMoadlElement) === null || _a === void 0 ? void 0 : _a.style.display) === "block" ||
            !modalObject.name)
            return;
        let modalTitle = (this.mainMoadlElement.querySelector(".modal-title"));
        let modalBody = (this.mainMoadlElement.querySelector(".modal-body"));
        let modalFooter = (this.mainMoadlElement.querySelector(".modal-footer"));
        modalTitle.innerHTML = "";
        modalBody.innerHTML = "";
        modalFooter.innerHTML = "";
        modalFooter.removeAttribute("style");
        let modalExtendedHeader = (this.mainMoadlElement.querySelector(".modal-extended-header"));
        modalTitle.innerHTML = modalObject.title;
        modalBody.innerHTML = modalObject.body;
        if (modalObject.buttons)
            modalObject.buttons.forEach((button) => {
                let btn = document.createElement("button");
                btn.type = "button";
                btn.id = button.id;
                btn.classList.add("btn", `btn-${button.bClass}`);
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
        if (modalObject.buttons.length === 0)
            modalFooter.style.display = "none";
        this.currentModal = modalObject.name;
        this.mainModal.show();
    }
    /**
     * Возвращает результат в зависимости от того, выведена модалка на экран или нет
     * @returns true или false, если отображается или не отображается модалка
     */
    isModalShown() {
        var _a;
        return ((_a = document.getElementById("mainModal")) === null || _a === void 0 ? void 0 : _a.style.display) === "block";
    }
}
new IndexController().init();
