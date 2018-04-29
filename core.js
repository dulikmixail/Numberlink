function launchFullScreen(element) {
    if (element.requestFullScreen) {
        element.requestFullScreen()
    } else if (element.webkitRequestFullScreen) {
        element.webkitRequestFullScreen()
    } else if (element.mozRequestFullScreen) {
        element.mozRequestFullScreen()
    } else if (element.oRequestFullScreen) {
        element.oRequestFullScreen()
    } else if (element.msRequestFullScreen) {

    } else {
        alert("Для елемента " + element.toString() + " недоступен полноэкранный режим")
    }
}