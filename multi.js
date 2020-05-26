var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
const Snake = require('./mclasses/snake.js');
/*
const V = require('./multiplayer/classes/v.js');
const AddVs = require('./multiplayer/classes/addvs.js');
const SubVs = require('./multiplayer/classes/subvs.js');
const CompareVs = require('./multiplayer/classes/comparevs.js');
const Color= require('./multiplayer/classes/color.js');
const Rand = require('./multiplayer/classes/rand.js');
const RandomChoice = require('./multiplayer/classes/randomchoice.js');
const Tile = require('./multiplayer/classes/tile.js');
*/

var globalObjs = [];
var tileId = 0;

var snakes = [];
var clients = [];

app.use(express.static('multiplayer'));

// initial client connection, and define the events we listen for
io.on('connection', function(socket){
	clients.push(socket);

	// create a new snake for the new player, and send it to him
	var snake = new Snake(socket.id, 5, 8, 8, globalObjs);
	snakes[clients.indexOf(socket)] = snake;
	socket.emit('init', snake);
	console.log(socket.id + " connected");

	// handle client disconnect
	socket.on('disconnect', function() {
		// Cleanup the obj tile
		snakes[clients.indexOf(socket)].parts.forEach(function(tile) {
			globalObjs.splice(globalObjs.indexOf(tile), 1);
		});
		snakes.splice(clients.indexOf(socket), 1);
		clients.splice(clients.indexOf(socket), 1);

		io.emit('disconnect', socket.id);

		console.log(socket.id + " disconnected");
	});

	// handle updates from the clients
	socket.on('update', function(clientSnake){
		var thisSnake = snakes[clients.indexOf(socket)];

		thisSnake.dead = clientSnake.dead;
		thisSnake.collided = clientSnake.collided;

		clientSnake.parts.forEach(function(tile, index) {
			if (index < thisSnake.parts.length) {
				thisSnake.parts[index].pos.x = tile.pos.x;
				thisSnake.parts[index].pos.y = tile.pos.y;
			}
		});

		io.emit('update', snakes);

		if (clientSnake.dead)
			snakes[clients.indexOf(socket)].parts = [];
	});
});

http.listen(3100, function() {
	console.log('listening on *:3000');
});
