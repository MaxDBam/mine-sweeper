'use strict'

var gBoard;

var gLevel = [{
    SIZE: 4,
    MINES: 2
},
{
    SIZE: 8,
    MINES: 12
},
{
    SIZE: 12,
    MINES: 30
}
];

var gGame = {
    isOn: false,
    shownCount: 0,
    markedCount: 0,
    secsPassed: 0
};

var gChosenLevel;
var gFirstClick = false;
var gMoves;


var MINE = '💣';
var FLAG = '🚩';
var gHints = '💡💡💡';
var gLives = '🧡🧡🧡';
var mineExplosionAudio = new Audio('mixkit-sea-mine-explosion-1184.wav');
var gNumOfHintsUsed;
var gClickedHint = false;
var gClickedOnAMine;
var gFlagsCount;

var elHintModal = document.querySelector('.hint-modal');
document.querySelector('.timer').innerText = gGame.secsPassed;

var gTimer;

function initGame(level) {
    document.querySelector('.play-again-btn').innerText = '🙂';
    gClickedOnAMine = 0;
    gNumOfHintsUsed = 0;
    gGame.shownCount = 0;
    gGame.secsPassed = 0;
    gHints = '💡💡💡';
    gLives = '🧡🧡🧡';
    document.querySelector('.hints').textContent = gHints;
    document.querySelector('.lives').innerText = gLives;
    document.querySelector('.timer').innerText = gGame.secsPassed;
    document.querySelector('.hints').style.width = '50px';
    document.querySelector('.hints').style.display = 'initial';
    clearInterval(gTimer);
    gMoves = 0;
    gChosenLevel = level;
    gFlagsCount = gChosenLevel.MINES;
    document.querySelector('.flags-counter').innerText = gFlagsCount;
    gBoard = buildBoard(level);
    renderBoard(gBoard);
}

function buildBoard(level) {
    var board = [];

    for (var i = 0; i < level.SIZE; i++) {
        board[i] = [];
        for (var j = 0; j < level.SIZE; j++) {
            board[i][j] = {
                minesAroundCount: 0,
                isShown: false,
                isMine: false,
                isMarked: false,
                gameElement: null
            };
        }
    }
    return board;
}

function setMinesNegsCount(mat) {
    // var minesNegsCount = 0;
    for (var i = 0; i < mat.length; i++) {
        for (var j = 0; j < mat[i].length; j++) {
            if (mat[i][j].isMine) {
                for (var k = i - 1; k <= i + 1; k++) {
                    if (k < 0 || k >= mat.length) continue;
                    for (var l = j - 1; l <= j + 1; l++) {
                        if (l < 0 || l >= mat[i].length) {
                            continue;
                        }
                        if (k === i && l === j) {
                            continue;
                        }
                        mat[k][l].minesAroundCount++;
                    }
                }
            }
        }
    }
}

function renderBoard(board) {
    var strHTML = '';
    for (var i = 0; i < board.length; i++) {
        strHTML += '<tr>';
        for (var j = 0; j < board[i].length; j++) {
            // var shownCell = (gBoard[i][j].isMine) ? MINE : gBoard[i][j].minesAroundCount;
            var className = (board[i][j].isShown) ? 'opened-cell' : 'closed-cell';
            var dataName = `data-i="${i}" data-j="${j}"`;
            strHTML += `<td ${dataName} onclick="cellClicked(this, ${i}, ${j})" oncontextmenu="cellMarked(this, ${i}, ${j})" class="${className}"></td>`;
            // if (gBoard[i][j].isMine) {
            //     board[i][j].gameElement = MINE; 
            // }
        }
        strHTML += '</tr>';
    }
    var elTBody = document.querySelector('.board');
    elTBody.innerHTML = strHTML;
}

