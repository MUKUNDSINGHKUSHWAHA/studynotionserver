// what to do
// 1. sign up send otp
    // email le lenge req ki body se
    // if(user already exist) 
        // toh return respose
        // generate unique otp
        // store in OTP DB to check when user enter it
        // delete karne ki jaroorat nahi hai automatically delete hojayega 5min baad
// 2. sign up
    // retrieve data 
    // check 2 password 
    // check already a user
        // login karo
    // OTP bheja jayega 
        // if OTP is correct hosakta hai id ke corresponding multiple OTP generated ho toh sab se latest wale se check karna hai
            // password hashed
            // database entry
// 3. login
    // get data from req body
    // validation data
        // user check exits or not
        // password check
    // genrate JWT , after password matching
    // create cookie and send response
// 4. change password
    // get data from req body {oldPassword , newPassword , confirmNewPassword}
    // Validation
    // upadate password in DB
    // send mail - Password updated
    // return response
// reset password -> resetpasswordToken function generate link and send it to mail
//                -> resetpassword function reset password in DB

//MIDDLEWARE
// auth
// isStudent
// isAdmin
// isInstructor


const bcrypt = require("bcrypt");
const User = require("../models/User");
const OTP = require("../models/OTP");
const jwt = require("jsonwebtoken");
const otpGenerator = require("otp-generator");
const mailSender = require("../utils/mailSender");
const { passwordUpdated } = require("../mail/templates/passwordUpdated");
const Profile = require("../models/Profile");
require("dotenv").config();


exports.signUp = async(req , res) => {

    try{
        // data fetch from request body
        const {
            firstName,
            lastName,
            email,
            password,
            confirmPassword,
            accountType,
            contactNumber, 
            otp
        } = req.body;


        // validation
        if(
            !firstName || 
            !lastName || 
            !email || 
            !password || 
            !confirmPassword || 
            !otp
        ){ //contact number ko optional maan rahe nai aur account type ek tab hai toh check karne ki jaroorat nahi  
            res.status(403).json({
                success:false,
                message:"All feild required"
            })
        }

        // check 2 password 
        if(password !== confirmPassword){
            return res.status(400).json({
                success:false,
                message:"Password and Confirm Password are not same"
            });
        }

        // check user already exist or not 
        const existingUser = await User.findOne({email});
        if(existingUser){
            return res.status(400).json({
                success:false,
                message:"User is already registered. Please sign in to continue."
            });
        }

        // find most recent OTP stored for the user
        const response = await OTP.find({ email }).sort({ createdAt: -1 }).limit(1);
		console.log(response);
		if (response.length === 0) {
			// OTP not found for the email
            // console.log("yaha par fail hoa 1");

			return res.status(400).json({
				success: false,
				message: "The OTP is not valid",
			});
		} else if (otp !== response[0].otp) {
            // console.log("yaha par fail hoa 2");
			// Invalid OTP

			return res.status(400).json({
				success: false,
				message: "The OTP is not valid",
			});
		}
        // Hash password 
        const hashedPassword = await bcrypt.hash(password , 10);
    
        // Create the user
		let approved = "";
		approved === "Instructor" ? (approved = false) : (approved = true);


        // entry create in DB
        const profileDetails = await Profile.create({
            gender: null,
            dateOfBirth: null,
            about:null,
            contactNumber:null,
        });

        // console.log("3");

        const user = await User.create({
            firstName,
            lastName,
            email,
            contactNumber,
            password:hashedPassword,
            accountType,
            approved: approved,
            additionalDetails:profileDetails._id,
            image: `https://api.dicebear.com/5.x/initials/svg?seed=${firstName}${lastName}`, 
        });

        // return res
        return res.status(200).json({
            success:true,
            user, 
            message:'User is registered Successfully'
        });


    } catch(error){
        console.log("error occured in signup function in Auth" , error);
        return res.status(500).json({
            success:false,
            message:"User cannot be registered.Please try again"
        })
    }
}




