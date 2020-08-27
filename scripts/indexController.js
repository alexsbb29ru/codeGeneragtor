//----------------------- Main settings --------------------------------
const electron = require('electron');
const { ipcRenderer, shell, clipboard } = electron;
const path = require('path');
const fs = require('fs');

let barcode = require('bwip-js');
const { nativeImage } = require('electron');


//----------------------- Visual elements --------------------------------
//Canvas с отображаемым QR-кодом
const canvas = document.getElementById('qrOutput');
//Выпадающий список с типами ШК (128, QR)
const typesSelect = document.getElementById('barcodeTypesSelect');
//Поле для ввода конвертируемого текста
const inputText = $('#qrTextForm');
//Вылетающий блок с сообщением об успешной операции или ошибкой
const successAlert = $('#successAlert');
//Поле, в котором выводится количество оставшихся символов
const symbolCount = $('#symbolCount');
//Кнока "Сгенерировать" ШК
const genQrButton = $('#genQrButton');
//Кнопка для вызова окна настроек
const settingsButton = $('#settingsButton');
//Кнопка вызова окна с историей
const historyButton = $('#historyButton');
//Кнопка вызова окна about
const contactButton = $('#contactButton');
//Кнопка вызова модалки для сохранения сгенерированного кода в изображение
const saveButton = $('#saveQrImgButton');
//Модалка с вводом имени для сохранения сгенерированного кода в изображение
const qrCodeNameModal = $('#qrCodeNameModal');
//Ссылка на стиль с темной темой
const darkStyleLink = "./css/darkTheme.css"
//Ссылка на стиль со светлой темой
const lightStyleLink = "./css/lightTheme.css"
//------------------------------------------------------------------------
//Максимально доступное количество вводимых символов
const maxSymbols = 100;

//Папка загрузок
let downloadFolder = '';
//Файл, в котором содержатся "избранные" коды
const savedDataFileName = 'savedData.txt';
//Файл, в котором содержатся настроки
const settingsFileName = 'settings.txt';
//Файл с историей вводимыого текста
const historyFileName = 'history.txt';
//Массив с избранными кодами
let savedCodes = [];
//Массив с историей текстов
let historyCodes = [];

//Типы ШК и их начальные настройки
let barcodeTypes = {
  code128: {
    bcid: "code128",
    text: "",
    includetext: false,
    scale: 10,
    height: 30,
    width: 60,
    backgroundcolor: 'FFFFFF'
  },
  qrcode: {
    bcid: "qrcode",
    text: "",
    scale: 10,
    eclevel: 'H',
    backgroundcolor: 'FFFFFF'
  }
}

//Изменяемые настройки приложения, включая настройки ШК
let settingsBlock = {
  code128: {
    bcid: "code128",
    includetext: false,
    backgroundcolor: 'FFFFFF'
  },
  qrcode: {
    bcid: "qrcode",
    eclevel: 'H',
    backgroundcolor: 'FFFFFF'
  },
  general: {
    copyImageToClipboard: {
      isCopy: false,
    },
    isDarkMode: false
  }
}
//Информация о приложении
let aboutArgs = {
  name: "",
  version: "",
  desctiption: "",
  copyright: ""
}

//Set max symbols count for main input
inputText.attr('maxlength', maxSymbols);

symbolCount.html('Ост. кол-во символов: ' + maxSymbols)
//Hide alert block on start
successAlert.hide();
//Init barcode types
initBarcodeTypesSelect();

//Get saved codes and push them to array
getSavedCodesFromStorage(savedDataFileName)

//Get saved settings
getSettingsFromStorage(settingsFileName)

//Get history
//getHistoryFromStorage(historyFileName)

//Bind function to button to generate QR-code 
genQrButton.click(async () => {
  if (inputText.val()) {
    drawFlag = true;
    //Добавляем код в историю запросов
    if (historyCodes[historyCodes.length - 1] != inputText.val())
      historyCodes.push(inputText.val());
    //Записываем историю в файл
    saveDataToLocalStorage(historyFileName, historyCodes)
    //Генерируем введенный текст
    generateBarcode(inputText.val(), saveImageToBuffer);
  }
  else {
    drawFlag = false;
  }
});

//Generating qr-code by keydown ctrl + enter
inputText.keydown(function (e) {
  if (e.ctrlKey && e.keyCode == 13)
    genQrButton.click();
});

//Open modal by ctrl + s
window.onkeydown = function (e) {
  if (!$('.modal').is(':visible')) {
    if (e.ctrlKey && e.keyCode == 83)
      saveButton.click();
  }
}
//Saving image by enter
qrCodeNameModal.keydown(function (e) {
  if (e.keyCode == 13)
    $('#confirmFileName').click();
});

