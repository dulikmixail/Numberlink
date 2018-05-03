var body = document.getElementsByTagName("body")[0];
var table = document.getElementById("table");
var mouseDown = false;
var neighbors;
var logger = true;
var lastSelectedCell;

function log(mesage, obj) {
    mesage = mesage === undefined ? "" : mesage;
    if (logger) {
        console.log(mesage + ' ' + (obj ? JSON.stringify(obj) : ''));
    }
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
        alert("Для елемента " + element.toString() + " недоступен полноэкранный режим")
    }
}

document.querySelectorAll(".level").forEach(function (v) {
    v.addEventListener("click", function (v) {
        launchFullScreen(body);
    })
});

function game_Init() {
    body.addEventListener("mouseup", function () {
        mouseDown = false;
        lastSelectedCell = null;
    });

    document.querySelectorAll(".value_wrapper").forEach(function (el) {
        el.addEventListener("mousedown", function () {
            var findCell = findCellByElement(el);
            if (findCell.value !== 0 && !isCompletedPath(findCell)) {
                mouseDown = true;
                lastSelectedCell = findCellByElement(el);
                if (!lastSelectedCell.isPublic) {
                    removeClass(el, "disabled");
                }
                deleteBeforePath(findCell, false);
                rebuilField();
            }
        });
        el.addEventListener("mouseout", function () {
            if (mouseDown) {
            }
        });
        el.addEventListener("mouseover", function () {
            if (mouseDown) {
                var selectedCell = findCellByElement(el);
                var lastCell = lastSelectedCell;
                var currentCell = selectedCell;
                findLocking(lastCell, currentCell);
                if ((isNeighbor(selectedCell, findNeighbors(lastSelectedCell)) || (isEndPath(lastCell, currentCell)))) {
                    selectedCell.after = lastSelectedCell;
                    selectedCell.value = lastSelectedCell.value;
                    lastSelectedCell.before = selectedCell;
                    lastSelectedCell = selectedCell;
                }
                rebuilField();
            }
        });
        el.addEventListener("click", function () {
            var cell = findCellByElement(el);
            deletePath(cell);
            log("One click");
        });
    });
}

function isEndPath(lastCell, currentCell) {
    if (lastCell.isPublic && lastCell.value === currentCell.value) {
        removeClass(currentCell.dom.firstChild, "disabled");
        mouseDown = false;
        return true;
    } else {
        return false;
    }
}

function isCompletedPath(cell) {
    var step = new StepToPath(cell);
    var startCell = step.getStartCell();
    var endCell = step.getEndCell();
    return (!startCell.isPublic && !endCell.isPublic && startCell.value === endCell.value && startCell !== endCell);
}

function findLocking(lastCell, currentCell) {
    if (currentCell.value !== 0) {
        if (lastCell.value === currentCell.value) {
            deleteBeforePath(currentCell, false);
        } else {
            deleteBeforePath(currentCell, true);
        }
        rebuilField();
    }
}

function deletePath(startCell) {
    deleteAfterPath(startCell);
    deleteBeforePath(startCell);
    rebuilField();
}

function deleteBeforePath(cell, whitResetValue) {
    whitResetValue = whitResetValue === undefined ? true : whitResetValue;
    var currentCell = cell;
    var afterCell = cell.before;
    cell.before = null;
    cell.value = cell.isPublic && whitResetValue ? 0 : cell.value;
    while (afterCell) {
        currentCell = afterCell;
        afterCell = afterCell.before;
        currentCell.after = null;
        currentCell.before = null;
        currentCell.value = currentCell.isPublic ? 0 : currentCell.value;
    }
}

function deleteAfterPath(cell, whitResetValue) {
    whitResetValue = whitResetValue === undefined ? true : whitResetValue;
    var currentCell = cell;
    var afterCell = cell.after;
    cell.after = null;
    cell.value = cell.isPublic && whitResetValue ? 0 : cell.value;
    while (afterCell) {
        currentCell = afterCell;
        afterCell = afterCell.after;
        currentCell.after = null;
        currentCell.before = null;
        currentCell.value = currentCell.isPublic ? 0 : currentCell.value;
    }
}

var StepToPath = function (startCell) {
    var cell = startCell;
    this.getCurrentCell = function () {
        return cell;
    };
    this.nextAfterCell = function nextAfterCell() {
        if (cell.after !== null) {
            cell = cell.after;
            return cell
        } else {
            return null;
        }
    };
    this.nextBeforeCell = function () {
        if (cell.before !== null) {
            cell = cell.before;
            return cell
        } else {
            return null;
        }
    };
    this.getAndGoToStartCell = function () {
        if (cell.after !== null) {
            while (cell.after) {
                cell = cell.after
            }
        }
        return cell;
    };
    this.getAndGoToEndCell = function () {
        if (cell.before !== null) {
            while (cell.before) {
                cell = cell.before
            }
        }
        return cell;
    };
    this.getStartCell = function () {
        var currentCell = cell;
        if (currentCell.after !== null) {
            while (currentCell.after) {
                currentCell = currentCell.after
            }
        }
        return currentCell;
    };
    this.getEndCell = function () {
        var currentCell = cell;
        if (currentCell.before !== null) {
            while (currentCell.before) {
                currentCell = currentCell.before;
            }
        }
        return currentCell;
    }
};


function rebuilField() {
    buildPath();

    function buildPath() {
        log("START buildPath");
        var data = CurrentLevel.GetCurrentState();
        CurrentLevel.GetCurrentState().forEach(function (row) {
            row.forEach(function (cell) {
                if (cell.isPublic) {
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
            })
        });
        log("END buildPath");
    }
}

function addDirection(cell, className) {
    removeClassByStartName(cell, "d_");
    addClass(cell.dom, className);
    addClass(cell.dom, getColorClass(cell.value));
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


function findNeighbors(cell) {
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
            data[possiblePath[i].y][possiblePath[i].x].isPublic) {
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