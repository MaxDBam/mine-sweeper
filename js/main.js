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

var mineExplosionAudio = new Audio('mixkit-sea-mine-explosion-1184.wav');
var gNumOfHintsUsed;
var gClickedHint = false;
var gClickedOnAMine;
var gFlagsCount;
var gSafeClicksUsed;
var gUsedASafeClick = false;
var gNumOfSafeClicks;
var elSafeClicks = document.querySelector('.num-of-clicks');
var gClickedOnAManualMode = false;
var gCountOfMines;
var gPlayingInManualMode = false;
var gUndoSteps = false;
var gSteppedOnMines = [];

var elHintModal = document.querySelector('.hint-modal');
document.querySelector('.timer').innerText = gGame.secsPassed;
var gBestBeginnerScore = document.querySelector('.beginner-score');
var gBestMediumScore = document.querySelector('.medium-score');
var gBestExpertScore = document.querySelector('.expert-score');

var gTimer;

function initGame(level) {
    document.querySelector('.play-again-btn').src = 'img/happy.png';
    gPlayingInManualMode = false;
    gClickedOnAManualMode = false;
    gUndoSteps = false;
    gSteppedOnMines = [];
    gSafeClicksUsed = 0;
    gClickedOnAMine = 0;
    gNumOfHintsUsed = 0;
    gGame.shownCount = 0;
    gGame.secsPassed = 0;
    gNumOfSafeClicks = 3;
    document.querySelector('.lives').innerHTML = '<img src="img/heart.png" alt="heart image" class="heart-img"/><img src="img/heart.png" alt="heart image" class="heart-img"/><img src="img/heart.png" alt="heart image" class="heart-img"/>';
    document.querySelector('.hints').innerHTML = '<img src="img/hint.png" alt="hint image" class="hint-img"/><img src="img/hint.png" alt="hint image" class="hint-img"/><img src="img/hint.png" alt="hint image" class="hint-img"/>';
    document.querySelector('.timer').innerText = gGame.secsPassed;
    document.querySelector('.hints').style.width = '50px';
    document.querySelector('.hints').style.display = 'initial';
    document.querySelector('.num-of-clicks').innerText = gNumOfSafeClicks + ' clicks available';
    document.querySelector('.manual-game-activated').style.display = 'none';
    clearInterval(gTimer);
    gMoves = 0;
    gChosenLevel = level;
    gFlagsCount = gChosenLevel.MINES;
    document.querySelector('.flags-counter').innerText = gFlagsCount;
    gBoard = buildBoard(level);
    renderBoard(gBoard);
    if (localStorage.getItem('BestTimeBeginner') !== null) {
        document.querySelector('.beginner-score').innerText = window.localStorage.getItem('PlayersNameBeginner') + ' ' + window.localStorage.getItem('BestTimeBeginner');
    }

    if (localStorage.getItem('BestTimeMedium') !== null) {
        document.querySelector('.medium-score').innerText = window.localStorage.getItem('PlayersNameMedium') + ' ' + window.localStorage.getItem('BestTimeMedium');
    }

    if (localStorage.getItem('BestTimeExpert') !== null) {
        document.querySelector('.expert-score').innerText = window.localStorage.getItem('PlayersNameExpert') + ' ' + window.localStorage.getItem('BestTimeExpert');
    }
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
                isMarked: false
            };
        }
    }

    return board;
}

function renderBoard(board) {
    var strHTML = '';
    for (var i = 0; i < board.length; i++) {
        strHTML += '<tr>';
        for (var j = 0; j < board[i].length; j++) {
            var className = (board[i][j].isShown) ? 'opened-cell' : 'closed-cell';
            var dataName = `data-i="${i}" data-j="${j}"`;
            strHTML += `<td ${dataName} onclick="cellClicked(this, ${i}, ${j})" oncontextmenu="cellMarked(this, ${i}, ${j})" class="${className}"></td>`;
        }
        strHTML += '</tr>';
    }
    var elTBody = document.querySelector('.board');
    elTBody.innerHTML = strHTML;
}

