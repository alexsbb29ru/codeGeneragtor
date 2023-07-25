import { ipcRenderer } from "electron"

import * as gp from "./generalSettings"
import logo128 from "../../images/icon128.png"

export const openAboutModal = (aboutParams: gp.TAboutApp): gp.MainModal => {
    return updateContactTable(aboutParams)
}

//Создалим объект модалки и отправим его обратно для открытия
const updateContactTable = (aboutParams: gp.TAboutApp): gp.MainModal => {
    const title = "О приложении"
    const body = `<table class="table table-sm table-borderless contact-table">
              <tr>
                <td id="logoBlockContact">
                  <img src="${logo128}">
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

    const modal = new gp.MainModal(aboutParams.modalName, title, body, [])

    document.getElementById("mainModal")?.addEventListener(
        "show.bs.modal",
        () => {
            const personLink = document.getElementById("personLink")
            personLink?.addEventListener("click", () => {
                const url = personLink?.getAttribute("targetLink")
                ipcRenderer.send("url:open-url", url)
            })
        },
        { once: true }
    )

    return modal
}
