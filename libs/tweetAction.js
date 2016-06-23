var tweetAction = {};

var twit = require('twit');
var waterfall = require('async-waterfall');

var config = require('../config.js');
var textAction = require('./textAction.js');
var chessAction = require('./chessAction.js');

// Twitter Api

var T = new twit({
  consumer_key:         config.twitter.consumer_key,
  consumer_secret:      config.twitter.consumer_secret,
  access_token:         config.twitter.access_token,
  access_token_secret:  config.twitter.access_token_secret,
  timeout_ms:           60*1000,  // optional HTTP request timeout to apply to all requests.
});


tweetAction.stream = function(){

  var stream = T.stream('statuses/filter', { track: '@playchesswith'})

  stream.on('tweet', function (tweet) {

    tweetAction.control(tweet);

  });


}

tweetAction.control = function(tweet){

  waterfall([
      function(next){
        textAction.mentionsText(tweet,function(state){
          if(state == 'error'){
            next('error','');
          }else{
            next('',tweet);
          }
        });
      },
      function(cleanText,next){
        // Tweet text cleaning out from hashtags and mentions
        textAction.cleanText(tweet,function(cleanText){
          next(null,cleanText);
        });
      },
      function(cleanText,next){
        // Detect command from tweet's text
        textAction.command(cleanText,function(command) {
          next(null,command);
        });
      },
      function(command,next){
        if(command.type == 'noCommand'){
          next(null,command);
        }else{
          textAction.gameInf(tweet,command,function(gameInf){
            next(null,gameInf);
          })
        }

      }
    ],function(err,result){

      if(!err)
      if(result.command.type != 'noCommand' && result.command.type != 'command'){
        chessAction.run(result,function(gameInf){

        switch (gameInf.status) {
          case 'invited':
            tweetAction.justTweet('@'+gameInf.wUser+' invited to play chess by @'+ gameInf.bUser +', send tweet "go" with these mentions',gameInf,function(res){
              console.log(res);
            });
            break;

            case 'wait':
            tweetAction.justTweet('@'+gameInf.wUser+' invited to play chess by @'+ gameInf.bUser +', we still wait @'+gameInf.wUser+'\'s tweet "go" ',gameInf,function(res){
              console.log(res);
            });
            break;

            case 'start':
            tweetAction.uploadImage(gameInf.black,function(image){

              gameInf.media_id_string =  image.media_id_string;

              tweetAction.justTweet('@'+gameInf.wUser+' (White) and @'+ gameInf.bUser +' (Black) matched, game is start ',gameInf,function(res){
                console.log(res);
              });

            })

            break;

        }


        });
      }

      if(result.command.type == 'command'){

        chessAction.doGame(result,function(gameInf){

            switch (gameInf.notice) {
              case 'noTurn':
              tweetAction.justTweet('No your turn! @'+gameInf.bUser +'',gameInf,function(res){
                console.log(res);
              });
              break;
              case 'chechmate':
              tweetAction.justTweet('Chechmate, you lose! @'+gameInf.bUser +'',gameInf,function(res){
                console.log(res);
              });
              tweetAction.justTweet('Chechmate, you win! @'+gameInf.wUser +'',gameInf,function(res){
                console.log(res);
              });
              break;
              case 'in_draw':
              tweetAction.justTweet('End in a draw @'+gameInf.bUser +' @'+gameInf.wUser,gameInf,function(res){
                console.log(res);
              });
              break;
              case 'dontMove':
              tweetAction.justTweet('Don\'t move, check the chessboard @'+gameInf.bUser +'',gameInf,function(res){
                console.log(res);
              });
              break;

              case 'chessBoardCreated':

              tweetAction.uploadImage(gameInf.black,function(image){

                gameInf.media_id_string =  image.media_id_string;

                tweetAction.justTweet('Your turn @'+gameInf.wUser +'',gameInf,function(res){
                  console.log(res);
                });

              })

              break;

            }


        });

      }

    }
  )


}

tweetAction.uploadImage = function(file,callback){

	T.postMediaChunked({ file_path: __dirname+'/../img/'+file+'.jpg' }, function (err, data, response) {

	  return callback(data);

	});

}


tweetAction.justTweet = function(text,inf,callback){

	var option = {
		status : text
	}

	if(inf.tweetId){
		option.in_reply_to_status_id = inf.tweetId
	}

  if(inf.media_id_string){
    option.media_ids = inf.media_id_string;
  }

	T.post('statuses/update', option, function(err, data, response) {


		if(response){
			return callback("sended");
		}


	});


}

module.exports = tweetAction;
