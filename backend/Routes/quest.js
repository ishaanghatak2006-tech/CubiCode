const express = require("express");
const Question = require("../schemas/Question");

const route = express.Router();

route.post("/Create_question", async (req, res) => {
  try {
    const {owner,Title,Description,Difficulty,Funtion_name,Class_name,Visible_tests,Hidden_tests,} = req.body;

    if (
      !owner ||
      !Title ||
      !Description ||
      !Difficulty ||
      !Funtion_name ||
      !Visible_tests ||
      !Hidden_tests
    ) {
      return res.status(400).json({ error: "please fill all the fields" });
    }

    const quest = await Question.create({
      owner,
      Title,
      Description,
      Difficulty,
      Funtion_name,
      Class_name,
      Visible_tests,
      Hidden_tests,
    });

    return res.status(201).json({
      message: "Question has been created",
      question: quest,
    });
  } catch (err) {
    const error = "Error Creating Question " + err.message;
    return res.status(500).json({ error });
  }
});

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
