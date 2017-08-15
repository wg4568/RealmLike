// ROTMG Game

var canvas = new Elemental.Canvas("game", fullscreen=true);
var viewport = new Elemental.Viewport(canvas);
var game = new Elemental.Game(viewport, network=null);

var background = new Elemental.Color("#fffba2");

var DRAW_SCALE = .5;

var tile_size = 64 * DRAW_SCALE;

class World {
	constructor(width, height, gen) {
		this.width = width;
		this.height = height;
		this.data = [];
		this.generator = gen;

		for (var x = 0; x < this.width; x++) {
			var line = [];
			for (var y = 0; y < this.height; y++) {
				line.push(this.generator(new Elemental.Vector(x, y)));
			}
			this.data.push(line);
		}
	}

	hasPosn(posn) {
		return posn.x > 0 && posn.x < this.width
				&& posn.y > 0 && posn.y < this.height;
	}

	getTile(posn) {
		if (this.hasPosn(posn)) return this.data[posn.x][posn.y];
		else return null;
	}

	setTile(posn, value) {
		if (this.hasPosn(posn)) this.data[posn.x][posn.y] = value;
	}

	forEach(func) {
		for (var x = 0; x < this.width; x++) {
			for (var y = 0; y < this.height; y++) {
				var posn = new Elemental.Vector(x, y);
				func(posn, this.getTile(posn));
			}
		}
	}
}

var sprites = [
	new Elemental.Sprite.Image("tiles/grass.png"),
	new Elemental.Sprite.Image("tiles/dirt.png"),
	new Elemental.Sprite.Image("tiles/water.png")
].map(function(spr) {
	spr.scale = DRAW_SCALE;
	return spr;
});

var tree_sprites = [
	new Elemental.Sprite.Image("tiles/tree1.png"),
	new Elemental.Sprite.Image("tiles/tree2.png"),
	new Elemental.Sprite.Image("tiles/tree3.png")
].map(function(tree) {
	tree.scale = DRAW_SCALE*2;
	return tree;
}).map(function(tree) {
	tree.center = new Elemental.Vector(32, 128);
	return tree;
})

var scale = 30;
var ocean = 0.4;
var dirt = ocean / 10;
noise.seed(1033.0);
var world = new World(100, 100, function(posn) {
	var nval = noise.perlin2(posn.x / scale, posn.y / scale);
	var tval = noise.perlin2(posn.x / 40, posn.y / 40);
	var nval = (nval + 1) / 2;
	var tval = (tval + 1) / 2;
	if (nval > ocean) {
		if (tval > 0.45) {
			var d = (tval - 0.45);
			console.log(d);
			if (Math.random() < d) {
				return Elemental.Helpers.RandomInt(4, 7);
			} else {
				return 0;
			}
			// return 4;
		} else {
			return 0;
		}
	} else if (nval > ocean-dirt) {
		return 1;
	} else {
		return 2;
	}
});

function worldDraw(world, viewport) {
	var halfwidth = viewport.canvas.width / 2;
	var halfheight = viewport.canvas.height / 2;
	var xmin = Math.floor((viewport.posn.x - halfwidth) / tile_size);
	var xmax = Math.floor((viewport.posn.x + viewport.canvas.width) / tile_size);
	var ymin = Math.floor((viewport.posn.y - halfheight) / tile_size);
	var ymax = Math.floor((viewport.posn.y + viewport.canvas.height) / tile_size);

	var trees = [];

	for (var x = xmin; x < xmax; x++) {
		for (var y = ymin; y < ymax; y++) {
			var posn = new Elemental.Vector(x, y);
			var value = world.getTile(posn);
			if (value >= 4) {
				viewport.drawSprite(sprites[0], Elemental.Vector.Multiply(posn, tile_size));
				trees.push({posn: posn, kind: value-4});
			} else if (value != null) {
				viewport.drawSprite(sprites[value], Elemental.Vector.Multiply(posn, tile_size));
			}
		}
	}

	trees.forEach(function(tree) {
		viewport.drawSprite(tree_sprites[tree.kind], Elemental.Vector.Multiply(tree.posn, tile_size));
	});
}

var move_speed = 2;
var cam_body = new Elemental.Rigidbody();
cam_body.posn = new Elemental.Vector(1200, 600);
cam_body.friction = 0.9;
cam_body.maxSpeed = 10;


game.start(function() {
	var movement = Elemental.Vector.Empty;
	if (game.keyHeld(Elemental.Keycodes.W)) movement.y -= move_speed;
	if (game.keyHeld(Elemental.Keycodes.S)) movement.y += move_speed;
	if (game.keyHeld(Elemental.Keycodes.A)) movement.x -= move_speed;
	if (game.keyHeld(Elemental.Keycodes.D)) movement.x += move_speed;

	cam_body.addForce(movement);
	cam_body.logic();

	viewport.posn = cam_body.posn;

	viewport.drawFill(background);
	worldDraw(world, viewport);
});
