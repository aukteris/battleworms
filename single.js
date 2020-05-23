var app = require('express')();
var http = require('http').Server(app);

app.get('/', function(req, res) {
	res.sendFile(__dirname + '/Singleplayer/index.html');
});

app.get('/code.js', function(req, res) {
        res.sendFile(__dirname + '/Singleplayer/code.js');
});

http.listen(3000, function() {
	console.log('listening on *:3000');
});
