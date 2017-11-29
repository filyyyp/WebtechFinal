const _puzzleHeight = document.getElementById('hra').clientWidth*0.8;
const _puzzleWidth = document.getElementById('hra').clientWidth*0.8;

const PUZZLE_HOVER_TINT = '#009900';
var delimiter = "---"; //pre cookies
var NumberOfBlocksVertical ;
var NumberOfBlocksHorizontal ;
var json;
var _stage;
var _canvas;
var _pieces;
var _pieceWidth;
var _pieceHeight;
var _currentPiece;
var _currentDropPiece;
var _mouse;
var _typeBlocks = [];
var _typeBlock;
var _backup;

var scorelvl;
var scoreall = 0;
var levelGame=0;
var username = "jozo";
var backupSteps = 0;
var touchM = false;

$.ajax({
    async: false,
    type: 'GET',
    url: 'rollTheBall.xml',
    success: function (xml) {
        json = xml2json(xml);
    }
});

function nextLevel() {
    levelGame++;
    scoreall = scoreall + scorelvl;
    document.getElementById("celkoveSkore").innerText="Celkove skore je: " + scoreall;
    var levelhry =Number(levelGame);
    levelhry++;
    document.getElementById("aktualnyLevel").innerText="Aktualny level: " + levelhry  + "/10";

    LoadGame(levelGame);
    drawImages()
}

function init() {
    LoadImages();
    LoadGame(levelGame);
    setCanvas();
    drawImages();

    _canvas.onmousedown = onClick;

    $('#canvas').on("touchstart", function (e, touch) {
        onClickT((e.originalEvent.touches[0].clientX-(document.getElementById('canvas').offsetLeft)),(e.originalEvent.touches[0].clientY-(document.getElementById('canvas').offsetParent.offsetTop+document.getElementById('canvas').offsetTop)));
        touchM=true;
    });

}

function LoadImages() {
    var blocks = json.rolltheball.blocks.block;
    for(var i = 0;i < blocks.length;i++)
    {
        var regExp = new RegExp('^\\.|\\.jpg$|\\.gif$|.png$');

        _typeBlock = new Image();
        _typeBlock.rotation = blocks[i].rotation;

        if(regExp.test(blocks[i].img)){
            _typeBlock.src = ('images/' + blocks[i].img);
        }
        _typeBlocks[blocks[i].name] = {image: _typeBlock};
    }
}

function LoadGame(level){
    var game = json.rolltheball.games.game[level];
    NumberOfBlocksHorizontal = game.size.horizontal;
    NumberOfBlocksVertical = game.size.vertical;
    _pieceWidth =_puzzleWidth / NumberOfBlocksVertical;
    _pieceHeight =_puzzleHeight / NumberOfBlocksHorizontal;
    var task = game.task;
    scorelvl = 1000;
    var levelhry =Number(levelGame);
    levelhry++;
    document.getElementById("aktualnyLevel").innerText="Aktualny level: " + levelhry  + "/10";
    document.getElementById("aktualneSkore").innerText="Aktualne skore je: " + scorelvl;
    document.getElementById("celkoveSkore").innerText="Celkove skore je: " + scoreall;




    task =task.replace(/;/g,',');

    var rows = task.split(',');


    _pieces = [];
    _mouse = {x:0,y:0};
    _currentPiece = null;
    _currentDropPiece = null;
    var i;
    var xPos = 0;
    var yPos = 0;
    for(i = 0;i < NumberOfBlocksVertical * NumberOfBlocksHorizontal;i++){
        var piece = {};
        piece.xPos = xPos;
        piece.yPos = yPos;
        piece.img = _typeBlocks[rows[i]].image;
        piece.type = rows[i];

        if(((rows[i]).match(/\d+/))!== null)
            piece.rotation = (rows[i]).match(/\d+/)[0];
        else
            piece.rotation = 0;

        _pieces.push(piece);
        xPos += _pieceWidth;
        if(xPos >= _puzzleWidth){
            xPos = 0;
            yPos += _pieceHeight;
        }
    }
}

