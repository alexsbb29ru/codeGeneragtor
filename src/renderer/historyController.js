"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = __importDefault(require("electron"));
const { ipcRenderer } = electron_1.default;
const gp = __importStar(require("./generalSettings"));
ipcRenderer.on("window:init-history-modal", (_event, history) => {
    let historyCont = new HistoryController(history);
    historyCont.initHistoryModal();
});
class HistoryController {
    constructor(history) {
        this.history = history.reverse();
        this.loadList = 0;
        this.loadIncrement = 15;
        this.scrolledHistory = new Array(...this.history);
    }
    initHistoryModal() {
        let title = "История";
        let extendedHeader = `<input type="text" placeholder="Поиск" class="form-control modal-input" id="history-search-input">`;
        let body = `<ul class="list-group list-group-flush" id="historyListModal"></ul>`;
        let clearBtn = new gp.ModalButton("clearHistBtn", "Очистить", "c-btn-outline-danger", null, false);
        let buttons = new Array(clearBtn);
        let modal = new gp.MainModal(gp.ModalTypes.history, title, body, buttons, extendedHeader);
        ipcRenderer.send("window:open-history-modal", modal);
        let mainModal = document.getElementById("mainModal");
        mainModal.addEventListener("shown.bs.modal", () => {
            if (gp.getCurrentModal() !== gp.ModalTypes.history)
                return;
            let modalBody = (mainModal.querySelector(".modal-body"));
            let historyList = (document.getElementById("historyListModal"));
            if (modalBody.clientHeight >= historyList.clientHeight &&
                this.loadList < this.scrolledHistory.length) {
                this.showHistoryList(this.scrolledHistory);
            }
        }, { once: true });
    }
    showHistoryList(history) {
        var _a, _b, _c;
        //Если история пустая, диактивируем кнопку очистки
        if (history.length === 0)
            (_a = document
                .getElementById("clearHistBtn")) === null || _a === void 0 ? void 0 : _a.setAttribute("disabled", "true");
        else
            (_b = document.getElementById("clearHistBtn")) === null || _b === void 0 ? void 0 : _b.removeAttribute("disabled");
        //Выводим историю в динамический список
        if (history.length - this.loadList > 0) {
            let inc = 0;
            if (history.length - this.loadList < this.loadIncrement)
                inc = history.length - this.loadList;
            else
                inc = this.loadIncrement;
            for (let i = this.loadList; i < this.loadList + inc; i++) {
                let element = history[i];
                const li = document.createElement("li");
                const itemText = document.createTextNode(element);
                li.classList.add("list-group-item");
                li.appendChild(itemText);
                (_c = document.getElementById("historyListModal")) === null || _c === void 0 ? void 0 : _c.appendChild(li);
            }
            this.loadList += inc;
        }
    }
}
