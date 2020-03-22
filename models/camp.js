const mongoose 	    = require("mongoose");
	  User		    = require("./user"),
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
			},
			avgRating: {type: Number, default: 0}
		}, {timestamps: true});

campSchema.pre("remove", async function(next){
	const camp = this;
	camp.comments.forEach(async function (comment){
		let author = await User.findById(comment.author.id);
		author.commentedCamps = author.commentedCamps.filter(function (campId) {
			return !campId.equals(camp._id);
		});
		await author.save();
		comment.remove();		
	});
	next();
});
module.exports = mongoose.model("Camp", campSchema);