const express = require("express");
const Question = require("../schemas/Question");

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


module.exports = route;
