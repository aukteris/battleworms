class V{
	constructor(x, y){
		this.x = x;
		this.y = y;
		this.area = function()
		{
			return this.x * this.y;
		}
	}

	setV(passedV) {
		this.x = passedV.x;
		this.y = passedV.y;
	}
}

module.exports = V