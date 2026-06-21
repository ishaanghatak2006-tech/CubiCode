const express = require("express");
const Question = require("../schemas/Question");
const Submission =require("../schemas/Submission");

const route = express.Router();


route.get("/Fetch_details/:id",async(req,res)=>{
  try{
    const questionId=req.params.id;
    const question=await Question.findById(questionId);
    if(!question){
      return res.status(404).json({message:"Question not found"});
    }
    return res.status(200).json(question);
  }
  catch(err){
    console.log(err.message);
    res.status(500).json({error:err.message});
  }
});


route.get("/getUser_Submissions/:id/:questionid",async(req,res)=>{
    try{
        const userid=req.params.id;
        const questid=req.params.questionid;
        const submissions=await Submission.find({QuestionId:questid,UserId:userid}).sort({ DateCreated: -1 });
        //this goves us the details of the submission the oce
        return res.status(200).json(submissions);
    }
    catch(err){
        console.log(err);

        return res.status(500).json({
            error: err.message
        });
    }
});

module.exports = route;
