import electron from "electron"
import path from "path"
/**
 * Общие переменные с настройками для проекта
 */
export class GeneralParams {
    private readonly docsDirectory: string = path.join(
        (electron.app || electron.remote.app).getPath("documents"),
        "BarcodeGenerator"
    )
    //Ссылка на стиль с темной темой
    public readonly darkStyleLink: string = "./css/darkTheme.css"
    //Ссылка на стиль со светлой темой
    public readonly lightStyleLink: string = "./css/lightTheme.css"
    //Файл, в котором содержатся "избранные" коды
    public readonly savedDataFileName: string = path.join(
        this.docsDirectory,
        "savedData.json"
    )
    //Файл, в котором содержатся настроки
    public readonly settingsFileName: string = path.join(
        this.docsDirectory,
        "settings.json"
    )
    //Файл с историей вводимыого текста
    public readonly historyFileName: string = path.join(
        this.docsDirectory,
        "history.json"
    )

    constructor() {}
}

export class ContextMenu {
    public items: Array<ContextMenuItem>
    /**
     * Формирование контекстного меню
     * @param items Список действий контекстного меню
     */
    constructor(items: Array<ContextMenuItem>) {
        this.items = items
    }
}

export class ContextMenuItem {
    public name: string
    public handler: Function

    /**
     * Создание пункта контекстного меню
     * @param name Название пункта контекстного меню
     * @param handler Обработчик нажатия на пункт меню
     */
    constructor(name: string, handler: Function) {
        this.name = name
        this.handler = handler
    }
}

export type TAboutApp = {
    modalName: string
    name: string
    version: string
    desctiption: string
    copyright: string
}

export class MainModal {
    public name: string
    public title: string
    public body: string
    public buttons: Array<ModalButton>
    public extendedHeader?: string
    public handler?: Function

    constructor(
        name: string,
        title: string,
        body: string,
        buttons: Array<ModalButton>,
        extendedHeader?: string,
        handler?: Function
    ) {
        this.name = name
        this.title = title
        this.body = body
        this.buttons = buttons
        this.extendedHeader = extendedHeader
        this.handler = handler
    }
}

export class ModalButton {
    public id: string
    public text: string
    public bClass: string
    public handler: Function | null
    public dismiss: boolean | null

    constructor(
        id: string,
        text: string,
        bClass: string,
        handler: Function | null,
        dismiss: boolean | null
    ) {
        this.id = id
        this.text = text
        this.bClass = bClass
        this.handler = handler
        this.dismiss = dismiss
    }
}

/**
 * Существующие типы модалок
 */
export enum ModalTypes {
    saveBarcode = "saveBarcode",
    settings = "settings",
    history = "history",
    multiGenerate = "multiGenerate",
    about = "about",
}

export enum AlertCssClasses {
    primary = "alert-primary",
    success = "alert-success",
    danger = "alert-danger",
}

let currentModal: string
export const getCurrentModal = (): string => {
    return currentModal
}
export const setCurrentModal = (modalName: string): void => {
    currentModal = modalName
}
