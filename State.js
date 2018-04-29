var ItemValue = function (value, _isPublic) {
    this.value = value || 0;
    this.isPublic = _isPublic === false ? false : true;
    this.after = null;
    this.before = null;
};

var Level = function (level) {
    var data = level.data;
    var _data = [];
    for (var i = 0; i < level.size; i++) {
        _data[i] = [];
        for (var j = 0; j < level.size; j++) {
            _data[i][j] = new ItemValue();
        }
    }
    for (var i = 0; i < level.size; i++) {
        _data[data[i].x][data[i].y].value = (i / 2).toFixed() + 1;
        _data[data[i].x][data[i].y].isPublic = false;
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
            console.log("changed level: ", number);
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
    console.log(JSON.stringify(Levels[level_number]));
};

level_Init();

addClass = function (el, className) {
    if (el.classList)
        el.classList.add(className);
    else
        el.className += ' ' + className;
};

removeClass = function (el, className) {
    if (el.classList)
        el.classList.remove(className);
    else
        el.className = el.className.replace(new RegExp('(^|\\b)' + className.split(' ').join('|') + '(\\b|$)', 'gi'), ' ');
};