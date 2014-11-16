// Get the accessories data
var fs = require('fs');
var path = require('path');

var keypress = require('keypress');

var levels =  new require("./levels.js");
var alphabet = ["a","á","b","d","ð","e","é","f","g","h","i","í","j","k","l","m","n","o","ó","p","r","s","t","u","ú","v","x","y","ý","þ","æ","ö"];

//accepts a target string, 
//returns an array of it's constituents
function split(word){
	var split = word.split(' ');
	if (split.length===1) {split = word.split('');};
	return split;
}

//take in all the parts + some zeroes and mix them together
function mix(split_word, alphabet){
	selection = split_word.concat(alphabet);
	selection = selection.concat(split_word);
	selection = selection.concat(split_word);
	selection = selection.concat(split_word);	
	number_of_zeroes_needed = (selection.length*2)-selection.length;
	zeroes = new Array(number_of_zeroes_needed+1).join(' ').split('')
	return selection.concat(zeroes);
}






// make `process.stdin` begin emitting "keypress" events
keypress(process.stdin);

	//// stream characters and play a perfect game
	//while(true){
//
	//	if (target_left.indexOf(pick_char)>-1) {
	//		
	//		console.log("Picked:" + pick_char + " - Left:" + target_left)
	//		if (target_left.length===0) {break;};
	//	};
	//	count++; if(count === 100){break;};
	//};






// and loop on it

split_word = split(levels[0].target);
var bag_of_chars = mix(split_word,alphabet);

var target_left = levels[0].target
var board = new Array(19);

process.stdin.on('keypress', function (ch, key) {
	//console.log('got "keypress"', key);
	//console.log(key.name);

	//check if i pressed a key
	var picked_char = "";
	if (key.name!=="enter"){

		picked_char = key.name;

	  		//check if it matched my selected square
	  		// check board position X for match
			//target_left = target_left.replace(new RegExp(pick_char, "gi"),'');
			//bag_of_chars = mix(split(target_left),alphabet);	
	}

	//process rest
	if (key.name==="enter") {
		//generate new letter
		generated_char = bag_of_chars[Math.floor(Math.random()*bag_of_chars.length)];
	
		board.unshift({generated:generated_char,sucess:false});
		board.pop();

		//render


		for (var i = board.length - 1; i >= 0; i--) {
			if (board[i]!==undefined) {
				if (i===4) {
					console.log("#" + board[i].generated);
				} else {
					console.log(board[i].generated);					
				}

			};			
		};	

		console.log("Target word : " + target_left);	

	};
	


});


process.stdin.resume();




