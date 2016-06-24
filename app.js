//var tweetAction = require('./libs/tweetAction.js');

var mongoose = require('mongoose');

//var chessAction = require('./libs/chessAction.js');
var config = require('./config.js');
var textAction = require('./libs/textAction.js');
var tweetAction = require('./libs/tweetAction.js');



// Connect DB
mongoose.connect(config.mongodb.url);





tweetAction.stream();
