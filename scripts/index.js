/*
Notes: 
'data' is lazily imported from the html
'seedrandom' is also imported from html. it gives deterministic random #s based on a seed set in fire()
*/


var wordsSelected = [];
var teams = [];
var NUMBER_OF_WORDS = 25;
var spyMasterMode = false;
var sessionData = [];
var customData = [];

var COLOR_RED = "#ff0000";
var COLOR_YELLOW = "#ffff00";
var COLOR_BLUE = "#00eeee";
var COLOR_BLACK = "#808080";
var COLOR_GREEN = "#009000";

//init
$("#seed").keyup(function() {
	fire();
});

$("#gameMode").change(function() {
	fire();
});

async function fetchDataAndReturnValue(user_prompt) {
    try {
        // Perform the fetch request and wait for the response
        const response = 
			await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=AIzaSyBr0mH3brDW-hetFbXqCJ1ESMTtxOk-SwM", {
				method: "POST",
				body: JSON.stringify({
					"contents": [{"parts": [{"text": user_prompt + ". Just a comma separated list."}]}]
				}),
				headers: {
					"Content-type": "application/json; charset=UTF-8"
				}
			});
        
        // Wait for the response to be converted to JSON (or text, depending on the format)
        const data = await response.json(); // Use .text() if the response is not JSON

		// Now data is available here synchronously
		// Split the data
		console.log(data);
		customData = data.candidates[0].content.parts[0].text.split(', ');
		console.log("Words to be used...", customData);
        
        // Return the data (the function will pause until this point)
        return customData;
    } catch (error) {
        console.error("Error fetching data:", error);
        // Optionally, you can return a default value or handle the error as needed
        return null;
    }
}


$("#seed").val(Math.floor(Math.random() * 1000));
fire();

async function fire() {
	//get seed and set the seed for randomizer
	var seed = document.getElementById("seed").value;
	Math.seedrandom(seed.toLowerCase());

	var option = $('#gameMode :selected').val();
	switch (option) {
		case 'tamil':
			sessionData = tamilmoviesdata.slice(0);
			break;
		case 'spanish':
			sessionData = spanishData.slice(0);
			break;
		case '2knouns':
			sessionData = data.slice(0);
			break;
		case 'movies':
			sessionData = movieData.slice(0);
			break;
		case 'custom':
			if (customData.length === 0) {
				var user_prompt = prompt("Please prompt Gemini for words", "Enter prompt here");
                sessionData = await fetchDataAndReturnValue(user_prompt + ". Just a comma separated list."); // Wait for the fetch to complete
			}
			break;
		default:
			sessionData = defaultData.slice(0);
	}

	console.log("sessionData: ", sessionData);

	wordsSelected = [];
	teams = [];
	spyMasterMode = false;
	document.getElementById("board").innerHTML = "";

	//fire new board
	updateScore();
	createNewGame();
}

//not used, but probably useful at some point
function removeItem(array, index) {
	if (index > -1) {
		// console.log("index: " + index + ", word: " + array[index] + " removed.");
		array.splice(index, 1);
	}
}

function createNewGame() {
	var trs = [];
	for (var i = 0; i < NUMBER_OF_WORDS; i++) {
		if (!trs[i % 5]) {
			trs[i % 5] = "";
		}
		var randomNumber = Math.floor(Math.random() * sessionData.length);
		var word = sessionData[randomNumber];
		removeItem(sessionData, randomNumber);
		wordsSelected.push(word);
		trs[i % 5] += "<div class=\"word\" id=\'" + i + "\' onclick=\"clicked(\'" + i + "\')\"><div><a href=\"#\"><span class=\"ada\"></span>" + word + "</a></div></div>";
	}
	//<a href="#"><span class="ada">Washington stimulates economic growth </span>Read me</a>
	for (var i = 0; i < trs.length; i++) {
		document.getElementById("board").innerHTML += '<div class="row">' + trs[i] + '</div>'
	}

	//create teams
	for (var i = 0; i < 8; i++) {
		teams.push(COLOR_RED);
		teams.push(COLOR_BLUE);
	}

	// one extra for one of the teams
	if (Math.floor(Math.random() * data.length) % 2 === 0) {
		teams.push(COLOR_RED);
		// document.getElementById("team").style.color = COLOR_RED;
		// document.getElementById("team").innerHTML = "RED";
		$('#board').addClass('redStarts').removeClass('blueStarts');

	} else {
		teams.push(COLOR_BLUE);
		// document.getElementById("team").style.color = COLOR_BLUE;
		// document.getElementById("team").innerHTML = "BLUE";
		$('#board').addClass('blueStarts').removeClass('redStarts');
	}

	// add neturals 
	for (var i = 0; i < 7; i++) {
		teams.push(COLOR_YELLOW);
	}

	// push the assasin
	teams.push(COLOR_BLACK)

	//shuffle teams
	shuffle(teams);

	updateScore();
}

function clicked(value) {
	if (spyMasterMode) {
		//spymaster mode
		document.getElementById(value).style.backgroundColor = COLOR_GREEN;
	} else {
		//guessers mode
		var word = wordsSelected[value];
		if (document.getElementById("confirm").checked) {
			if (window.confirm("Are sure you want to select '" + word + "'?")) {
				document.getElementById(value).style.backgroundColor = teams[value];
				if (teams[value] == "black") {
					document.getElementById(value).style.color = "white";
				}
			}
		} else {
			document.getElementById(value).style.backgroundColor = teams[value];
			if (teams[value] == "black") {
				document.getElementById(value).style.color = "white";
			}
		}
	}
	updateScore();
}

function updateScore() {
	var blueScore = 9;
	var redScore = 9;
	if (spyMasterMode) {
		blueScore = 0;
		redScore = 0;
		$('div.word').each(function() {
			var color = $(this).css('background-color');
			if (color === 'rgb(0, 238, 238)') {
				blueScore++;
			}
			if (color === 'rgb(255, 0, 0)') {
				redScore++;
			}
		});
	} else {
		$('div.word').each(function() {
			var color = $(this).css('background-color');
			if (color === 'rgb(0, 238, 238)') {
				blueScore--;
			}
			if (color === 'rgb(255, 0, 0)') {
				redScore--;
			}
		});

		if ($('.redStarts').length === 1) {
			blueScore--;
		} else {
			redScore--;
		}
	}
	$('#redScore').text(redScore);
	$('#blueScore').text(blueScore);
	if(redScore === 0){
		$('#redScore').text('Winner!');
	}
	if(blueScore === 0){
		$('#blueScore').text('Winner!');
	}
}

function spyMaster() {
	//TODO: randomize or organize tiles for easier comparing
	spyMasterMode = true;
	for (var i = 0; i < NUMBER_OF_WORDS; i++) {
		document.getElementById(i).style.backgroundColor = teams[i];
		if (teams[i] == "black") {
			document.getElementById(i).style.color = "white";
		}
	}
}

function shuffle(array) {
	var currentIndex = array.length,
		temporaryValue, randomIndex;

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
}

//enable pressing 'Enter' on seed field
document.getElementById('seed').onkeypress = function(e) {
	if (!e) e = window.event;
	var keyCode = e.keyCode || e.which;
	if (keyCode == '13') {
		// Enter pressed
		fire();
		return false;
	}
}
