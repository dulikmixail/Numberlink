var body = document.getElementsByTagName("body")[0];
var isMouseDown = false;
var logger = false;
var lastSelectedCell;
var lastTouchElement = null;

function showModal() {
    var number = gameStorage.getNumberCurrentLevel();
    var color;
    document.querySelectorAll("[data-level]").forEach(function (item) {
        if (item.attributes["data-level"].value == number) {
            color = getComputedStyle(item).color;
        }
    });
    if (!!color) {
        var completeLevel = document.querySelector(".complete_level");
        completeLevel.innerHTML = number + 1;
        completeLevel.style.color = color;
        var states = new States();
        states.showState("state-lvl_complete", true);
    }

}

function hideModal() {
    var states = new States();
    states.showState("state-levels");
}


function log(mesage, obj) {
    mesage = mesage === undefined ? "" : mesage;
    if (logger) {
        console.log(mesage + ' ' + (obj ? JSON.stringify(obj) : ''));
    }
}

var isMobile = {
    Android: function () {
        return navigator.userAgent.match(/Android/i);
    },
    BlackBerry: function () {
        return navigator.userAgent.match(/BlackBerry/i);
    },
    iOS: function () {
        return navigator.userAgent.match(/iPhone|iPad|iPod/i);
    },
    Opera: function () {
        return navigator.userAgent.match(/Opera Mini/i);
    },
    Windows: function () {
        return navigator.userAgent.match(/IEMobile/i);
    },
    any: function () {
        return (isMobile.Android() || isMobile.BlackBerry() || isMobile.iOS() || isMobile.Opera() || isMobile.Windows());
    }
};

function isTouchDevice() {
    return !!('ontouchstart' in window);
}


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
        element.msRequestFullScreen()
    } else {
        alert("Для вашего устройства не доступен полноэкранный режим")
    }
}

function clearField() {
    if (screamerCells.haveScreamer()) {
        screamerCells.hide();
        screamerCells.clear();
    }
    CurrentLevel.GetCurrentState().forEach(function (row) {
        row.forEach(function (cell) {
            cell.after = null;
            cell.before = null;
            cell.setValue(0);
        })
    });
    rebuildField();
}


function game_Init() {
    window.scrollTo(0, (window.innerHeight / 2) - (document.getElementById("table").clientHeight / 2));
    stateGame.addEventListener("mouseup", function () {
        eUp();
    });
    stateGame.addEventListener("touchend", function (event) {
        eUp();
        lastTouchElement = null;
    });
    stateGame.addEventListener("touchstart", function (event) {
        var element = document.elementFromPoint(event.changedTouches[0].clientX, event.changedTouches[0].clientY);
        if (element.classList.contains("value_wrapper")) {
            eDown(element);
            lastTouchElement = element;
        }
    });
    stateGame.addEventListener("touchmove", function (event) {
        var element = document.elementFromPoint(event.changedTouches[0].clientX, event.changedTouches[0].clientY);
        if (element !== lastTouchElement &&
            element.classList.contains("value_wrapper") &&
            lastTouchElement !== null) {
            eOver(element);
            lastTouchElement = element;
        }
    }, false);
    document.querySelectorAll(".value_wrapper").forEach(function (el) {
        el.addEventListener("mousedown", function () {
            eDown(el);
        });
        el.addEventListener("mouseover", function () {
            eOver(el);
        });
        el.addEventListener("click", function () {
            eClick(el);
        });
    });
}


function eUp(el) {
    autoMagnet(lastSelectedCell);
    rebuildField();
    isMouseDown = false;
    lastSelectedCell = null;
}

function eDown(el) {
    if (screamerCells.haveScreamer()) {
        screamerCells.hide();
        screamerCells.clear();
    }
    var findCell = findCellByElement(el);
    if (findCell.value !== 0 && !isCompletedPath(findCell)) {
        isMouseDown = true;
        lastSelectedCell = findCell;
        deleteAfterPath(findCell);
        rebuildField();
        // removeClass(findCell.dom.firstChild, "disabled");
    }
}

