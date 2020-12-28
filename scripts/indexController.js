
//----------------------- Main settings --------------------------------
const electron = require("electron")
const { ipcRenderer, clipboard, nativeImage } = electron
const path = require("path")
const jetpack = require("fs-jetpack")
const fs = require("fs")
const barcode = require("bwip-js")


//----------------------- Visual elements --------------------------------
//Img с отображаемым QR-кодом
const qrImg = document.getElementById("qrOutput")
//Выпадающий список с типами ШК (128, QR)
const typesSelect = document.getElementById("barcodeTypesSelect")
//Поле для ввода конвертируемого текста
const inputText = $("#qrTextForm")
//Вылетающий блок с сообщением об успешной операции или ошибкой
const successAlert = $("#successAlert")
//всплывающий список с подходящими кодами из истории
const historyAlert = $("#historyAlert")
//Поле, в котором выводится количество оставшихся символов
const symbolCount = $("#symbolCount")
//Кнока "Сгенерировать" ШК
const genQrButton = $("#genQrButton")
//Кнопка для вызова окна настроек
const settingsButton = $("#settingsButton")
//Кнопка вызова окна с историей
const historyButton = $("#historyButton")
//Кнопка вызова окна about
const contactButton = $("#contactButton")
//Кнопка вызова модалки для сохранения сгенерированного кода в изображение
const saveButton = $("#saveQrImgButton")
//Модалка с вводом имени для сохранения сгенерированного кода в изображение
const qrCodeNameModal = $("#qrCodeNameModal")
//Ссылка на стиль с темной темой
const darkStyleLink = "./css/darkTheme.css"
//Ссылка на стиль со светлой темой
const lightStyleLink = "./css/lightTheme.css"
//------------------------------------------------------------------------

//Папка загрузок
let downloadFolder = ""
//Файл, в котором содержатся "избранные" коды
const savedDataFileName = "savedData.txt"
//Файл, в котором содержатся настроки
const settingsFileName = "settings.txt"
//Файл с историей вводимыого текста
const historyFileName = "history.txt"
//Массив с избранными кодами
let savedCodes = []
//Массив с историей текстов
let historyCodes = []

//Типы ШК и их начальные настройки
let barcodeTypes = {
  code128: {
    bcid: "code128",
    text: "",
    textfont: "PT-Sans",
    includetext: false,
    scale: 10,
    height: 15,
    width: 30,
    backgroundcolor: "FFFFFF",
    textcolor: "",
    barcolor: ""
  },
  qrcode: {
    bcid: "qrcode",
    text: "",
    scale: 10,
    eclevel: "H",
    backgroundcolor: "FFFFFF",
    barcolor: ""
  }
}

//Изменяемые настройки приложения, включая настройки ШК
let settingsBlock = {
  code128: {
    bcid: "code128",
    includetext: false,
    backgroundcolor: "FFFFFF",
    textcolor: "",
    barcolor: ""
  },
  qrcode: {
    bcid: "qrcode",
    eclevel: "H",
    backgroundcolor: "FFFFFF",
    barcolor: ""
  },
  general: {
    copyImageToClipboard: {
      isCopy: false,
    },
    isDarkMode: false,
    codeSymbolLength: {
      currentLength: 100,
      maxLength: 150,
      minLength: 1
    },
    colors: {
      background: "#FFFFFF",
      symbolsColor: "#000000",
      fontColor: "#000000"
    }
  }
}
//Информация о приложении
let aboutArgs = {
  name: "",
  version: "",
  desctiption: "",
  copyright: ""
}

//Hide alert block on start
successAlert.hide()
historyAlert.hide()
//Init barcode types
initBarcodeTypesSelect()

//Get saved codes and push them to array
getSavedCodesFromStorage(savedDataFileName)

//Get saved settings
getSettingsFromStorage(settingsFileName)

//Get history
getHistoryFromStorage(historyFileName, false)

//Load own font
loadFontToBarcode()

