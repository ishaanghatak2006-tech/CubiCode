const Users=require("../schemas/User");
const express=require("express");
const mongoose=require("mongoose");
const Submissions=require("../schemas/Submission");
const Question=require("../schemas/Question");
const { stripTypeScriptTypes } = require("node:module");
const router=express.Router();
const jwt=require("jsonwebtoken");
const env=require('../config/env');

//this contains the user dashbooard routes....and safe login
router.post('/login',async(req,res)=>{
    try{
        const {Email,Password}=req.body;
        if(!Email || !Password){
            return res.status(400).json("endter your credentials please!");
        }
        const userData=await Users.findOne({Email}).select('+Password');
        if(!userData){
            return res.status(400).json({message:"Email is wrong!"});
        }
        //compare password
        const result=await userData.comparePassword(Password);
        if(!result){
            return res.status(400).json({message:"Password is incorrect"});
        }
        const token=jwt.sign(
            {
                id:userData.id,
            },
            env.JWT_SECRET,
            {
                expiresIn:"7d",
            }
        )
        return res.status(200).json({
            message:"Login successful",
            token,
            user:{
                id: userData._id,
                Username: userData.Username,
                Email: userData.Email,
                Role: userData.Role
            }
        });
    }   
    catch(err){
        const errMessages="Error logging in"+err.message;
        console.log(errMessages);
        return res.status(500).json({error:errMessages});        
    }
});
//fetch the profile
router.get('/profile/:id',async(req,res)=>{
    try{
        const userid=req.params.id;
        if(!userid){
            return res.status(400).json({message:"invalid id"});
        }
        const profile=await Users.findById(userid).select('-Password');
        return res.status(200).json(profile);
    }
    catch(err){
        const errMessages="Error fetching profile"+err.message;
        console.log(errMessages);
        return res.status(500).json({error:errMessages});
    }
});

