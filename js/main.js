const CELL = null;
const FLAG = '🚩';
const SHOW = 'SHOW';
const HIDE = 'HIDE';
const HAPPY = '<img src="img/smile1.png"/>';
const SAD = '<img src="img/sad1.png"/>';
const VICTORY = 'img src="img/sunglass1.png"/>';
// const HEART =

var gTime;
var gSeconds = 0;
var gMinutes = 0;

// var gLives = 3;
var gSize = 4;
var gMines = 2;
var gFlagsCount = 2;
var gLevel = [
    { id: 1, name: 'Beginner', SIZE: 4, MINES: 2 },
    { id: 2, name: 'Medium', SIZE: 8, MINES: 15 },
    { id: 3, name: 'Expert', SIZE: 12, MINES: 30 }
];

var gBoard = buildBoard();
var gFirstClick = true;




function buildBoard() {
    var size = gSize;
    var board = new Array(size);
    for (var i = 0; i < board.length; i++) {
        board[i] = new Array(size);
    }

    for (var i = 0; i < board.length; i++) {
        for (var j = 0; j < board[0].length; j++) {
            var cell = {
                type: HIDE,
                gameElement: null,
                mine: false,
                flag: false,
                location: { i: i, j: j }
            };
            board[i][j] = cell;
        }
    }
    return board;
}


function renderMinesCount() {
    var strHTML = '';
    strHTML = '<div class="mines-count">' + gFlagsCount + '</div>';
    var elBoard = document.querySelector('.mines-container');
    elBoard.innerHTML = strHTML;
}

function renderBoard(board) {
    var strHTML = '';
    strHTML += '<th  colspan="' + gSize + '">'
    strHTML += '<div class="mines-count"></div></th>'
    for (var i = 0; i < board.length; i++) {
        strHTML += '<tr>\n';
        for (var j = 0; j < board[0].length; j++) {
            var currCell = board[i][j];
            var tdId = 'cell-' + i + '-' + j;
            var cellClass = '';
            if (currCell.type === SHOW) cellClass += 'shown';
            strHTML += '\t<td id="' + tdId + '" class="cell ' + cellClass + '" onmousedown="cellMarked(this, event)"'
            strHTML += ' onclick="cellClicked(this)">\n';

            if (currCell.type === SHOW) {
                if (currCell.mine === true) {
                    strHTML += '<img src="img/mine.png">';
                } else strHTML += '<img src="img/' + currCell.gameElement + '.png">';
            } else if (currCell.flag === true) strHTML += FLAG;
        }
        strHTML += '</tr>\n';
    }

    var elBoard = document.querySelector('.board');
    elBoard.innerHTML = strHTML;
}

function renderTime() {
    var strHTML = '';
    strHTML += '<div class="clock"></div>';
    var elBoard = document.querySelector('.clock-container');
    elBoard.innerHTML = strHTML;
}

function getFirstClick(i, j) {
    setMinesNegsCount(i, j);
    gTime = setInterval(startTime, 1000);
    gFirstClick = false;
}

function expandShown(i, j) {
    var negs = findNegs(i, j);
    for (var k = 0; k < negs.length; k++) {
        if (negs[k].mine === false && negs[k].type === HIDE) {
            if (negs[k].gameElement !== 0) {
                negs[k].type = SHOW;
            } else {
                negs[k].type = SHOW;
                expandShown(negs[k].location.i, negs[k].location.j);
            }
        }
    }
}

function cellClicked(elCell, event) {
    var cellCoord = getCellCoord(elCell.id);
    var i = cellCoord.i;
    var j = cellCoord.j;
    if (gFirstClick) getFirstClick(i, j);
    if (gBoard[i][j].gameElement === 0) expandShown(i, j);
    if (gBoard[i][j].flag) return;
    else {
        gBoard[i][j].type = SHOW;
        if (gBoard[i][j].mine === true) {

            gameOver(true);
        }
        gameOver(checkVictory());
    }
    renderBoard(gBoard);
}


function getCellCoord(strCellId) {
    var coord = {};
    coord.i = +strCellId.substring(5, strCellId.lastIndexOf('-'));
    coord.j = +strCellId.substring(strCellId.lastIndexOf('-') + 1);
    return coord;
}


