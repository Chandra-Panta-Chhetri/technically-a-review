var mongoose 		= require("mongoose"),
	commentSchema 	= new mongoose.Schema({
		author: {
			id: {
				type: mongoose.Schema.Types.ObjectId,
				ref: "User"
			},
			username: String
		},
		contents: String
	});
	
module.exports = mongoose.model("Comment", commentSchema);