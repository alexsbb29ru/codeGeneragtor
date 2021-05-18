import electron from "electron"
const { ipcRenderer } = electron
import bootstrap from "bootstrap"
import * as bs from "./barcodeSettings"
import * as gp from "./generalSettings"

ipcRenderer.on(
    "window:init-history-modal",
    (_event: Event, history: Array<string>) => {
        let historyCont = new HistoryController(history)
        historyCont.initHistoryModal()
    }
)

class HistoryController {
    private history: Array<string>
    private loadList: number = 0
    private loadIncrement: number = 0
    private scrolledHistory: Array<string>

    constructor(history: Array<string>) {
        this.history = history.reverse()
        this.initHistoryParams()
        this.scrolledHistory = new Array<string>(...this.history)
    }
    private initHistoryParams() {
        this.loadList = 0
        this.loadIncrement = 15
        this.scrolledHistory = new Array<string>()
    }
    public initHistoryModal() {
        let title: string = "История"
        let extendedHeader: string = `<input type="text" placeholder="Поиск" class="form-control modal-input" id="history-search-input">`
        let body: string = `<ul class="list-group list-group-flush" id="historyListModal"></ul>`
        let clearBtn = new gp.ModalButton(
            "clearHistBtn",
            "Очистить",
            "c-btn-outline-danger",
            null,
            false
        )
        let buttons = new Array<gp.ModalButton>(clearBtn)

        let modal = new gp.MainModal(
            gp.ModalTypes.history,
            title,
            body,
            buttons,
            extendedHeader
        )

        ipcRenderer.send("window:open-history-modal", modal)

        let mainModal = <HTMLElement>document.getElementById("mainModal")
        //Во время открытия модалки загружаем в нее данные
        mainModal.addEventListener(
            "show.bs.modal",
            () => {
                if (gp.getCurrentModal() !== gp.ModalTypes.history) return
                this.showHistoryList(this.scrolledHistory)
            },
            { once: true }
        )
        //После открытия модалки, проверяем высоты элементов,
        //чтобы вывести дополнительные данные, если потребуется
        mainModal.addEventListener(
            "shown.bs.modal",
            () => {
                if (gp.getCurrentModal() !== gp.ModalTypes.history) return
                let modalBody = <HTMLElement>(
                    mainModal.querySelector(".modal-body")
                )
                let historyList = <HTMLUListElement>(
                    document.getElementById("historyListModal")
                )
                if (
                    modalBody.clientHeight >= historyList.clientHeight &&
                    this.loadList < this.scrolledHistory.length
                ) {
                    this.showHistoryList(this.scrolledHistory)
                }

                let clearHistBtn = <HTMLButtonElement>(
                    document.getElementById("clearHistBtn")
                )
                //!Навесим обработчики на элементы модалки
                //Очистка истории при нажатии на кнопку
                clearHistBtn.addEventListener("click", () => {
                    ipcRenderer.send("window:clear-history")
                })

                //Обработка двойного нажатия на пункте истории.
                let historyListModal = <HTMLUListElement>(
                    document.getElementById("historyListModal")
                )
                historyListModal.addEventListener("dblclick", (e) => {
                    //Отправим выбранный пункт в другой контроллер (indexController)
                    ipcRenderer.send(
                        "window:set-history",
                        (<HTMLLIElement>e.target).innerText
                    )
                })

                //Сделаем подгрузку данных при скролле
                let historyModalBody = <HTMLElement>(
                    mainModal.querySelector(".modal-body")
                )
                historyModalBody.addEventListener("scroll", (e) => {
                    if (this.scrolledHistory.length - this.loadList > 0) {
                        let windowRelativeBottom =
                            historyListModal.getBoundingClientRect().bottom
                        let clientHeight = historyModalBody.clientHeight

                        // если пользователь прокрутил достаточно далеко (< 100px до конца)
                        if (
                            windowRelativeBottom <= clientHeight + 150 &&
                            windowRelativeBottom !== 0
                        )
                            //Выведем историю генерации
                            this.showHistoryList(this.scrolledHistory)
                    }
                })
                //Обработчик ввода в поисковое поле
                let searchInput = <HTMLInputElement>(
                    document.getElementById("history-search-input")
                )
                searchInput.addEventListener("input", () => {
                    let isSearching = false
                    if (!searchInput.value) {
                        historyListModal.innerHTML = ""
                        this.initHistoryParams()
                        this.showHistoryList(this.history)
                    }
                    if (!isSearching) {
                        isSearching = true
                        historyListModal.innerHTML = ""

                        this.initHistoryParams()

                        this.history.forEach((str) => {
                            if (str.includes(searchInput.value))
                                this.scrolledHistory.push(str)
                        })
                        this.showHistoryList(this.scrolledHistory)
                        isSearching = false
                    }
                })
            },
            { once: true }
        )
    }
    /**
     * Вывод истории генерации
     * @param history Массив с историей генерации
     */
    private showHistoryList(history: Array<string>) {
        //Если история пустая, диактивируем кнопку очистки
        if (history.length === 0)
            document
                .getElementById("clearHistBtn")
                ?.setAttribute("disabled", "true")
        else
            document.getElementById("clearHistBtn")?.removeAttribute("disabled")

        //Выводим историю в динамический список
        if (history.length - this.loadList > 0) {
            let inc = 0
            if (history.length - this.loadList < this.loadIncrement)
                inc = history.length - this.loadList
            else inc = this.loadIncrement

            for (let i = this.loadList; i < this.loadList + inc; i++) {
                let element = history[i]

                const li = document.createElement("li")
                const itemText = document.createTextNode(element)

                li.classList.add("list-group-item")

                li.appendChild(itemText)
                document.getElementById("historyListModal")?.appendChild(li)
            }
            this.loadList += inc
        }
    }
}
