const electron = require("electron")
const { ipcRenderer } = electron

//Модалка с историей
const historyModal = $("#historyModal")
//Список (ul), который содержит историю генерации
const historyListModal = $("#historyListModal")
//Кнопка закрытия модалки с историей
const closeHistorylBtn = $("#closeHistorylBtn")
//Кнопка очистки истории
const clearHistBtn = $("#clearHistBtn")
//Поле ввода поиска по истории
const searchInput = $("#history-search-input")

//Открытие модалки после получения запроса от главного процесса
ipcRenderer.on("window:open-history", (event, history) => {
    historyModal.modal("show")

    //Выведем историю генерации
    showHistoryList(history.reverse())
})

/**
 * Show history list from array
 * @param {array} history Array with generation history
 */
function showHistoryList(history) {
    //Если история пустая, диактивируем кнопку очистки
    if (history.length > 0)
        clearHistBtn.removeAttr("disabled")
    else
        clearHistBtn.attr("disabled", true)

    //Выведем весь список в ul
    history.forEach(element => {
        const li = document.createElement("li")
        const itemText = document.createTextNode(element)

        li.classList.add("list-group-item")

        li.appendChild(itemText)
        historyListModal[0].appendChild(li)
    })
}
closeHistorylBtn.on("click", () => {
    searchInput.val("")
})
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
    ipcRenderer.send("window:set-history", e.target.innerHTML)
})
searchInput.on("input", async (e) => {
    let isSearching
    if (!isSearching) {
        isSearching = true
        for (let i = 0; i < historyListModal[0].children.length; i++) {
            let str = historyListModal[0].children[i]

            if (!str.innerText.includes(searchInput.val()))
                str.style.display = "none"
            else
                str.style.display = ""
        }
        isSearching = false
    }
})