//Save text to select control
$('#saveQrTextButton').click(() => {
  if (!inputText.val()) return;
  let select = document.getElementById('savedCodesSelect');
  //Проверка на содержание текста в списке
  if (select.innerHTML.indexOf('value="' + inputText.val() + '"') > -1) {
    showAlert('Код уже содержится в избранном');
  }
  else {
    savedCodes.push(inputText.val());
    saveCodesToLocalStorage();
    showAlert('Код успешно сохранен в избранном');
    $('#savedCodesSelect').append(new Option(inputText.val(), inputText.val()));
  }
});
/**
 * Save image to buffer
 */
function saveImageToBuffer() {
  if (!settingsBlock.general.copyImageToClipboard.isCopy)
    return false

  //! Костыль. Почему-то не копируется текущее изображение буфер
  setTimeout(() => {
    let img = nativeImage.createFromDataURL(canvas.src)
    clipboard.writeImage(img)
    console.log("Image downloaded")
  }, 100)
}
/**
 * Save code to local storage
 */
function saveCodesToLocalStorage() {
  saveDataToLocalStorage(savedDataFileName, savedCodes)
}
/**
 * 
 * @param {string} fileName Name of file with data
 * @param {any} saveData Data for saving
 */
function saveDataToLocalStorage(fileName, saveData) {
  let savingData = JSON.stringify(saveData);

  fs.writeFile(fileName, savingData, function (err) {
    if (err)
      console.log(err);
  });
}
/**
 * Save settings to local storage
 */
function saveSettingsToLocalStorage() {
  saveDataToLocalStorage(settingsFileName, settingsBlock);
}

/**
 * Get settings from local storage
 * @param {string} filename Name of local settings file
 */
function getSettingsFromStorage(filename) {
  getDataFromStorage(filename, function (data) {
    //settingsBlock = JSON.parse(data);
    let sourceData = JSON.parse(data)
    objectMapper(sourceData, settingsBlock)
    changeColorTheme(settingsBlock.general.isDarkMode)
  });
}
/**
 * Get history from storage
 * @param {string} filename Name of history file in storage
 */
function getHistoryFromStorage(filename) {
  getDataFromStorage(filename, function (data) {
    $('#historyListModal').html('');
    if (!data)
      data = JSON.stringify(historyCodes);
    historyCodes = JSON.parse(data);
    ipcRenderer.send('window:open-history', historyCodes)
  });
}

/**
 * Get data from file in local storage
 * @param {string} fileName Name of required file in storage
 */
async function getDataFromStorage(fileName, callback) {
  if (fileName) {
    fs.readFile(fileName, "utf-8", function (error, data) {
      if (error) {
        console.log(error);
        throw error;
      }
      if (callback)
        callback(data);
    });
  }
}
/**
 * Get saved codes and push them to array
 * @param {string} fileName Name of required file in storage
 */
function getSavedCodesFromStorage(fileName) {
  getDataFromStorage(fileName, function (data) {
    savedCodes = JSON.parse(data);
    if (savedCodes.length > 0) {
      $.each(savedCodes, function (index, value) {
        $('#savedCodesSelect').append(new Option(value, value));
      });
    }
  });
}

//Remove code from array and select
$('#removeSavedQrBtn').click(() => {
  let code = $('#savedCodesSelect').val();
  if (code) {
    savedCodes.splice(savedCodes.indexOf(code), 1);
    $('#savedCodesSelect option:selected').remove();
    $('#savedCodesSelect').change();
    inputText.change();
    saveCodesToLocalStorage();
    showAlert('Код успешно удален из избранного');
  }
});

//Close modal to save qr-code image
//Call function to save qr-code image
$('#confirmFileName').click(() => {
  if ($('#fileNameInput').val()) {
    qrCodeNameModal.modal('hide');
    try {
      saveFileFunc();
      showAlert('Изображение успешно сохранено!');
    } catch (error) {

    }
  }
});
//Кнопка отмены при вводе имени файла
$('#denyFileName').click(() => {
  $('#fileNameInput').val('');
});

//Show modal to save qr-code image
saveButton.click(() => {
  if (canvas.src) {
    downloadFolder = path.join((electron.app || electron.remote.app).getPath('downloads'), 'QR Downloads');

    qrCodeNameModal.modal('show');
    $('#saveFolderPath').html(downloadFolder)
    $('#fileNameInput').val(removeCharacters(inputText.val())).focus().select();
  }
});

/**
 * Нажатие на копку "Настройки". Показ модалки с настройками
 */
