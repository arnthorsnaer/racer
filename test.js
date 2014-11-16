// Get the accessories data
var fs = require('fs');
var path = require('path');

var levels =  new require("./levels.js");
var alphabet = ["a","á","b","d","ð","e","é","f","g","h","i","í","j","k","l","m","n","o","ó","p","r","s","t","u","ú","v","x","y","ý","þ","æ","ö"]



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




for (var i = levels.length - 1; i >= 0; i--) {
	split_word = split(levels[i].target);
	var bag_of_chars = mix(split_word,alphabet);

	var count = 0;
	target_left = levels[i].target
	console.log("PICK:" + target_left)

	// stream characters and play a perfect game
	while(true){
		pick_char = bag_of_chars[Math.floor(Math.random()*bag_of_chars.length)];
		console.log(count + " : " + pick_char);

		if (target_left.indexOf(pick_char)>-1) {
			target_left = target_left.replace(new RegExp(pick_char, "gi"),'');


			bag_of_chars = mix(split(target_left),alphabet);
			
			console.log("PICK:" + target_left)
			if (target_left.length===0) {break;};
		};

		count++; if(count === 100){break;};
	};

};