//Bind function to button to generate QR-code 
genQrButton.on("click", async () => {
  if (inputText.val()) {
    drawFlag = true
    await getHistoryFromStorage(historyFileName, false)

    //Добавляем код в историю запросов
    if (historyCodes[historyCodes.length - 1] != inputText.val())
      historyCodes.push(inputText.val())
    //Записываем историю в файл
    await saveDataToLocalStorage(historyFileName, historyCodes)
    //Генерируем введенный текст
    generateBarcode(inputText.val(), saveImageToBuffer)
  }
  else {
    drawFlag = false
  }
  //При генерации скроем всплывашку с историей кодов
  if (historyAlert.is(":visible"))
    hideHistoryAlert()
})

//Generating qr-code by keydown ctrl + enter
inputText.on("keydown", function (e) {
  if (e.ctrlKey && e.key == "Enter")
    genQrButton.trigger("click")
})

//Open modal by ctrl + s
window.onkeydown = (e) => {
  if (!$(".modal").is(":visible")) {
    if (e.ctrlKey && e.code == "KeyS")
      saveButton.trigger("click")
  }
  //При нажатии Escape скрываем всплываху
  if (e.code == "Escape" && historyAlert.is(":visible"))
    hideHistoryAlert()
}
//При кликах вне текстового поля и всплывашки, скроем предложенные коды из истории
window.onclick = (e) => {
  if (!e.target.attributes["histListFlag"]
    && historyAlert.is(":visible"))
    hideHistoryAlert()
}
//Saving image by enter
qrCodeNameModal.on("keydown", (e) => {
  if (e.key == "Enter")
    $("#confirmFileName").trigger("click")
})

//Save text to select control
$("#saveQrTextButton").on("click", async () => {
  if (!inputText.val()) return
  let select = document.getElementById("savedCodesSelect")
  //Проверка на содержание текста в списке
  if (select.innerHTML.indexOf("value='" + inputText.val() + "'") > -1) {
    showAlert("Код уже содержится в избранном")
  }
  else {
    savedCodes.push(inputText.val())
    await saveCodesToLocalStorage()
    showAlert("Код успешно сохранен в избранном")
    $("#savedCodesSelect").append(new Option(inputText.val(), inputText.val()))
  }
})
function loadFontToBarcode() {
  barcode.loadFont("PT-Sans", 100,
    fs.readFileSync(require('path').resolve(__dirname, '..') + "/fonts/PTSans-Regular.ttf", "binary"))
}
/**
 * Save image to buffer
 */
function saveImageToBuffer() {
  if (!settingsBlock.general.copyImageToClipboard.isCopy)
    return false

  //! Костыль. Почему-то не копируется текущее изображение буфер
  setTimeout(() => {
    let img = nativeImage.createFromDataURL(qrImg.src)
    clipboard.writeImage(img)
    console.log("Image downloaded")
  }, 100)
}
/**
 * Save code to local storage
 */
async function saveCodesToLocalStorage() {
  await saveDataToLocalStorage(savedDataFileName, savedCodes)
}
/**
 * 
 * @param {string} fileName Name of file with data
 * @param {any} saveData Data for saving
 */
async function saveDataToLocalStorage(fileName, saveData) {
  let savingData = JSON.stringify(saveData)

  await jetpack.writeAsync(fileName, savingData)
}

/**
 * Save settings to local storage
 */
async function saveSettingsToLocalStorage() {
  await saveDataToLocalStorage(settingsFileName, settingsBlock)
}

/**
 * Get settings from local storage
 * @param {string} filename Name of local settings file
 */
async function getSettingsFromStorage(filename) {
  await getDataFromStorage(filename, function (data) {
    //settingsBlock = JSON.parse(data)
    if (!data)
      data = JSON.stringify(settingsBlock)

    let sourceData = JSON.parse(data)
    objectMapper(sourceData, settingsBlock)
    changeColorTheme(settingsBlock.general.isDarkMode)
    changeMaxSymbolCount(settingsBlock.general.codeSymbolLength.currentLength)
  })
}
/**
 * Get history from storage
 * @param {string} filename Name of history file in storage
 */
