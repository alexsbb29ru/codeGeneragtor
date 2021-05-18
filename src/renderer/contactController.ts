import electron, { IpcRenderer } from "electron"
const { ipcRenderer } = electron

import * as gp from "./generalSettings"

//Обработаем обращение
ipcRenderer.on("window:init-about", (event, aboutParams) => {
    new ContactController().updateContactTable(aboutParams)
})
class ContactController {
    constructor() {}

    //Создалим объект модалки и отправим его обратно для открытия
    public updateContactTable = (aboutParams: gp.TAboutApp) => {
        let title = "О приложении"
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
            </table>`

        let modal = new gp.MainModal(aboutParams.modalName, title, body, [])
        ipcRenderer.send("window:open-about-modal", modal)

        document.getElementById("mainModal")?.addEventListener(
            "show.bs.modal",
            () => {
                let personLink = document.getElementById("personLink")
                personLink?.addEventListener("click", () => {
                    let url = personLink?.getAttribute("targetLink")
                    ipcRenderer.send("url:open-url", url)
                })
            },
            { once: true }
        )
    }
}
