const Users=require("../schemas/User");
const express=require("express");
const mongoose=require("mongoose");
const Submissions=require("../schemas/Submission");
const { stripTypeScriptTypes } = require("node:module");
const router=express.Router();
const jwt=require("jsonwebtoken");

//this contains the user dashbooard routes....
//fetch the profile
router.get('/profile/:id',async(req,res)=>{
    try{
        const userid=req.params.id;
        if(!userid){
            return res.status(200).json({message:"invalid id"});
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

router.get('/stats/:id',async(req,res)=>{
    try{
        const userid=req.params.id;
        const userData=await Users.findById(userid).select('DateCreated Solved_questions Questions_solved Submissions');
        return res.status(200).json(userData);
    }
    catch(err){
        const errMessages="Error fetching stats"+err.message;
        console.log(errMessages);
        return res.status(500).json({error:errMessages});
    }
});

module.exports=router;