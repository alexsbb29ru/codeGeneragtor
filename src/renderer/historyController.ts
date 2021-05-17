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
    private loadList: number
    private loadIncrement: number
    private scrolledHistory: Array<string>

    constructor(history: Array<string>) {
        this.history = history.reverse()
        this.loadList = 0
        this.loadIncrement = 15
        this.scrolledHistory = new Array<string>(...this.history)
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
            },
            { once: true }
        )
    }

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
