const electron = require("electron")
const { ipcRenderer } = electron

//Модалка пакетной генерации
let multiGenModal = $("#multiGenModal")
//Текстовый блок, куда вводятся раздельные части текста
let multiGenerateTextBlock = $("#multiGenerateTextBlock")
//Кнопка подтверждения генерации
let confirmMultiGenBtn = $("#confirmMultiGenBtn")
//Спиннер загрузки
let generateFilesSpinner = $("#generateFilesSpinner")

//Обработаем вызов и откроем модалку
ipcRenderer.on("window:open-multi-gen", () => {
	multiGenModal.modal("show")
})
//Обработаем закрытие модалки
multiGenModal.on("hidden.bs.modal", () => {
	//Очистим поле с текстом
	multiGenerateTextBlock.val("")
})

//Обработаем генерацию
confirmMultiGenBtn.on("click", () => {
	//Распарсим текст по разделителю и отправим его дальше для генерации
	let codesArr = multiGenerateTextBlock.val().trim().split(";")
	if (codesArr.length > 0) {
		if (!generateFilesSpinner.is(":visible")) generateFilesSpinner.show()
		ipcRenderer.send("window:generate-codes", codesArr)
	}
})
