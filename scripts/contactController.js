// const electron = require("electron")
// const { ipcRenderer } = electron

// //Модалка about
// const aboutModal = $("#contactModal")
// //Блок с логотипом
// const logoBlockContact = $("#logoBlockContact")
// //Блок с названием приложения
// const appNameContact = $("#appNameContact")
// //Блок с описанием приложения
// const desctiptionContact = $("#desctiptionContact")
// //Блок с версией приложения
// const versionContact = $("#versionContact")
// //Блок с копирайтом
// const copyrightContact = $("#copyrightContact")
// //Ссылка на мою страницу
// let personLink

// //Открываем модалку о приложении
// ipcRenderer.on("window:open-about", (event, aboutParams) => {
//     aboutModal.modal("show")
//     updateContactTable(aboutParams)
// })
// const updateContactTable = (aboutParams) => {
//     appNameContact.html(aboutParams.name)
//     versionContact.html(aboutParams.version)
//     copyrightContact.html(aboutParams.copyright)

//     personLink = $("#personLink")
//     personLink.on("click", () => {
//         let stringUrl = personLink.attr("targetLink")
//         ipcRenderer.send("url:open-url", stringUrl)
//     })
// }