router.get('/profile-by-username/:username',async(req,res)=>{
    try{
        const username=(req.params.username || "").trim();
        if(!username){
            return res.status(400).json({message:"invalid username"});
        }
        const profile=await Users.findOne({
            Username: {
                $regex: new RegExp(`^${username.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i"),
            },
        }).select('-Password');
        if(!profile){
            return res.status(404).json({message:"User not found"});
        }
        return res.status(200).json(profile);
    }
    catch(err){
        const errMessages="Error fetching profile by username "+err.message;
        console.log(errMessages);
        return res.status(500).json({error:errMessages});
    }
});
//update the profile
router.put('/profile/:id',async(req,res)=>{
    try{
        const userid=req.params.id;
        const {Username,Email}=req.body;
        const userData=await Users.findById(userid);
        if(!userData){
            return res.status(400).json({message:"User not found"});
        }
        userData.Email=Email;
        userData.Username=Username;
        await userData.save();
        res.status(200).json("the data has been updated");
    }
    catch(err){
        const errMessages="Error updating profile"+err.message;
        console.log(errMessages);
        return res.status(500).json({error:errMessages});
    }
});

router.put('/profile/:id/password',async(req,res)=>{
    try{
        const userid=req.params.id;
        const {currentPassword,newPassword}=req.body;
        const user=await Users.findById(userid).select('+Password');
        if(!user){
            return res.status(400).json({message:"User not found"});
        }
        const isPasswordCorrect=await user.comparePassword(currentPassword);
        if(!isPasswordCorrect){
            return res.status(400).json({message:"Current password is incorrect"});
        }
        user.Password=newPassword;
        await user.save();
        res.status(200).json({message:"Password updated successfully"});
    }
    catch(err){
        const errMessages="Error updating password"+err.message;
        console.log(errMessages);
        return res.status(500).json({error:errMessages});
    }
});

router.post('/logout',async(req,res)=>{
    try{
        return res.status(200).json({message:"User logged out successfully"});
    }
    catch(err){
        const errMessages="Error logging out"+err.message;
        console.log(errMessages);
        return res.status(500).json({error:errMessages});
    }
});

router.get("/stats/:id", async (req, res) => {
    try {
        const userId = req.params.id;

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({
                message: "Invalid user id"
            });
        }

        const userData = await Users.findById(userId)
            .select(
                "Username DateCreated Solved_questions Questions_solved"
            )
            .populate({
                path: "Questions_solved.solved",
                select: "Difficulty"
            });

        if (!userData) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        const difficultyStats = {
            easy: 0,
            medium: 0,
            hard: 0,
        };

        for (const item of userData.Questions_solved) {
            const difficulty =
                item?.solved?.Difficulty?.toLowerCase();

            if (difficulty === "easy") {
                difficultyStats.easy++;
            } else if (difficulty === "medium") {
                difficultyStats.medium++;
            } else if (difficulty === "hard") {
                difficultyStats.hard++;
            }
        }

        const [
            totalSubmissions,
            acceptedSubmissions,
            attemptedQuestionsAgg,
            languageStats,
            recentAccepted
        ] = await Promise.all([
            Submissions.countDocuments({
                UserId: userId
            }),

            Submissions.countDocuments({
                UserId: userId,
                Verdict: "Accepted"
            }),

            Submissions.aggregate([
                {
                    $match: {
                        UserId: new mongoose.Types.ObjectId(userId)
                    }
                },
                {
                    $group: {
                        _id: "$QuestionId"
                    }
                },
                {
                    $count: "total"
                }
            ]),

            Submissions.aggregate([
                {
                    $match: {
                        UserId: new mongoose.Types.ObjectId(userId)
                    }
                },
                {
                    $group: {
                        _id: "$language",
                        count: { $sum: 1 }
                    }
                },
                {
                    $sort: {
                        count: -1
                    }
                }
            ]),

            Submissions.find({
                UserId: userId,
                Verdict: "Accepted"
            })
                .sort({ _id: -1 })
                .limit(5)
                .select(
                    "QuestionId language Verdict Runtime Memory Passed"
                )
        ]);

        const attemptedQuestions =
            attemptedQuestionsAgg[0]?.total || 0;

        const acceptanceRate =
            totalSubmissions === 0
                ? 0
                : Number(
                      (
                          (acceptedSubmissions /
                              totalSubmissions) *
                          100
                      ).toFixed(2)
                  );

        return res.status(200).json({
            Username: userData.Username,
            DateCreated: userData.DateCreated,

            totalSolved: userData.Solved_questions,

            totalSubmissions,
            acceptedSubmissions,
            attemptedQuestions,
            acceptanceRate,

            difficultyStats,
            languageStats,

            solvedQuestionIds:
                userData.Questions_solved
                    .map((q) => q?.solved?._id)
                    .filter(Boolean),

            recentAcceptedSubmissions:
                recentAccepted
        });
    } catch (err) {
        console.log(
            "Error fetching stats:",
            err.message
        );

        return res.status(500).json({
            error:
                "Error fetching stats: " +
                err.message
        });
    }
});

router.get('/AcceptedSubmissions/:id',async(req,res)=>{
    try{
        let num=0;
        const userId=req.params.id;
        const submissions=await Submissions.find({UserId:userId,Verdict:"Accepted"}).populate("QuestionId","Title Difficulty").sort({CreatedAt:-1 });
        num=submissions.length;
        if(!submissions){
            return res.status(400).json({message:"No submissions yet"});
        }
        return res.status(200).json({
            Submissions:submissions,
            total:num,
        });
    }
    catch(err){
        res.status(500).json({error:err.message});
    }
});


router.get("/fetchAllQuestions", async (req, res) => {

    try {
        let num=0;
        const questions = await Question.find();
        num=questions.length;
        return res.status(200).json({
            Questions:questions,
            total:num,
        });

    } catch (err) {

        return res.status(500).json({
            error: err.message
        });
    }
});


module.exports=router;