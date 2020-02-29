var mongoose = require("mongoose"),
	Comment	 = require("./models/comment"),
	Camp 	 = require("./models/camp"),
	data 	 = [
		{
			image: "https://images.unsplash.com/photo-1537565266759-34bbc16be345?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=400&q=60",
			name: "Camp Fire",
			description: "Might be a little too hot to handle",
			price: "43.2"
		},
		{
			image: "https://images.unsplash.com/photo-1510312305653-8ed496efae75?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=400&q=60",
			name: "Desert Hill",
			description: "You might wanna bring water",
			price: "21.32"
		},
		{
			image: "https://images.unsplash.com/photo-1487730116645-74489c95b41b?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=400&q=60",
			name: "Forest Lake",
			description: "Lots.....and Lots of trees",
			price: "63.23"
		},
		{
			image: "https://images.unsplash.com/photo-1526491109672-74740652b963?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=400&q=60",
			name: "Lagoon Place",
			description: "Cool and relaxing place",
			price: "41.32"
		}
	];

function seed(){
	Comment.deleteMany({}, function(err){
		Camp.deleteMany({}, function(err){
		Comment.deleteMany({}, function(err){
			data.forEach(function(seed){
				Camp.create(seed, function(err, camp){
					Comment.create({author: "Jimmy Corea", contents: "blah blah blah"}, function(err, comment){
						camp.comments.push(comment);
						camp.save();
					});
				});
			});
		});
	});
	});
}

module.exports = seed;