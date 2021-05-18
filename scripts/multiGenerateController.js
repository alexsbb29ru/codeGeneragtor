// const electron = require("electron")
// const { ipcRenderer } = electron

// //Модалка пакетной генерации
// let multiGenModal = $("#multiGenModal")
// //Текстовый блок, куда вводятся раздельные части текста
// let multiGenerateTextBlock = $("#multiGenerateTextBlock")
// //Кнопка подтверждения генерации
// let confirmMultiGenBtn = $("#confirmMultiGenBtn")
// //Спиннер загрузки
// let generateFilesSpinner = $("#generateFilesSpinner")
// //Папка с сохраненными кодами
// let generagteFolderPath = $("#generagteFolderPath")

// //Обработаем вызов и откроем модалку
// ipcRenderer.on("window:open-multi-gen", (event, folderPath) => {
// 	multiGenModal.modal("show")
// 	generagteFolderPath.html(`Папка с сохрененными файлами: ${folderPath}`)
// })
// //Обработаем закрытие модалки
// multiGenModal.on("hidden.bs.modal", () => {
// 	//Очистим поле с текстом
// 	multiGenerateTextBlock.val("")
// })

// //Обработаем генерацию
// confirmMultiGenBtn.on("click", () => {
// 	//Распарсим текст по разделителю и отправим его дальше для генерации
// 	let codesArr = multiGenerateTextBlock.val().trim().split(";")
// 	codesArr.forEach((code, index) => {
// 		if (!code) codesArr.splice(index, 1)
// 	})
// 	if (codesArr.length > 0) {
// 		if (!generateFilesSpinner.is(":visible")) generateFilesSpinner.show()
// 		ipcRenderer.send("window:generate-codes", codesArr)
// 	}
// })
