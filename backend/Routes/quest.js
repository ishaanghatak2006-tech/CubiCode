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

module.exports = route;
