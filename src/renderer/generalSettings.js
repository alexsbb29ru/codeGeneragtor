"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModalButton = exports.MainModal = exports.GeneralParams = void 0;
/**
 * Общие переменные с настройками для проекта
 */
class GeneralParams {
    constructor() {
        //Ссылка на стиль с темной темой
        this.darkStyleLink = "./css/darkTheme.css";
        //Ссылка на стиль со светлой темой
        this.lightStyleLink = "./css/lightTheme.css";
        //Файл, в котором содержатся "избранные" коды
        this.savedDataFileName = "savedData.json";
        //Файл, в котором содержатся настроки
        this.settingsFileName = "settings.json";
        //Файл с историей вводимыого текста
        this.historyFileName = "history.json";
    }
}
exports.GeneralParams = GeneralParams;
class MainModal {
    constructor(name, title, body, buttons, isExtendedHeader) {
        this.name = name;
        this.title = title;
        this.body = body;
        this.buttons = buttons;
        this.isExtendedHeader = isExtendedHeader;
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
