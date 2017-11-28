
var NumberOfBlocksVertical ;
var NumberOfBlocksHorizontal ;
const _puzzleWidth = 800;
const _puzzleHeight = 800;
const PUZZLE_HOVER_TINT = '#009900';

var _stage;
var _canvas;

var _pieces;
var _pieceWidth;
var _pieceHeight;
var _currentPiece;
var _currentDropPiece;
var _mouse;
var json;
var _typeBlocks = [];
var _typeBlock;
var _backup;


var levelGame=2;
var username = "jozo";
var backupSteps = 0;

$.ajax({
    async: false,
    type: 'GET',
    url: 'rollTheBall.xml',
    success: function (xml) {
        json = xml2json(xml);
    }
});

function init() {
   // var game = json.rolltheball.games;
   // console.log(game);

    LoadImages();
    LoadGame(levelGame);
    setCanvas();
    drawImages();
    setCookie(username);
    document.onmousedown = onClick;
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

    task =task.replace(/;/g,',');
    console.log(task);
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
    if(e.layerX || e.layerX == 0){
        _mouse.x = e.layerX - _canvas.offsetLeft;
        _mouse.y = e.layerY - _canvas.offsetTop;
    }
    else if(e.offsetX || e.offsetX == 0){
        _mouse.x = e.offsetX - _canvas.offsetLeft;
        _mouse.y = e.offsetY - _canvas.offsetTop;
    }
    _currentPiece = checkPieceClicked();
    if(_currentPiece != null){
        _stage.clearRect(_currentPiece.xPos,_currentPiece.yPos,_pieceWidth,_pieceHeight);
        _stage.save();
        _stage.globalAlpha = .9;
        _stage.drawImage(_currentPiece.img, _currentPiece.sx, _currentPiece.sy, _pieceWidth, _pieceHeight, _mouse.x - (_pieceWidth / 2), _mouse.y - (_pieceHeight / 2), _pieceWidth, _pieceHeight);
        _stage.restore();

        document.onmousemove = updatePiecesMove;
        document.onmouseup = pieceDropped;

    }
}

function updatePiecesMove(e){
    _currentDropPiece = null;               //na ktorom skonci ten sa vymeni
    if(e.layerX || e.layerX == 0){
        _mouse.x = e.layerX - _canvas.offsetLeft;
        _mouse.y = e.layerY - _canvas.offsetTop;

    }
    else if(e.offsetX || e.offsetX == 0){
        _mouse.x = e.offsetX - _canvas.offsetLeft;
        _mouse.y = e.offsetY - _canvas.offsetTop;

    }
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
    document.onmousemove = null;
    document.onmouseup = null;
    if(_currentDropPiece != null){
        //backup();
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
    }

    resetPuzzleAndCheckWin();
}

function resetPuzzleAndCheckWin(){
    _stage.clearRect(0,0,_puzzleWidth,_puzzleHeight);
    setCookie(username);
    var gameWin = true;  //nastavit na true aby skoncila hra
    var i;
    var piece;
    var gameSolution;
    var type;

    if(json.rolltheball.games.game[levelGame].solution.length>30)                                                               // hra ma jeden vysledok
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
    initPuzzle();
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

    var tmp = {rotationF:_currentPiece.rotation,imgF:_currentPiece.img,typeF:_currentPiece.type,rotationW:_currentDropPiece.rotation,imgW:_currentDropPiece.img,typeW:_currentDropPiece.type};
    if(_backup == null){
        _backup = [];
        _backup.push(tmp);

        console.log(_backup.length);
        console.log(_backup);
    }
    else if(_backup.length == 1){
        _backup.push(_backup[0]);
        _backup[0] = tmp;
        console.log(_backup);
    }
    else{
        _backup[2] = _backup[1];
        _backup[1] = _backup[0];
        _backup[0] = _piecesString;
    }

    console.log(_backup.length);
    console.log(_backup);
  //  if(_backup.length = 1)
}

function stepBack(){
    if(backupSteps>0){
        console.log('1');
        var temp = _backup[0].split(',');
        console.log(temp);
        for(var i= 0;i<_pieces.length;i++){
            _pieces[i].type = temp[i];
            console.log('for');

        }
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

function readCookies() {

    var ca = document.cookie.split(';');

    console.log(ca);
}

function setCookie(username) {
    var _piecesString = [];
    for(var i= 0;i<_pieces.length;i++){
        _piecesString = _piecesString + _pieces[i].type + ","
    }


    var exdays = 30;


    var d = new Date();
    d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
    var expires = "expires="+d.toUTCString();
    document.cookie = username + '=' + _piecesString + ";" + expires + ";path=/";


    
}