function eOver(el) {
    if (isMouseDown) {
        var selectedCell = findCellByElement(el);
        var _isEndPath = isEndPath(lastSelectedCell, selectedCell);
        if (isNeighbor(selectedCell, findNeighbors(lastSelectedCell)) ||
            _isEndPath ||
            isStartPath(lastSelectedCell, selectedCell)) {
            //при переходе на другой цвет для не Public поля
            if (selectedCell.before !== null && selectedCell.before.value !== lastSelectedCell.value) {
                deleteAfterPath(selectedCell);
                selectedCell.before.after = null;
                selectedCell.after = null;
            }
            //когда возвращаемся по томуже цвету обратно
            if (selectedCell.value === lastSelectedCell.value && !_isEndPath) {
                var step1 = new StepToPath(selectedCell);
                var step2 = new StepToPath(lastSelectedCell);
                //при попадании на другой путь с одинаковым цветом
                if (lastSelectedCell.before !== selectedCell &&
                    step1.getStartCell() !== step2.getStartCell()) {
                    deleteAfterPath(selectedCell);
                    connectTwoPaths(lastSelectedCell, selectedCell)
                    isMouseDown = false;
                } else {
                    deleteAfterPath(selectedCell);
                    lastSelectedCell = selectedCell;
                }
            } else {
                //когда двигаемся по пустым ячекам
                // и при движении в обрачном напреавдении,
                // когда мышь наводиться на Public поле
                deleteAfterPath(selectedCell);
                selectedCell.before = lastSelectedCell;
                selectedCell.setValue(lastSelectedCell.value);
                lastSelectedCell.after = selectedCell;
                lastSelectedCell = selectedCell;
            }

        }
        rebuildField();
    }
}

function eClick(el) {
    if (screamerCells.haveScreamer()) {
        screamerCells.hide();
        screamerCells.clear();
    }
    var cell = findCellByElement(el);
    deletePath(cell);
    log("One click");
}

function connectTwoPaths(lastCell, currentCell) {
    reversePath(currentCell);
    currentCell.before = lastCell;
    lastCell.after = currentCell;
}

function reversePath(cell) {
    var step = new StepToPath(cell);
    var startCell = step.getAndGoToEndCell();
    var buffer, currentCell;
    while (step.hasNextBeforeCell()) {
        currentCell = step.nextBeforeCell();
        buffer = currentCell.after;
        currentCell.after = currentCell.before;
        currentCell.before = buffer;
    }
}

function isEndPath(lastCell, currentCell) {
    if (lastCell.isPublic &&
        lastCell.value === currentCell.value &&
        !currentCell.isPublic &&
        currentCell.after === null &&
        isNeighbor(currentCell, findNeighbors(lastCell, true))) {
        // removeClass(currentCell.dom.firstChild, "disabled");
        isMouseDown = false;
        return true;
    } else {
        return false;
    }
}

var ScreamerCells = function () {
    this.screamers = [];
    this.haveScreamer = function () {
        return this.screamers.length !== 0;
    };
    this.clear = function () {
        this.screamers = [];
    };
    this.checked = function () {
        var screamers = [];
        CurrentLevel.GetCurrentState().forEach(function (row) {
            row.forEach(function (cell) {
                if (cell.value === 0) {
                    screamers.push(cell);
                }
            })
        });
        this.screamers = screamers;
    };
    this.show = function () {
        this.screamers.forEach(function (screamer) {
            removeClass(screamer.dom, "screamer");
            addClass(screamer.dom, "screamer");
        });
    };
    this.hide = function hideScreamerCell() {
        this.screamers.forEach(function (screamer) {
            removeClass(screamer.dom, "screamer");
        });
    }
};

var screamerCells = new ScreamerCells();

function isStartPath(lastCell, currentCell) {
    var step = new StepToPath(lastCell);
    var step2 = new StepToPath(currentCell);
    var a = step.getStartCell();
    var b = step2.getStartCell();
    return a === b;
}

function isCompletedPath(cell) {
    var step = new StepToPath(cell);
    var startCell = step.getStartCell();
    var endCell = step.getEndCell();
    return (!startCell.isPublic && !endCell.isPublic && startCell.value === endCell.value && startCell !== endCell);
}

function deletePath(startCell) {
    deleteAfterPath(startCell);
    deleteBeforePath(startCell);
    rebuildField();
}

function deleteAfterPath(cell, whitResetValue) {
    whitResetValue = whitResetValue === undefined ? true : whitResetValue;
    var step = new StepToPath(cell);
    var data = CurrentLevel.GetCurrentState();
    while (step.hasNextAfterCell()) {
        var next = step.nextAfterCell();
        if (cell === next) {
            data[next.y][next.x].after = null;
        } else {
            data[next.y][next.x].before = null;
            data[next.y][next.x].after = null;
            data[next.y][next.x].setValue(whitResetValue ? 0 : step.getCurrentCell().value);
        }
    }
}

function deleteBeforePath(cell, whitResetValue) {
    whitResetValue = whitResetValue === undefined ? true : whitResetValue;
    var step = new StepToPath(cell);
    var data = CurrentLevel.GetCurrentState();
    while (step.hasNextBeforeCell()) {
        var next = step.nextBeforeCell();
        if (cell === next) {
            data[next.y][next.x].before = null;
        } else {
            data[next.y][next.x].before = null;
            data[next.y][next.x].after = null;
            data[next.y][next.x].setValue(whitResetValue ? 0 : step.getCurrentCell().value);
        }
    }
}


