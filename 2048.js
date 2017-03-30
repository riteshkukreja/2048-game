var TwentyFortyEightGame = function(config) {

	// Create a new canvas element
	var canvas = document.createElement('canvas');

	// Container of the canvas
	var holder = config ? config.holder || document.body : document.body;

	// Size of NxN game world
	var size = config ? config.size || 8 : 8;

	// Width of the canvas
	var width = config ? config.width || window.innerHeight - 100 : window.innerHeight - 100;

	// Height of the canvas
	var height = config ? config.height || window.innerHeight - 100 : window.innerHeight - 100;

	// Update canvas width and height
	canvas.width = width;
	canvas.height = height;

	// build a matrix of size NxN
	var World = function(canvas, size) {

		// Matrix to hold the game
		var world = [];

		// Player score
		var score = 0;

		// Boolean flag to stop actions on game over
		var gameOver = false;

		// 2D Context
		var context = canvas.getContext('2d');

		// Total States in the game
		// Or the ones we actually care about anyway
		var states = {
			"EMPTY": 0,
			"START": 2,
			"FINAL": 2048
		};

		// Such Colors Much Beautiful
		var colors = {
			"0": "#ecf0f1",
			"2": "#1abc9c",
			"4": "#2ecc71",
			"8": "#3498db",
			"16": "#9b59b6",
			"32": "#e67e22",
			"64": "#f39c12",
			"128": "#e74c3c",
			"256": "#2980b9",
			"512": "#8e44ad",
			"1024": "#d35400",
			"2048": "#c0392b",
			"lose": "#c0392b",
			"won": 	"#2980b9",
			"button": "#e67e22"
		};

		// Directions in which the user can play
		var directions = {
			"LEFT": 0,
			"RIGHT": 1,
			"TOP": 2,
			"DOWN": 3
		};

		/**
		 *	Initialization Method
		 *	Generates a new game world with one block and start game
		 */
		var init = function() {
			world = [];

			// Create a empty state world
			for(var i = 0; i < size; i++) {
				var t = [];
				for(var j = 0; j < size; j++) {
					t.push(states.EMPTY);
				}

				world.push(t);
			}

			// start at a random position
			// Totally Random 
			world[2][2] = states.START;

			score = 0;
			gameOver = false;

			// Let's start playing
			draw();
		}

		/**
		 *	getRandomEmptyPositions Method
		 *	Loop Throught the game world and returns a random position in the matrix which is empty and adjacent to a block
		 */
		var getRandomEmptyPositions = function() {

			// Hold all the possible positions
			var positions = [];

			// Loop throught the game world
			for(var i = 0; i < size; i++) {
				for(var j = 0; j < size; j++) {

					// if current position is empty and any of the four neightbour states are not empty
					if(world[i][j] == states.EMPTY && (
						// left position is full
						(j-1 >= 0 && world[i][j-1] != states.EMPTY) ||
						// right position is full
						(j+1 < size && world[i][j+1] != states.EMPTY) ||
						// top position is full
						(i-1 >= 0 && world[i-1][j] != states.EMPTY) ||
						// bottom position is full
						(i+1 < size && world[i+1][j] != states.EMPTY)
						))

						positions.push([i, j]);
				}
			}

			// If no possible state, game world is full
			if(positions.length == 0) return false;

			// returns a random position
			var randomPosition = Math.floor(Math.random() * positions.length);
			return positions[randomPosition];
		}

		/**
		 *	checkSucess Method
		 *	Loop Throught the game world and returns true if the final state has been reached otherwise returns false
		 */
		var checkSucess = function() {
			// if 2048 block appears
			for(var i = 0; i < size; i++) {
				for(var j = 0; j < size; j++) {
					if(world[i][j] == states.FINAL) return true;
				}
			}

			return false;
		}

		/**
		 *	matchWorlds Method
		 *	Loop through two game world and determine their indifference.
		 *  Returns true if both worlds are same else returns false
		 *	
		 *	@Param w1 - first matrix containing the game information
		 *	@Param w2 - second matrix containing the game information
		 */
		var matchWorlds = function(w1, w2) {
			for(var i = 0; i < size; i++) {
				for(var j = 0; j < size; j++) {
					if(w1[i][j] != w2[i][j])
						return false;
				}
			}

			return true;
		}

		/**
		 *	checkMoves Method
		 *	Loop through the game world and checks if a valid move is available.
		 *  return true if move available else return false
		 */
		var checkMoves = function() {
			var dummyWorld = [];

			// copy world data to dummy world
			for(var i = 0; i < size; i++) {
				var t = [];
				for(var j = 0; j < size; j++) {
					t.push(world[i][j]);
				}

				dummyWorld.push(t);
			}

			// perform swiping operation to determine if posible moves
			for(var dir in directions) {
				// perform dir shift
				dummyWorld = combine(dummyWorld, directions[dir]);

				// If both world doesn't match, then valid move is available
				if(!matchWorlds(world, dummyWorld)) return true;
			}

			return false;
		}

		/**
		 *	swapStates Method
		 *	Swap two positions in the game world. Used in shift method.
		 *
		 * 	@Param pos1 - First position in the game world with format [x, y]
		 * 	@Param pos2 - Second position in the game world with format [x, y]
		 */
		var swapStates = function(pos1, pos2) {
			var temp = world[pos1[0]][pos1[1]];
			world[pos1[0]][pos1[1]] = world[pos2[0]][pos2[1]];
			world[pos2[0]][pos2[1]] = temp;
		}

		/**
		 *	combine Method
		 *	Check if any two adjacent blocks can be grouped together to form one block 
		 *	depending on the given direction in which swipe has been made.
		 *
		 * 	@Param map - Game World matrix
		 * 	@Param dir - Directions object defining the swipe direction
		 */
		var combine = function(map, dir) {
			switch(dir) {
				// Handle Left swiping
				case directions.LEFT: 
				for(var i = 0; i < size; i++) {
					for(var j = 1; j < size; j++) {
						if(map[i][j] == states.EMPTY) continue;
						else if(map[i][j-1] == map[i][j]) {
							// same states then combine
							// first state to contain the sum and second state is empty
							map[i][j-1] += map[i][j];
							map[i][j] = states.EMPTY;

							// update score
							updateScore(map[i][j-1]);
						}
					}
				}
				break;

				// Handle Right swiping
				case directions.RIGHT: 
				for(var i = 0; i < size; i++) {
					for(var j = size-1; j >= 0; j--) {
						if(map[i][j] == states.EMPTY) continue;
						else if(map[i][j-1] == map[i][j]) {
							// same states then combine
							// first state to contain the sum and second state is empty
							map[i][j] += map[i][j-1];
							map[i][j-1] = states.EMPTY;

							// update score
							updateScore(map[i][j]);
						}
					}
				}
				break;

				// Handle Up swiping
				case directions.UP: 
				for(var i = 1; i < size; i++) {
					for(var j = 0; j < size; j++) {
						if(map[i][j] == states.EMPTY) continue;
						else if(map[i-1][j] == map[i][j]) {
							// same states then combine
							// first state to contain the sum and second state is empty
							map[i-1][j] += map[i][j];
							map[i][j] = states.EMPTY;

							// update score
							updateScore(map[i-1][j]);
						}
					}
				}
				break;

				// Handle Down swiping
				case directions.DOWN: 
				for(var i = size-1; i > 0; i--) {
					for(var j = 0; j < size; j++) {
						if(map[i][j] == states.EMPTY) continue;
						else if(map[i-1][j] == map[i][j]) {
							// same states then combine
							// first state to contain the sum and second state is empty
							map[i][j] += map[i-1][j];
							map[i-1][j] = states.EMPTY;

							// update score
							updateScore(map[i][j]);
						}
					}
				}
				break;
			}
			return map;
		}

		/**
		 *	swipe Method
		 *	Move all the blocks on the row/column on one side 
		 *	depending on the given direction in which swipe has been made.
		 *
		 * 	@Param map - Game World matrix
		 * 	@Param dir - Directions object defining the swipe direction
		 */
		var swipe = function(map, dir) {
			switch(dir) {

				// Handle Left swiping
				case directions.LEFT: 
				for(var i = 0; i < size; i++) {
					var k = 0, l = 0;

					while(k < size && l < size) {

						// k will occupy closest empty space
						while(k < size && map[i][k] != states.EMPTY) k++;
						// if k reaches the end then no empty space
						if(k == size) break;

						// l will occupy closest occupied space greater than k
						while(l < size && (map[i][l] == states.EMPTY || l < k)) l++;
						// if l reaches the end then no shift required
						if(l == size) break;

						// if none of the above conditions pan out then a filled block is after a empty block
						// so swap them
						swapStates([i, l], [i, k]);
					}
				}
				break;

				// Handle Right swiping
				case directions.RIGHT: 
				for(var i = 0; i < size; i++) {
					var k = size-1, l = size-1;

					while(k >= 0 && l >= 0) {

						// k will occupy closest empty space
						while(k >= 0 && map[i][k] != states.EMPTY) k--;
						// if k reaches the end then no empty space
						if(k <= 0) break;

						// l will occupy closest occupied space greater than k
						while(l >= 0 && (map[i][l] == states.EMPTY || l > k)) l--;
						// if l reaches the end then no shift required
						if(l < 0) break;

						// if none of the above conditions pan out then a filled block is after a empty block
						// so swap them
						swapStates([i, l], [i, k]);
					}
				}
				break;

				// Handle Up Swiping
				case directions.UP: 
				for(var i = 0; i < size; i++) {
					var k = 0, l = 0;

					while(k < size && l < size) {

						// k will occupy closest empty space
						while(k < size && map[k][i] != states.EMPTY) k++;
						// if k reaches the end then no empty space
						if(k == size) break;

						// l will occupy closest occupied space greater than k
						while(l < size && (map[l][i] == states.EMPTY || l < k)) l++;
						// if l reaches the end then no shift required
						if(l == size) break;

						// if none of the above conditions pan out then a filled block is after a empty block
						// so swap them
						swapStates([l, i], [k, i]);
					}
				}
				break;

				// Handle Down swiping
				case directions.DOWN: 
				for(var i = size-1; i >= 0; i--) {
					var k = size-1, l = size-1;

					while(k >= 0 && l >= 0) {

						// k will occupy closest empty space
						while(k >= 0 && map[k][i] != states.EMPTY) k--;
						// if k reaches the end then no empty space
						if(k <= 0) break;

						// l will occupy closest occupied space greater than k
						while(l >= 0 && (map[l][i] == states.EMPTY || l > k)) l--;
						// if l reaches the end then no shift required
						if(l < 0) break;

						// if none of the above conditions pan out then a filled block is after a empty block
						// so swap them
						swapStates([l, i], [k, i]);
					}
				}
				break;
			}
			return map;
		}

		/**
		 *	updateScore Method
		 *	Utility method to update score based on given threshold.
		 *
		 * 	@Param scoreThreshold - integer defining the update in score
		 */
		var updateScore = function(scoreThreshold) {

			// @TODO Define a kickass score update mechanism
			score += scoreThreshold; 
		}

		/**
		 *	update Method
		 *	Method responsible for reacting to a swipe action to update the game world
		 *
		 * 	@Param dir - Direction in which the swipe has been made
		 */
		var update = function(dir) {

			// If game has already been over, then do nothing
			if(gameOver) return;

			// Swipe the blocks so they are adjacent to each other
			world = swipe(world, dir);

			// Combine similar blocks if there are any
			world = combine(world, dir);

			// Swipe the blocks so as to remove any empty spaces formed due to combine operation
			world = swipe(world, dir);

			// check for game completion
			if(checkSucess()) {

				// Show win window and stop all operations
				draw();
				drawGameOverWindow(true);
				return;
			}

			// add a 2 to any available random position
			var pos = getRandomEmptyPositions();

			// If no empty block in the world
			if(pos === false) {
				// Check for valid moves
				if(!checkMoves()) {
					// game over you lose
					draw();
					drawGameOverWindow(false);
				}
				
				return;
			}

			// If empty blocks in the world, add the start block
			world[pos[0]][pos[1]] = states.START;

			// Keep Drawing
			draw();
		}

		/**
		 *	methods responsible for drawing the game world and game objects
		 *
		 */

		/**
		 *	drawBox Method
		 *	Method responsible for drawing a single box with given parameters and text
		 *
		 * 	@Param x - position from left of the canvas
		 * 	@Param y - position from top of the canvas
		 * 	@Param width - width of the block
		 * 	@Param height - height of the block
		 * 	@Param state - integer defining the text in the block
		 */
		var drawBox = function(x, y, width, height, state) {

			// Create a colorful block based on state
		 	context.fillStyle = colors[state];
		 	context.fillRect(x, y, width, height);

			// add outline
			/*context.strokeStyle = "rgba(90, 90, 90, .1)";
			context.lineWidth = .2;
			context.rect(x, y, width, height);
			context.stroke();*/

			// box content - write the state inside the block if its not empty
			if(state != states.EMPTY) {
				context.fillStyle = "#FFF";
				context.font = "25px Georgia";
				context.textAlign = "center";
				context.textBaseline = "middle";
				context.fillText(state, x + width / 2, y + height / 2);
			}
		}

		/**
		 *	drawBox Method
		 *	Utility method to draw score on the top right of the canvas
		 */
		var drawScore = function() {
			context.beginPath();
			context.fillStyle = "#c0392b";
			context.font = "20px Georgia";
			context.textAlign = "center";
			context.textBaseline = "middle";
			context.fillText(score, width - 50, 30);
		}

		/**
		 *	clear Method
		 *	Utility method to clear the canvas
		 */
		var clear = function() {
			context.clearRect(0, 0, canvas.width, canvas.height);
		}

		/**
		 *	drawGameOverWindow Method
		 *	Create a colorful window allowing user to score final result and start a new game
		 *
		 * 	@Param won - boolean flag denoting if the game has been won or lost
		 */
		var drawGameOverWindow = function(won) {
			var winWidth = width / 2;
			var winHeight = height / 2;

			gameOver = true;

			// draw shadow container
			context.fillStyle = "rgba(0, 0, 0, .5)";
			context.fillRect(0, 0, width, height);

			// draw container
			context.fillStyle = (won ? colors["won"]: colors["lose"]);
			context.fillRect(width / 4, height / 4, winWidth, winHeight);

			// write score if won else write you lose
			context.fillStyle = "#FFF";
			context.textAlign = "center";
			if(won) {
				context.font = "100 20px calibri";
				context.fillText("Your Score is", width / 2, height / 4 + 40);
				context.font = "100 80px calibri";
				context.fillText(score, width / 2, height / 4 + 120);
			} else {
				context.font = "100 40px calibri";
				context.fillText("You Lose!", width / 2, height / 4 + 60);
			}

			// play again button
			var play_btn = new Button(init, width / 3, height / 4 + 200, width / 3, 60, "Play again?");
		}

		/**
		 *	Button Method
		 *	Create a colorful rounded button and allow executing a method on click event.
		 *
		 * 	@Param callback - Method to execute on button click
		 * 	@Param x - position from left of the canvas
		 * 	@Param y - position from top of the canvas
		 * 	@Param width - width of the button
		 * 	@Param height - height of the button
		 * 	@Param text - integer defining the text in the button
		**/
		var Button = function(callback, x, y, width, height, text) {

			// Method to draw the button
			var draw = function() {
				context.fillStyle = colors.button;

				// left circle
				context.arc(x + width/2 - height, y + height/2, height/2, 0, 2*Math.PI);
				context.fill();

				// right circle
				context.arc(x + width/2 + height, y + height/2, height/2, 0, 2*Math.PI);
				context.fill();

				// middle box
				context.fillRect(x + height/2, y, width - height, height);

				// text drawing
				context.fillStyle = "#FFF";
				context.textAlign = "center";
				context.textBaseline = "middle"; 
				context.font = "20px calibri";
				context.fillText(text, x + width / 2, y + height / 2);
			}

			// Modify the mouse positions to fit the canvas
			var getCanvasMouse = function(e) {
				var rect = canvas.getBoundingClientRect();
				var x = (e.clientX - rect.left) / (rect.right - rect.left) * canvas.width;
				var y = (e.clientY - rect.top) / (rect.bottom - rect.top) * canvas.height;

				return { x: x, y: y};
			}

			// Draw the button
			draw();

			// Listen for the click event
			window.addEventListener("click", function(e) {
				var pos = getCanvasMouse(e);

				// Test if the mouse click happened inside the button, call callback method if it did.
				if(pos.x <= x + width && pos.x >= x && pos.y >= y && pos.y <= y + height)
					callback();
			});
		}

		/**
		 *	draw Method
		 *	Method responsible for drawing the game world onto the canvas.
		 */
		var draw = function() {

			// Define the width and height of each block
			var width = Math.floor(canvas.width / size), 
				height = Math.floor(canvas.height / size);
			
			// Bring up a clean slate
			// Let's start fresh
			clear();
			
			// Loop through the hame world and draw all the blocks
			for(var i = 0; i < size; i++) {
				for(var j = 0; j < size; j++) {
					drawBox(j*width, i*height, width, height, world[i][j]);
				}
			}

			// Draw score board
			drawScore();
		}


		// ============================================================================
		// ========================== Constructors Methods ============================
		// ============================================================================

		/**
		 *	Constructor method for left swiping
		**/
		this.swipeLeft = function() {
		 	update(directions.LEFT);
		}

		/**
		 *	Constructor method for Right swiping
		**/
		this.swipeRight = function() {
		 	update(directions.RIGHT);
		}

		/**
		 *	Constructor method for Up swiping
		**/
		this.swipeUp = function() {
		 	update(directions.UP);
		}

		/**
		 *	Constructor method for Down swiping
		**/
		this.swipeDown = function() {
		 	update(directions.DOWN);
		}

		// ============================================================================
		// ========================= Auto Executed Methods ============================
		// ============================================================================
		init();
		
	}

	var gameWorld = new World(canvas, size);
	holder.appendChild(canvas);

	window.addEventListener("keydown", function(e) {
		// get keycode
		var code = e.keyCode || e.charCode;

		switch (code) {
			// Set I key to Up
			case 38: 	gameWorld.swipeUp();
			break;
			// Set J key to Left
			case 37: 	gameWorld.swipeLeft();
			break;
			// Set K key to Down
			case 40: 	gameWorld.swipeDown();
			break;
			// Set L key to Right
			case 39: 	gameWorld.swipeRight();
			break;
		}
	});
}

TwentyFortyEightGame();