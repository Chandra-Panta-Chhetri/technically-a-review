const mongoose 		 = require("mongoose"),
	  commentSchema  = new mongoose.Schema
	  ({
			author: {
				id: {type: mongoose.Schema.Types.ObjectId, ref: "User"},
				username: String
			},
			content: String,
			rating: {type: Number, default: 0}
	   }, {timestamps: true});
	
module.exports = mongoose.model("Comment", commentSchema);