var StepToPath = function (startCell) {
    this.cell = startCell;
    this.afterCell = startCell;
    this.beforeCell = startCell;
    this.getCurrentCell = function () {
        return this.cell;
    };
    this.hasNextAfterCell = function () {
        return this.afterCell !== null
    };
    this.hasNextBeforeCell = function () {
        return this.beforeCell !== null
    };
    this.nextAfterCell = function () {
        this.cell = this.afterCell;
        this.afterCell = this.afterCell.after;
        return this.cell;
    };
    this.nextBeforeCell = function () {
        this.cell = this.beforeCell;
        this.beforeCell = this.beforeCell.before;
        return this.cell;
    };
    this.getAndGoToEndCell = function () {
        while (startCell) {
            this.cell = startCell;
            startCell = startCell.after;
        }
        return this.cell;
    };
    this.getAndGoToStartCell = function () {
        while (startCell) {
            this.cell = startCell;
            startCell = startCell.before;
        }
        return this.cell;
    };
    this.getEndCell = function () {
        var currentCell = this.cell;
        while (currentCell.after) {
            currentCell = currentCell.after
        }
        return currentCell;
    };
    this.getStartCell = function () {
        var currentCell = this.cell;
        while (currentCell.before) {
            currentCell = currentCell.before;
        }
        return currentCell;
    }
};

function deleteLocking(cell) {
    if (cell.before && cell.after) {
        var counterOut = 0;
        var currentCell = cell;
        var findLocking = false;
        while (currentCell) {
            currentCell = currentCell.after;
            if (currentCell === cell) {
                currentCell = null;
                findLocking = true;
            }
        }
        if (findLocking) {
            deletePath(cell);
            isMouseDown = false;
            lastSelectedCell = null;
        }
    }
}

function rebuildField(withAutoMagnet) {
    gameStorage.save();
    var notFoundedZeroValue = true;
    var allWayFound = true;
    CurrentLevel.GetCurrentState().forEach(function (row) {
        row.forEach(function (cell) {
            if (cell.isPublic) {
                buildPublicCell(cell);
            } else {
                // buildNotPublicCell(cell)
            }

            if (!cell.isPublic) {
                if (!isCompletedPath(cell)) {
                    allWayFound = false;
                }
            }
            if (cell.value === 0) {
                notFoundedZeroValue = false;
            }
        })
    });

    if (allWayFound && notFoundedZeroValue) {
        gameStorage.levelComplete();
        var stateElements = document.querySelectorAll('[id^="state-"]');
        stateElements.forEach(function (el) {
            removeClass(el, "show");
        });
        addClass(document.getElementById("state-game"), "show");
        addClass(document.getElementById("state-lvl_complete"), "show");
        showModal();
    } else if (allWayFound && !notFoundedZeroValue) {
        screamerCells.checked();
        if (screamerCells.haveScreamer()) {
            screamerCells.show()
        }
    }

    function buildPublicCell(cell) {
        if (cell.before === null && cell.after === null) {
            cell.setValue(0);
        }
        if (cell.after && cell.before) {
            if ((cell.after.y + 1 === cell.y && cell.y === cell.before.y - 1 && cell.after.x === cell.x && cell.x === cell.before.x) ||
                (cell.after.y - 1 === cell.y && cell.y === cell.before.y + 1 && cell.after.x === cell.x && cell.x === cell.before.x)) {
                addDirection(cell, "d_up-down");
            } else if (cell.after.y === cell.y && cell.y === cell.before.y && cell.after.x + 1 === cell.x && cell.x === cell.before.x - 1 ||
                cell.after.y === cell.y && cell.y === cell.before.y && cell.after.x - 1 === cell.x && cell.x === cell.before.x + 1) {
                addDirection(cell, "d_left-right");
            } else if (cell.after.y + 1 === cell.y && cell.y === cell.before.y && cell.after.x === cell.x && cell.x === cell.before.x + 1 ||
                cell.after.y === cell.y && cell.y === cell.before.y + 1 && cell.after.x + 1 === cell.x && cell.x === cell.before.x) {
                addDirection(cell, "d_up-left");
            } else if (cell.after.y + 1 === cell.y && cell.y === cell.before.y && cell.after.x === cell.x && cell.x === cell.before.x - 1 ||
                cell.after.y === cell.y && cell.y === cell.before.y + 1 && cell.after.x - 1 === cell.x && cell.x === cell.before.x) {
                addDirection(cell, "d_up-right");
            } else if ((cell.after.y - 1 === cell.y && cell.y === cell.before.y && cell.after.x === cell.x && cell.x === cell.before.x + 1) ||
                (cell.after.y === cell.y && cell.y === cell.before.y - 1 && cell.after.x + 1 === cell.x && cell.x === cell.before.x)) {
                addDirection(cell, "d_down-left");
            } else if ((cell.after.y - 1 === cell.y && cell.y === cell.before.y && cell.after.x === cell.x && cell.x === cell.before.x - 1) ||
                (cell.after.y === cell.y && cell.y === cell.before.y - 1 && cell.after.x - 1 === cell.x && cell.x === cell.before.x)) {
                addDirection(cell, "d_down-right");
            }
        } else if (cell.after && cell.before === null) {
            if (cell.after.y - 1 === cell.y && cell.after.x === cell.x ||
                cell.after.y + 1 === cell.y && cell.after.x === cell.x) {
                addDirection(cell, "d_up-down");
            } else if (cell.after.y === cell.y && cell.after.x - 1 === cell.x ||
                cell.after.y === cell.y && cell.after.x + 1 === cell.x) {
                addDirection(cell, "d_left-right");
            }
        } else if (cell.before && cell.after === null) {
            if (cell.before.y - 1 === cell.y && cell.before.x === cell.x ||
                cell.before.y + 1 === cell.y && cell.before.x === cell.x) {
                addDirection(cell, "d_up-down");
            } else if (cell.before.y === cell.y && cell.before.x - 1 === cell.x ||
                cell.before.y === cell.y && cell.before.x + 1 === cell.x) {
                addDirection(cell, "d_left-right");
            }
        } else {
            removeClassByStartName(cell, "d_");
            removeClassByStartName(cell, "color");
        }
    }

    function buildNotPublicCell(cell) {
        if (cell.before || cell.after) {
            removeClass(cell.dom.firstChild, "disabled");
        } else {
            removeClass(cell.dom.firstChild, "disabled");
            addClass(cell.dom.firstChild, "disabled");
        }
    }

    function addDirection(cell, className) {
        removeClassByStartName(cell, "d_");
        addClass(cell.dom, className);
        addClass(cell.dom, getColorClass(cell.value));
    }

}