settingsButton.click(() => {
  ipcRenderer.send('window:open-settings', settingsBlock)
})

historyButton.click(() => {
  getHistoryFromStorage(historyFileName)
})

contactButton.click(() => {
  aboutArgs.name = "Генератор штрих-кодов"
  aboutArgs.copyright = `&#169; 2019 - ${new Date().getFullYear()} 
  <a href="#" id="personLink" targetLink="https://vk.com/subbotinalexeysergeevich">Aleksey Subbotin</a>`
  ipcRenderer.send('window:open-about', aboutArgs)
})
/**
 * Применение настроек и сохранение их в файл
 */
ipcRenderer.on('window:change-settings', (event, codeTypes) => {
  settingsBlock = codeTypes
  saveSettingsToLocalStorage()
  changeColorTheme(settingsBlock.general.isDarkMode)
})
/**
 * Генерация текста, выбранного из истории
 */
ipcRenderer.on('window:set-history', (event, historyText) => {
  if (inputText.val() != historyText) {
    inputText.val(historyText);
    inputText.change();
    genQrButton.click();
  }
})
/**
 * Очистка истории
 */
ipcRenderer.on('window:clear-history', (event, args) => {
  historyCodes = [];
  //Записываем историю в файл
  saveDataToLocalStorage(historyFileName, historyCodes)
})

//Generate qr-code when select was changes
$('#savedCodesSelect').change(() => {
  inputText.val($('#savedCodesSelect').val());
  inputText.change();
  genQrButton.click();
});

inputText.on('input', () => {
  writeRemainingSymb();
});

inputText.change(() => {
  writeRemainingSymb();
});
/**
 * Отображение оставшихся символов
 */
function writeRemainingSymb() {
  let remainingSymbCount = maxSymbols - inputText.val().length;
  symbolCount.html('Ост. кол-во символов: ' + remainingSymbCount);
}

/**
 * Show alert block on screen
 * @param {string} text text for alert
 */
function showAlert(text) {
  $('#alertText').html(text);
  successAlert.fadeTo(2000, 50).fadeOut("fast");
}

/**
 * Save qr-code image to folder
 */
function saveFileFunc() {
  makeDir(downloadFolder);

  // let fileName =  inputText.val().length > 13 ? inputText.val().slice(0, 13) : inputText.val() + '.png';
  let fileName = removeCharacters($('#fileNameInput').val()) + '.png';
  let pathToSave = path.join(downloadFolder, fileName);
  let url = canvas.src;
  const base64Data = url.replace(/^data:image\/png;base64,/, "");

  fs.writeFile(pathToSave, base64Data, 'base64', function (err) {
    if (err)
      console.log(err);
  });
};

/**
 * Find and create folder to save qr-code
 * @param {string} dirPath directory path
 */
const makeDir = function (dirPath) {
  try {
    fs.mkdirSync(dirPath)
  }
  catch (err) {
    if (err.code !== 'EEXIST') throw err;
  }
};

/**
 * Remove forbidden characters from string
 * @param {string} string String for file name
 */
function removeCharacters(string) {
  return string.replace(/[<>:/|?*\\"]/g, "");
}

/**
 * Init barcode types
 */
function initBarcodeTypesSelect() {
  var bTypes = Object.getOwnPropertyNames(barcodeTypes);

  //Set barcode types to types select
  bTypes.forEach(function (codeType) {
    let option = document.createElement("option");
    option.text = barcodeTypes[codeType].bcid;
    typesSelect.add(option);
  });
  //Set default type in types select
  typesSelect.value = barcodeTypes.qrcode.bcid;
  //Remove empty value from types select
  $('#barcodeTypesSelect option')
    .filter(function () {
      return !this.value || $.trim(this.value).length == 0 || $.trim(this.text).length == 0;
    })
    .remove();
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
  let themeStyle = document.getElementById('colorTheme')
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

//----------------------------------------------Generator settings region----------------------------------------
/**
 * Generate some text
 * @param {string} text Text for generate
 */
function generateBarcode(text, callback) {
  let type = typesSelect.value;
  let props = Object.keys(settingsBlock[type]);
  let params = barcodeTypes[type];

  props.forEach(set => {
    params[set] = settingsBlock[type][set]
  });

  params.text = text;

  barcode.toBuffer(
    params, function (err, png) {
      if (err) {
        console.log(err);
      } else {
        canvas.src = 'data:image/png;base64,' +
          png.toString('base64');

        if (type == barcodeTypes.code128.bcid) {
          canvas.height = 105;
        }
        else
          canvas.height = 210;
        canvas.width = 210;
      }
    });

  if (callback)
    callback();
}