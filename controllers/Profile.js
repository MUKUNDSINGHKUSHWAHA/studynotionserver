const Profile = require("../models/Profile");
const User = require("../models/User");
const { uploadImageToCloudinary } = require("../utils/imageUploader");


// Method for updating a profile
exports.updateProfile = async(req,res) =>{
    try{
        //  get data
        
        const { dateOfBirth="" , about="" , contactNumber } = req.body;
        
        //  getuserId
        const id = req.user.id;
        // console.log("123123123")
         //  find profile
         const userDetails = await User.findById(id);
        //  const profileId = userDetails.additionalDetails;
         const profile = await Profile.findById(userDetails.additionalDetails);

        //  update profile
        profile.dateOfBirth = dateOfBirth;
        profile.about = about;
        profile.contactNumber = contactNumber;
        // profile.gender = gender;

        await profile.save();

        // //  validation
        // if(!contactNumber || !gender || !id){
        //     return res.status(400).json({
        //         success:false,
        //         message:'All fields are required',
        //     });
        // }

        //  return response
        return res.status(200).json({
            success:true,
            message:"Profile Update Successfully",
            profile,
        });
    } catch(error){
        
        return res.status(500).json({
            success:false,
            error:error.message,
        });
    }
};



exports.deleteAccount = async(req , res) => {
    try{
        //get id
        const id = req.user.id;
        //validation
        const user = await User.findById({_id:id});
        if(!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }

        //delete profile
        await Profile.findByIdAndDelete({_id: user.additionalDetails });
        //TOOD: HW unenroll user form all enrolled courses
        //delete user
        await User.findByIdAndDelete({_id:id});  // improvement yeh task schedulling hona chaiye  
                                                
        //return response
        return res.status(200).json({
            success:true,
            message:'User Deleted Successfully',
        });
    } catch(error){
        console.log(error);
        // return 
        res.status(500).json({
            success:false,
            message:'User cannot be deleted successfully '
        })
    }
};


exports.getAllUserDetails = async (req, res) => {

    try{
    
        //get id
        const id = req.user.id;
        
        //validation and get user details
        const userDetails = await User.findById(id)
                                      .populate("additionalDetails")
                                      .exec();
        
        console.log(userDetails);
        //return response
        return res.status(200).json({
            success:true,
            message: 'User Data Fetched Successfully',
            data: userDetails,
        });
    
    } catch(error) {
        return res.status (500).json({
            success: false,
            message:error.message,
        });
    }
};


exports.updateDisplayPicture = async (req, res) => {
    try {
      
      const displayPicture = req.files.displayPicture
      const userId = req.user.id
      const image = await uploadImageToCloudinary(
        displayPicture,
        process.env.FOLDER_NAME,
        1000,
        1000
      )
      console.log(image)
      const updatedProfile = await User.findByIdAndUpdate(
        { _id: userId },
        { image: image.secure_url },
        { new: true }
      )
      res.send({
        success: true,
        message: `Image Updated successfully`,
        data: updatedProfile,
      })
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      })
    }
};
  
exports.getEnrolledCourses = async (req, res) => {
    try {
      const userId = req.user.id
      const userDetails = await User.findOne({
        _id: userId,
      })
        .populate("courses")
        .exec()
      if (!userDetails) {
        return res.status(400).json({
          success: false,
          message: `Could not find user with id: ${userDetails}`,
        })
      }
      return res.status(200).json({
        success: true,
        data: userDetails.courses,
      })
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      })
    }
};