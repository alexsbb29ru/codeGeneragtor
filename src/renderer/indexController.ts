import electron, { IpcRenderer, IpcRendererEvent } from "electron"
const { clipboard, nativeImage } = electron
import path from "path"
import jetpack from "fs-jetpack"
import * as fs from "fs"
import bwipjs from "bwip-js"
import * as bootstrap from "bootstrap"
import * as bs from "./barcodeSettings"
import * as gp from "./generalSettings"
import { ObjectMapper as mapper } from "./objectMapper"
import { openSettingsWindow } from "./settingsController"
import { openAboutModal } from "./contactController"
import { initHistoryModal } from "./historyController"
import { initMultiGenModal } from "./multiGenerateController"

export class IndexController {
    private ipcRenderer: IpcRenderer
    //Img с отображаемым QR-кодом
    private qrImg: HTMLCanvasElement
    //Выпадающий список с типами ШК (128, QR)
    private typesSelect: HTMLSelectElement
    //Поле для ввода конвертируемого текста
    private inputText: HTMLInputElement
    //Поле, в котором выводится количество оставшихся символов
    private symbolCount: HTMLElement
    //Путь до папки с сохраненными изображениями
    private qrDownloadFolderPath = ""
    //Получаем стандартные настройки приложения
    private appSettings: bs.TBarcodeParams
    //Кнока "Сгенерировать" ШК
    private readonly genQrButton: HTMLButtonElement
    //Кнопка для вызова окна настроек
    private readonly settingsButton: HTMLButtonElement
    //Кнопка вызова окна с историей
    private readonly historyButton: HTMLButtonElement
    //Кнопка вызова окна множественной генерации
    private readonly multiGenerateBtn: HTMLButtonElement
    //Спиннер пакетной генерации кодов
    private readonly generateFilesSpinner: HTMLElement
    //Кнопка вызова окна about
    private readonly contactButton: HTMLButtonElement
    //Кнопка вызова модалки для сохранения сгенерированного кода в изображение
    private readonly saveButton: HTMLButtonElement
    //Общая модалка
    private mainMoadlElement: HTMLElement
    private mainModal: bootstrap.Modal
    //Массив с историей генерации
    private historyCodes: Array<string>
    //Массив с сохраненными кодами
    private savedCodes: Array<string>
    //Общие параметры для приложения
    private generalParams: gp.GeneralParams
    //Идентификатор таймера показа алерта
    private alertTimerId = 0
    //Выделенный текст в текстовом поле
    private selectedText = ""
    //Папка с загрузкам
    private dowloadsFolderPath = ""
    //Папка приложения
    private appFolderPath = ""
    // Версия приложения
    private appVersion = ""