// Login code 
exports.login = async(req,res) => {
     try{
        // get data from req body
        const {email , password} = req.body;
        // validation data
        if(!email || !password){
            return res.status(400).json({
                success:false,
                message:'All fields are required, please try again',
            })
        }

        // user check exits or not
        const user = await User.findOne({email}).populate("additionalDetails");
        // If user not found with provided email
        if(!user){
            return res.status(401).json({
                success:false,
                message:"User is not registered, please signup first",
            });
        }

        // Generate JWT token and Compare Password
        if(await bcrypt.compare(password , user.password)){

            // genrate JWT , after password matching
            const token = jwt.sign(
				{ email: user.email, id: user._id, accountType: user.accountType },
				process.env.JWT_SECRET,
				{
					expiresIn: "24h",
				}
			);

            // Save token to user document in database
            user.token = token;
            user.password = undefined;

            // create cookie and send response
            const options = {
                expires: new Date(Date.now() + 3*24*60*60*1000),
                httpOnly:true, // why this is used search karna hiai
            }
            res.cookie("token" , token , options).status(200).json({
                success:true,
                token,
                user,
                messagge: 'Logged in successfully',
            });

        }
        else{
            return res.status(401).json({
                success: false,
                message: 'password is incorrect'
            });
        }
        
        
     } catch(error){
        console.log("error in login in auth controller", error);
        return res.status(500).json({
            success:false,
            message:'Login Failure , try again'
        })
     }
}


//sendOtp code 
exports.sendOTP = async (req , res) => {
    try{
        // fetch emailfrom request ki body
        const {email} = req.body;

        // check if Uset already exist
        const checkUserPresent = await User.findOne({email});

        // if user already exist , then return a response
        if(checkUserPresent){
            // Return 401 Unauthorized status code with error message
            return res.status(401).json({
                success:false,
                message:"User already registered",
            })
        }

        // generate OTP
        var otp = otpGenerator.generate(6 , {
            upperCaseAlphabets:false,
            lowerCaseAlphabets:false,
            specialChars:false,
        });
        console.log("OTP genrated" , otp);

        // check unique otp or not
        // yaha par improvement ho sakti hai loi library use karke jo unique otp hi bheje
        let result = await OTP.findOne({otp : otp}); // result ko const ki jagah let kiya hai 
		console.log("Result is Generate OTP Func");
		console.log("OTP", otp);
		console.log("Result", result);

        while(result){
            otp = otpGenerator(6 , {
                upperCaseAlphabets:false,
            });
            result = await OTP.findOne({otp:otp});
        }

        const otpPayload = {email , otp};

        // Created entry in DB
        const otpBody = await OTP.create(otpPayload);
        console.log(otpBody);

        // return response
        res.status(200).json({
            success:true,
            message:'OTP Sent Successfully',
            otp,
        });

        // improvement can done in validation of email

    } catch(error){
        console.log("Error Occured in sending sign up otp" , error);
        return res.staus(500).json({
            success:false,
            message:error.message,
        });
    }
};



// Controller for Changing Password
exports.changePassword = async (req, res) => {
	try {
		// Get user data from req.user
		const userDetails = await User.findById(req.user.id);

		// Get old password, new password, and confirm new password from req.body
		const { oldPassword, newPassword, confirmNewPassword } = req.body;

		// Validate old password
		const isPasswordMatch = await bcrypt.compare(
			oldPassword,
			userDetails.password
		);
		if (!isPasswordMatch) {
			// If old password does not match, return a 401 (Unauthorized) error
			return res
				.status(401)
				.json({ success: false, message: "The password is incorrect" });
		}

		// Match new password and confirm new password
		if (newPassword !== confirmNewPassword) {
			// If new password and confirm new password do not match, return a 400 (Bad Request) error
			return res.status(400).json({
				success: false,
				message: "The password and confirm password does not match",
			});
		}

		// Update password
		const encryptedPassword = await bcrypt.hash(newPassword, 10);
		const updatedUserDetails = await User.findByIdAndUpdate(
			req.user.id,
			{ password: encryptedPassword },
			{ new: true }
		);

		// Send notification email
		try {
			const emailResponse = await mailSender(
				updatedUserDetails.email,
				passwordUpdated(
					updatedUserDetails.email,
					`Password updated successfully for ${updatedUserDetails.firstName} ${updatedUserDetails.lastName}`
				)
			);
			console.log("Email sent successfully:", emailResponse.response);
		} catch (error) {
			// If there's an error sending the email, log the error and return a 500 (Internal Server Error) error
			console.error("Error occurred while sending email:", error);
			return res.status(500).json({
				success: false,
				message: "Error occurred while sending email",
				error: error.message,
			});
		}

		// Return success response
		return res
			.status(200)
			.json({ success: true, message: "Password updated successfully" });
	} catch (error) {
		// If there's an error updating the password, log the error and return a 500 (Internal Server Error) error
		console.error("Error occurred while updating password:", error);
		return res.status(500).json({
			success: false,
			message: "Error occurred while updating password",
			error: error.message,
		});
	}
};