function cellClicked(elCell, i, j) {
    if (document.querySelector('.play-again-btn').innerText === '🙂'){
        gGame.isOn = true;

    } else return;
    if (gBoard[i][j].isMarked || gBoard[i][j].isShown) {
        return;
    }

    if (gGame.isOn) {
        // Need to take care of this in a better way
        if (gMoves === 0) {
            // gamerTimer();
            gTimer = setInterval(function () {
                gGame.secsPassed++;
                document.querySelector('.timer').innerText = gGame.secsPassed;

            }, 1000);
            // setTimeout(function () {
            for (var k = 0; k < gChosenLevel.MINES; k++) {
                var placeMine = possibleMinePlacing(i, j)[getRandomInt(0, possibleMinePlacing(i, j).length)];          
                if (gBoard[placeMine.i][placeMine.j].isMine === true) {
                    k--;
                } else {
                    gBoard[placeMine.i][placeMine.j].isMine = true;
                    console.log(placeMine.i, placeMine.j);
                }
            }
            setMinesNegsCount(gBoard);
        }
    }
    gMoves++;

    var shownCell = (gBoard[i][j].isMine) ? MINE : gBoard[i][j].minesAroundCount;
    if (shownCell === MINE && !gClickedHint) {
        mineExplosionAudio.play();
        gBoard[i][j].isShown = true;
        elCell.innerText = shownCell;
        elCell.classList.remove('closed-cell');
        elCell.classList.add('opened-cell');
        // gGame.shownCount++;
        gameLivesLeft();
        if (gClickedOnAMine === 3) {
            checkGameOver('lose');
        }
    } else if (shownCell > 0 && !gClickedHint) {
        gBoard[i][j].isShown = true;
        elCell.innerText = shownCell;
        elCell.classList.remove('closed-cell');
        elCell.classList.add('opened-cell');
        gGame.shownCount++;
        checkGameOver('win');
    } else expandShown(gBoard, elCell, i, j);

    if (gClickedHint) {
        expandShown(gBoard, elCell, i, j);
    }
}

function possibleMinePlacing(coordI, coordJ) {
    var placesToPutMinesIn = [];
    for (var m = 0; m < gBoard.length; m++) {
        for (var n = 0; n < gBoard[m].length; n++) {
            if (m === coordI - 1 && n === coordJ - 1 || m === coordI + 1 && n === coordJ + 1 || m === coordI - 1 && n === coordJ + 1 ||
                m === coordI + 1 && n === coordJ - 1 || m === coordI && n === coordJ || m === coordI + 1 && n === coordJ ||
                m === coordI - 1 && n === coordJ || m === coordI && n === coordJ + 1 || m === coordI && n === coordJ - 1) {
                continue;
            } else {
                placesToPutMinesIn.push({
                    i: m,
                    j: n
                });
            }         
        }
    }
    return placesToPutMinesIn;
}

window.addEventListener('contextmenu',function (e) {
    e.preventDefault();
}, false);

function cellMarked(elCell, i, j) {
    if (!gGame.isOn) {
        return;
    }
    if (gBoard[i][j].isShown) {
        return;
    } 
    if (!gBoard[i][j].isMarked) {
        if (gFlagsCount === 0) {
            return;
        } else {
            gBoard[i][j].isMarked = true;
            elCell.innerText = FLAG;
            document.querySelector('.flags-counter').innerText = --gFlagsCount;
            console.log(gFlagsCount);
            checkGameOver('win');
        }     
    } else {
        if (gFlagsCount === gChosenLevel.MINES) {
            return;
        } else {
            gBoard[i][j].isMarked = false;
            elCell.innerText = '';
            document.querySelector('.flags-counter').innerText = ++gFlagsCount;

        }
    }
}

