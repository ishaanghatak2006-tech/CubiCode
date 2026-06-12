const mongoose = require("mongoose");

const QuestionSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  Title: {
    type: String,
    required: true,
  },
  Description: {
    type: String,
    required: true,
  },
  Difficulty: {
    type: String,
    required: true,
  },
  Funtion_name: {
    type: String,
    required: true,
  },
  Class_name: {
    type: String,
    default: "Solution",
  },
  Visible_tests: [
    {
      input: {
        type: String,
        default: "",
      },
      Output: {
        type: String,
        default: "",
      },
    },
  ],
  Hidden_tests: [
    {
      input: {
        type: String,
        default: "",
      },
      Output: {
        type: String,
        default: "",
      },
    },
  ],
  Number_solved: {
    type: Number,
    default: 0,
  },
});

module.exports =
  mongoose.models.Question || mongoose.model("Question", QuestionSchema);
