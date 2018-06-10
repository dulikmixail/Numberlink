var startGameBtn = document.getElementById("start-game");
startGameBtn.addEventListener("click", function () {
    if (isTouchDevice() && !isMobile.iOS()) {
        launchFullScreen(document.getElementsByTagName("body")[0]);
    }
    var states = new States();
    states.showState("state-levels");
});

var backBtns = document.querySelectorAll(".btn_back");
var fullBtn = document.getElementById("btn_full");
var clearBtn = document.getElementById("btn_clear");
var closeRule = document.getElementById("close_rule");
var showRule = document.getElementById("btn_show_rules");

document.addEventListener('DOMContentLoaded', function () { // Аналог $(document).ready(function(){
    backBtns.forEach(function (btn) {
        btn.addEventListener("click", function () {
            var states = new States();
            states.showState("state-levels");
        });
    });
    fullBtn.addEventListener("click", function () {
        launchFullScreen(body);
    });
    clearBtn.addEventListener("click", function () {
        clearField();
    });
    closeRule.addEventListener("click", function () {
        var states = new States();
        states.showState("state-main");
    });
    showRule.addEventListener("click", function () {
        var states = new States();
        states.showState("state-rules");
    });
});

startGameBtn.addEventListener("click", function () {
    var states = new States();
    states.showState("state-levels");
});

function preventDefault(e) {
    e = e || window.event;
    if (e.preventDefault)
        e.preventDefault();
    e.returnValue = false;
}

var States = function () {
    this.states = document.querySelectorAll(".state");
    this.getStateById = function (id) {
        var findState = null;
        this.states.forEach(function (state) {
            if (state.getAttribute("id") === id) {
                findState = state;
            }
        });
        return findState;
    };
    this.hideAllState = function () {
        this.states.forEach(function (state) {
            removeClass(state, "show");
        })
    };
    this.showState = function (id, notHideAllState) {
        var state = this.getStateById(id);
        if (state !== null) {
            if (!notHideAllState) {
                this.hideAllState();
            }
            addClass(state, "show");
        }
    }
};

var ItemValue = function (value, _isPublic, y, x) {
    this.value = value || 0;
    this.isPublic = _isPublic === false ? false : true;
    this.after = null;
    this.before = null;
    this.dom = null;
    this.y = y || 0;
    this.x = x || 0;
    this.setValue = function (value) {
        if (this.isPublic) {
            this.value = value;
        }
    };
    this.getValue = function () {
        return this.value;
    }
};

var GameStorage = function () {
    var numberCurrentLevel = -1;
    var storageLevel = {
        "isComplete": false,
        "data": null
    };
    this.setNumberCurrentLevel = function (number) {
        numberCurrentLevel = number;
    };
    this.getNumberCurrentLevel = function () {
        return numberCurrentLevel;
    };
    this.levelComplete = function () {
        storageLevel.isComplete = true;
        localStorage.setItem(numberCurrentLevel, JSON.stringify(storageLevel))
    };
    this.isLevelComplete = function () {
        return storageLevel.isComplete;
    };
    this.save = function () {
        var currentLevel = CurrentLevel.GetCurrentState();
        var copyLevel = [];
        currentLevel.forEach(function (row, j) {
            copyLevel[j] = [];
            row.forEach(function (cell, i) {
                var item = {
                    value: cell.value,
                    isPublic: cell.isPublic,
                };
                if (row[i + 1] !== undefined && cell.after === row[i + 1]) {
                    item.direction = 1;
                } else if (row[i - 1] !== undefined && cell.after === row[i - 1]) {
                    item.direction = 3;
                } else if (currentLevel[j + 1] !== undefined && cell.after === currentLevel[j + 1][i]) {
                    item.direction = 2;
                } else if (currentLevel[j - 1] !== undefined && cell.after === currentLevel[j - 1][i]) {
                    item.direction = 4;
                } else {
                    item.direction = 0;
                }
                copyLevel[j][i] = item;
            })
        });
        storageLevel.data = copyLevel;
        localStorage.setItem(numberCurrentLevel, JSON.stringify(storageLevel))
    };
    this.load = function (number) {
        number = number !== undefined ? number : numberCurrentLevel !== null ? numberCurrentLevel : null;
        if (number != null) {
            var storage = JSON.parse(localStorage.getItem(number.toString()));
            var newObj = null;
            if (storage !== undefined && storage !== null) {
                storageLevel = storage;
                var obj = storage.data;
                newObj = [];
                for (var j = 0; j < obj.length; j++) {
                    var row = obj[j];
                    newObj[j] = [];
                    for (var i = 0; i < row.length; i++) {
                        var cell = row[i];
                        newObj[j][i] = new ItemValue(cell.value, cell.isPublic, j, i);
                    }
                }
                for (j = 0; j < obj.length; j++) {
                    row = obj[j];
                    for (i = 0; i < row.length; i++) {
                        cell = row[i];
                        switch (cell.direction) {
                            case 1:
                                newObj[j][i].after = newObj[j][i + 1];
                                newObj[j][i + 1].before = newObj[j][i];
                                break;
                            case 2:
                                newObj[j][i].after = newObj[j + 1][i];
                                newObj[j + 1][i].before = newObj[j][i];
                                break;
                            case 3:
                                newObj[j][i].after = newObj[j][i - 1];
                                newObj[j][i - 1].before = newObj[j][i];
                                break;
                            case 4:
                                newObj[j][i].after = newObj[j - 1][i];
                                newObj[j - 1][i].before = newObj[j][i];
                                break;
                            case 0:
                                newObj[j][i].after = null;
                                break;
                        }
                    }
                }
            }
            return newObj;
        } else return null;
    }
};


