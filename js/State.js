var ItemValue = function (value, _isPublic) {
    this.value = value || 0;
    this.isPublic = _isPublic === false ? false : true;
    this.after = null;
    this.before = null;
    this.dom = null;
    this.y = -1;
    this.x = -1;
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
    }
};

var CurrentLevel, stateElements;
level_Init = function () {
    stateElements = document.querySelectorAll('[id^="state-"]');
    var levels_wrapper = document.querySelector('.levels_wrapper');
    var level_tml = levels_wrapper.innerHTML;
    levels_wrapper.innerHTML = '';
    for (var i = 0; i < Levels.length; i++) {
        levels_wrapper.innerHTML += '<div class="level" data-level="' + i + '">level ' + (i + 1) + '</div >';
    }
    document.querySelectorAll('[data-level]').forEach(function (v) {
        v.addEventListener('click', function () {
            var number = +this.getAttribute('data-level');
            log("changed level:", number);
            startGame(Levels[number]);
        })
    });
};

startGame = function (level) {
    CurrentLevel = new Level(level);
    stateElements.forEach(function (v) {
        if (v.id == 'state-game')
            addClass(v, 'show');
        else
            removeClass(v, 'show');
    });
    loadGameField();
    game_Init();
    log('START GAME', CurrentLevel.GetCurrentState());
};

loadGameField = function (level) {
    var lvl = level !== undefined ? level : CurrentLevel !== undefined ? CurrentLevel : false;
    var data = lvl.GetCurrentState();
    var row, cell;
    if (lvl) {
        var table = document.getElementById("table");
        table.innerHTML = '';
        addClass(table, "size-" + data.length);
        for (var i = 0; i < data.length; i++) {
            row = createRow();
            for (var j = 0; j < data.length; j++) {
                if (data[i][j].value === 0) {
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
        cell.innerHTML = '<div class="value_wrapper"></div>';
        return cell;
    }
};

level_Init();

addClass = function (el, className) {
    if (el.classList)
        el.classList.add(className);
    else
        el.className += ' ' + className;
};

removeClassByStartName = function (cell, className) {
    log("Class name:", cell.dom.className);
    cell.dom.className = cell.dom.className.replace(new RegExp('(^|\\b)' + className + '.+ '.split(' ').join('|') + '(\\b|$)', 'gi'), '');
    log("Remove class name:", cell.dom.className);
};

removeClass = function (el, className) {
    if (el.classList)
        el.classList.remove(className);
    else
        el.className = el.className.replace(new RegExp('(^|\\b)' + className.split(' ').join('|') + '(\\b|$)', 'gi'), ' ');
};