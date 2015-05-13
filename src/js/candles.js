const FIELD_HEIGHT = 5;
const FIELD_WIDTH = 5;

$(document).ready(function() {
	var visualizer = new Visualizer();
	var game = new Game(FIELD_WIDTH, FIELD_HEIGHT, visualizer);
	game.run();
});	

function Visualizer() {
	this.init = function(map) {
		var grid = $('#game-grid');
		for (var y = 0; y < map.height; ++y) {
			var row = $('<div/>', {class: 'grid-row'});
			for (var x = 0; x < map.width; ++x) {
				var cell = $('<div/>', {class: 'grid-cell'});
				var roomIcon = $('<div/>', {class: 'room-icon'});
				cell.append(roomIcon);
				row.append(cell);
			}
			grid.append(row);
		}
		clear();
	}
	
	this.visualize = function(map) {
		clear();		
		var player = map.getPlayer();
		var cellNumber = map.width * player.y + player.x;
		
		var player = createPlayer(map);
		var htmlCell = getHtmlCell(cellNumber);
		htmlCell.append(player);
		
		for (var x = 0; x < map.width; ++x) {
			for (var y = 0; y < map.height; ++y) {
				var cell = new Cell(x, y);
				var cellNumber = map.width * y + x;
				var htmlCell = getHtmlCell(cellNumber);				
				if (map.isAlight(cell)) {
					htmlCell.removeClass('dark');
					htmlCell.addClass('alight');
				}		
				if (map.isCandleStore(cell)) {
					var el = $('<div/>', {class: 'candle-store'});
					htmlCell.children('.room-icon').append(el);
				}
				else if (map.hasCandle(cell)) {
					var el = $('<div/>', {class: 'candle'});
					htmlCell.children('.room-icon').append(el);
				}
			}
		}
	}
	
	function clear() {
		var cells = $('.grid-cell');
		cells.removeClass('alight');
		cells.addClass('dark');		
		$('.player').remove();
		cells.children('.room-icon').children().remove();
	}
	
	function getHtmlCell(cellNumber) {
		return $('.grid-cell:eq(' + cellNumber + ')');		
	}
	
	function createPlayer(map) {
		return $('<div/>', {class: 'player', text: map.getCandleLenght()});
	}
}

function Game(width, height, visualizer) {
	// PUBLIC FIELDS
	// END PUBLIC FIELDS
	
	// PRIVATE FIELDS
	const KEY_LEFT = 37;
	const KEY_UP = 38;
	const KEY_RIGHT = 39;
	const KEY_DOWN = 40;
	const KEY_SPACE = 32;
	const keys = [KEY_LEFT, KEY_RIGHT, KEY_UP, KEY_DOWN, KEY_SPACE];

	var pressedKey = false;
	var map = new Map(width, height);
	// END PRIVATE FIELDS
	
	// INITIALIZE
	visualizer.init(map);
	visualizer.visualize(map);
	// END INITIALIZE
	
	// PUBLIC FUNCTIONS	
	this.run = function() {
		$(document).keydown(function(e) {
			if (!pressedKey) {
				pressedKey = true;				
				if (e.keyCode == KEY_LEFT)
					shiftPlayer(new Cell(-1, 0));
				else if (e.keyCode == KEY_UP)
					shiftPlayer(new Cell(0, -1));
				else if (e.keyCode == KEY_RIGHT)
					shiftPlayer(new Cell(1, 0));
				else if (e.keyCode == KEY_DOWN)
					shiftPlayer(new Cell(0, 1));
				else if (e.keyCode == KEY_SPACE) {
					if (map.playerHasCandle())
						map.putCandle();
					else
						map.takeCandle();
				}
				if (keys.indexOf(e.keyCode) != -1) {
					visualizer.visualize(map);
					pressedKey = false;
					return false;
				}
				pressedKey = false;
			}
		});
	}	
	// END PUBLIC FUNCTIONS
	
	// PRIVATE FUNCTIONS
	function shiftPlayer(cell) {
		var player = map.getPlayer();
		var newPos = player.add(cell);
		if (!map.checkBounds(newPos) || map.closed(newPos))
			return;
		
		if (map.playerHasCandle()) {
			map.shiftPlayer(cell);
			if (map.isDark(newPos) && map.hasCandle(newPos)) {
				map.tryBurnCandle(newPos);
			}
		}
		else if (map.isAlight(newPos)) {
			map.shiftPlayer(cell);
		}
	}
	// END PRIVATE FUNCTIONS
}

