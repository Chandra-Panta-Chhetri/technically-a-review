var mongoose 		= require("mongoose"),
	commentSchema 	= new mongoose.Schema({
		author: {
			id: {
				type: mongoose.Schema.Types.ObjectId,
				ref: "User"
			},
			username: String
		},
		contents: String,
		createdDate: {type: Date, default: Date.now}
	});
	
module.exports = mongoose.model("Comment", commentSchema);