async function getHistoryFromStorage(filename, openDialog) {
  await getDataFromStorage(filename, function (data) {
    $("#historyListModal").html("")
    if (!data)
      data = JSON.stringify(historyCodes)
    historyCodes = JSON.parse(data)

    if (openDialog)
      ipcRenderer.send("window:open-history", historyCodes)
  })
}

/**
 * Get data from file in local storage
 * @param {string} fileName Name of required file in storage
 */
async function getDataFromStorage(fileName, callback) {
  if (fileName) {
    if (jetpack.exists(fileName)) {
      let data = await jetpack.readAsync(fileName)
      if (callback)
        callback(data)
    }
    else
      await jetpack.fileAsync(fileName)
  }
}
/**
 * Get saved codes and push them to array
 * @param {string} fileName Name of required file in storage
 */
function getSavedCodesFromStorage(fileName) {
  getDataFromStorage(fileName, function (data) {
    if (!data)
      data = JSON.stringify(savedCodes)

    savedCodes = JSON.parse(data)
    if (savedCodes.length > 0) {
      $.each(savedCodes, function (index, value) {
        $("#savedCodesSelect").append(new Option(value, value))
      })
    }
  })
}

//Remove code from array and select
$("#removeSavedQrBtn").on("click", async () => {
  let code = $("#savedCodesSelect").val()
  if (code) {
    savedCodes.splice(savedCodes.indexOf(code), 1)
    $("#savedCodesSelect option:selected").remove()
    $("#savedCodesSelect").trigger("change")
    inputText.trigger("change")
    await saveCodesToLocalStorage()
    showAlert("Код успешно удален из избранного")
  }
})

//Close modal to save qr-code image
//Call function to save qr-code image
$("#confirmFileName").on("click", () => {
  if ($("#fileNameInput").val()) {
    qrCodeNameModal.modal("hide")
    try {
      saveFileFunc()
      showAlert("Изображение успешно сохранено!")
    } catch (error) {

    }
  }
})
//Кнопка отмены при вводе имени файла
$("#denyFileName").on("click", () => {
  $("#fileNameInput").val("")
})

//Show modal to save qr-code image
saveButton.on("click", () => {
  if (qrImg.src) {
    downloadFolder = path.join((electron.app || electron.remote.app).getPath("downloads"), "QR Downloads")

    qrCodeNameModal.modal("show")
    $("#saveFolderPath").html(downloadFolder)
    $("#fileNameInput").val(removeCharacters(inputText.val())).trigger("focus").trigger("select")
  }
})

/**
 * Нажатие на копку "Настройки". Показ модалки с настройками
 */
settingsButton.on("click", () => {
  ipcRenderer.send("window:open-settings", settingsBlock)
})

historyButton.on("click", async () => {
  await getHistoryFromStorage(historyFileName, true)
})

contactButton.on("click", () => {
  aboutArgs.name = "Генератор штрих-кодов"
  aboutArgs.copyright = `&#169; 2019 - ${new Date().getFullYear()} 
  <a href="#" id="personLink" targetLink="https://vk.com/subbotinalexeysergeevich">Aleksey Subbotin</a>`
  ipcRenderer.send("window:open-about", aboutArgs)
})
/**
 * Применение настроек и сохранение их в файл
 */
ipcRenderer.on("window:change-settings", async (event, codeTypes) => {
  settingsBlock = codeTypes
  await saveSettingsToLocalStorage()
  changeColorTheme(settingsBlock.general.isDarkMode)
  changeMaxSymbolCount(settingsBlock.general.codeSymbolLength.currentLength)
})
/**
 * Генерация текста, выбранного из истории
 */
ipcRenderer.on("window:set-history", (event, historyText) => {
  if (inputText.val() != historyText) {
    inputText.val(historyText)
    inputText.trigger("change")
    genQrButton.trigger("click")
  }
})
/**
 * Очистка истории
 */
ipcRenderer.on("window:clear-history", (event, args) => {
  historyCodes = []
  //Записываем историю в файл
  saveDataToLocalStorage(historyFileName, historyCodes)
})

//Generate qr-code when select was changes
$("#savedCodesSelect").on("change", () => {
  inputText.val($("#savedCodesSelect").val())
  inputText.trigger("change")
  genQrButton.trigger("click")
})

