var chessAction = {};
var chess = require('chess.js').Chess;
var waterfall = require('async-waterfall');
var fs = require('fs');
var webshot = require('webshot');

var tweetAction = require('./tweetAction.js');
var gameModel = require('../models/game.js');

chessAction.run = function(gameInf,callback){
  switch (gameInf.command.type) {

    case 'start':

      chessAction.intiveGame(gameInf,function(res){
        return callback(res);
      });

      break;

    case 'go':

      chessAction.startGame(gameInf,function(res){
        return callback(res);
      })

      break;


    default:
    return callback('error');

  }

}


chessAction.doGame = function(gameInf,callback){

  chessAction.controlGame(gameInf,function(game){
    var play = new chess(game.fen);
    var player;
    var notice;

    if(gameInf.white == game.white){
      player = 'w';
    }else{
      player = 'b';
    }

    if (play.turn() != player) {
      gameInf.notice = 'noTurn';
  	return callback(gameInf);
    }

    // checkmate?
    if (play.in_checkmate() === true) {
      gameInf.notice = 'chechmate';
      return callback(gameInf);
    }

    // draw?
    else if (play.in_draw() === true) {
      gameInf.notice = 'in_draw'
      return callback(gameInf);
    }

    // game still on
    else {

      var move = play.move({ from: gameInf.command.from, to: gameInf.command.to });

      if(move !== null){

  	gameModel.findOneAndUpdate({$or:[
      {$and:[{'black':gameInf.black}, {'white':gameInf.white} ]},
      {$and: [{'black':gameInf.white}, {'white':gameInf.black} ]}]
    }, { fen: play.fen() }, function(err, user) {
  		  if (err){
          gameInf.notice = 'error';
  		  	return callback(gameInf);
  		  }else{
          gameInf.notice = 'movikMovik';
          gameInf.fen = play.fen();
          chessAction.getSnapshot(gameInf,function(media_id_string){
            if(media_id_string)
            gameInf.notice = 'chessBoardCreated';
            return callback(gameInf);
          });
  		  }
  		});


      }else{
        gameInf.notice = 'dontMove';
      	return callback(gameInf);
      }

    }

  });




}

chessAction.startGame = function(gameInf,callback){

  chessAction.controlGame(gameInf,function(game){

    if(game.status == 'wait'){

      gameModel.findOneAndUpdate({ _id: game._id }, { status: 'start',tweetId : gameInf.tweetId }, function(err, res) {
		  if (err){
		  	return callback('error');
		  }else{
        gameInf.status = 'start';
        chessAction.getSnapshot(gameInf,function(board){
  		  	return callback(gameInf);
        })
		  }
		});



    }


  });


}

chessAction.intiveGame = function(gameInf,callback){

  chessAction.controlGame(gameInf,function(game){

    if(game.status == 'noGame'){

      chessAction.createGame(gameInf,function(state){

        return callback(state);

      });

    }else{

      return callback(game);

    }


  });


}



chessAction.controlGame = function(gameInf,callback){


  gameModel.findOne({$or:[
    {$and: [ {'white':gameInf.black}, {'black':gameInf.white} ]},
    {$and:[ {'white':gameInf.white}, {'black':gameInf.black} ] }
  ]}, function(err,obj) {

    if(!obj){
      return callback({status : 'noGame'});
    }else{
      return callback(obj);
    }

  });



}

chessAction.createGame = function(gameInf,callback){

  delete gameInf.command;

  gameInf.status = 'wait';
  gameInf.fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

  var newGame = new gameModel(gameInf);

  newGame.save(function(err){
    if(err){
      return callback({error : err});
    }else{
      gameInf.status = 'invited';

      return callback(gameInf);

    }
  });


}

chessAction.getSnapshot = function(gameInf,callback){

  var options = {
  screenSize: {
    width: 410
  , height: 410
  }
, shotSize: {
    width: 410
  , height: 'all'
  },siteType:'html'
};


  fs.readFile(__dirname + '/../chessboard.html', 'utf8', function (err,data) {
    if (err) {
      console.log(err);
    }
    if(gameInf.fen == 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'){
      gameInf.fen = 'start';
    }

    var html = data.replace('<!--FEN-->',"'"+gameInf.fen+"'");


    webshot(html, __dirname + '/../img/'+gameInf.black+'.jpg', options, function(err) {
      if(err){
        console.log(err);
      }else{
          return callback('chessBoardCreated');
      }
    });


  });


}

module.exports = chessAction;