function setCanvas(){
    _canvas = document.getElementById('canvas');
    _stage = _canvas.getContext('2d');
    _canvas.width = _puzzleWidth;
    _canvas.height = _puzzleHeight;
    _canvas.style.border = "1px solid black";
}

function onClick(e){
    _mouse.x = e.layerX;
    _mouse.y = e.layerY;

    _currentPiece = checkPieceClicked();
    if(_currentPiece != null){
        _stage.clearRect(_currentPiece.xPos,_currentPiece.yPos,_pieceWidth,_pieceHeight);
        _stage.save();
        _stage.globalAlpha = .9;
        _stage.drawImage(_currentPiece.img, _currentPiece.sx, _currentPiece.sy, _pieceWidth, _pieceHeight, _mouse.x - (_pieceWidth / 2), _mouse.y - (_pieceHeight / 2), _pieceWidth, _pieceHeight);
        _stage.restore();

        _canvas.onmousemove = updatePiecesMove;
        _canvas.onmouseup = pieceDropped;
    }
}


function onClickT(x,y){
    _mouse.x = x;
    _mouse.y = y;

    _currentPiece = checkPieceClicked();

    if(_currentPiece != null){
        _stage.clearRect(_currentPiece.xPos,_currentPiece.yPos,_pieceWidth,_pieceHeight);
        _stage.save();
        _stage.globalAlpha = .9;
        _stage.drawImage(_currentPiece.img, _currentPiece.sx, _currentPiece.sy, _pieceWidth, _pieceHeight, _mouse.x - (_pieceWidth / 2), _mouse.y - (_pieceHeight / 2), _pieceWidth, _pieceHeight);
        _stage.restore();

        $('#canvas').on("touchmove", function (e, touch) {
            updatePiecesMoveT((e.originalEvent.touches[0].clientX-(document.getElementById('canvas').offsetLeft)),(e.originalEvent.touches[0].clientY-(document.getElementById('canvas').offsetParent.offsetTop+document.getElementById('canvas').offsetTop)));
        });

        $('#canvas').on("touchend", function (e, touch) {
            if(touchM)
                pieceDropped();
            touchM=false;
        });
    }
}

function updatePiecesMove(e){
    _currentDropPiece = null;               //na ktorom skonci ten sa vymeni

    _mouse.x = e.layerX;
    _mouse.y = e.layerY;


    _stage.drawImage(_typeBlocks['E'].image,_currentPiece.xPos,_currentPiece.yPos,_pieceWidth,_pieceHeight);  //tahany blok prekreslenie pozadia pod nim
    var i;
    var piece;
    for(i = 0;i < _pieces.length;i++){
        piece = _pieces[i];
        if(piece == _currentPiece){                                                         //ten isty
            continue;
        }
        drawImage(piece.xPos,piece.yPos,piece.img,piece.rotation);                          //prekreslovanie kuskov aby na nich neostal tien od tahaneho obrazku

        if(_currentDropPiece == null){
            if(_mouse.x < piece.xPos || _mouse.x > (piece.xPos + _pieceWidth) || _mouse.y < piece.yPos || _mouse.y > (piece.yPos + _pieceHeight)){
                //NOT OVER
            }
            else if(  ((((piece.xPos)>(_currentPiece.xPos))&&((piece.xPos)<(_currentPiece.xPos+_pieceWidth+1)))&&(piece.yPos===_currentPiece.yPos)) ||  //osetrenie aby sa dalo posuvat len o jeden blok
                ((((piece.xPos)<(_currentPiece.xPos))&&((piece.xPos)>(_currentPiece.xPos-_pieceWidth-1)))&&(piece.yPos===_currentPiece.yPos)) ||
                ((((piece.yPos)>(_currentPiece.yPos))&&((piece.yPos)<(_currentPiece.yPos+_pieceWidth+1)))&&(piece.xPos===_currentPiece.xPos)) ||
                ((((piece.yPos)<(_currentPiece.yPos))&&((piece.yPos)>(_currentPiece.yPos-_pieceWidth-1)))&&(piece.xPos===_currentPiece.xPos)))
            {
                if(piece.img == _typeBlocks['E'].image) //moze sa posuvat len na empty blok
                {
                    _currentDropPiece = piece;
                    _stage.save();
                    _stage.globalAlpha = .4;
                    _stage.fillStyle = PUZZLE_HOVER_TINT;
                    _stage.fillRect(_currentDropPiece.xPos,_currentDropPiece.yPos,_pieceWidth, _pieceHeight);
                    _stage.restore();
                }
            }
        }
    }
    _stage.save();
    _stage.globalAlpha = .6;
    drawImage(_mouse.x - (_pieceWidth / 2), _mouse.y - (_pieceHeight / 2),_currentPiece.img,_currentPiece.rotation); // nastavit ktory obrazok sa ma zobrazit pri tahani
    _stage.restore();

}