inputText.on("input", async () => {
  await historySearch(inputText.val())
  writeRemainingSymb()
})

inputText.on("change", () => {
  writeRemainingSymb()
})
/**
 * Отображение оставшихся символов
 */
function writeRemainingSymb() {
  let remainingSymbCount = settingsBlock.general.codeSymbolLength.currentLength - inputText.val().length
  symbolCount.html(`Ост. кол-во символов: ${remainingSymbCount}`)
}
/**
 * Search text in history
 * @param {string} searchText searched text
 */
async function historySearch(searchText) {
  //Сохраняем новый массив с кодами, используя Set, чтобы были убраны дубликаты
  let historyArr = [...new Set(historyCodes)]
  let historyListAlert = $("#historyListAlert")
  //Отступы сверху и снизу (костыль)
  let topBottomHeight = 10
  //Принимаем за высоту одной строки, чтобы указать высоту всплывающего блока
  let stringHeight = 25
  //Счетчик количества отображаемых кодов
  let counter = 0
  //Флаг, указывающий, что происходит поиск. Возможно, понадобится, когда история будет большая
  let isSearching

  //Очищаем содержимое всплывашки
  historyListAlert[0].innerHTML = ""
  //Инвертируем массив, чтобы недавние данные были первыми
  historyArr.reverse()

  if (!isSearching && inputText.val()) {
    isSearching = true

    for (let i = 0; i < historyArr.length; i++) {
      let str = historyArr[i]

      //Если всплывашка скрыта, откроем ее
      if (str.includes(inputText.val())) {
        if (historyAlert.is(":hidden"))
          showHistoryAlert()
        counter++
        //Если отображено 5 элементов, завершаем цикл, так как пока что выводим только 5 элементов
        if (counter > 5)
          break

        //Создаем элемент списка для отображаемого кода
        const li = document.createElement("li")
        //Обрежем отображаемое значение, если слишком много символов
        const itemText = str.length > 30
          ? document.createTextNode(str.substring(0, 30) + "...")
          : document.createTextNode(str)

        li.classList.add("list-group-item")
        //Добавляем этот параметр, чтобы при кликах вне текстового поля и всплывашки
        //закрывалась эта самая всплывашка
        li.setAttribute("histListFlag", true)
        li.setAttribute("allText", str)

        li.appendChild(itemText)
        //При клике запишем значение в текстовое поле
        li.onclick = () => {
          inputText.val(str)
          hideHistoryAlert()
        }
        historyListAlert[0].appendChild(li)
      }
    }
    //Если введенное значение равно тому, что в списке и в списке всего один элемент, скроем всплывашку
    if ((historyListAlert[0].children.length == 1
      && historyListAlert[0].children[0].attributes["allText"].value == inputText.val())
      || historyListAlert[0].children.length == 0) {
      hideHistoryAlert()
      isSearching = false

      return true
    }
    //Формируем высоту вслывашки
    historyAlert[0].style.height = (topBottomHeight + historyListAlert[0].children.length * stringHeight + topBottomHeight) + "px"

    isSearching = false
  }
  else {
    if (historyAlert.is(":visible"))
      hideHistoryAlert()
  }
}

/**
 * Show alert block on screen
 * @param {string} text text for alert
 */
function showAlert(text) {
  $("#alertText").html(text)
  successAlert.fadeTo(2000, 50).fadeOut("fast")
}
function showHistoryAlert() {
  historyAlert.fadeTo(1000, 50)
}
function hideHistoryAlert() {
  historyAlert.hide()
}
/**
 * Save qr-code image to folder
 */
function saveFileFunc() {
  makeDir(downloadFolder)

  // let fileName =  inputText.val().length > 13 ? inputText.val().slice(0, 13) : inputText.val() + '.png'
  let fileName = removeCharacters($("#fileNameInput").val()) + ".png"
  let pathToSave = path.join(downloadFolder, fileName)
  let url = qrImg.src
  const base64Data = url.replace(/^data:image\/png;base64,/, "")

  fs.writeFile(pathToSave, base64Data, "base64", function (err) {
    if (err)
      console.log(err)
  })
}