    constructor() {
        this.ipcRenderer = window.require("electron").ipcRenderer

        this.qrImg = <HTMLCanvasElement>document.getElementById("qrOutput")
        this.typesSelect = <HTMLSelectElement>(
            document.getElementById("barcodeTypesSelect")
        )
        this.inputText = <HTMLInputElement>document.getElementById("qrTextForm")
        this.symbolCount = <HTMLElement>document.getElementById("symbolCount")

        this.appSettings = new bs.BarcodeSettings().getSettingsParams()
        this.genQrButton = <HTMLButtonElement>(
            document.getElementById("genQrButton")
        )
        this.settingsButton = <HTMLButtonElement>(
            document.getElementById("settingsButton")
        )
        this.historyButton = <HTMLButtonElement>(
            document.getElementById("historyButton")
        )
        this.multiGenerateBtn = <HTMLButtonElement>(
            document.getElementById("multiGenerateBtn")
        )
        this.generateFilesSpinner = <HTMLElement>(
            document.getElementById("generateFilesSpinner")
        )
        this.contactButton = <HTMLButtonElement>(
            document.getElementById("contactButton")
        )
        this.saveButton = <HTMLButtonElement>(
            document.getElementById("saveQrImgButton")
        )
        this.mainMoadlElement = <HTMLElement>(
            document.getElementById("mainModal")
        )

        this.generalParams = new gp.GeneralParams()

        this.historyCodes = new Array<string>()
        this.savedCodes = new Array<string>()
        //Реализация общей модалки
        this.mainModal = new bootstrap.Modal(this.mainMoadlElement)
        //Очистка модалки при закрытии
        this.mainMoadlElement.addEventListener("hidden.bs.modal", () => {
            const modalTitle = <HTMLElement>(
                this.mainMoadlElement.querySelector(".modal-title")
            )
            modalTitle.innerHTML = ""

            const modalExtendedHeader = <HTMLElement>(
                this.mainMoadlElement.querySelector(".modal-extended-header")
            )

            modalExtendedHeader.innerHTML = ""

            const modalBody = <HTMLElement>(
                this.mainMoadlElement.querySelector(".modal-body")
            )
            modalBody.innerHTML = ""

            const footer = <HTMLElement>(
                this.mainMoadlElement.querySelector(".modal-footer")
            )
            footer.innerHTML = ""
            footer.removeAttribute("style")

            this.mainMoadlElement
                .querySelector(".modal-dialog")
                ?.classList.remove("modal-dialog-scrollable")
            this.mainMoadlElement
                .querySelector(".modal-dialog")
                ?.classList.add("modal-dialog-centered")
        })

        const tooltipTriggerList = [].slice.call(
            document
                .getElementById("main")
                ?.querySelectorAll('[data-bs-toggle="tooltip"]')
        )
        const tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
            return new bootstrap.Tooltip(tooltipTriggerEl)
        })
    }

    async init() {
        await this.initFoldersPath()
        await this.initGeneralParams()

        this.initBarcodeTypesSelect()
        this.getSettingsFromStorage()
        this.getSavedCodesFromStorage()
        this.getHistoryFromStorage(false)
        this.initIpcRenderers()
        this.initButtonsHandlers()
        this.loadFontToBarcode()
    }
    public initGeneralParams = async () => {
        await this.generalParams.init()
        this.appVersion = await this.ipcRenderer.invoke("window:getAppVersion")
    }
    public initFoldersPath = async () => {
        this.dowloadsFolderPath = await this.ipcRenderer.invoke(
            "getDownloadsPath"
        )
        this.appFolderPath = await this.ipcRenderer.invoke("getAppPath")

        this.qrDownloadFolderPath = path.join(
            this.dowloadsFolderPath,
            "QR Downloads"
        )
    }
    public initButtonsHandlers = () => {
        const savedCodesElement: HTMLSelectElement = <HTMLSelectElement>(
            document.getElementById("savedCodesSelect")
        )
        savedCodesElement.addEventListener("change", async () => {
            this.inputText.value = savedCodesElement.value
            this.inputText.dispatchEvent(new Event("change"))

            if (savedCodesElement.value)
                await this.generateCodesButtonsHandler()
            else {
                this.clearCanvas()
            }
        })

        this.inputText.addEventListener("change", () => {
            this.writeRemainingSymb()
        })
        this.inputText.addEventListener("input", async () => {
            //Выводим всплывашку с предложенной историей генерации
            await this.historySearch(this.inputText.value)
            this.writeRemainingSymb()
        })
        this.settingsButton.addEventListener("click", () => {
            const modal = openSettingsWindow(this.appSettings)
            modal.name = gp.ModalTypes.settings
            this.openModal(modal)
        })

        this.historyButton.addEventListener("click", async () => {
            await this.getHistoryFromStorage(true)
        })

        this.contactButton.addEventListener("click", () => {
            const aboutArgs: gp.TAboutApp = {
                modalName: gp.ModalTypes.about,
                name: "Генератор штрих-кодов",
                copyright: `&#169; 2019 - ${new Date().getFullYear()} 
  <a href="#" id="personLink" targetLink="https://vk.com/subbotinalexeysergeevich">Aleksey Subbotin</a>`,
                desctiption: "",
                version: this.appVersion,
            }

            const modal = openAboutModal(aboutArgs)
            this.openModal(modal)
        })

        this.multiGenerateBtn.addEventListener("click", () => {
            const modal = initMultiGenModal(this.qrDownloadFolderPath)
            this.openModal(modal)

            const spinner = document.createElement("div")
            spinner.id = "generateFilesSpinner"
            spinner.style.display = "none"
            spinner.classList.add(
                "spinner-border",
                "spinner-border-sm",
                "text-primary"
            )
            spinner.setAttribute("role", "status")
            spinner.innerHTML = `<span class="visually-hidden">Loading...</span></div>`

            this.mainMoadlElement
                .querySelector(".modal-footer")
                ?.prepend(spinner)
        })

        this.genQrButton.addEventListener("click", async () => {
            await this.generateCodesButtonsHandler()
        })

        //Генерация ШК нажатием ctrl + enter
        this.inputText.addEventListener("keydown", async (e) => {
            if (e.ctrlKey && e.key === "Enter") {
                if (this.appSettings.general.isCtrlEnter)
                    await this.generateCodesButtonsHandler()
            } else if (e.key === "Enter") {
                if (!this.appSettings.general.isCtrlEnter) {
                    e.preventDefault()
                    await this.generateCodesButtonsHandler()
                }
            }
        })
        //Обработка выделения текста для последующего копирования в буфер обмена
        this.inputText.addEventListener("mouseup", (e) => {
            if (window.getSelection()?.toString()) {
                this.selectedText = <string>window.getSelection()?.toString()
            }
        })
        //Вызов кастомного контекстного меню
        window.addEventListener("contextmenu", (e) => {
            //Если нажата правая кнопка не в блоке для ввода текста, ничего не делаем
            if ((<Element>e.target).id !== this.inputText.id) {
                if (this.checkContextMenuShown()) this.hideContextMenu()
                return
            }
            e?.preventDefault()

            //Генерируем два пункта контекстного меню
            const copyMenuItem = new gp.ContextMenuItem("Копировать", () => {
                if (
                    this.inputText.selectionStart !==
                    this.inputText.selectionEnd
                )
                    electron.clipboard.writeText(this.selectedText)
            })
            const pasteMenuItem = new gp.ContextMenuItem("Вставить", () => {
                const selectionStart = this.inputText.selectionStart
                const selectionEnd = this.inputText.selectionEnd

                const leftText = this.inputText.value.substring(
                    0,
                    <number>selectionStart
                )
                const rightText = this.inputText.value.substring(
                    <number>selectionEnd
                )

                this.inputText.value =
                    leftText + electron.clipboard.readText() + rightText
            })
            //Добавим в массив сделанные пункты, чтобы передать их в родительский объект
            const contextMenu = new gp.ContextMenu(
                new Array<gp.ContextMenuItem>(copyMenuItem, pasteMenuItem)
            )
            //Создаем и визуализируем контекстное меню
            this.makeContextMenu(contextMenu, e)
        })

        //Сохранение изображения по нажатию ctrl + s
        window.addEventListener("keydown", (e) => {
            if (e.ctrlKey && e.code == "KeyS")
                if (!this.isModalShown())
                    this.saveButton.dispatchEvent(new Event("click"))

            //Открытие модалки настроек по нажатию ctrl + q
            if (e.ctrlKey && e.code == "KeyQ")
                if (!this.isModalShown())
                    this.settingsButton.dispatchEvent(new Event("click"))

            //Открытие модалки истории по нажатию ctrl + j
            if (e.ctrlKey && e.code == "KeyJ")
                if (!this.isModalShown())
                    this.historyButton.dispatchEvent(new Event("click"))

            //Открытие модалки пакетной генерации по нажатию ctrl + g
            if (e.ctrlKey && e.code == "KeyG")
                if (!this.isModalShown())
                    this.multiGenerateBtn.dispatchEvent(new Event("click"))

            //Открытие модалки контактов по нажатию ctrl + i
            if (e.ctrlKey && e.code == "KeyI")
                if (!this.isModalShown())
                    this.contactButton.dispatchEvent(new Event("click"))

            if (e.code === "Escape") {
                //При нажатии Escape закрываем высплывашку с предложенной историей генерации
                this.hideHistoryAlert()
            }
        })

        window.addEventListener("click", (e: MouseEvent) => {
            if (
                (<Element>e.target).id !== "historyAlert" &&
                this.historyAlertIsShown()
            )
                this.hideHistoryAlert()

            if (
                this.checkContextMenuShown() &&
                !(<HTMLElement>e.target).classList.contains("context-menu-item")
            )
                this.hideContextMenu()
        })

        //Сохранение текста в "избранное"
        const saveQrTextButton: HTMLButtonElement = <HTMLButtonElement>(
            document.getElementById("saveQrTextButton")
        )
        saveQrTextButton.addEventListener("click", async () => {
            if (!this.inputText.value) return

            if (this.savedCodes.includes(this.inputText.value)) {
                //Выводим сообщение о том, что код уже содержится в избранном
                this.showMessageAlert(
                    "Текст уже содержится в избранном",
                    gp.AlertCssClasses.danger
                )
            } else {
                this.savedCodes.push(this.inputText.value)
                await this.saveCodesToLocalStorage()
                //Вывести сообщение об успешном добавлении в "избранное"
                this.showMessageAlert(
                    "Текст успешно сохранен в избранном",
                    gp.AlertCssClasses.success
                )
                savedCodesElement.options.add(
                    new Option(this.inputText.value, this.inputText.value)
                )
            }
        })

        //Удаление элемента из "Избранного"
        const removeSavedCodeBtn: HTMLButtonElement = <HTMLButtonElement>(
            document.getElementById("removeSavedQrBtn")
        )
        removeSavedCodeBtn.addEventListener("click", async () => {
            const code = savedCodesElement.value
            if (!code) return

            this.savedCodes.splice(this.savedCodes.indexOf(code), 1)
            savedCodesElement.options.remove(savedCodesElement.selectedIndex)
            savedCodesElement.dispatchEvent(new Event("change"))

            this.inputText.dispatchEvent(new Event("change"))
            await this.saveCodesToLocalStorage()

            //Выводим сообщение об успешном удалении данных из избранного
            this.showMessageAlert(
                "Текст успешно удален из избранного",
                gp.AlertCssClasses.success
            )
        })

        //Вывод модалки для сохранения изображения в локальное хранилище
        this.saveButton.addEventListener("click", () => {
            if (!this.qrImg.toDataURL()) return

            const name = gp.ModalTypes.saveBarcode
            const title = "Введите имя файла без расширения"

            const body = `<input class="form-control modal-input" id="fileNameInput" type="text" placeholder="Введите имя файла">
            <span id="saveFolderPath" class="saveFolderPath">${this.qrDownloadFolderPath}</span>`

            const dismissBtn = new gp.ModalButton(
                "denyFileNameBtn",
                "Отмена",
                "btn-secondary",
                () => {
                    const fileNameInput = <HTMLInputElement>(
                        document.getElementById("fileNameInput")
                    )
                    fileNameInput.value = ""
                },
                true
            )
            const okBtn = new gp.ModalButton(
                "confirmFileNameBtn",
                "ОК",
                "btn-primary",
                () => {
                    const fileNameInput = <HTMLInputElement>(
                        document.getElementById("fileNameInput")
                    )
                    if (!fileNameInput.value) return

                    this.mainModal.hide()
                    try {
                        const fileName =
                            this.removeCharacters(fileNameInput.value) + ".png"
                        const url = this.qrImg.toDataURL()
                        this.saveFileFunc(fileName, url)

                        //Выводим сообщение об успешном сохранении изображении
                        this.showMessageAlert(
                            "Изображение успешно сохранено!",
                            gp.AlertCssClasses.success
                        )
                    } catch (err) {
                        console.log(err)
                    }
                },
                false
            )

            const modalObj = new gp.MainModal(
                name,
                title,
                body,
                new Array<gp.ModalButton>(dismissBtn, okBtn)
            )

            this.openModal(modalObj)

            const saveFolderPath = <HTMLSpanElement>(
                document.getElementById("saveFolderPath")
            )
            const fileNameInput = <HTMLInputElement>(
                document.getElementById("fileNameInput")
            )

            saveFolderPath.textContent = this.qrDownloadFolderPath
            fileNameInput.value = this.removeCharacters(
                <string>this.inputText.value
            )
            fileNameInput.focus()
            fileNameInput.select()
        })

        //Сохраняем изображение нажатием Enter в модалке
        this.mainMoadlElement.addEventListener("keydown", (e) => {
            if (gp.getCurrentModal() === gp.ModalTypes.saveBarcode)
                if (e.key === "Enter")
                    document
                        .getElementById("confirmFileNameBtn")
                        ?.dispatchEvent(new Event("click"))
        })
    }
    /**
     * Инициализация всех IpcRenderer
     */
    public initIpcRenderers = () => {
        return
    }

    /**
     * Пакетная генерация ШК
     * @param codesArr Массив генерируемых ШК
     */
    public mulipleCodesGeneration = async (codesArr: string[]) => {
        await this.generateBarcode(codesArr)
    }

    /**
     * Генерация текста, выбранного из истории
     * @param historyText Выбранный текст из истории
     */
    public setHistoryToInput = (historyText: string) => {
        this.mainModal.hide()
        const maxLength =
            this.appSettings.general.codeSymbolLength.currentLength
        if (historyText.length > maxLength)
            historyText = historyText.substring(0, maxLength)
        if (this.inputText.value != historyText) {
            this.inputText.value = historyText
            this.inputText.dispatchEvent(new Event("change"))
            this.genQrButton.dispatchEvent(new Event("click"))
        }
    }

    /**
     * Применение настроек и сохранение их в файл
     * @param codeTypes Настройки видов ШК
     */
    public changeSettings = async (codeTypes: bs.TBarcodeParams) => {
        this.appSettings = codeTypes
        await this.saveSettingsToLocalStorage()
        await this.changeColorTheme(this.appSettings.general.isDarkMode)
        this.changeMaxSymbolCount(
            this.appSettings.general.codeSymbolLength.currentLength
        )
    }

    /**
     * Очистка истории
     */
    public clearHistory = async () => {
        this.mainModal.hide()
        //Очищаем массив с историей генерации
        this.historyCodes = new Array<string>()
        const fileName: string = this.generalParams.historyFileName
        //Записываем историю в файл
        const data = JSON.stringify(this.historyCodes)
        this.saveDataToLocalStorage(fileName, data)
    }
    /**
     * Получение списка типов кодов и добавление в Select
     */
    public initBarcodeTypesSelect = () => {
        //Получим типы ШК
        const barcodeTypes: string[] = Object.getOwnPropertyNames(
            this.appSettings
        )
        //Переберем все типы ШК, создадим элементы и закинем в select
        barcodeTypes.forEach((barcodeType) => {
            const objectBarcodeType = barcodeType as keyof bs.TBarcodeParams
            if (
                this.appSettings[objectBarcodeType].typeName !==
                this.appSettings.code128.typeName
            )
                return

            const option = new Option()
            const typeInd = barcodeTypes.indexOf(barcodeType)

            option.text = barcodeTypes[typeInd]
            option.value = barcodeTypes[typeInd]

            //Сразу выделим нужный нам тип кода
            if (barcodeType === this.appSettings.qrcode.bcid)
                option.selected = true

            this.typesSelect?.options.add(option)
        })
        //Удалим первый пустой элемент
        this.typesSelect?.options.remove(0)
    }
    /**
     * Получение сохраненных кодов и вывод в Select
     */
    public getSavedCodesFromStorage = async () => {
        //Получаем имя файла с сохраненными кодами
        const filePath: string = this.generalParams.savedDataFileName
        //Получаем все сохраненные коды из файла
        const data: string = <string>await this.getDataFromStorage(filePath)
        if (data) {
            this.savedCodes = <Array<string>>JSON.parse(data)

            const savedCodesElement: HTMLSelectElement = <HTMLSelectElement>(
                document.getElementById("savedCodesSelect")
            )
            //Закинем их в Select
            this.savedCodes.forEach((code) => {
                savedCodesElement.options.add(new Option(code, code))
            })
        }
    }
    /**
     * Получение настроек из локального хранилища
     */
    public getSettingsFromStorage = async () => {
        //Получаем имя файла с настройками
        const filePath: string = this.generalParams.settingsFileName
        //Получаем настройки из файла
        const data: string = <string>await this.getDataFromStorage(filePath)
        if (data) {
            const sourceData: bs.TBarcodeParams = JSON.parse(data)
            new mapper().map<bs.TBarcodeParams>(sourceData, this.appSettings)

            await this.changeColorTheme(this.appSettings.general.isDarkMode)
            this.changeMaxSymbolCount(
                this.appSettings.general.codeSymbolLength.currentLength
            )
        }
    }
    /**
     * Получение истории генерации из локального хранилища
     * @param openDialog параметр нужен для того, чтобы передать полученные данные в модалку
     */
    public getHistoryFromStorage = async (openDialog: boolean) => {
        //Получаем имя файла с историей генерации
        const filePath: string = this.generalParams.historyFileName
        //Получаем историю генерации из файла
        const data = await this.getDataFromStorage(filePath)

        if (data) {
            this.historyCodes = JSON.parse(data) as string[]
            if (openDialog) {
                const modal = initHistoryModal(this.historyCodes)
                this.openModal(modal)
            }
        }
    }

    /**
     * Получение данных из локального хранилища
     * @param fileName название файла, данные из которого надо получить
     * @returns Данные из указанного файла
     */
    public getDataFromStorage = async (
        fileName: string
    ): Promise<string | undefined> => {
        if (fileName) {
            let data: string | undefined = ""
            if (jetpack.exists(fileName)) {
                data = await jetpack.readAsync(fileName)
                // fs.readFile(fileName, (err, dataaa) => {
                //     data = String(dataaa)
                // })
            } else await jetpack.fileAsync(fileName)

            return data
        }
    }
    /**
     * Запись данных в файл локального хранилища
     * @param fileName Название файла, куда надо записывать новые данные
     * @param saveData Текстовые данные, которые надо записать в файл
     */
    public saveDataToLocalStorage = async (
        fileName: string,
        saveData: string
    ) => {
        await jetpack.writeAsync(fileName, saveData)
    }

    /**
     * Сохранение изображения в буфер обмена системы
     * @returns
     */
    public saveImageToBuffer = (): void => {
        if (!this.appSettings.general.copyImageToClipboard) return

        //! Костыль. Почему-то не копируется текущее изображение буфер
        setTimeout(() => {
            const img = nativeImage.createFromDataURL(this.qrImg.toDataURL())
            clipboard.writeImage(img)
            console.log("Image was generated")
        }, 100)
    }
    /**
     * Сохранение избранных данных в локальный файл
     */
    public saveCodesToLocalStorage = async () => {
        const fileName = this.generalParams.savedDataFileName
        const data = JSON.stringify(this.savedCodes)
        await this.saveDataToLocalStorage(fileName, data)
    }
    /**
     * Сохранение настроек в локальный файл
     */
    public saveSettingsToLocalStorage = async () => {
        const fileName = this.generalParams.settingsFileName
        const data = JSON.stringify(this.appSettings)

        await this.saveDataToLocalStorage(fileName, data)
    }

    /**
     * Создание файла с изображением
     * @param fileName Имя сохраняемого файла
     * @param url строка в формате Base64
     */
    public saveFileFunc = (fileName: string, url: string): void => {
        //Создадим директорию для сохранения файлов
        this.makeDir(this.qrDownloadFolderPath)

        const pathToSave = path.join(this.qrDownloadFolderPath, fileName)
        const base64Data = url.replace(/^data:image\/png;base64,/, "")

        fs.writeFileSync(pathToSave, base64Data, "base64")
    }

    /**
     * Создание директории по указанному пути
     * @param dirPath Путь до директории
     */
    private makeDir = (dirPath: string) => {
        try {
            jetpack.dir(dirPath)
        } catch (err) {
            // if (ex.code !== "EEXIST") throw err
        }
    }
    /**
     * Переключение тем приложения
     * @param isDarkMode выбрана темная тема?
     */
    private changeColorTheme = async (isDarkMode: boolean) => {
        if (isDarkMode) {
            document.body.classList.add("darkBody")
            document.body.classList.remove("lightBody")

            await this.ipcRenderer.invoke("dark-mode:on")
        } else {
            document.body.classList.add("lightBody")
            document.body.classList.remove("darkBody")

            await this.ipcRenderer.invoke("dark-mode:off")
        }
    }
    /**
     * Указание измененного количества символов в текстовом поле ввода данных для генерации
     * @param length новое количество символов в текстовом поле
     */
    private changeMaxSymbolCount = (length: number) => {
        this.inputText?.setAttribute("maxlength", length.toString())
        this.writeRemainingSymb()
    }
    /**
     * Отображение оставшегося количества символов
     */
    private writeRemainingSymb = () => {
        //Высчитываем оставшее количество символов
        const remainingSymbCount =
            this.appSettings.general.codeSymbolLength.currentLength -
            <number>this.inputText?.value.length

        //Выводим на экран
        this.symbolCount.innerText = `Ост. кол-во символов: ${remainingSymbCount}`
    }
    /**
     * Удаление недопустимых символов из строки
     * @param text входящий текст
     * @returns итоговая строка без недопустимых символов
     */
    private removeCharacters = (text: string): string => {
        return text.replace(/[<>:/|?*\\"]/g, "")
    }
    /**
     * Отображение модального окна с определенным содержимым
     * @param modalObject Объект модального окна с необходимым содержимым
     * @returns
     */
    private openModal = (modalObject: gp.MainModal): void => {
        //Если модалка открыта или не содержит имя, не открываем ее
        if (this.isModalShown() || !modalObject.name) return

        //Элемент заголовка модалки
        const modalTitle = <HTMLElement>(
            this.mainMoadlElement.querySelector(".modal-title")
        )
        //Элемент тела модалки
        const modalBody = <HTMLElement>(
            this.mainMoadlElement.querySelector(".modal-body")
        )
        //Подвал модалки, куда кидаем кнопки, если они будут
        const modalFooter = <HTMLElement>(
            this.mainMoadlElement.querySelector(".modal-footer")
        )

        const modalExtendedHeader = <HTMLElement>(
            this.mainMoadlElement.querySelector(".modal-extended-header")
        )
        if (modalObject.extendedHeader && modalObject.extendedHeader.length > 0)
            modalExtendedHeader.innerHTML = modalObject.extendedHeader

        //Запишем данные из объекта в соответствующие элементы
        modalTitle.innerHTML = modalObject.title
        modalBody.innerHTML = modalObject.body

        //Если есть кнопки, создадим их на основе массива из объекта модалки
        if (modalObject.buttons)
            modalObject.buttons.forEach((button) => {
                const btn = document.createElement("button")
                btn.type = "button"
                btn.id = button.id
                btn.classList.add("btn", `${button.bClass}`)
                btn.textContent = button.text
                if (button.handler)
                    btn.addEventListener("click", () => {
                        button.handler?.()
                    })
                if (button.dismiss)
                    btn.addEventListener("click", () => this.mainModal.hide())

                modalFooter.appendChild(btn)
            })
        //Если кнопок нет, скроем футер с глаз долой
        if (modalObject.buttons.length === 0) modalFooter.style.display = "none"
        //Укажем имя текущей открываемой модалки
        gp.setCurrentModal(modalObject.name)
        //Откроем модалку
        this.mainModal.show()

        if (modalObject.handler) modalObject.handler
    }
    /**
     * Возвращает результат в зависимости от того, выведена модалка на экран или нет
     * @returns true или false, если отображается или не отображается модалка
     */
    private isModalShown = (): boolean => {
        return document.getElementById("mainModal")?.style.display === "block"
    }

    private showMessageAlert = (messageText: string, alertType?: string) => {
        const messageAlert = <HTMLElement>(
            document.getElementById("messageAlert")
        )

        if (alertType) {
            messageAlert.classList.remove(gp.AlertCssClasses.danger)
            messageAlert.classList.remove(gp.AlertCssClasses.primary)
            messageAlert.classList.remove(gp.AlertCssClasses.success)

            messageAlert.classList.add(alertType)
        }
        messageAlert.textContent = messageText
        if (this.alertTimerId) {
            clearTimeout(this.alertTimerId)
            this.alertTimerId = 0
        }

        this.showAlert(messageAlert)
        this.alertTimerId = window.setTimeout(
            () => this.hideAlert(messageAlert),
            2000
        )
    }

    private hideHistoryAlert = () => {
        const historyAlert = <HTMLElement>(
            document.getElementById("historyAlert")
        )
        this.hideAlert(historyAlert)
    }
    private showHistoryAlert = () => {
        const historyAlert = <HTMLElement>(
            document.getElementById("historyAlert")
        )
        this.showAlert(historyAlert)
    }
    private historyAlertIsShown = (): boolean => {
        const historyAlert = <HTMLElement>(
            document.getElementById("historyAlert")
        )
        return historyAlert.classList.contains("active-alert")
    }

    private showAlert = (alertElement: HTMLElement) => {
        alertElement.classList.remove("disabled-alert")
        alertElement.classList.add("active-alert")
    }

    private hideAlert = (alertElement: HTMLElement) => {
        alertElement.classList.remove("active-alert")
        alertElement.classList.add("disabled-alert")
    }

    private historySearch = async (searchText: string) => {
        const historyAlert = <HTMLElement>(
            document.getElementById("historyAlert")
        )
        //Сохраняем новый массив с кодами, используя Set, чтобы были убраны дубликаты
        const historyArr: Array<string> = [...new Set(this.historyCodes)]
        const historyListAlert = <HTMLElement>(
            document.getElementById("historyListAlert")
        )
        //Отступы сверху и снизу (костыль)
        const topBottomHeight = 10
        //Принимаем за высоту одной строки, чтобы указать высоту всплывающего блока
        const stringHeight = 25
        //Счетчик количества отображаемых кодов
        let counter = 0
        //Флаг, указывающий, что происходит поиск. Возможно, понадобится, когда история будет большая
        let isSearching = false

        //Очищаем содержимое всплывашки
        historyListAlert.innerHTML = ""
        //Инвертируем массив, чтобы недавние данные были первыми
        historyArr.reverse()

        if (!isSearching && this.inputText.value) {
            isSearching = true

            for (let i = 0; i < historyArr.length; i++) {
                const str = historyArr[i]

                //Если всплывашка скрыта, откроем ее
                if (
                    str
                        .toLowerCase()
                        .includes(this.inputText.value.toLowerCase())
                ) {
                    if (!this.historyAlertIsShown()) this.showHistoryAlert()
                    counter++
                    //Если отображено 5 элементов, завершаем цикл, так как пока что выводим только 5 элементов
                    if (counter > 5) break

                    //Создаем элемент списка для отображаемого кода
                    const li = document.createElement("li")
                    //Обрежем отображаемое значение, если слишком много символов
                    const itemText =
                        str.length > 30
                            ? document.createTextNode(
                                  str.substring(0, 30) + "..."
                              )
                            : document.createTextNode(str)

                    li.classList.add("list-group-item")
                    //Добавляем этот параметр, чтобы при кликах вне текстового поля и всплывашки
                    //закрывалась эта самая всплывашка
                    li.setAttribute("histListFlag", "true")
                    li.setAttribute("allText", str)

                    li.appendChild(itemText)
                    //При клике запишем значение в текстовое поле
                    li.onclick = async () => {
                        this.inputText.value = str
                        await this.generateBarcode(str)
                        this.hideHistoryAlert()
                    }
                    historyListAlert.appendChild(li)
                }
            }
            //Если введенное значение равно тому, что в списке и в списке всего один элемент, скроем всплывашку
            if (
                (historyListAlert.children.length === 1 &&
                    historyListAlert.children[0].getAttribute("allText") ===
                        this.inputText.value) ||
                historyListAlert.children.length == 0
            ) {
                this.hideHistoryAlert()
                isSearching = false

                return
            }
            //Формируем высоту вслывашки
            historyAlert.style.height =
                topBottomHeight +
                historyListAlert.children.length * stringHeight +
                topBottomHeight +
                "px"

            isSearching = false
        } else {
            if (this.historyAlertIsShown()) this.hideHistoryAlert()
        }
    }
    /**
     * Создание и отображение контекстного меню
     * @param menuObject родительский объект контекстного меню
     * @param event событие мыши для определения координат курсора
     * @returns
     */
    private makeContextMenu(
        menuObject: gp.ContextMenu,
        event: MouseEvent
    ): void {
        //Если нет пунктов меню, ничего не делаем
        if (menuObject.items.length === 0) return

        //Если уже есть одно контекстное меню, удалим его
        this.hideContextMenu()
        //Сохраним координаты курсора
        const { clientX: mouseX, clientY: mouseY } = event

        //Создаем родительский блок контекстного меню
        const menuBlock = document.createElement("div")
        menuBlock.id = "contextMenu"
        //Задаем координаты положения меню
        menuBlock.style.top = `${mouseY}`
        menuBlock.style.left = `${mouseX}`
        menuBlock.classList.add("context-menu")
        //Заполняем пункты меню
        menuObject.items.forEach((item) => {
            const menuItem = document.createElement("div")
            menuItem.classList.add("context-menu-item")
            menuItem.innerText = item.name
            menuItem.onclick = () => {
                item.handler()
                this.hideContextMenu()
            }

            menuBlock.appendChild(menuItem)
        })
        const main = <HTMLElement>document.getElementById("main")
        main.appendChild(menuBlock)
    }
    /**
     * Определение отображения контекстного меню
     * @returns true - меню отображается; false - меню скрыто
     */
    private checkContextMenuShown() {
        const contextMenu = document.getElementById("contextMenu")
        if (contextMenu) return true

        return false
    }
    /**
     * Скрытие контекстного меню
     */
    private hideContextMenu() {
        const contextMenu = document.getElementById("contextMenu")
        const main = <HTMLElement>document.getElementById("main")

        if (contextMenu) main.removeChild(contextMenu)
    }

    //----------------------------------------------Generator settings region----------------------------------------

    private loadFontToBarcode = () => {
        bwipjs.loadFont(
            "PT-Sans",
            100,
            fs.readFileSync(
                path.resolve(this.appFolderPath) + "/fonts/PTSans-Regular.ttf",
                "binary"
            )
        )
    }

    public generateCodesButtonsHandler = async () => {
        if (this.inputText.value) {
            await this.getHistoryFromStorage(false)
            //Добавляем код в историю запросов
            if (
                this.historyCodes[this.historyCodes.length - 1] !==
                this.inputText.value
            )
                this.historyCodes.push(this.inputText.value)

            const data = JSON.stringify(this.historyCodes)
            //Записываем историю в файл
            await this.saveDataToLocalStorage(
                this.generalParams.historyFileName,
                data
            )

            //Генерируем введенный текст
            this.generateBarcode(this.inputText.value, () => {
                this.saveImageToBuffer()
            })
        }

        //При генерации скроем всплывашку с историей кодов
        if (this.historyAlertIsShown()) this.hideHistoryAlert()
    }
    /**
     * Генерация изображения ШК из текста
     * @param {string} text Текст для генерации ШК
     */
    public generateBarcode = async (
        text: string | string[],
        callback?: () => void
    ) => {
        //Получим выбранный тип ШК из выпадающего списка
        const type = this.typesSelect.value as keyof bs.TBarcodeParams
        //Получаем параметры для выбранного типа ШК из настроек приложения
        const params: bs.TCodeParams = <bs.TCodeParams>this.appSettings[type]

        //Установим новые значения для цветовых свойств ШК
        params.textcolor = this.appSettings.general.color.fontColor.replace(
            "#",
            ""
        )
        params.backgroundcolor =
            this.appSettings.general.color.background.replace("#", "")
        params.barcolor = this.appSettings.general.color.symbolsColor.replace(
            "#",
            ""
        )

        //Если поступающий текст - массив, значит, это множественная генерация
        if (Array.isArray(text)) {
            for (const code of text) {
                params.text = code.trim()
                await this.generateSingleCode(true, params)
            }
            //Скроем модалку после завершения
            this.mainModal.hide()
        } else {
            params.text = text

            await this.generateSingleCode(false, params)
        }

        if (callback) callback()
    }
    /**
     * Генерация одиночного изображения
     * @param isMulty проверка для множественной генерации. Нужна для непосредственного сохранения файла
     * @param params параметры для генерации ШК
     */
    public generateSingleCode = async (
        isMulty: boolean,
        params: bs.TCodeParams
    ) => {
        const promise = new Promise((resolve, reject) => {
            if (isMulty) {
                const fileName = this.removeCharacters(params.text) + ".png"
                const multiGenCanvas = document.getElementById("multiGenCanvas")

                if (!multiGenCanvas) return

                const canvas = multiGenCanvas as HTMLCanvasElement

                bwipjs.toCanvas(canvas, params)

                const imageData = canvas.toDataURL()
                this.saveFileFunc(fileName, imageData)

                resolve(true)
            } else {
                this.clearCanvas()

                this.qrImg.style.padding = "10px"
                this.qrImg.style.background =
                    this.appSettings.general.color.background

                //Чуток подправим отображение линейного ШК
                if (params.bcid == this.appSettings.code128.bcid) {
                    const baseSize = 150
                    this.qrImg.style.height = `${baseSize}px`
                    this.qrImg.style.width = `${baseSize * 1.67}px`
                } else {
                    this.qrImg.style.height = "220px"
                    this.qrImg.style.width = "220px"
                }
                bwipjs.toCanvas(this.qrImg, params)
                resolve(true)
            }
        })

        return promise
    }

    /**
     * Очистка canvas
     */
    private clearCanvas = () => {
        const canvasContext = this.qrImg.getContext("2d")
        canvasContext?.clearRect(0, 0, this.qrImg.width, this.qrImg.height)
        this.qrImg.removeAttribute("style")
        this.qrImg.removeAttribute("width")
        this.qrImg.removeAttribute("height")
    }
}
