const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema({
    courseName:{
        type: String,
    },
    couseDescription: {
        type: String,
    },
    instructor:{
        type: mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true,
    },
    whatYouWillLearn: {
        type:String,
    },
    courseContent: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref:"Section",
        }
    ],
    ratingAndReview:[
        {
            type:mongoose.Schema.Types.ObjectId,
            ref:"RatingAndReview",
        }
    ],
    price:{
        type:String,
    },
    thumbnail:{
        type:String,
    },
    tag:{
        type: [String],
        required: true,
    },
	category: {
		type: mongoose.Schema.Types.ObjectId,
		// required: true,
		ref: "Category",
	},
    studentsEnrolled: [
        {
            type:mongoose.Schema.Types.ObjectId,
            ref:"User",
            require:true,
        }
    ],
    instructions: {
		type: [String],
	},
	status: {
		type: String,
		enum: ["Draft", "Published"],
	},
});

module.exports = mongoose.model("Course" , courseSchema);

// improvemt last mein check karna hai required true and trim add karke