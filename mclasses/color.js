class Color{
	constructor(r, g, b)
	{
		this.r = r == null ? 0 : r;
		this.g = g == null ? 0 : g;
		this.b = b == null ? 0 : b;
	}

	randomize(randR, randG, randB) {
		var ranges = [randR, randG, randB];
		shuffle(ranges);
		//multipliers
		this.r = ranges[0];
		this.g = ranges[1];
		this.b = ranges[2];
	}

	setColor (passedColor) {
		this.r = passedColor.r;
		this.g = passedColor.g;
		this.b = passedColor.b;
	}
}

var shuffle = function (array) {

	var currentIndex = array.length;
	var temporaryValue, randomIndex;

	// While there remain elements to shuffle...
	while (0 !== currentIndex) {
		// Pick a remaining element...
		randomIndex = Math.floor(Math.random() * currentIndex);
		currentIndex -= 1;

		// And swap it with the current element.
		temporaryValue = array[currentIndex];
		array[currentIndex] = array[randomIndex];
		array[randomIndex] = temporaryValue;
	}

	return array;

};

module.exports = Color