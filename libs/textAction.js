var textAction = {};
var config = require('../config.js');

textAction.mentionsText = function(tweet,callback){

  if(tweet.entities.user_mentions.length == 2 || tweet.user.id_str == config.twitter.account_id){
    return callback('pass');
  }else{
    return callback('error');
  }


}

textAction.cleanText = function(tweet,callback){

  var text = tweet.text;
  var hashtags = tweet.entities.hashtags;
  var mentions = tweet.entities.user_mentions;
  var cleanText;


  if(hashtags.length == 0){

    cleanText = text;

  }else{

    for($i = 0; $i < hashtags.length; $i++){

      cleanText = text.replace('#'+hashtags[$i].text,'');

    }

  }

  for($i = 0; $i < mentions.length; $i++){

    cleanText = cleanText.replace('@'+mentions[$i].screen_name,'');

  }

  cleanText = cleanText.trim();

  return callback(cleanText);


}


textAction.command = function(text,callback){

  var tmp = text.split('-');

  if (tmp.length == 2 && text.length == 5 && tmp[0].length == 2 && tmp[1].length == 2){

    return callback({
      from : tmp[0],
      to : tmp[1],
      type : 'command'
    });

  }

  var command = text.toLowerCase();

  switch (command) {

    case 'go':

      return callback({type:'go'});

      break;

    case 'quite':

      return callback({type:'quite'});

      break;

    case 'game':

      return callback({ type:'start' });

      break;

    default:
    return callback({type: 'noCommand'});

  }



}


textAction.gameInf = function(tweet,command,callback){

  var wUser,bUser,white,black;

  if(tweet.entities.user_mentions[0].id_str == config.twitter.account_id){
    white = tweet.entities.user_mentions[0].id_str;
    wUser = tweet.entities.user_mentions[0].screen_name;
  }else{
    white = tweet.entities.user_mentions[1].id_str;
    wUser = tweet.entities.user_mentions[1].screen_name;
  }

  var gameInf = {
    white : white,
    black : tweet.user.id_str,
    wUser : wUser,
    bUser : tweet.user.screen_name,
    command : command,
    tweetId :tweet.id_str
  }

  return callback(gameInf);


}

module.exports = textAction;
