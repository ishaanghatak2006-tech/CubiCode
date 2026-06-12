const mongoose = require("mongoose");

const SubmissionSchema = new mongoose.Schema({
  QuestionId: {
    type: mongoose.Schema.ObjectId,
    required: true,
  },
  UserId: {
    type: mongoose.Schema.ObjectId,
    required: true,
  },
  language: {
    type: String,
    required: true,
  },
  Code: {
    type: String,
    required: true,
  },
  Verdict: {
    type: String,
    enum: [
      "Accepted",
      "Wrong Answer",
      "Time Limit Exceeded",
      "Runtime Error",
      "Compilation Error",
    ],
    required: true,
  },
  Runtime: {
    type: Number,
    default: 0,
  },
  Memory: {
    type: Number,
    default: 0,
  },
  Passed: {
    type: Number,
    default: 0,
  },
  Errors:{
    type:String,
    default:"None",
  }
});

module.exports =
  mongoose.models.Submission ||
  mongoose.model("Submission", SubmissionSchema);