function updatePiecesMoveT(x,y){
    _currentDropPiece = null;               //na ktorom skonci ten sa vymeni

    _mouse.x = x;
    _mouse.y = y;


    _stage.drawImage(_typeBlocks['E'].image,_currentPiece.xPos,_currentPiece.yPos,_pieceWidth,_pieceHeight);  //tahany blok prekreslenie pozadia pod nim
    var i;
    var piece;
    for(i = 0;i < _pieces.length;i++){
        piece = _pieces[i];
        if(piece == _currentPiece){                                                         //ten isty
            continue;
        }
        drawImage(piece.xPos,piece.yPos,piece.img,piece.rotation);                          //prekreslovanie kuskov aby na nich neostal tien od tahaneho obrazku

        if(_currentDropPiece == null){
            if(_mouse.x < piece.xPos || _mouse.x > (piece.xPos + _pieceWidth) || _mouse.y < piece.yPos || _mouse.y > (piece.yPos + _pieceHeight)){
                //NOT OVER
            }
            else if(  ((((piece.xPos)>(_currentPiece.xPos))&&((piece.xPos)<(_currentPiece.xPos+_pieceWidth+1)))&&(piece.yPos===_currentPiece.yPos)) ||  //osetrenie aby sa dalo posuvat len o jeden blok
                ((((piece.xPos)<(_currentPiece.xPos))&&((piece.xPos)>(_currentPiece.xPos-_pieceWidth-1)))&&(piece.yPos===_currentPiece.yPos)) ||
                ((((piece.yPos)>(_currentPiece.yPos))&&((piece.yPos)<(_currentPiece.yPos+_pieceWidth+1)))&&(piece.xPos===_currentPiece.xPos)) ||
                ((((piece.yPos)<(_currentPiece.yPos))&&((piece.yPos)>(_currentPiece.yPos-_pieceWidth-1)))&&(piece.xPos===_currentPiece.xPos)))
            {
                if(piece.img == _typeBlocks['E'].image) //moze sa posuvat len na empty blok
                {
                    _currentDropPiece = piece;
                    _stage.save();
                    _stage.globalAlpha = .4;
                    _stage.fillStyle = PUZZLE_HOVER_TINT;
                    _stage.fillRect(_currentDropPiece.xPos,_currentDropPiece.yPos,_pieceWidth, _pieceHeight);
                    _stage.restore();
                }
            }
        }
    }
    _stage.save();
    _stage.globalAlpha = .6;
    drawImage(_mouse.x - (_pieceWidth / 2), _mouse.y - (_pieceHeight / 2),_currentPiece.img,_currentPiece.rotation); // nastavit ktory obrazok sa ma zobrazit pri tahani
    _stage.restore();

}

