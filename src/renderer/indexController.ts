import electron, { App, IpcRenderer } from "electron"
const { clipboard, nativeImage } = electron
import path from "path"
import jetpack from "fs-jetpack"
import * as fs from "fs"
import barcode from "bwip-js"
import bootstrap from "bootstrap"
import * as bs from "./barcodeSettings"
import * as gp from "./generalSettings"
import { ObjectMapper as mapper } from "./objectMapper"

class IndexController {
    private ipcRender: IpcRenderer
    private appData: App
    //Img с отображаемым QR-кодом
    private qrImg: HTMLImageElement
    //Выпадающий список с типами ШК (128, QR)
    private typesSelect: HTMLSelectElement
    //Поле для ввода конвертируемого текста
    private inputText: HTMLInputElement
    //Поле, в котором выводится количество оставшихся символов
    private symbolCount: HTMLElement
    //Путь до папки с сохраненными изображениями
    private downloadFolderPath: string
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
    private alertTimerId: number = 0

    constructor() {
        this.ipcRender = window.require("electron").ipcRenderer
        this.appData = window.require("electron").remote.app

        this.qrImg = <HTMLImageElement>document.getElementById("qrOutput")
        this.typesSelect = <HTMLSelectElement>(
            document.getElementById("barcodeTypesSelect")
        )
        this.inputText = <HTMLInputElement>document.getElementById("qrTextForm")
        this.symbolCount = <HTMLElement>document.getElementById("symbolCount")
        this.downloadFolderPath = path.join(
            (electron.app || electron.remote.app).getPath("downloads"),
            "QR Downloads"
        )
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
            ;(<HTMLElement>(
                this.mainMoadlElement.querySelector(".modal-title")
            )).innerHTML = ""
            ;(<HTMLElement>(
                this.mainMoadlElement.querySelector(".modal-extended-header")
            )).innerHTML = ""
            ;(<HTMLElement>(
                this.mainMoadlElement.querySelector(".modal-body")
            )).innerHTML = ""
            let footer = <HTMLElement>(
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

        let tooltipTriggerList = [].slice.call(
            document
                .getElementById("main")
                ?.querySelectorAll('[data-bs-toggle="tooltip"]')
        )
        let tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
            return new bootstrap.Tooltip(tooltipTriggerEl)
        })
    }

    async init() {
        this.initBarcodeTypesSelect()
        this.getSettingsFromStorage()
        this.getSavedCodesFromStorage()
        this.getHistoryFromStorage(false)
        this.initIpcRenderers()
        this.initButtonsHandlers()
        this.loadFontToBarcode()
    }

    public initButtonsHandlers = () => {
        let savedCodesElement: HTMLSelectElement = <HTMLSelectElement>(
            document.getElementById("savedCodesSelect")
        )
        savedCodesElement.addEventListener("change", async () => {
            this.inputText.value = savedCodesElement.value
            this.inputText.dispatchEvent(new Event("change"))
            await this.generateCodesButtonsHandler()
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
            this.ipcRender.send(
                "window:prepare-settings-page",
                this.appSettings
            )
        })

        this.historyButton.addEventListener("click", async () => {
            await this.getHistoryFromStorage(true)
        })

        this.contactButton.addEventListener("click", () => {
            let aboutArgs: gp.TAboutApp
            aboutArgs = {
                modalName: gp.ModalTypes.about,
                name: "Генератор штрих-кодов",
                copyright: `&#169; 2019 - ${new Date().getFullYear()} 
  <a href="#" id="personLink" targetLink="https://vk.com/subbotinalexeysergeevich">Aleksey Subbotin</a>`,
                desctiption: "",
                version: "",
            }

            this.ipcRender.send("window:init-about", aboutArgs)
        })

        this.multiGenerateBtn.addEventListener("click", () => {
            this.ipcRender.send(
                "window:init-multi-gen",
                this.downloadFolderPath
            )
        })

        this.genQrButton.addEventListener("click", async () => {
            await this.generateCodesButtonsHandler()
        })

        //Генерация ШК нажатием ctrl + enter
        this.inputText.addEventListener("keydown", async (e) => {
            if (e.ctrlKey && e.key == "Enter")
                await this.generateCodesButtonsHandler()
        })

        window.addEventListener("keydown", (e) => {
            if (e.ctrlKey && e.code == "KeyS")
                if (!this.isModalShown())
                    this.saveButton.dispatchEvent(new Event("click"))
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
        })

        //Сохранение текста в "избранное"
        let saveQrTextButton: HTMLButtonElement = <HTMLButtonElement>(
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
        let removeSavedCodeBtn: HTMLButtonElement = <HTMLButtonElement>(
            document.getElementById("removeSavedQrBtn")
        )
        removeSavedCodeBtn.addEventListener("click", async () => {
            let code = savedCodesElement.value
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
            if (!this.qrImg.src) return

            let name = gp.ModalTypes.saveBarcode
            let title = "Введите имя файла без расширения"

            let body = `<input class="form-control modal-input" id="fileNameInput" type="text" placeholder="Введите имя файла">
            <span id="saveFolderPath" class="saveFolderPath">${this.downloadFolderPath}</span>`

            let dismissBtn = new gp.ModalButton(
                "denyFileNameBtn",
                "Отмена",
                "btn-secondary",
                () => {
                    let fileNameInput = <HTMLInputElement>(
                        document.getElementById("fileNameInput")
                    )
                    fileNameInput.value = ""
                },
                true
            )
            let okBtn = new gp.ModalButton(
                "confirmFileNameBtn",
                "ОК",
                "btn-primary",
                () => {
                    let fileNameInput = <HTMLInputElement>(
                        document.getElementById("fileNameInput")
                    )
                    if (!fileNameInput.value) return

                    this.mainModal.hide()
                    try {
                        let fileName =
                            this.removeCharacters(fileNameInput.value) + ".png"
                        let url = this.qrImg.src
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

            let modalObj = new gp.MainModal(
                name,
                title,
                body,
                new Array<gp.ModalButton>(dismissBtn, okBtn)
            )

            this.openModal(modalObj)

            let saveFolderPath = <HTMLSpanElement>(
                document.getElementById("saveFolderPath")
            )
            let fileNameInput = <HTMLInputElement>(
                document.getElementById("fileNameInput")
            )

            saveFolderPath.textContent = this.downloadFolderPath
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

        let allModals = document.querySelectorAll(".modal")
        allModals.forEach((modal) => {
            // modal.addEventListener("")
        })
    }
    /**
     * Инициализация всех IpcRenderer
     */
    public initIpcRenderers = () => {
        this.ipcRender.on(
            "window:open-multigen-modal",
            (_event: Event, modalObj: gp.MainModal) => {
                gp.setCurrentModal(gp.ModalTypes.multiGenerate)
                modalObj.name = gp.ModalTypes.multiGenerate
                this.openModal(modalObj)

                let spinner = document.createElement("div")
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
            }
        )
        //Обработаем запрос пакетной генерации
        this.ipcRender.on(
            "window:generate-codes",
            async (_event: Event, codesArr: string[]) => {
                await this.generateBarcode(codesArr)
            }
        )

        //Очистка истории
        this.ipcRender.on(
            "window:clear-history",
            (_event: Event, _args: any) => {
                this.mainModal.hide()
                //Очищаем массив с историей генерации
                this.historyCodes = new Array<string>()
                let fileName: string = new gp.GeneralParams().historyFileName
                //Записываем историю в файл
                let data = JSON.stringify(this.historyCodes)
                this.saveDataToLocalStorage(fileName, data)
            }
        )
        //Генерация текста, выбранного из истории
        this.ipcRender.on(
            "window:set-history",
            (_event: Event, historyText: string) => {
                this.mainModal.hide()
                let maxLength =
                    this.appSettings.general.codeSymbolLength.currentLength
                if (historyText.length > maxLength)
                    historyText = historyText.substring(0, maxLength)
                if (this.inputText.value != historyText) {
                    this.inputText.value = historyText
                    this.inputText.dispatchEvent(new Event("change"))
                    this.genQrButton.dispatchEvent(new Event("click"))
                }
            }
        )
        this.ipcRender.on(
            "window:open-history-modal",
            (_event: Event, modalObj: gp.MainModal) => {
                this.mainMoadlElement
                    .querySelector(".modal-dialog")
                    ?.classList.add("modal-dialog-scrollable")
                this.mainMoadlElement
                    .querySelector(".modal-dialog")
                    ?.classList.remove("modal-dialog-centered")
                this.openModal(modalObj)
            }
        )
        //Применение настроек и сохранение их в файл
        this.ipcRender.on(
            "window:change-settings",
            async (_event: Event, codeTypes: bs.TBarcodeParams) => {
                this.appSettings = codeTypes
                await this.saveSettingsToLocalStorage()
                this.changeColorTheme(this.appSettings.general.isDarkMode)
                this.changeMaxSymbolCount(
                    this.appSettings.general.codeSymbolLength.currentLength
                )
            }
        )
        //Открытие модалки настроек
        this.ipcRender.on(
            "window:open-settings-modal",
            (_event: Event, modalObj: gp.MainModal) => {
                modalObj.name = gp.ModalTypes.settings
                this.openModal(modalObj)
            }
        )
        this.ipcRender.on(
            "window:open-about-modal",
            (_event: Event, modalObj: gp.MainModal) => {
                this.openModal(modalObj)
            }
        )
    }
    /**
     * Получение списка типов кодов и добавление в Select
     */
    public initBarcodeTypesSelect = () => {
        //Получим типы ШК
        let barcodeTypes: string[] = Object.getOwnPropertyNames(
            this.appSettings
        )
        //Переберем все типы ШК, создадим элементы и закинем в select
        barcodeTypes.forEach((barcodeType) => {
            let objectBarcodeType = barcodeType as keyof bs.TBarcodeParams
            if (
                this.appSettings[objectBarcodeType].typeName !==
                this.appSettings.code128.typeName
            )
                return

            let option = new Option()
            let typeInd = barcodeTypes.indexOf(barcodeType)

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
        let filePath: string = new gp.GeneralParams().savedDataFileName
        //Получаем все сохраненные коды из файла
        let data: string = <string>await this.getDataFromStorage(filePath)
        if (data) {
            this.savedCodes = <Array<string>>JSON.parse(data)

            let savedCodesElement: HTMLSelectElement = <HTMLSelectElement>(
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
        let filePath: string = new gp.GeneralParams().settingsFileName
        //Получаем настройки из файла
        let data: string = <string>await this.getDataFromStorage(filePath)
        if (data) {
            let sourceData: bs.TBarcodeParams = JSON.parse(data)
            new mapper().map<bs.TBarcodeParams>(sourceData, this.appSettings)

            this.changeColorTheme(this.appSettings.general.isDarkMode)
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
        let filePath: string = new gp.GeneralParams().historyFileName
        //Получаем историю генерации из файла
        let data = await this.getDataFromStorage(filePath)

        if (data) {
            this.historyCodes = JSON.parse(data) as string[]
            if (openDialog)
                this.ipcRender.send(
                    "window:init-history-modal",
                    this.historyCodes
                )
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
            let img = nativeImage.createFromDataURL(this.qrImg.src)
            clipboard.writeImage(img)
            console.log("Image was generated")
        }, 100)
    }
    /**
     * Сохранение избранных данных в локальный файл
     */
    public saveCodesToLocalStorage = async () => {
        let fileName = this.generalParams.savedDataFileName
        let data = JSON.stringify(this.savedCodes)
        await this.saveDataToLocalStorage(fileName, data)
    }
    /**
     * Сохранение настроек в локальный файл
     */
    public saveSettingsToLocalStorage = async () => {
        let fileName = this.generalParams.settingsFileName
        let data = JSON.stringify(this.appSettings)

        await this.saveDataToLocalStorage(fileName, data)
    }

    /**
     * Создание файла с изображением
     * @param fileName Имя сохраняемого файла
     * @param url строка в формате Base64
     */
    public saveFileFunc = (fileName: string, url: string): void => {
        //Создадим директорию для сохранения файлов
        this.makeDir(this.downloadFolderPath)

        let pathToSave = path.join(this.downloadFolderPath, fileName)
        let base64Data = url.replace(/^data:image\/png;base64,/, "")

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
            if (err.code !== "EEXIST") throw err
        }
    }
    /**
     * Переключение тем приложения
     * @param isDarkMode выбрана темная тема?
     */
    private changeColorTheme = (isDarkMode: boolean) => {
        let themeStyle: HTMLLinkElement = <HTMLLinkElement>(
            document.getElementById("colorTheme")
        )
        if (isDarkMode) {
            themeStyle.href = new gp.GeneralParams().darkStyleLink
            document.body.classList.add("darkBody")
            document.body.classList.remove("lightBody")
        } else {
            themeStyle.href = new gp.GeneralParams().lightStyleLink
            document.body.classList.add("lightBody")
            document.body.classList.remove("darkBody")
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
        let remainingSymbCount =
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
        let modalTitle = <HTMLElement>(
            this.mainMoadlElement.querySelector(".modal-title")
        )
        //Элемент тела модалки
        let modalBody = <HTMLElement>(
            this.mainMoadlElement.querySelector(".modal-body")
        )
        //Подвал модалки, куда кидаем кнопки, если они будут
        let modalFooter = <HTMLElement>(
            this.mainMoadlElement.querySelector(".modal-footer")
        )

        let modalExtendedHeader = <HTMLElement>(
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
                let btn = document.createElement("button")
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
        let messageAlert = <HTMLElement>document.getElementById("messageAlert")

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
        let historyAlert = <HTMLElement>document.getElementById("historyAlert")
        this.hideAlert(historyAlert)
    }
    private showHistoryAlert = () => {
        let historyAlert = <HTMLElement>document.getElementById("historyAlert")
        this.showAlert(historyAlert)
    }
    private historyAlertIsShown = (): boolean => {
        let historyAlert = <HTMLElement>document.getElementById("historyAlert")
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
        let historyAlert = <HTMLElement>document.getElementById("historyAlert")
        //Сохраняем новый массив с кодами, используя Set, чтобы были убраны дубликаты
        let historyArr: Array<string> = [...new Set(this.historyCodes)]
        let historyListAlert = <HTMLElement>(
            document.getElementById("historyListAlert")
        )
        //Отступы сверху и снизу (костыль)
        let topBottomHeight: number = 10
        //Принимаем за высоту одной строки, чтобы указать высоту всплывающего блока
        let stringHeight: number = 25
        //Счетчик количества отображаемых кодов
        let counter: number = 0
        //Флаг, указывающий, что происходит поиск. Возможно, понадобится, когда история будет большая
        let isSearching: boolean = false

        //Очищаем содержимое всплывашки
        historyListAlert.innerHTML = ""
        //Инвертируем массив, чтобы недавние данные были первыми
        historyArr.reverse()

        if (!isSearching && this.inputText.value) {
            isSearching = true

            for (let i = 0; i < historyArr.length; i++) {
                let str = historyArr[i]

                //Если всплывашка скрыта, откроем ее
                if (str.includes(this.inputText.value)) {
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

    //----------------------------------------------Generator settings region----------------------------------------

    private loadFontToBarcode = () => {
        barcode.loadFont(
            "PT-Sans",
            100,
            fs.readFileSync(
                require("path").resolve(this.appData.getAppPath()) +
                    "/fonts/PTSans-Regular.ttf",
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

            let data = JSON.stringify(this.historyCodes)
            //Записываем историю в файл
            await this.saveDataToLocalStorage(
                this.generalParams.historyFileName,
                data
            )

            //Генерируем введенный текст
            this.generateBarcode(this.inputText.value, this.saveImageToBuffer)
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
        callback?: Function
    ) => {
        //Получим выбранный тип ШК из выпадающего списка
        let type = this.typesSelect.value as keyof bs.TBarcodeParams
        //Получаем параметры для выбранного типа ШК из настроек приложения
        let params: bs.TCodeParams = <bs.TCodeParams>this.appSettings[type]

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
            for (let code of text) {
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
        let promise = new Promise((resolve, reject) => {
            //Сгенерируем изображение
            barcode.toBuffer(params, (err, png) => {
                if (err) console.log(err)
                else {
                    //Конвертируем изображение в строку Base64 для дальнейшего отображения и сохранения
                    let imageSrc: string =
                        "data:image/png;base64," + png.toString("base64")
                    //Если множественная генерация, то сохраним файл в директорию для сохраненных изображений
                    if (isMulty) {
                        let fileName =
                            this.removeCharacters(params.text) + ".png"

                        this.saveFileFunc(fileName, imageSrc)
                        resolve(true)
                    } else {
                        //Выведем изображение на экран с дополнительными отступами
                        //Отступы нужны для нормального сканированя ТСД с темной темой приложения
                        this.qrImg.src = imageSrc
                        this.qrImg.style.padding = "10px"
                        this.qrImg.style.background =
                            this.appSettings.general.color.background

                        //Чуток подправим отображение линейного ШК
                        if (params.bcid == this.appSettings.code128.bcid) {
                            this.qrImg.height = 150
                            this.qrImg.width = this.qrImg.height * 1.67
                        } else {
                            this.qrImg.height = 220
                            this.qrImg.width = 220
                        }

                        resolve(true)
                    }
                }
            })
        })

        await promise
    }
}

new IndexController().init()
