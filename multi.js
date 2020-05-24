var express = require('express');
var app = express();
var http = require('http').Server(app);
/*
app.get('/', function(req, res) {
	res.sendFile(__dirname + '/Singleplayer/index.html');
});

app.get('/code.js', function(req, res) {
        res.sendFile(__dirname + '/Singleplayer/code.js');
});

app.get('/engine.js', function(req, res) {
	res.sendFile(__dirname + '/Singleplayer/engine.js');
});
*/

app.use(express.static('multiplayer'));

http.listen(3000, function() {
	console.log('listening on *:3000');
});
