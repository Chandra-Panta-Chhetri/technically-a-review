const mongoose 		 = require("mongoose"),
	  commentSchema  = new mongoose.Schema({
			author: {
				id: {type: mongoose.Schema.Types.ObjectId, ref: "User", required: true},
				username: {type: String, required: true}
			},
			content: {type: String, required: true},
			rating: {type: Number, default: 0, min: 0, max: 5},
			campId: {type: mongoose.Schema.Types.ObjectId, ref: "Camp", required: true}
	   }, {timestamps: true});
	
module.exports = mongoose.model("Comment", commentSchema);