var Level = function (level) {
    var data = level.data;
    var _data = [];
    for (var i = 0; i < level.size; i++) {
        _data[i] = [];
        for (var j = 0; j < level.size; j++) {
            var item = new ItemValue();
            item.y = i;
            item.x = j;
            _data[i][j] = item;
        }
    }
    for (var i = 0; i < data.length; i += 2) {
        _data[data[i].y][data[i].x].value = (i / 2) + 1;
        _data[data[i].y][data[i].x].isPublic = false;
        _data[data[i + 1].y][data[i + 1].x].value = (i / 2) + 1;
        _data[data[i + 1].y][data[i + 1].x].isPublic = false;
    }

    this.GetCurrentState = function () {
        return _data;
    };
    this.SetCurrentState = function (data) {
        _data = data
    };
};

var CurrentLevel, stateElements, gameStorage;
level_Init = function () {
    var startDate = new Date(settings.game.startDate);
    // startDate.setHours(startDate.getHours()-3);
    var numberActiveLevels = settings.game.numberActiveLevels;
    var today = new Date();
    var numberLevels = 0;
    if (today >= startDate && numberActiveLevels === 0) {
        numberLevels = (((today - startDate) / (24 * 60 * 60 * 1000)) + 1) | 0;
    } else {
        numberLevels = numberActiveLevels;
    }
    stateElements = document.querySelectorAll('[id^="state-"]');
    var levels_wrapper = document.querySelector('.levels_wrapper');
    var level_tml = levels_wrapper.innerHTML;
    // levels_wrapper.innerHTML = '';
    numberLevels = numberLevels < Levels.length ? numberLevels : Levels.length;
    for (var i = 0; i < numberLevels; i++) {
        levels_wrapper.innerHTML += '<div class="level" data-level="' + i + '">' + (i + 1) + '<span></span></div >';
    }
    document.querySelectorAll('[data-level]').forEach(function (v) {
        v.addEventListener('click', function () {
            if (isTouchDevice() && !isMobile.iOS()) {
                launchFullScreen(document.getElementsByTagName("body")[0]);
            }
            var number = +this.getAttribute('data-level');
            log("changed level:", number);
            startGame(Levels[number], number);
        })
    });
};

startGame = function (level, number) {
    CurrentLevel = new Level(level);
    gameStorage = new GameStorage();
    gameStorage.setNumberCurrentLevel(number);
    var dataStorage = gameStorage.load();
    if (dataStorage && !gameStorage.isLevelComplete()) {
        CurrentLevel.SetCurrentState(dataStorage);
    }
    stateElements.forEach(function (v) {
        if (v.id == 'state-game')
            addClass(v, 'show');
        else
            removeClass(v, 'show');
    });
    loadGameField();
    game_Init();
};
level_Init();

loadGameField = function (level) {
    var lvl = level !== undefined ? level : CurrentLevel !== undefined ? CurrentLevel : false;
    var data = lvl.GetCurrentState();
    var row, cell;
    if (lvl) {
        var table = document.getElementById("table");
        table.innerHTML = '';
        removeClassByStartName(table, "size-");
        addClass(table, "size-" + data.length);
        for (var i = 0; i < data.length; i++) {
            row = createRow();
            for (var j = 0; j < data.length; j++) {
                if (data[i][j].isPublic) {
                    cell = createCell();
                    data[i][j].dom = cell;

                } else {
                    cell = createCell();
                    addClass(cell.firstChild, "color-" + data[i][j].value);
                    addClass(cell.firstChild, "disabled");
                    data[i][j].dom = cell;
                }
                row.appendChild(cell);
            }
            table.appendChild(row);
        }
    }

    function createRow() {
        var row = document.createElement("div");
        addClass(row, "row");
        return row;
    }

    function createCell() {
        var cell = document.createElement("div");
        addClass(cell, "cell");
        cell.innerHTML = '<div class="value_wrapper"><span></span></div>';
        return cell;
    }

    rebuildField();
};


addClass = function (el, className) {
    if (el.classList)
        el.classList.add(className);
    else
        el.className += ' ' + className;
};

removeClassByStartName = function (cell, className) {
    if (cell.dom !== undefined && cell.dom.className !== undefined) {
        cell.dom.className = cell.dom.className.replace(new RegExp('(^|\\b)' + className + '.+ '.split(' ').join('|') + '(\\b|$)', 'gi'), '');
    }
    if (cell !== undefined && cell.className !== undefined) {
        cell.className = cell.className.replace(new RegExp('(^|\\b)' + className + '.+ '.split(' ').join('|') + '(\\b|$)', 'gi'), '');
    }
};

removeClass = function (el, className) {
    if (el.classList)
        el.classList.remove(className);
    else
        el.className = el.className.replace(new RegExp('(^|\\b)' + className.split(' ').join('|') + '(\\b|$)', 'gi'), ' ');
};