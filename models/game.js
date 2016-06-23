var mongoose = require('mongoose');

var gamesDB = mongoose.model('games', {
              white: String,
              black: String,
              status: String,
              fen: String,
              wUser: String,
              bUser: String,
              tweetId: String
								});

module.exports = gamesDB;
