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

class Client {
	contructor (socket) {
		this.socket = socket;
		this.score = 0;
		this.color;
		this.name;
	}
}

class LeaderboardMember {
	constructor (name, score) {
		this.name = name;
		this.score = score;
	}
}

class TileUpdate {
	constructor (tile) {
		this.pos = new V(tile.pos.x, tile.pos.y);
		this.id = tile.id;
	}
}

function scoreCompare(a, b) {
	let comparison = 0;

	if (a.score > b.score)
		comparison = 1;
	else if (a.score < b.score)
		comparison = -1;

	return comparison * -1;
}

function addToLeaderboard(name,score) {
	var tmpMember = new LeaderboardMember(name,score);
	leaderboard.push(tmpMember);

	leaderboard.sort(scoreCompare);
	leaderboard = leaderboard.slice(0,10);

	io.emit('updateLB', leaderboard);
}

function spawnFood() {
	var overlap = true;
	var foodPos;

	// Place the food, without overlapping any other tile
	while (overlap == true) {
		foodPos = new V(Rand(0, width-1), Rand(0, height-1));

		var conflict = false;
		for (var index in globalObjs) {
			var tile = globalObjs[index];

			if (CompareVs(tile.pos, foodPos))
				conflict = true
		}

		if (conflict == false) 
			overlap = false;

	}

	var newFood = new Tile(foodPos, globalObjs);
	newFood.color = new Color(255, 100, 50)
	newFood.type = 1;
	foods.push(newFood);

	return newFood;
}

// Settings
var port = 3100;
var height = 50;
var width = 50;
var intervalRate = 75;

// For tracking objects
var globalObjs = {};
var snakes = {};
var walls = [];
var foods = [];
var clients = {};
var changes = [];
var leaderboard = [];

//draw borders
for(var x = 0; x < width; x++)
{
	var t = new Tile(new V(x, 0), globalObjs, 0);
	t.color = new Color(0, 255, 255);
	walls.push(t);
	var t2 = new Tile(new V(x, height-1), globalObjs, 0);
	t2.color = new Color(0, 255, 255);
	walls.push(t2);
}
for(var y = 0; y < height; y++)
{
	var t = new Tile(new V(0, y), globalObjs, 0);
	t.color = new Color(0, 255, 255);
	walls.push(t);
	var t2 = new Tile(new V(width-1, y), globalObjs, 0);
	t2.color = new Color(0, 255, 255);
	walls.push(t2);
}
spawnFood();

app.use(express.static('multiplayer'));

// initial client connection, and define the events we listen for
io.on('connection', function(socket){
	clients[socket.id] = new Client(socket);
	io.emit('newPlayerJoins', socket.id);

	var clientIds = [];

	for (var clientId in clients) {	
		clientIds.push(clientId);
	}
	
	var payload = {};
	payload['socketId'] = socket.id;
	payload['clients'] = clientIds;
	payload['walls'] = walls;
	payload['foods'] = foods;
	payload['snakes'] = snakes;
	payload['leaderboard'] = leaderboard;

	socket.emit('init', payload);

	clients[socket.id].color = new Color();
	clients[socket.id].color.randomize(Rand(0, 255), Rand(50, 220), Rand(0, 255));
	
	console.log(socket.id + " connected");

	// handle client disconnect
	socket.on('disconnect', function() {

		// Cleanup the obj tile
		if (snakes[socket.id] != null) {
			snakes[socket.id].parts.forEach(function(tile) {
				delete globalObjs[tile.id];
			});
			delete snakes[socket.id];
		}
		delete clients[socket.id];

		io.emit('disconnect', socket.id);

		console.log(socket.id + " disconnected");
	});

	// handle updates from the clients
	socket.on('update', function(clientSnake){
		var thisSnake = snakes[socket.id];

		if (thisSnake != null) {
			thisSnake.dead = clientSnake.dead;
			thisSnake.collided = clientSnake.collided;
			thisSnake.direction.setV(clientSnake.direction);

			if (clientSnake.parts.length > 0) {
				clientSnake.parts.forEach(function(tile, index) {
					if (index < thisSnake.parts.length) {
						thisSnake.parts[index].pos.setV(tile.pos);

						if (changes.indexOf(thisSnake.parts[index]) == -1)
							changes.push(new TileUpdate(thisSnake.parts[index]));
					}
				});
			}
		}

	});

	// handles eating the snack, growing the snake, and creating a new snack
	socket.on('eatfood', function(foodTile) {
		foods.forEach(function(tile){
			if (CompareVs(tile.pos, foodTile.pos)) {
				var thisSnake = snakes[socket.id];
				var newSnakeSegment = new Tile(new V(0, 0), globalObjs, 0, thisSnake.color)
				thisSnake.parts.push(newSnakeSegment);
				clients[socket.id].score++;

				var oldFoodTile = foodTile.id;
				delete globalObjs[tile.id];
				foods.splice(foods.indexOf(tile), 1);
				var newFood = spawnFood();

				var payload = {};
				payload['playerId'] = socket.id;
				payload['segment'] = newSnakeSegment;
				payload['segmentIndex'] = thisSnake.parts.length - 1;
				payload['oldFoodId'] = oldFoodTile;
				payload['newFood'] = newFood;

				io.emit('eatenFood', payload);
				socket.emit('updateScore', clients[socket.id].score);
			}
		});
	});

	// start the game
	socket.on('start', function() {
		// create a new snake for the new player, and send it to him
		clients[socket.id].score = 0;
		var snake = new Snake(socket.id, 3, Rand(10,40), Rand(10,40), clients[socket.id].color, globalObjs);
		snakes[socket.id] = snake;

		socket.emit('start', snake);
		io.emit('newSnake', snake);
	});

	socket.on('killed', function(snake) {
		var thisSnake = snakes[socket.id];

		thisSnake.parts.forEach(function(tile) {
			delete globalObjs[tile.id];
		});
		thisSnake.parts = [];
		delete snakes[socket.id];

		addToLeaderboard(clients[socket.id].name,clients[socket.id].score);

		io.emit('killed', socket.id);
	});

	socket.on('setName', function(name) {
		clients[socket.id].name = name;
	});
});

function sendUpdate() {
	var snakeChanges = {};
	for (var index in snakes) {
		var snake = snakes[index];
		snakeChanges[index] = snake.direction;
	}

	var payload = {};
	payload['tileChanges'] = changes;
	payload['snakeChanges'] = snakeChanges;

	io.emit('update', payload);

	changes = [];
}

var updateInterval = setInterval(sendUpdate, intervalRate);

http.listen(port, function() {
	console.log('listening on *:'+port);
});
