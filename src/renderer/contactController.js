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
//Открываем модалку о приложении
ipcRenderer.on("window:open-about", (event, aboutParams) => {
    new ContactController().updateContactTable(aboutParams);
});
class ContactController {
    constructor() {
        this.updateContactTable = (aboutParams) => {
            let title = "О приложении";
            let body = `<table class="table table-sm table-borderless contact-table">
              <tr>
                <td id="logoBlockContact">
                  <img src="images/icon128.png">
                </td>
              </tr>
              <tr>
                <td id="appNameContact">
                    ${aboutParams.name}
                </td>
              </tr>
              <tr>
                <td id="desctiptionContact">
                </td>
              </tr>
              <tr>
                <td id="versionContact">
                    ${aboutParams.version}
                </td>
              </tr>
              <tr>
                <td id="copyrightContact">
                    &#169; 2019 - ${new Date().getFullYear()}
                    <a href="#" id="personLink" targetLink="https://vk.com/subbotinalexeysergeevich">Aleksey Subbotin</a>
                </td>
              </tr>
            </table>`;
            let modal = new gp.MainModal(aboutParams.modalName, title, body, [], false);
            ipcRenderer.send("window:open-about-modal", modal);
        };
    }
}