function checkPieceClicked(){
    var i;
    var piece;
    for(i = 0;i < _pieces.length;i++){
        piece = _pieces[i];
        var type = piece.type.match(/[a-zA-z]+/g);
        if((_mouse.x < piece.xPos || _mouse.x > (piece.xPos + _pieceWidth) || _mouse.y < piece.yPos || _mouse.y > (piece.yPos + _pieceHeight))
            || (type == 'E') || (type == 'S')|| (type == 'F')){
            //PIECE NOT HIT OR BLOCK IS NOT DRAGGABLE
        }
        else{
            return piece;
        }
    }
    return null;
}

function pieceDropped(e){                   //vymena blokov
    _canvas.onmousemove = null;
    _canvas.onmouseup = null;
    if(_currentDropPiece != null){
        backup();
        if(backupSteps !== 3)
            backupSteps++;

        var tmp = {rotation:_currentPiece.rotation,img:_currentPiece.img,type:_currentPiece.type};
        _currentPiece.img = _currentDropPiece.img;
        _currentPiece.rotation = _currentDropPiece.rotation;
        _currentPiece.type = _currentDropPiece.type;
        _currentDropPiece.img = tmp.img;
        _currentDropPiece.rotation = tmp.rotation;
        _currentDropPiece.type = tmp.type;
        _currentDropPiece = null;

        scorelvl = scorelvl - 10;
        document.getElementById("aktualneSkore").innerText="Aktualne skore je: " + scorelvl;
        
    }
    resetPuzzleAndCheckWin();
}



function resetPuzzleAndCheckWin(){
    _stage.clearRect(0,0,_puzzleWidth,_puzzleHeight);

    var gameWin = true;  //nastavit na true aby skoncila hra
    var i;
    var piece;
    var gameSolution;
    var type;
    if(json.rolltheball.games.game[levelGame].solution.length>27)                                                               // hra ma jeden vysledok
    {
        gameSolution = json.rolltheball.games.game[levelGame].solution;
        gameSolution = gameSolution.replace(/;/g,',');
        gameSolution = gameSolution.split(',');


        for(i = 0;i < _pieces.length;i++){
            piece = _pieces[i];
            drawImage(piece.xPos,piece.yPos,piece.img,piece.rotation);

            type = gameSolution[i].match(/[a-zA-z]+/g);
            if((type == 'T')||(type == 'D')){
                if(piece.type !=  gameSolution[i]){                                                   //overenie vsetkych kuskov ci niesu take iste ako vysledok
                    gameWin = false;

                }
            }
        }
        if(gameWin){
            setTimeout(gameOver,500);
        }
    }
    else {                                                                                                              //hra ma viac vysledkov
        for(i = 0;i < _pieces.length;i++){
            piece = _pieces[i];
            drawImage(piece.xPos,piece.yPos,piece.img,piece.rotation);
        }

        for(i=0;i < json.rolltheball.games.game[levelGame].solution.length;i++)
        {
            gameWin = true;
            gameSolution = json.rolltheball.games.game[levelGame].solution[i];
            gameSolution = gameSolution.replace(/;/g,',');
            gameSolution = gameSolution.split(',');
            console.log("novy");
            for(var j=0;j < _pieces.length;j++){

                piece = _pieces[j];
                type = gameSolution[j].match(/[a-zA-z]+/g);

                if((type == 'T')||(type == 'D')){

                    if(piece.type !==  gameSolution[j]){                                                   //overenie vsetkych kuskov ci niesu take iste ako vysledok
                        gameWin = false;
                        console.log("chyba");
                    }
                }
            }
            if(gameWin){
                setTimeout(gameOver,500);
            }
        }
    }
}


function gameOver(){
    document.onmousedown = null;
    document.onmousemove = null;
    document.onmouseup = null;
    document.touchstart=null;
    document.touchmove=null;
    document.touchend;

    nextLevel();
}

