"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BarcodeSettings = void 0;
class BarcodeSettings {
    constructor() {
        this.code128Params = {
            bcid: "code128",
            text: "",
            textfont: "PT-Sans",
            includetext: false,
            scale: 10,
            height: 15,
            width: 30,
            backgroundcolor: "FFFFFF",
            textcolor: "",
            barcolor: "",
            typeName: "TCodeParams",
        };
        this.qrcodeParams = {
            bcid: "qrcode",
            text: "",
            scale: 10,
            eclevel: "H",
            backgroundcolor: "FFFFFF",
            barcolor: "",
            typeName: "TCodeParams",
        };
        this.generalParams = {
            copyImageToClipboard: false,
            isDarkMode: false,
            codeSymbolLength: {
                currentLength: 100,
                maxLength: 150,
                minLength: 1,
            },
            color: {
                background: "#FFFFFF",
                fontColor: "#000000",
                symbolsColor: "#000000",
            },
            typeName: "TGeneralSettings",
        };
        this.barcodeTypes = {
            code128: this.code128Params,
            qrcode: this.qrcodeParams,
            general: this.generalParams,
        };
        this.appDataFiles = {
            savedDataFileName: "savedData.txt",
            settingsFileName: "settings.txt",
            historyFileName: "history.txt",
        };
    }
    /**
     * Получение набора стандартных настроек ШК и QR-кодов
     * @returns Стандартный набор настроек для ШК и QR-кодов
     */
    getSettingsParams() {
        return this.barcodeTypes;
    }
    /**
     * Получение списка с названиями файлов, хранящих данные приложения
     * @returns Список найзваний файлов с данными приложеия
     */
    getAppDataFiles() {
        return this.appDataFiles;
    }
}
exports.BarcodeSettings = BarcodeSettings;
