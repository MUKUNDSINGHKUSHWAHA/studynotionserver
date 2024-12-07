// forgot password ui click 
// genrate link and send it on mail with token and expire time
// ****************
// open that link new UI
// new password set

const User = require("../models/User");
const mailSender = require("../utils/mailSender");
const bcrypt = require("bcrypt");
const crypto = require("crypto");


exports.resetPasswordToken = async(req,res) => {
    try{
        // get email from req body
        const email = req.body.email;
        // check user for this email , email validation
        const user = await User.findOne({email: email});
        if(!user){
            return res.json({
                success:false ,
                message:`This Email: ${email} is not Registered With Us Enter a Valid Email`,
            });
        }

        // generate token
        const token = crypto.randomBytes(20).toString("hex");

        // update user by adding token and expiration time
        const updatedDetails = await User.findOneAndUpdate(
                                            {email: email},
                                            {
                                                token:token,
                                                resetPasswordExpires: Date.now() + 3600000,
                                            },
                                            {new:true});

        console.log("DETAILS", updatedDetails);

        // create url
        const url = `http://localhost:3000/update-password/${token}`;

        // send mail containing the url
        await mailSender(
            email , 
            "Password Reset Link -by studyNotion" , 
            `Your Link for email verification is ${url}. Please click this url to reset your password.`
        );

        // return response
        return res.json({
            success:true,
            message:"Email Sent Successfully, Please Check Your Email to Continue Further",
        });

    }catch(error){
        console.log("reset password error" , error)
        return res.status(500).json({
            error: error.message,
            success:false ,
            message:'Something went worng while reset password',
        });
    }
}



// UI par click hone ke badd
exports.resetPassword = async(req,res) => {
    
    try{
        // data fetch
        const {password , confirmPassword , token} = req.body; // req mein token frontend se aaya hai 

        // validation 
        if(password !== confirmPassword){

            return res.json({
                success:false,
                message:"Password and Confirm Password Does not Match",
            });
        }

        // get userDetail from db using token
        const userDetails = await User.findOne({token: token});

        // if not entry - invalid token
        if(!userDetails){
            return res.json({
                success : false,
                message: 'Token is invalid',
            });
        }

        // token time check
        if(!(userDetails.resetPasswordExpires > Date.now())){ // userDetails.resetPasswordExpires < Date.now()
            return res.status(403).json({
                success: false,
                message: 'Token is expires , please regenerate your token'
            });
        }

        // hash pwd
        const encryptedPassword = await bcrypt.hash(password , 10);

        //update password
        await User.findOneAndUpdate(
			{ token: token },
			{ password: encryptedPassword },
			{ new: true }
        );

        // response return 
        // return res.status(200).json({
        //     success:true,
        //     message:'Password reset successful'
        // });
        res.json({
			success: true,
			message: `Password Reset Successful`,
		});

    } catch(error){
        console.log("reset password error" , error)
        return res.status(500).json({
            error: error.message,
            success:false ,
            message:'Something went worng while reset password',
            
        });
    }
};