/**
 * Find and create folder to save qr-code
 * @param {string} dirPath directory path
 */
const makeDir = function (dirPath) {
  try {
    jetpack.dir(dirPath)
  }
  catch (err) {
    if (err.code !== "EEXIST") throw err
  }
}

/**
 * Remove forbidden characters from string
 * @param {string} string String for file name
 */
function removeCharacters(string) {
  return string.replace(/[<>:/|?*\\"]/g, "")
}

/**
 * Init barcode types
 */
function initBarcodeTypesSelect() {
  var bTypes = Object.getOwnPropertyNames(barcodeTypes)

  //Set barcode types to types select
  bTypes.forEach(function (codeType) {
    let option = document.createElement("option")
    option.text = barcodeTypes[codeType].bcid
    typesSelect.add(option)
  })
  //Set default type in types select
  typesSelect.value = barcodeTypes.qrcode.bcid
  //Remove empty value from types select
  $("#barcodeTypesSelect option")
    .filter(function () {
      return !this.value || $.trim(this.value).length == 0 || $.trim(this.text).length == 0
    })
    .remove()
}
/**
 * Copy data between object
 * @param {object} sourceObject Source object from which to copy data
 * @param {object} targetObject Target object to which copying data
 */
function objectMapper(sourceObject, targetObject) {
  //Получаем исходные свойства, данные которых нужно скопировать в целевой объект
  let targetProps = Object.getOwnPropertyNames(targetObject)
  if (targetProps.length > 0) {
    targetProps.forEach((item) => {
      //Проверяем, чтобы в исходном объекте тоже присутствовали свойства
      if (sourceObject[item]) {
        //Проверяем, есть ли дочение свойства у объекта
        //Если есть, то рекурсией проходим по ним
        //Попутно проверяем, чтобы дочернее свойство было объектом
        if (Object.getOwnPropertyNames(targetObject[item]).length > 0 &&
          typeof (targetObject[item]) === 'object')
          objectMapper(sourceObject[item], targetObject[item])
        else
          //Переносим свойства в целевой объект
          targetObject[item] = sourceObject[item]
      }
    })
  }
}
/**
 * Change color theme between light or dark
 * @param {bool} isDarkMode Bool param to change color theme
 */
function changeColorTheme(isDarkMode) {
  let themeStyle = document.getElementById("colorTheme")
  if (isDarkMode) {
    themeStyle.href = darkStyleLink
    document.body.classList.add("darkBody")
    document.body.classList.remove("lightBody")
  }
  else {
    themeStyle.href = lightStyleLink
    document.body.classList.add("lightBody")
    document.body.classList.remove("darkBody")
  }
}

function changeMaxSymbolCount(length) {
  //Set max symbols count for main input
  inputText.attr("maxlength", length)

  symbolCount.html(`Ост. кол-во символов: ${length}`)
}

//----------------------------------------------Generator settings region----------------------------------------
/**
 * Generate some text
 * @param {string} text Text for generate
 */
function generateBarcode(text, callback) {
  let type = typesSelect.value
  let props = Object.keys(settingsBlock[type])
  let params = barcodeTypes[type]

  props.forEach(set => {
    params[set] = settingsBlock[type][set]
  })

  params.text = text
  params.textcolor = settingsBlock.general.colors.fontColor.replace("#", "")
  params.backgroundcolor = settingsBlock.general.colors.background.replace("#", "")
  params.barcolor = settingsBlock.general.colors.symbolsColor.replace("#", "")

  barcode.toBuffer(
    params, function (err, png) {
      if (err) {
        console.log(err)
      } else {
        qrImg.src = "data:image/png;base64," +
          png.toString("base64")
        qrImg.style.padding = "10px"
        qrImg.style.background = settingsBlock.general.colors.background

        if (type == barcodeTypes.code128.bcid) {
          qrImg.height = 150
          qrImg.width = qrImg.height * 1.67
        }
        else {
          qrImg.height = 220
          qrImg.width = 220
        }
      }
    })

  if (callback)
    callback()
}