function checkGameOver(result) {
    if (result === 'lose') {
        document.querySelector('.play-again-btn').innerText = '💀'
        for (var i = 0; i < gBoard.length; i++) {
            for (var j = 0; j < gBoard[i].length; j++) {
                if (gBoard[i][j].isMine) {
                    gBoard[i][j].isShown = true;
                    gGame.shownCount++;
                    renderCell(i, j, MINE);
                }
            }
        } 
        gGame.isOn = false;
        clearInterval(gTimer);
    } else if ( result === 'win' && gGame.shownCount + gGame.markedCount === ((gChosenLevel.SIZE) ** 2 - gChosenLevel.MINES) || gGame.shownCount === (gChosenLevel.SIZE ** 2)) {
        document.querySelector('.play-again-btn').innerText = '😎';
        gGame.isOn = false;
        clearInterval(gTimer);
    }
}

function expandShown(board, elCell, i, j) {
    if (board[i][j].minesAroundCount === 0 && !board[i][j].isMine && !gClickedHint && !board[i][j].isMarked) {
        for (var k = i - 1; k <= i + 1; k++) {
            if (k < 0 || k >= board.length) continue;
            for (var l = j - 1; l <= j + 1; l++) {
                if (l < 0 || l >= board[i].length) continue;
                if (board[k][l].minesAroundCount >= 0 && !board[k][l].isMine) {
                    if (!board[k][l].isShown && !board[k][l].isMarked) {
                        board[k][l].isShown = true;
                        gGame.shownCount++;
                    }
                    if (board[k][l].isMarked) {
                        checkGameOver('win');
                        continue;
                    } else {
                        renderCell(k, l, board[k][l].minesAroundCount);
                    }
                }
            }
        }
        checkGameOver('win');
    }
    if (gClickedHint) {
        for (var m = i - 1; m <= i + 1; m++) {
            if (m < 0 || m >= board.length) continue;
            for (var n = j - 1; n <= j + 1; n++) {
                if (n < 0 || n >= board[i].length) continue;
                if (board[m][n].isMarked) {
                    continue;
                }
                var shownCell = (board[m][n].isMine) ? MINE : board[m][n].minesAroundCount;
                renderCell(m, n, shownCell);
            }
        }
        setTimeout(function () {
            for (var o = 0; o < board.length; o++) {
                for (var p = 0; p < board[o].length; p++) {
                    if (!board[o][p].isShown) {
                        renderCellsAfterUsingHint(o, p);
                    }
                }
            }
            gClickedHint = false;
            elHintModal.style.display = 'none';
        }, 1000)
    }
}

function gameHints() {
    if (!gGame.isOn) {
        return;
    }
    if (gClickedHint) {    
        return;
    } 
    gNumOfHintsUsed++;
    gClickedHint = true;
    if (gNumOfHintsUsed > 2) {
        document.querySelector('.hints').style.display = 'none';
        // return;
    } 
    elHintModal.style.display = 'block';
    
    if (gNumOfHintsUsed > 0) {
        document.querySelector('.hints').style.width = '33px';
        document.querySelector('.hints').innerText = gHints.substring(gNumOfHintsUsed * 2);
        if (gNumOfHintsUsed === 3 && !gClickedHint) elHintModal.style.display = 'hidden';
    } 
}

function gameLivesLeft() {
    gClickedOnAMine++;
    if (gClickedOnAMine > 0) {
        document.querySelector('.lives').innerText = gLives.substring(gClickedOnAMine * 2);
    }
}

function gamerTimer() {
}

function renderCell(i, j, value) {
    var elCell = document.querySelector(`[data-i="${i}"][data-j="${j}"]`);
    elCell.classList.remove('closed-cell');
    elCell.innerText = value;
    elCell.classList.add('opened-cell');
}

function renderCellsAfterUsingHint(i, j) {
    var elCell = document.querySelector(`[data-i="${i}"][data-j="${j}"]`);
    if (elCell.classList.contains('opened-cell')) {
        elCell.classList.remove('opened-cell');
        elCell.innerText = '';
        elCell.classList.add('closed-cell');
    }
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}
// var elTd = document.querySelector('td');
// elTd.addEventListener('dblclick', function (e) {
//     e.preventDefault();
// });
