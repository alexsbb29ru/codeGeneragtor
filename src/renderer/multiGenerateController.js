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
//Обработаем вызов и откроем модалку
ipcRenderer.on("window:init-multi-gen", (event, folderPath) => {
    let multiGen = new MultiGenerate(folderPath);
    multiGen.initModal();
});
class MultiGenerate {
    constructor(folderPath) {
        this.folderPath = folderPath;
    }
    initModal() {
        var _a;
        let title = "Множественная генерация";
        let body = `<div class="form-floating">
              <textarea class="form-control" name="multiGenerateTextBlock" id="multiGenerateTextBlock"
                placeholder="Введите данные через ;"></textarea>
              <label for="multiGenerateTextBlock">Введите данные через ;</label>
            </div>
            <span id="generagteFolderPath" class="saveFolderPath">${this.folderPath}</span>`;
        let generateBtn = new gp.ModalButton("confirmMultiGenBtn", "Сгенерировать", "btn-primary", null, false);
        let buttons = new Array(generateBtn);
        let modal = new gp.MainModal("", title, body, buttons);
        ipcRenderer.send("window:open-multigen-modal", modal);
        (_a = document.getElementById("mainModal")) === null || _a === void 0 ? void 0 : _a.addEventListener("show.bs.modal", () => {
            if (gp.getCurrentModal() === gp.ModalTypes.multiGenerate)
                this.initHandlers();
        }, { once: true });
    }
    initHandlers() {
        let confirmMultiGenBtn = (document.getElementById("confirmMultiGenBtn"));
        confirmMultiGenBtn.addEventListener("click", () => {
            let multiGenerateTextBlock = (document.getElementById("multiGenerateTextBlock"));
            //Распарсим текст по разделителю и отправим его дальше для генерации
            let codesArr = multiGenerateTextBlock.value
                .trim()
                .replace(/(\r\n|\n|\r)/gm, "")
                .split(";");
            codesArr.forEach((code, index) => {
                if (!code)
                    codesArr.splice(index, 1);
            });
            if (codesArr.length > 0) {
                let spinner = (document.getElementById("generateFilesSpinner"));
                if (spinner.style.display === "none")
                    spinner.style.display = "block";
                ipcRenderer.send("window:generate-codes", codesArr);
            }
        });
    }
}