function drawImage(x,y,img,angle) {
    /*
    angle= (3.14/180)*270;
    console.log(x);
    _stage.rotate(angle);
    _stage.drawImage(img, x-_pieceWidth, y,_pieceWidth,_pieceHeight);

    _stage.rotate(-(angle));
    _stage.strokeStyle='black';
    _stage.strokeRect( x, y, _pieceWidth,_pieceHeight);
    */

    angle= (3.14/180)*angle;
    _stage.save();
    _stage.translate(x+_pieceWidth/2,y+_pieceHeight/2);
    _stage.rotate(angle);
    _stage.translate(-x-_pieceWidth/2,-y-_pieceHeight/2);
    _stage.drawImage(img,x,y,_pieceWidth,_pieceHeight);
    _stage.restore();



}

function drawImages() {
    for(var i = 0;i < _pieces.length;i++) {
        var piece = _pieces[i];
        drawImage(piece.xPos,piece.yPos,piece.img,piece.rotation);
    }
}

function backup() {

    var tmp = {xPosF:_currentPiece.xPos,yPosF:_currentPiece.yPos,rotationF:_currentPiece.rotation,imgF:_currentPiece.img,typeF:_currentPiece.type,xPosW:_currentDropPiece.xPos,yPosW:_currentDropPiece.yPos,rotationW:_currentDropPiece.rotation,imgW:_currentDropPiece.img,typeW:_currentDropPiece.type};
    if(_backup == null){
        _backup = [];
        _backup.push(tmp);

    }
    else if(_backup.length == 1){
        _backup.push(_backup[0]);
        _backup[0] = tmp;

    }
    else if(_backup.length ==2 ){
        _backup.push(_backup[1]);
        _backup[1] = _backup[0];
        _backup[0] = tmp;
    }
    else {
        _backup[2]=_backup[1];
        _backup[1]=_backup[0];
        _backup[0] = tmp;
    }
}

function stepBack() {
    if(_backup === undefined)
        return 0;
    if (_backup[0] !== undefined) {

        var tmp1 = [];
        var tmp2 = [];
        tmp1.xPos = _backup[0].xPosF;
        tmp1.yPos = _backup[0].yPosF;
        tmp1.rotation = _backup[0].rotationF;
        tmp1.img = _backup[0].imgF;
        tmp1.type = _backup[0].typeF;

        tmp2.xPos = _backup[0].xPosW;
        tmp2.yPos = _backup[0].yPosW;
        tmp2.rotation = _backup[0].rotationW;
        tmp2.img = _backup[0].imgW;
        tmp2.type = _backup[0].typeW;

        for(var i = 0;i<_pieces.length;i++){
            if((_pieces[i].xPos == tmp1.xPos)&&(_pieces[i].yPos == tmp1.yPos)){
                _pieces[i].rotation = tmp1.rotation;
                _pieces[i].img = tmp1.img;
                _pieces[i].type = tmp1.type;
            }
            if((_pieces[i].xPos == tmp2.xPos)&&(_pieces[i].yPos == tmp2.yPos)){
                _pieces[i].rotation = tmp2.rotation;
                _pieces[i].img = tmp2.img;
                _pieces[i].type = tmp2.type;
            }
        }
        _backup.splice(0,1);
        scorelvl = scorelvl + 10;
        document.getElementById("aktualneSkore").innerText="Aktualne skore je: " + scorelvl;
        drawImages();
    }
    else
        alert('Nemozte sa vratit spat');
}




function xml2json(xml) {
    try {
        var obj = {};
        if (xml.children.length > 0) {
            for (var i = 0; i < xml.children.length; i++) {
                var item = xml.children.item(i);
                var nodeName = item.nodeName;

                if (typeof (obj[nodeName]) == "undefined") {
                    obj[nodeName] = xml2json(item);
                } else {
                    if (typeof (obj[nodeName].push) == "undefined") {
                        var old = obj[nodeName];

                        obj[nodeName] = [];
                        obj[nodeName].push(old);
                    }
                    obj[nodeName].push(xml2json(item));
                }
            }
        } else {
            obj = xml.textContent;
        }
        return obj;
    } catch (e) {
        console.log(e.message);
    }
}