function Map(width, height) {
	const PLAYER_CANDLE_LENGHT_MAX = 3;
	
	this.width = width;
	this.height = height;
	
	// 0 - закрытая комната
	// 1 - нет свечки
	// 2 - незаженная свечка
	// 3 - заженная свечка
	var map = [];
	var candleStore = new Cell(0, 0);
	var player = candleStore;
	var playerCandleLenght = PLAYER_CANDLE_LENGHT_MAX;
	
	for (var x = 0; x < width; ++x) {
		map[x] = [];
		for (var y = 0; y < height; ++y) {
			map[x][y] = 2;
		}
	}
	map[0][0] = 3;
	
	this.checkBounds = checkBounds;	
	function checkBounds(cell) {
		return cell.x >= 0 && cell.x < width && cell.y >= 0 && cell.y < height;
	}
	
	this.getPlayer = function() {
		return player;
	}
	
	this.getCandleLenght = function() {
		return playerCandleLenght;
	}
	
	this.playerHasCandle = playerHasCandle;
	function playerHasCandle() {
		return playerCandleLenght != 0;
	}
		
	this.tryBurnCandle = tryBurnCandle;
	function tryBurnCandle(cell) {
		if (!checkBounds(cell) || closed(cell))
			return false;
		if (playerCandleLenght == 0 || !hasCandle(cell) || isAlight(cell))
			return false;
		playerCandleLenght --;
		map[player.x][player.y] = 3;
		return true;
	}
	
	this.isDark = isDark;
	function isDark(cell) {
		if (!checkBounds(cell))
			return false;
		var val = map[cell.x][cell.y];
		return val == 1 || val == 2;
	}
	
	this.isAlight = isAlight;
	function isAlight(cell) {
		if (!checkBounds(cell))
			return false;
		return map[cell.x][cell.y] == 3;
	}
	
	this.hasCandle = hasCandle;
	function hasCandle(cell) {
		if (!checkBounds(cell))
			return false;
		var val = map[cell.x][cell.y];
		return val == 2 || val == 3;
	}
	
	this.empty = empty;
	function empty(cell) {
		if (!checkBounds(cell))
			return false;
		return map[cell.x][cell.y] == 1;
	}
	
	this.closed = closed;
	function closed(cell) {
		if (!checkBounds(cell))
			return false;
		return map[cell.x][cell.y] == 0;		
	}
	
	this.shiftPlayer = function(cell) {
		var newPos = player.add(cell);
		if (!checkBounds(newPos))
			return;
		player = newPos;
		if (player.equals(candleStore))
			playerCandleLenght = PLAYER_CANDLE_LENGHT_MAX;
	}
	
	this.isCandleStore = function(cell) {
		return candleStore.equals(cell);
	}
	
	this.takeCandle = function() {
		if (!isAlight(player) || playerCandleLenght != 0)
			return;
		map[player.x][player.y] = 1;
		playerCandleLenght = PLAYER_CANDLE_LENGHT_MAX;
	}
	
	this.putCandle = function() {
		if (!empty(player) || playerCandleLenght == 0)
			return false;
		map[player.x][player.y] = 3;
		playerCandleLenght = 0;
	}
}

function Cell(x, y) {
	this.x = x;
	this.y = y;
	
	this.add = function(cell) {
		return new Cell(x + cell.x, y + cell.y);
	}
	
	this.equals = function(other) {
		return x == other.x && y == other.y;
	}
}