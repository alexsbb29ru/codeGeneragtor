import * as gp from "./generalSettings"
import { indexController } from "./renderer"

export const initHistoryModal = (history: Array<string>) => {
    const historyCont = new HistoryController(history)
    return historyCont.initHistoryModal()
}

class HistoryController {
    private history: Array<string>
    private loadList = 0
    private loadIncrement = 0
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
        const title = "История"
        const extendedHeader = `<input type="text" placeholder="Поиск" class="form-control modal-input" id="history-search-input">`
        const body = `<ul class="list-group list-group-flush" id="historyListModal"></ul>`
        const clearBtn = new gp.ModalButton(
            "clearHistBtn",
            "Очистить",
            "btn-danger",
            () => {
                return
            },
            false
        )
        const buttons = new Array<gp.ModalButton>(clearBtn)

        const modal = new gp.MainModal(
            gp.ModalTypes.history,
            title,
            body,
            buttons,
            extendedHeader
        )

        const mainModal = <HTMLElement>document.getElementById("mainModal")
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
                const modalBody = <HTMLElement>(
                    mainModal.querySelector(".modal-body")
                )
                const historyList = <HTMLUListElement>(
                    document.getElementById("historyListModal")
                )
                if (
                    modalBody.clientHeight >= historyList.clientHeight &&
                    this.loadList < this.scrolledHistory.length
                ) {
                    this.showHistoryList(this.scrolledHistory)
                }

                const clearHistBtn = <HTMLButtonElement>(
                    document.getElementById("clearHistBtn")
                )
                //!Навесим обработчики на элементы модалки
                //Очистка истории при нажатии на кнопку
                clearHistBtn.addEventListener("click", () => {
                    indexController.clearHistory()
                })

                //Обработка двойного нажатия на пункте истории.
                const historyListModal = <HTMLUListElement>(
                    document.getElementById("historyListModal")
                )
                historyListModal.addEventListener("dblclick", (e) => {
                    //Отправим выбранный пункт в другой контроллер (indexController)

                    const selectedText = (<HTMLLIElement>e.target).innerText
                    indexController.setHistoryToInput(selectedText)
                })

                //Сделаем подгрузку данных при скролле
                const historyModalBody = <HTMLElement>(
                    mainModal.querySelector(".modal-body")
                )
                historyModalBody.addEventListener("scroll", () => {
                    if (this.scrolledHistory.length - this.loadList > 0) {
                        const windowRelativeBottom =
                            historyListModal.getBoundingClientRect().bottom
                        const clientHeight = historyModalBody.clientHeight

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
                const searchInput = <HTMLInputElement>(
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
                            if (
                                str
                                    .toLowerCase()
                                    .includes(searchInput.value.toLowerCase())
                            )
                                this.scrolledHistory.push(str)
                        })
                        this.showHistoryList(this.scrolledHistory)
                        isSearching = false
                    }
                })
            },
            { once: true }
        )

        return modal
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
                const element = history[i]

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
