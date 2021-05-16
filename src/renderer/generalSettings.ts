import { timers } from "jquery"

/**
 * Общие переменные с настройками для проекта
 */
export class GeneralParams {
    //Ссылка на стиль с темной темой
    public readonly darkStyleLink: string = "./css/darkTheme.css"
    //Ссылка на стиль со светлой темой
    public readonly lightStyleLink: string = "./css/lightTheme.css"
    //Файл, в котором содержатся "избранные" коды
    public readonly savedDataFileName: string = "savedData.json"
    //Файл, в котором содержатся настроки
    public readonly settingsFileName: string = "settings.json"
    //Файл с историей вводимыого текста
    public readonly historyFileName: string = "history.json"

    constructor() {}
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
    public isExtendedHeader: Boolean

    constructor(
        name: string,
        title: string,
        body: string,
        buttons: Array<ModalButton>,
        isExtendedHeader: boolean
    ) {
        this.name = name
        this.title = title
        this.body = body
        this.buttons = buttons
        this.isExtendedHeader = isExtendedHeader
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
