myindex = 0;
function PhaserSnake(){
	snake = snakes[myindex];
	snake.parts.forEach(function(part, index)
	{
		if(index != 0)
		{
			newpos = new V(Rand(-10, 10), Rand(-10, 10));
			no = snakes[myindex].parts[0]
			no2 = new V(no.x + snake.direction.x, no.y + snake.direction.y)
			if(newpos.x != no.x && newpos.y != no.y && newpos.x != no2.x && newpos.y != no2.y)
			{
				part.pos = newpos;
			}
		}
	});
}
var phaserinterval = null;


document.addEventListener("keydown", function(event) {
  console.log("HAKZ.. " + event.code);
  if(event.code == "KeyF")
  {
  	if(phaserinterval == null)
  	{
  		snakes[myindex].parts[0].pos.x += .001;
  		phaserinterval = setInterval(PhaserSnake, 600);
  	}
  	else{
  		snakes[myindex].parts[0].pos.x -= .001;
  		clearInterval(phaserinterval);
  		phaserinterval = null;
  	}
  }
});