function autoMagnet(cell) {
    if (cell !== undefined && cell !== null && cell.isPublic) {
        var neighbors = findNeighbors(cell, true);
        var neighbor;
        var data = CurrentLevel.GetCurrentState();
        for (var i = 0; i < neighbors.length; i++) {
            neighbor = data[neighbors[i].y][neighbors[i].x];
            if (neighbor.value === cell.value &&
                neighbor !== cell.before &&
                neighbor.after === null &&
                cell.value !== 0
            ) {
                var step1 = new StepToPath(cell);
                var step2 = new StepToPath(neighbor);
                if (step1.getStartCell() !== step2.getStartCell()) {
                    connectTwoPaths(data[neighbors[i].y][neighbors[i].x], cell);
                }
            }
        }
    }
}

function getColorClass(value) {
    return "color-" + value;
}

function isNeighbor(cell, neighbors) {
    var findNeighbor = false;
    for (var i = 0; i < neighbors.length; i++) {
        if (neighbors[i].x === cell.x && neighbors[i].y === cell.y) {
            findNeighbor = true;
        }
    }
    return findNeighbor;
}

function findNeighbors(cell, withNoPublicCell) {
    withNoPublicCell = withNoPublicCell === undefined ? false : withNoPublicCell;
    var neighbors = [];
    var data = CurrentLevel.GetCurrentState();
    var possiblePath = [
        {y: cell.y, x: cell.x + 1},
        {y: cell.y, x: cell.x - 1},
        {y: cell.y + 1, x: cell.x},
        {y: cell.y - 1, x: cell.x}
    ];
    for (var i = 0; i < possiblePath.length; i++) {
        if (possiblePath[i].y >= 0 &&
            possiblePath[i].x >= 0 &&
            possiblePath[i].y < data.length &&
            possiblePath[i].x < data.length &&
            (data[possiblePath[i].y][possiblePath[i].x].isPublic || withNoPublicCell)
        ) {
            neighbors.push(possiblePath[i]);
        }
    }
    log("Neighbors", neighbors);
    return neighbors;
}

function findCellByElement(el) {
    var cell = el.parentNode;
    var row = cell.parentNode;
    var y = 0, x = 0;
    while ((cell = cell.previousElementSibling)) {
        x++;
    }
    while ((row = row.previousElementSibling)) {
        y++;
    }
    log("Index cell (" + y + "," + x + ")");
    return CurrentLevel.GetCurrentState()[y][x];
}
