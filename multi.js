var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
const V = require('./mclasses/v.js');
const CompareVs = require('./mclasses/comparevs.js');
const Color= require('./mclasses/color.js');
const Rand = require('./mclasses/rand.js');
const Snake = require('./mclasses/snake.js');
const Tile = require('./mclasses/tile.js');

/*
const AddVs = require('./multiplayer/classes/addvs.js');
const SubVs = require('./multiplayer/classes/subvs.js');
const RandomChoice = require('./multiplayer/classes/randomchoice.js');
*/

// Settings
var port = 3100;
var height = 50;
var width = 50;
var intervalRate = 15;

// For tracking objects
var globalObjs = [];
var snakes = [];
var foods = [];
var clients = [];

//draw borders
for(var x = 0; x < width; x++)
{
	var t = new Tile(new V(x, 0), globalObjs, 0);
	t.color = new Color(0, 255, 255);
	var t2 = new Tile(new V(x, height-1), globalObjs, 0);
	t2.color = new Color(0, 255, 255);
}
for(var y = 0; y < height; y++)
{
	var t = new Tile(new V(0, y), globalObjs, 0);
	t.color = new Color(0, 255, 255);
	var t2 = new Tile(new V(width-1, y), globalObjs, 0);
	t2.color = new Color(0, 255, 255);
}

function spawnFood() {
	var overlap = true;
	var foodPos;

	// Place the food, without overlapping any other tile
	while (overlap == true) {
		foodPos = new V(Rand(0, width-1), Rand(0, height-1));

		var conflict = false;
		globalObjs.forEach(function(tile){
			if (CompareVs(tile.pos, foodPos))
				conflict = true
		});

		if (conflict == false) 
			overlap = false;

	}

	var newFood = new Tile(foodPos, globalObjs);
	newFood.color = new Color(255, 100, 50)
	newFood.type = 1;
	foods.push(newFood);
}

app.use(express.static('multiplayer'));

// initial client connection, and define the events we listen for
io.on('connection', function(socket){
	clients.push(socket);
	socket.emit('init', socket.id);
	
	console.log(socket.id + " connected");

	if (foods.length == 0)
		spawnFood();

	// handle client disconnect
	socket.on('disconnect', function() {
		var cleanupClientIndex = clients.indexOf(socket);
		// Cleanup the obj tile
		if (snakes[cleanupClientIndex] != null) {
			snakes[cleanupClientIndex].parts.forEach(function(tile) {
				globalObjs.splice(globalObjs.indexOf(tile), 1);
			});
			snakes.splice(cleanupClientIndex, 1);
		}
		clients.splice(cleanupClientIndex, 1);

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

		if (clientSnake.dead)
			snakes[clients.indexOf(socket)].parts = [];
	});

	// handles eating the snack, growing the snake, and creating a new snack
	socket.on('eatfood', function(foodTile) {
		foods.forEach(function(tile){
			if (CompareVs(tile.pos, foodTile.pos)) {
				var thisSnake = snakes[clients.indexOf(socket)];
				thisSnake.parts.push(new Tile(new V(0, 0), globalObjs, 0, thisSnake.color));
				foods.splice(foods.indexOf(tile), 1);
				spawnFood();
			}
		});
	});

	// start the game
	socket.on('start', function() {
		// create a new snake for the new player, and send it to him
		var snake = new Snake(socket.id, 3, Rand(10,40), Rand(10,40), globalObjs);
		snakes[clients.indexOf(socket)] = snake;

		socket.emit('start', snake);
	});
});

function sendUpdate() {
	var payload = [];
	payload.push(snakes);
	payload.push(foods);

	io.emit('update', payload);
}

var updateInterval = setInterval(sendUpdate, intervalRate);

http.listen(port, function() {
	console.log('listening on *:'+port);
});
