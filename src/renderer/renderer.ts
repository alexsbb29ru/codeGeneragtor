import "../../node_modules/bootstrap/dist/css/bootstrap.css"
import "../../css/style.css"
import "../../css/customBtn.css"
import "../../css/customTitlebar.css"
import "../../css/mainTheme.css"
// import "../../images/iconMax.png"

import { initTitleBar } from "../titleBar/customTitleBarController"
import { IndexController } from "./indexController"

export let indexController: IndexController

document.onreadystatechange = async () => {
    // Инициализируем titlebar
    initTitleBar()

    // Вызываем иницализацию остальных модулей приложения
    indexController = new IndexController()
    await indexController.init()
}
