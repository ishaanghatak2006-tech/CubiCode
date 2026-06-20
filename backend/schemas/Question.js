const mongoose = require("mongoose");

const TestCaseSchema = new mongoose.Schema(
  {
    input: {
      type: String,
      default: "",
      trim: true,
    },
    output: {
      type: String,
      default: "",
      trim: true,
    },
    // Kept for backward compatibility with older documents/routes.
    Output: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { _id: false }
);

const QuestionSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  Title: {
    type: String,
    required: true,
    trim: true,
  },
  Description: {
    type: String,
    required: true,
    trim: true,
  },
  Difficulty: {
    type: String,
    required: true,
    trim: true,
  },
  Funtion_name: {
    type: String,
    required: true,
    trim: true,
  },
  Return_type: {
    type: String,
    default: "",
    trim: true,
  },
  Class_name: {
    type: String,
    default: "Solution",
    trim: true,
  },
  Parameters: {
    type: [
      new mongoose.Schema(
        {
          name: {
            type: String,
            required: true,
            trim: true,
          },
          type: {
            type: String,
            required: true,
            trim: true,
          },
        },
        { _id: false }
      ),
    ],
    default: [],
  },
  Constraints: {
    type: String,
    default: "",
    trim: true,
  },
  Input_format: {
    type: String,
    default: "",
    trim: true,
  },
  Output_format: {
    type: String,
    default: "",
    trim: true,
  },
  Visible_tests: {
    type: [TestCaseSchema],
    default: [],
  },
  Hidden_tests: {
    type: [TestCaseSchema],
    default: [],
  },
  Number_solved: {
    type: Number,
    default: 0,
  },
});

function normalizeTestCases(testCases) {
  if (!Array.isArray(testCases)) {
    return [];
  }

  return testCases.map((testCase) => {
    const normalizedOutput = testCase?.output ?? testCase?.Output ?? "";

    return {
      input: testCase?.input ?? "",
      output: normalizedOutput,
      Output: normalizedOutput,
    };
  });
}

QuestionSchema.pre("validate", function () {
  this.Visible_tests = normalizeTestCases(this.Visible_tests);
  this.Hidden_tests = normalizeTestCases(this.Hidden_tests);
});

module.exports =
  mongoose.models.Question || mongoose.model("Question", QuestionSchema);