function cellClicked(elCell, i, j) {
    var img = document.querySelector('.play-again-btn');
    if (img.getAttribute('src') === 'img/happy.png' && !gClickedOnAManualMode) {
        gGame.isOn = true;

    } else {
        placeMinesManually(elCell, i, j);
        return;
        
    }


    if (gBoard[i][j].isMarked || gBoard[i][j].isShown) {
        return;
    }

    if (gGame.isOn) {
        if (gMoves === 0 && !gPlayingInManualMode) {
            gamerTimer();
            for (var k = 0; k < gChosenLevel.MINES; k++) {
                var placeMine = possibleMinePlacing(i, j)[getRandomInt(0, possibleMinePlacing(i, j).length)];
                if (gBoard[placeMine.i][placeMine.j].isMine === true) {
                    k--;
                } else {
                    gBoard[placeMine.i][placeMine.j].isMine = true;
                }
            }
            setMinesNegsCount(gBoard);
        }
        if (gPlayingInManualMode && gMoves === 0) {
            gamerTimer();
        }
        gMoves++;
    
        var shownCell = (gBoard[i][j].isMine) ? '<img class="flag-mine-imgs" src="img/mine.png" alt="mine"/>' : gBoard[i][j].minesAroundCount;
        if (shownCell === '<img class="flag-mine-imgs" src="img/mine.png" alt="mine"/>' && !gClickedHint) {
            mineExplosionAudio.play();
            gBoard[i][j].isShown = true;
            elCell.innerHTML = shownCell;
            elCell.classList.remove('closed-cell');
            elCell.classList.add('opened-cell');
            gSteppedOnMines.push({
                i: i,
                j: j
            });
            gGame.shownCount++;
            gameLivesLeft();
            if (gClickedOnAMine === 3) {
                checkGameOver('lose');
            } 
        } else if (shownCell > 0 && !gClickedHint) {
            gBoard[i][j].isShown = true;
            renderCell(i, j, shownCell);
            gGame.shownCount++;
            checkGameOver('win');
        } else expandShown(gBoard, elCell, i, j);
    
        if (gClickedHint) {
            expandShown(gBoard, elCell, i, j);
        }
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

function setMinesNegsCount(mat) {
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

window.addEventListener('contextmenu', function (e) {

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
            elCell.innerHTML = '<img class="flag-mine-imgs" src=img/flag.png alt="flag"/>';
            document.querySelector('.flags-counter').innerText = --gFlagsCount;
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

function gamerTimer() {
    gTimer = setInterval(function () {
        gGame.secsPassed++;
        document.querySelector('.timer').innerText = gGame.secsPassed;
    }, 2000);
}

function checkGameOver(result) {
    if (result === 'lose') {
        document.querySelector('.play-again-btn').src = 'img/deadsmile.png';
        for (var i = 0; i < gBoard.length; i++) {
            for (var j = 0; j < gBoard[i].length; j++) {
                if (gBoard[i][j].isMine) {
                    gBoard[i][j].isShown = true;
                    gGame.shownCount++;
                    renderCell(i, j, '<img class="flag-mine-imgs" src="img/mine.png" alt="mine"/>');
                }
            }
        }
        gGame.isOn = false;
        clearInterval(gTimer);
    } else if (result === 'win' && gGame.shownCount + gGame.markedCount === ((gChosenLevel.SIZE) ** 2 - gChosenLevel.MINES + gClickedOnAMine) || gGame.shownCount + gClickedOnAMine === (gChosenLevel.SIZE ** 2) + gClickedOnAMine) {
        document.querySelector('.play-again-btn').src = 'img/sunglasses.png';
        gGame.isOn = false;
        clearInterval(gTimer);
        keepingBestScore();
    }
}

function expandShown(board, elCell, i, j) {
    if (!board[i][j].isMine && !gClickedHint && !board[i][j].isMarked) {
        for (var k = i - 1; k <= i + 1; k++) {
            if (k < 0 || k >= board.length) continue;
            for (var l = j - 1; l <= j + 1; l++) {
                if (l < 0 || l >= board[i].length) continue;
                if (board[k][l].minesAroundCount >= 0 && !board[k][l].isMine) {

                    if (!board[k][l].isShown && !board[k][l].isMarked) {
                        board[k][l].isShown = true;
                        gGame.shownCount++;
                        if (board[k][l].minesAroundCount === 0) {
                            expandShown(board, elCell, k, l);
                            renderCell(k, l, '');
                        } else {
                            renderCell(k, l, board[k][l].minesAroundCount)
                        }
                    }
                    if (board[k][l].isMarked) {
                        checkGameOver('win');
                        continue;
                    }
                    
                }
            }
        }
        checkGameOver('win');
    }
    if (gClickedHint) {
        expandCellsAfterUsingAHint(board, i, j);
    }
}

function showSafeCell() {
    if (!gGame.isOn || gUsedASafeClick || gSafeClicksUsed >= 3) {
        return;
    }
    var closedCells = [];
    gSafeClicksUsed++;
    if (gSafeClicksUsed > 0 && gSafeClicksUsed <= 3) {
        gUsedASafeClick = true;
        gNumOfSafeClicks--;
        if (gNumOfSafeClicks !== 1) {
            elSafeClicks.innerText = gNumOfSafeClicks + ' clicks available';

        } else {
            elSafeClicks.innerText = gNumOfSafeClicks + ' click available';
        }
        

        for (var k = 0; k < gBoard.length; k++) {
            for (var l = 0; l < gBoard[k].length; l++) {
                if (!gBoard[k][l].isShown && !gBoard[k][l].isMine && !gBoard[k][l].isMarked) {
                    closedCells.push({
                        i: k,
                        j: l
                    });
                }
            }
        }
    } else {
        return;
    }

    var randomSafeCell = closedCells[getRandomInt(0, closedCells.length)];
    renderSafeCell(randomSafeCell.i, randomSafeCell.j, '');
}

function renderSafeCell(i, j) {
    var elCell = document.querySelector(`[data-i="${i}"][data-j="${j}"]`);
    if (gUsedASafeClick) {
        elCell.classList.remove('closed-cell');
        elCell.classList.add('safe-cell');
        setTimeout(function () {
            elCell.classList.remove('safe-cell');
            elCell.classList.add('closed-cell');
            gUsedASafeClick = false;
        }, 1000);
    }
}

function gameHints() {
    var elHintImgs = document.querySelector('.hints');
    if (!gGame.isOn) {
        return;
    }
    if (gClickedHint) {
        return;
    }
    gNumOfHintsUsed++;
    gClickedHint = true;
    if (gNumOfHintsUsed > 2) {
        elHintImgs.style.display = 'none';
    }
    elHintModal.style.display = 'block';

    if (gNumOfHintsUsed > 0) {
        elHintImgs.removeChild(elHintImgs.childNodes[0]);
        if (gNumOfHintsUsed === 3 && !gClickedHint) elHintModal.style.display = 'hidden';
    }
}

function expandCellsAfterUsingAHint(board, coordI, coordJ) {
    for (var m = coordI - 1; m <= coordI + 1; m++) {
        if (m < 0 || m >= board.length) continue;
        for (var n = coordJ - 1; n <= coordJ + 1; n++) {
            if (n < 0 || n >= board[coordI].length) continue;
            if (board[m][n].isMarked) {
                continue;
            }
            var shownCell = (board[m][n].isMine) ? '<img class="flag-mine-imgs" src="img/mine.png" alt="mine"/>' : board[m][n].minesAroundCount;
            if (board[m][n].isMine) {
                renderCell(m, n, shownCell);
            } else if (!board[m][n].isMine && shownCell > 0) {
                renderCell(m, n, shownCell);
            } else {
                renderCell(m, n, '');
            }

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


function gameLivesLeft() {
    gClickedOnAMine++;
    var elHeartImgs = document.querySelector('.lives');
    if (gClickedOnAMine > 0) {
        elHeartImgs.removeChild(elHeartImgs.childNodes[0]);
    }
}



function renderCell(i, j, value) {
    var colorsOfNegs = ['', 'blue', 'green', 'red', 'purple', 'maroon', 'turquoise', 'black', 'gray'];
    var elCell = document.querySelector(`[data-i="${i}"][data-j="${j}"]`);
    elCell.classList.remove('closed-cell');
    if (gBoard[i][j].isMine) {
        elCell.innerHTML = value;
        elCell.classList.add('opened-cell');
    } else if (gBoard[i][j] === 0) {
        elCell.innerText = value; 
        elCell.classList.add('opened-cell');
    } else {
        elCell.innerText = value;
        elCell.style.color = colorsOfNegs[gBoard[i][j].minesAroundCount];
        elCell.classList.add('opened-cell');
    }
    if(gUndoSteps) {
        elCell.innerText = '';
        elCell.classList.remove('opened-cell');
        elCell.classList.add('closed-cell');
        gUndoSteps = false;
    }
}

function renderCellsAfterUsingHint(i, j) {
    var elCell = document.querySelector(`[data-i="${i}"][data-j="${j}"]`);
    if (elCell.classList.contains('opened-cell')) {
        elCell.classList.remove('opened-cell');
        elCell.innerText = '';
        elCell.classList.add('closed-cell');
    }
}

function keepingBestScore() {
    var playerName;
    if (gChosenLevel.SIZE === 4 && gChosenLevel.MINES === 2 && localStorage.getItem('BestTimeBeginner') === null) {
        playerName = prompt('Please enter a name to be shown on the score list');
        if (!playerName) {
            window.localStorage.setItem('PlayersNameBeginner', 'player');
        } else {
            window.localStorage.setItem('PlayersNameBeginner', playerName);
        }
        window.localStorage.setItem('BestTimeBeginner', gGame.secsPassed);
        document.querySelector('.beginner-score').innerText = window.localStorage.getItem('PlayersNameBeginner') + ' ' + window.localStorage.getItem('BestTimeBeginner');

    } else if (gChosenLevel.SIZE === 4 && gChosenLevel.MINES === 2 && gGame.secsPassed < +localStorage.getItem('BestTimeBeginner')) {
        playerName = prompt('Please enter a name to be shown on the score list');
        if (!playerName) {
            window.localStorage.setItem('PlayersNameBeginner', 'player');
        } else {
            window.localStorage.setItem('PlayersNameBeginner', playerName);
        }
        window.localStorage.setItem('BestTimeBeginner', gGame.secsPassed);
        document.querySelector('.beginner-score').innerText = window.localStorage.getItem('PlayersNameBeginner') + ' ' + window.localStorage.getItem('BestTimeBeginner');
    }

    if (gChosenLevel.SIZE === 8 && gChosenLevel.MINES === 12 && localStorage.getItem('BestTimeMedium') === null) {
        playerName = prompt('Please enter a name to be shown on the score list');
        if (!playerName) {
            window.localStorage.setItem('PlayersNameMedium', 'player');
        } else {
            window.localStorage.setItem('PlayersNameMedium', playerName);
        }
        window.localStorage.setItem('BestTimeMedium', gGame.secsPassed);
        document.querySelector('.medium-score').innerText = window.localStorage.getItem('PlayersNameMedium') + ' ' + window.localStorage.getItem('BestTimeMedium');
    } else if (gChosenLevel.SIZE === 8 && gChosenLevel.MINES === 12 && gGame.secsPassed < +localStorage.getItem('BestTimeMedium')) {
        playerName = prompt('Please enter a name to be shown on the score list');
        if (!playerName) {
            window.localStorage.setItem('PlayersNameMedium', 'player');
        } else {
            window.localStorage.setItem('PlayersNameMedium', playerName);
        }
        window.localStorage.setItem('BestTimeMedium', gGame.secsPassed);
        document.querySelector('.medium-score').innerText = window.localStorage.getItem('PlayersNameMedium') + ' ' + window.localStorage.getItem('BestTimeMedium');
    }

    if (gChosenLevel.SIZE === 12 && gChosenLevel.MINES === 30 && localStorage.getItem('BestTimeExpert') === null) {
        playerName = prompt('Please enter a name to be shown on the score list');
        if (!playerName) {
            window.localStorage.setItem('PlayersNameExpert', 'player');
        } else {
            window.localStorage.setItem('PlayersNameExpert', playerName);
        }
        window.localStorage.setItem('BestTimeExpert', gGame.secsPassed);
        document.querySelector('.expert-score').innerText = window.localStorage.getItem('PlayersNameExpert') + ' ' + window.localStorage.getItem('BestTimeExpert');
    } else if (gChosenLevel.SIZE === 12 && gChosenLevel.MINES === 30 && gGame.secsPassed < +localStorage.getItem('BestTimeExpert')) {
        playerName = prompt('Please enter a name to be shown on the score list');
        if (!playerName) {
            window.localStorage.setItem('PlayersNameExpert', 'player');
        } else {
            window.localStorage.setItem('PlayersNameExpert', playerName);
        }
        window.localStorage.setItem('BestTimeExpert', gGame.secsPassed);
        document.querySelector('.expert-score').innerText = window.localStorage.getItem('PlayersNameExpert') + ' ' + window.localStorage.getItem('BestTimeExpert');
    }

}

function manualMode(level) {
    initGame(level);
    gPlayingInManualMode = true;
    gClickedOnAManualMode = true;
    document.querySelector('.manual-game-activated').style.display = 'block';
}

function placeMinesManually(elCell, i, j) {
    if (!gClickedOnAManualMode) {
        return;
    }
    if (gFlagsCount > 0) {
        --gFlagsCount;
        document.querySelector('.flags-counter').innerText = gFlagsCount;
        gBoard[i][j].isMine = true;
        elCell.innerHTML = '<img class="flag-mine-imgs" src="img/mine.png" alt="mine"/>';
    } else {
        setMinesNegsCount(gBoard);
        gFlagsCount = gChosenLevel.MINES;
        document.querySelector('.flags-counter').innerText = gFlagsCount;
        gClickedOnAManualMode = false;
        coverMinesInManualMode();
        cellClicked(elCell, i, j);
        return;
    }
   
}

function coverMinesInManualMode() {
    for (var i = 0; i < gBoard.length; i++) {
        for (var j = 0; j < gBoard[i].length; j++) {
            if (gBoard[i][j].isMine) {
                document.querySelector(`[data-i="${i}"][data-j="${j}"]`).innerText = '';
            }
        }
    }
}

function undoStep() {
    var elHeartImgs = document.querySelector('.lives');
    var imgSrc = 'img/heart.png';
    var img = new Image();
    img.className = 'heart-img';
    img.src = imgSrc;
    if (gSteppedOnMines.length > 0) {
        gUndoSteps = true;
        gBoard[gSteppedOnMines[Object.keys(gSteppedOnMines).length - 1].i][gSteppedOnMines[Object.keys(gSteppedOnMines).length - 1].j].isShown = false;
        renderCell(gSteppedOnMines[Object.keys(gSteppedOnMines).length - 1].i, gSteppedOnMines[Object.keys(gSteppedOnMines).length - 1].j, '');
        gGame.shownCount--;
        gSteppedOnMines.splice(length - 1, 1);
        gClickedOnAMine--;
        elHeartImgs.appendChild(img);
    } else {
        return;
    }
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}