function cellMarked(elCell, event) {
    var cellCoord = getCellCoord(elCell.id);
    var i = cellCoord.i;
    var j = cellCoord.j;

    if (event.button === 2) {
        if (gBoard[i][j].flag === false && gBoard[i][j].type === HIDE) {
            gBoard[i][j].flag = true;
            gFlagsCount--;
            renderMinesCount();
            checkVictory();
            renderBoard(gBoard);
            return;
        }
        if (gBoard[i][j].flag = true) {
            gBoard[i][j].flag = false;
            gFlagsCount++;
            renderMinesCount();
            renderBoard(gBoard);
        }
    }
}

function setMinesNegsCount(i, j) {
    addMines(i, j);
    for (var m = 0; m < gBoard.length; m++) {
        for (var n = 0; n < gBoard[0].length; n++) {
            var mines = countNegsMine(findNegs(m, n, gBoard));
            if (gBoard[m][n].mine === false) {
                gBoard[m][n].gameElement = mines;
            }
        }
    }
}

function addMines(i, j) {
    for (var count = 0; count < gMines;) {
        var mineLocation = getMineCoord(gBoard);
        var negs = findNegs(i, j);
        var isNeg = false;
        for (var i = 0; i < negs.length; i++) {
            if (negs[i] === mineLocation) {
                var isNeg = true;
                break;
            }
        }
        if (!isNeg && mineLocation.mine === false) {
            mineLocation.mine = true;
            count++;

        }
    }
}


function getMineCoord() {
    var i = getRandomInt(0, gSize - 1);
    var j = getRandomInt(0, gSize - 1);

    return gBoard[i][j];
}


function findNegs(i, j) {
    var negs = [];
    for (var k = -1; k < 2; k++) {
        if (gBoard[i + k] !== undefined) {
            for (var l = -1; l < 2; l++) {
                if (gBoard[i + k][j + l] !== undefined) {
                    var neg = gBoard[i + k][j + l];
                    negs.push(neg);
                }
            }
        }
    }

    return negs;
}


function countNegsMine(negs) {
    var count = 0;
    for (var i = 0; i < negs.length; i++) {
        if (negs[i].mine) count++;

    }
    return count;
}








function getLevel(elLevel) {
    var id = +elLevel.id;
    for (var i = 0; i < gLevel.length; i++) {
        if (id === gLevel[i].id) {
            gSize = gLevel[i].SIZE;
            gMines = gLevel[i].MINES;
            gFlagsCount = gMines;

        }
    }
    startPlay();

}



function init() {
    clearInterval(gTime);
    renderTime();

    renderMinesCount();
    renderBoard(gBoard);

}


function startPlay() {
    clearInterval(gTime);
    gBoard = [];
    gBoard = buildBoard();


    gFlagsCount = gMines;
    gFirstClick = true;
    document.querySelector('.play-btn').innerHTML = '🙂';

    init();


}


function gameOver(isTrue) {;
    if (isTrue) {
        for (var i = 0; i < gBoard.length; i++) {
            for (var j = 0; j < gBoard[0].length; j++) {
                if (gBoard[i][j].mine === true) gBoard[i][j].type = SHOW;
                document.querySelector('.play-btn').innerHTML = '😟';
            }
        }

    }


}



function checkVictory() {
    for (var i = 0; i < gBoard.length; i++) {
        for (var j = 0; j < gBoard[0].length; j++) {
            var cell = gBoard[i][j];
            if (cell.type === HIDE && cell.mine === false) return false;
            if (cell.mine === true && cell.flag === false) return false;

        }
    }
    document.querySelector('.btn-play').innerHTML = VICTORY;
    clearInterval(gTime);
    return true;
}

function startTime() {
    gSeconds++;
    if (gSeconds === 60) {
        gSeconds = 0;
        gMinutes++;
    }
    if (gSeconds < 10) {
        gSeconds = '0' + gSeconds;
    };

    document.querySelector('.clock').innerHTML = gMinutes + ':' + gSeconds;
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}


document.addEventListener('contextmenu', event => event.preventDefault());