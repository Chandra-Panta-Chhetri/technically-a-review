const mongoose 	    = require("mongoose"),
	  campSchema 	= new mongoose.Schema
	  ({
			name: {type: String, unique: true},
			image: String,
			description: String,
			price: String,
			comments: [{type: mongoose.Schema.Types.ObjectId, ref: "Comment"}],
			author: 
			{
				id: {type: mongoose.Schema.Types.ObjectId, ref: "User"},
				username: String
			}
		}, {timestamps: true});

module.exports = mongoose.model("Camp", campSchema);