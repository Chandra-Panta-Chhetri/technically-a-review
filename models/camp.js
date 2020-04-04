const mongoose 	    = require("mongoose");
	  Comment		= require("./comment"),
	  campSchema 	= new mongoose.Schema({
			name: {type: String, unique: true, required: true},
			image: {
				id: {type: String, required: true},
				url: {type: String, required: true}
			},
			description: {type: String, required: true},
			price: {type: String, required: true},
			author: 
			{
				id: {type: mongoose.Schema.Types.ObjectId, ref: "User", required: true},
				username: {type: String, required: true}
			},
			avgRating: {type: Number, default: 0, min: 0, max: 5}
		}, {timestamps: true});

campSchema.virtual("comments", {
	ref: "Comment",
	localField: "_id",
	foreignField: "campId"
});

campSchema.pre("remove", async function(next){
	await Comment.deleteMany({campId: this._id});
	next();
});

module.exports = mongoose.model("Camp", campSchema);