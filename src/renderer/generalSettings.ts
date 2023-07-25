/* eslint-disable @typescript-eslint/no-extra-semi */
import electron, { ipcRenderer } from "electron"
import path from "path"
/**
 * Общие переменные с настройками для проекта
 */
export class GeneralParams {
    private documentsPath = ""

    private docsDirectory = ""
    //Ссылка на стиль с темной темой
    public readonly darkStyleLink: string = "./css/darkTheme.css"
    //Ссылка на стиль со светлой темой
    public readonly lightStyleLink: string = "./css/lightTheme.css"
    //Файл, в котором содержатся "избранные" коды
    public savedDataFileName = ""
    //Файл, в котором содержатся настроки
    public settingsFileName = ""
    //Файл с историей вводимыого текста
    public historyFileName = ""

    constructor() {
        return
    }

    public init = async () => {
        this.documentsPath = await ipcRenderer.invoke("getDocumentsPath")
        this.docsDirectory = path.join(this.documentsPath, "BarcodeGenerator")
        this.savedDataFileName = path.join(this.docsDirectory, "savedData.json")
        this.settingsFileName = path.join(this.docsDirectory, "settings.json")
        this.historyFileName = path.join(this.docsDirectory, "history.json")
    }
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
    public handler: () => void

    /**
     * Создание пункта контекстного меню
     * @param name Название пункта контекстного меню
     * @param handler Обработчик нажатия на пункт меню
     */
    constructor(name: string, handler: () => void) {
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
    public handler?: typeof Function

    constructor(
        name: string,
        title: string,
        body: string,
        buttons: Array<ModalButton>,
        extendedHeader?: string,
        handler?: typeof Function
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
    public handler: () => void | null
    public dismiss: boolean | null

    constructor(
        id: string,
        text: string,
        bClass: string,
        handler: () => void | null,
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
