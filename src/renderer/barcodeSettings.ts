export type TCodeParams = {
    bcid: string
    text: string
    textfont?: string
    includetext?: boolean
    scale: number
    height?: number
    width?: number
    backgroundcolor: string
    textcolor?: string
    barcolor: string
    eclevel?: string
    eclevelList?: TQRCodeEclevels
    typeName: string
}
export type TBarcodeParams = {
    code128: TCodeParams
    qrcode: TCodeParams
    dataMatrix: TCodeParams
    general: TGeneralSettings
}

export type TQRCodeEclevels = {
    low: string
    medium: string
    quality: string
    high: string
}

export type TAppDataFiles = {
    savedDataFileName: string
    settingsFileName: string
    historyFileName: string
}

export type TCodeSymbolSettings = {
    currentLength: number
    maxLength: number
    minLength: number
}

export type TColorSettings = {
    background: string
    symbolsColor: string
    fontColor: string
}

export type TGeneralSettings = {
    copyImageToClipboard: boolean
    isDarkMode: boolean
    isCtrlEnter: boolean
    codeSymbolLength: TCodeSymbolSettings
    color: TColorSettings
    typeName: string
}

export const QRCodeEclevels: TQRCodeEclevels = {
    low: "L",
    medium: "M",
    quality: "Q",
    high: "H",
}

export class BarcodeSettings {
    private code128Params: TCodeParams = {
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
    }
    private qrcodeParams: TCodeParams = {
        bcid: "qrcode",
        text: "",
        scale: 10,
        eclevel: QRCodeEclevels.high,
        eclevelList: QRCodeEclevels,
        backgroundcolor: "FFFFFF",
        barcolor: "",
        typeName: "TCodeParams",
    }
    private dataMatrixParams: TCodeParams = {
        bcid: "datamatrix",
        text: "",
        scale: 10,
        backgroundcolor: "FFFFFF",
        barcolor: "",
        typeName: "TCodeParams",
    }
    private generalParams: TGeneralSettings = {
        copyImageToClipboard: false,
        isDarkMode: false,
        isCtrlEnter: true,
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
    }

    private barcodeTypes: TBarcodeParams = {
        code128: this.code128Params,
        qrcode: this.qrcodeParams,
        dataMatrix: this.dataMatrixParams,
        general: this.generalParams,
    }

    private appDataFiles: TAppDataFiles = {
        savedDataFileName: "savedData.txt",
        settingsFileName: "settings.txt",
        historyFileName: "history.txt",
    }

    constructor() {
        return
    }
    /**
     * Получение набора стандартных настроек ШК и QR-кодов
     * @returns Стандартный набор настроек для ШК и QR-кодов
     */
    getSettingsParams() {
        return this.barcodeTypes
    }
    /**
     * Получение списка с названиями файлов, хранящих данные приложения
     * @returns Список найзваний файлов с данными приложеия
     */
    getAppDataFiles() {
        return this.appDataFiles
    }
}
