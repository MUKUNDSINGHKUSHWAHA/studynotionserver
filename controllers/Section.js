const Section = require("../models/Section");
const Course = require("../models/Course");
const SubSection = require("../models/SubSection");

exports.createSection = async(req,res) => {
    try{
        const {sectionName , courseId} = req.body;

        // data Validation
        if(!sectionName || !courseId){
            return res.status(400).json({
                success:false,
                message:"Missing required properties",
            });
        }

        const newSection = await Section.create({sectionName});

        // update course with section OBjectID
        const updatedCourse = await Course.findByIdAndUpdate(
                    courseId,
                    {
                        $push:{
                            courseContent: newSection._id,
                        }
                    },
                    {new:true},
                ).populate({ //         // use populate to replace section / subsection both in updated course
                        path: "courseContent",
                        populate: {
                            path: "subSection",
                        },
                }).exec();


        res.status(200).json({
            success:true,
            message:"Section created successfully",
            updatedCourse,
        });
    } catch(error){
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        });
    }
};


// UPDATE a section
exports.updateSection = async(req,res) => {
    try{
        // data input
        const {sectionName , sectionId , courseId} = req.body;

        // update data
        const section = await Section.findByIdAndUpdate(
            sectionId,
            {sectionName},
            {new:true}
        );

        const course = await Course.findById(courseId)
		.populate({
			path:"courseContent",
			populate:{
				path:"subSection",
			},
		})
		.exec();

        res.status(200).json({
            success:true,
            message: section,
            data:course,
        });

        // // data Validation
        // if(!sectionName || sectiornId){
        //     return res.status(400).json({
        //         success:false,
        //         message:"Missing Properties",
        //     });
        // }



        // // return res
        // return res.status(200).json({
        //     success:true,
        //     message:"Section Updated Successfully",
        // })

        
    } catch(error){
        console.error("Error updating section:", error);
        return res.status(500).json({
            success:false,
            message: "Internal server error",

        })
    }
}



exports.deleteSection = async(req,res) => {
    try{
        // get ID -params sending 
        const {sectionId, courseId} = req.body;

        await Course.findByIdAndUpdate(courseId, {
			$pull: {
				courseContent: sectionId,
			}
		})
        
        const section = await Section.findById(sectionId);
		console.log(sectionId, courseId);
		if(!section) {
			return res.status(404).json({
				success:false,
				message:"Section not Found",
			})
		}

		//delete sub section
		await SubSection.deleteMany({_id: {$in: section.subSection}});

		await Section.findByIdAndDelete(sectionId);

		//find the updated course and return 
		const course = await Course.findById(courseId).populate({
			path:"courseContent",
			populate: {
				path: "subSection"
			}
		})
		.exec();

		res.status(200).json({
			success:true,
			message:"Section deleted",
			data:course
		});
    } catch(error){
		console.error("Error deleting section:", error);
		res.status(500).json({
			success: false,
			message: "Internal server error",
		});
    }
};
