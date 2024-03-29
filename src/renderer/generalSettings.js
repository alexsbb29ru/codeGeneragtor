"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setCurrentModal = exports.getCurrentModal = exports.AlertCssClasses = exports.ModalTypes = exports.ModalButton = exports.MainModal = exports.ContextMenuItem = exports.ContextMenu = exports.GeneralParams = void 0;
const electron_1 = __importDefault(require("electron"));
const path_1 = __importDefault(require("path"));
/**
 * Общие переменные с настройками для проекта
 */
class GeneralParams {
    constructor() {
        this.docsDirectory = path_1.default.join((electron_1.default.app || electron_1.default.remote.app).getPath("documents"), "BarcodeGenerator");
        //Ссылка на стиль с темной темой
        this.darkStyleLink = "./css/darkTheme.css";
        //Ссылка на стиль со светлой темой
        this.lightStyleLink = "./css/lightTheme.css";
        //Файл, в котором содержатся "избранные" коды
        this.savedDataFileName = path_1.default.join(this.docsDirectory, "savedData.json");
        //Файл, в котором содержатся настроки
        this.settingsFileName = path_1.default.join(this.docsDirectory, "settings.json");
        //Файл с историей вводимыого текста
        this.historyFileName = path_1.default.join(this.docsDirectory, "history.json");
    }
}
exports.GeneralParams = GeneralParams;
class ContextMenu {
    /**
     * Формирование контекстного меню
     * @param items Список действий контекстного меню
     */
    constructor(items) {
        this.items = items;
    }
}
exports.ContextMenu = ContextMenu;
class ContextMenuItem {
    /**
     * Создание пункта контекстного меню
     * @param name Название пункта контекстного меню
     * @param handler Обработчик нажатия на пункт меню
     */
    constructor(name, handler) {
        this.name = name;
        this.handler = handler;
    }
}
exports.ContextMenuItem = ContextMenuItem;
class MainModal {
    constructor(name, title, body, buttons, extendedHeader, handler) {
        this.name = name;
        this.title = title;
        this.body = body;
        this.buttons = buttons;
        this.extendedHeader = extendedHeader;
        this.handler = handler;
    }
}
exports.MainModal = MainModal;
class ModalButton {
    constructor(id, text, bClass, handler, dismiss) {
        this.id = id;
        this.text = text;
        this.bClass = bClass;
        this.handler = handler;
        this.dismiss = dismiss;
    }
}
exports.ModalButton = ModalButton;
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
})(ModalTypes = exports.ModalTypes || (exports.ModalTypes = {}));
var AlertCssClasses;
(function (AlertCssClasses) {
    AlertCssClasses["primary"] = "alert-primary";
    AlertCssClasses["success"] = "alert-success";
    AlertCssClasses["danger"] = "alert-danger";
})(AlertCssClasses = exports.AlertCssClasses || (exports.AlertCssClasses = {}));
let currentModal;
const getCurrentModal = () => {
    return currentModal;
};
exports.getCurrentModal = getCurrentModal;
const setCurrentModal = (modalName) => {
    currentModal = modalName;
};
exports.setCurrentModal = setCurrentModal;
