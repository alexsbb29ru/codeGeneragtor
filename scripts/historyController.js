const electron = require("electron")
const { ipcRenderer } = electron

//Модалка с историей
const historyModal = $("#historyModal")
//Тело модалки
const historyModalBody = $("#historyModalBody")
//Список (ul), который содержит историю генерации
const historyListModal = $("#historyListModal")
//Кнопка закрытия модалки с историей
const closeHistorylBtn = $("#closeHistorylBtn")
//Кнопка очистки истории
const clearHistBtn = $("#clearHistBtn")
//Поле ввода поиска по истории
const searchInput = $("#history-search-input")
//Количество выведенных данных
let loadList
//Количество подргужаемых данных
let loadIncrement
//Массив с историей, который надо скроллить
let scrolledHistory

//Открытие модалки после получения запроса от главного процесса
ipcRenderer.on("window:open-history", (event, history) => {
	initHistoryParams()

	history.reverse()
	historyModal.modal("show")
	scrolledHistory = new Array(...history)

	showHistoryList(scrolledHistory)
	//Обработчик ввода в поле поиска по истории
	searchInput.on("input", async (e) => {
		let isSearching
		if (!searchInput.val()) {
			historyListModal[0].innerHTML = ""

			initHistoryParams()
			showHistoryList(history)
		}
		if (!isSearching) {
			isSearching = true
			historyListModal[0].innerHTML = ""

			initHistoryParams()

			history.forEach((str) => {
				if (str.includes(searchInput.val())) scrolledHistory.push(str)
			})
			showHistoryList(scrolledHistory)
			isSearching = false
		}
	})

	historyModal.on("shown.bs.modal", function (e) {
		if (
			historyModalBody.height() >= historyListModal.height() &&
			loadList < scrolledHistory.length
		)
			showHistoryList(scrolledHistory)
	})
})

/**
 * Show history list from array
 * @param {array} history Array with generation history
 */
function showHistoryList(history) {
	//Если история пустая, диактивируем кнопку очистки
	if (history.length > 0) clearHistBtn.removeAttr("disabled")
	else clearHistBtn.attr("disabled", true)

	//Выводим историю в динамический список
	if (history.length - loadList > 0) {
		let inc = 0
		if (history.length - loadList < loadIncrement) inc = history.length - loadList
		else inc = loadIncrement

		for (let i = loadList; i < loadList + inc; i++) {
			let element = history[i]

			const li = document.createElement("li")
			const itemText = document.createTextNode(element)

			li.classList.add("list-group-item")

			li.appendChild(itemText)
			historyListModal[0].appendChild(li)
		}
		loadList += inc
	}
}
closeHistorylBtn.on("click", () => {
	searchInput.val("")
})

function initHistoryParams() {
	loadList = 0
	loadIncrement = 15
	scrolledHistory = new Array()
}
//Очищаем историю
clearHistBtn.on("click", () => {
	closeHistorylBtn.trigger("click")
	ipcRenderer.send("window:clear-history")
})

//Обработка двойного нажатия на пункте истории.
historyListModal.on("dblclick", (e) => {
	//Закроем модалку
	closeHistorylBtn.trigger("click")
	//Отправим выбранный пункт в другой контроллер (indexController)
	ipcRenderer.send("window:set-history", e.target.innerText)
})

historyModalBody.on("scroll", (e) => {
	if (scrolledHistory.length - loadList > 0) {
		let windowRelativeBottom = historyListModal[0].getBoundingClientRect().bottom
		let clientHeight = historyModalBody[0].clientHeight

		// если пользователь прокрутил достаточно далеко (< 100px до конца)
		if (windowRelativeBottom <= clientHeight + 100)
			//Выведем историю генерации
			showHistoryList(scrolledHistory)
	}
})