function readCookieToGame(username) {
    var myUserArray=getCookie(username);

    console.log(myUserArray[1].split('%2C'));
    levelGame = myUserArray[0];
    scorelvl = Number(myUserArray[2]);
    scoreall = Number(myUserArray[3]);

    var levelhry =Number(levelGame);
    levelhry++;
    document.getElementById("aktualnyLevel").innerText="Aktualny level: " + levelhry  + "/10";
    document.getElementById("aktualneSkore").innerText="Aktualne skore je: " + scorelvl;
    document.getElementById("celkoveSkore").innerText="Celkove skore je: " + scoreall;


    var game = json.rolltheball.games.game[levelGame];
    NumberOfBlocksHorizontal = game.size.horizontal;
    NumberOfBlocksVertical = game.size.vertical;
    _pieceWidth =_puzzleWidth / NumberOfBlocksVertical;
    _pieceHeight =_puzzleHeight / NumberOfBlocksHorizontal;



    var rows = myUserArray[1].split('%2C'); // tu sa vlozi aktualne rozohrana hra

    _pieces = [];
    _mouse = {x:0,y:0};
    _currentPiece = null;
    _currentDropPiece = null;
    var i;
    var xPos = 0;
    var yPos = 0;
    for(i = 0;i < NumberOfBlocksVertical * NumberOfBlocksHorizontal;i++){
        var piece = {};
        piece.xPos = xPos;
        piece.yPos = yPos;
        piece.img = _typeBlocks[rows[i]].image;
        piece.type = rows[i];

        if(((rows[i]).match(/\d+/))!== null)
            piece.rotation = (rows[i]).match(/\d+/)[0];
        else
            piece.rotation = 0;

        _pieces.push(piece);
        xPos += _pieceWidth;
        if(xPos >= _puzzleWidth){
            xPos = 0;
            yPos += _pieceHeight;
        }
    }
    drawImages();

}

function setCookie(username) {
    var _piecesString = [];
    for(var i= 0;i<_pieces.length;i++){
        if(i<_pieces.length-1)
            _piecesString = _piecesString + _pieces[i].type + ',';
        else
            _piecesString = _piecesString + _pieces[i].type;
    }

    //meno level rozohrane progressVsetkych skore
    var userdata=levelGame+delimiter+_piecesString +delimiter + scorelvl + delimiter + scoreall;
    createCookie(username, userdata);
}

function createCookie(name, value, days) {
    if (days) {

        var date=new Date();
        date.setTime(date.getTime()+ (days*24*60*60*1000));
        var expires=date.toGMTString();

    }

    else var expires = "";

    cookieString= name + "=" + escape (value);

    if (expires)
        cookieString += "; expires=" + expires;

    document.cookie=cookieString;
}

function getCookie(name) {
    var nameEquals = name + "=";
    var whole_cookie=document.cookie.split(nameEquals)[1].split(";")[0]; // get only the value of the cookie we need
    var crumbs=whole_cookie.split(delimiter);
    return crumbs; // return the information parts as an array
}

function deleteCookie(name){
    createCookie(name, "", -1);
}

function checkTime(i) {
    if (i < 10) {
        i = "0" + i;
    }
    return i;
}

function startTime() {
    var today = new Date();
    var h = today.getHours();
    var m = today.getMinutes();
    var s = today.getSeconds();
    // add a zero in front of numbers<10
    m = checkTime(m);
    s = checkTime(s);
    document.getElementById('time').innerHTML = "Aktuálny čas: "+  h + ":" + m + ":" + s;
    t = setTimeout(function() {
        startTime()
    }, 500);
}
startTime();