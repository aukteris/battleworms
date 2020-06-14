class V{
	constructor(x, y){
		this.x = x;
		this.y = y;
		this.area = function()
		{
			return this.x * this.y;
		}
	}

	setV(passedV){
		this.x = passedV.x;
		this.y = passedV.y;
	}

	copy(){
		return new V(this.x, this.y);
	}
}

module.exports = V