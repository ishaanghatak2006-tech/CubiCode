const express = require("express");
const route = express.Router();
const Question = require("../schemas/Question");
const Submission = require("../schemas/Submission");
const axios = require("axios");

// // Node.js / browser-style example
// async function submitAndCheck() {
//   const submitResp = await fetch('http://localhost:8000/judge', {
//     method: 'POST',
//     headers: { 'Content-Type': 'application/json' },
//     body: JSON.stringify({
//       language: 'cpp',
//       code: `#include <iostream> ...`,
//       testcases: [
//         { input: '5 6\n1 2 2\n...1\n', expectedOutput: '0 2 3 7 6' },
//         { input: '4 4\n1 2 5\n...1\n', expectedOutput: '0 4 1 3' }
//       ]
//     })
//   });

//   const submitData = await submitResp.json();
//   const jobId = submitData.jobId; // or the field your API returns

//   const statusResp = await fetch(`http://localhost:8000/status/${jobId}`);
//   const statusData = await statusResp.json();

//   console.log('jobId:', jobId);
//   console.log('status:', statusData);
// }

// submitAndCheck();


//api judge call response
// {
//   "message": "Code queued for execution",
//   "jobId": "7779a5ac-fdf5-49ad-bca9-72c8e2dbc3e0",
//   "fileName": "1781240990737-0vhbo3emz",
//   "timestamp": 1781240990737,
//   "wrapResult": {
//     "message": "Code wrapped successfully and queued",
//     "jobId": "7779a5ac-fdf5-49ad-bca9-72c8e2dbc3e0",
//     "filePath": "C:\\Users\\Ishaan\\OneDrive\\Documents\\GitHub\\LocalCodeJudge\\judgeService\\src\\tempSubmittedFiles\\1781240990737-0vhbo3emz.cpp"
//   }
// }

//api status call response(no error)
// {
//   "jobId": "7779a5ac-fdf5-49ad-bca9-72c8e2dbc3e0",
//   "verdict": "Accepted",
//   "passedCount": 2,
//   "testResults": [
//     {
//       "testcase": 1,
//       "input": "5 6\n1 2 2\n1 3 4\n2 3 1\n2 4 7\n3 5 3\n4 5 1\n1\n",
//       "expected": "0 2 3 7 6",
//       "output": "0 2 3 7 6",
//       "passed": true,
//       "timeMs": 489.04,
//       "memory": "7.066MiB / 7.418GiB"
//     },
//     {
//       "testcase": 2,
//       "input": "4 4\n1 2 5\n1 3 1\n3 4 2\n2 4 1\n1\n",
//       "expected": "0 4 1 3",
//       "output": "0 4 1 3",
//       "passed": true,
//       "timeMs": 599.245,
//       "memory": "8.492MiB / 7.418GiB"
//     }
//   ],
//   "TotTime": 1088.285,
//   "peakMemory": 8.492
// }

// if error is there similar as above except verdict shows that there is an erroor and also an extra key for error will be there,....




function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function splitTopLevel(text, delimiter = ",") {
  const parts = [];
  let current = "";
  let squareDepth = 0;
  let angleDepth = 0;
  let inSingleQuote = false;
  let inDoubleQuote = false;

  for (let index = 0; index < text.length; index++) {
    const char = text[index];
    const previousChar = text[index - 1];

    if (char === "'" && !inDoubleQuote && previousChar !== "\\") {
      inSingleQuote = !inSingleQuote;
    } else if (char === '"' && !inSingleQuote && previousChar !== "\\") {
      inDoubleQuote = !inDoubleQuote;
    }

    if (!inSingleQuote && !inDoubleQuote) {
      if (char === "[") squareDepth++;
      if (char === "]") squareDepth--;
      if (char === "<") angleDepth++;
      if (char === ">") angleDepth--;
    }

    if (
      char === delimiter &&
      !inSingleQuote &&
      !inDoubleQuote &&
      squareDepth === 0 &&
      angleDepth === 0
    ) {
      parts.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  if (current.trim()) {
    parts.push(current.trim());
  }

  return parts;
}

function parseAssignments(input) {
  const assignmentMap = {};
  const parts = splitTopLevel(String(input ?? ""));

  for (const part of parts) {
    const equalIndex = part.indexOf("=");
    if (equalIndex === -1) {
      continue;
    }

    const name = part.slice(0, equalIndex).trim();
    const value = part.slice(equalIndex + 1).trim();

    if (name) {
      assignmentMap[name] = value;
    }
  }

  return assignmentMap;
}

function normalizeType(type) {
  return String(type ?? "").replace(/\s+/g, "");
}

function stripConstQualifier(type) {
  return normalizeType(type).replace(/^const/, "");
}

function stripReferenceQualifier(type) {
  return stripConstQualifier(type).replace(/[&]+$/g, "");
}

function isVectorType(type) {
  const normalizedType = stripReferenceQualifier(type);
  return normalizedType.startsWith("vector<") && normalizedType.endsWith(">");
}

function getVectorInnerType(type) {
  const normalized = stripReferenceQualifier(type);
  return normalized.slice("vector<".length, -1);
}

function isStringType(type) {
  return stripReferenceQualifier(type) === "string";
}

function isCharType(type) {
  return stripReferenceQualifier(type) === "char";
}

function isBoolType(type) {
  return stripReferenceQualifier(type) === "bool";
}

function isNumericType(type) {
  return [
    "int",
    "long",
    "longint",
    "longlong",
    "longlongint",
    "float",
    "double",
    "short",
  ].includes(stripReferenceQualifier(type));
}

function isSupportedScalarType(type) {
  return (
    isNumericType(type) ||
    isStringType(type) ||
    isCharType(type) ||
    isBoolType(type)
  );
}

function validateSupportedType(type) {
  const normalizedType = normalizeType(type);

  if (normalizedType.includes("*")) {
    throw new Error(`Unsupported parameter type "${type}". Pointer types are not supported`);
  }

  if (normalizedType.endsWith("&") && !normalizedType.startsWith("const")) {
    throw new Error(`Unsupported parameter type "${type}". Use plain value types in question parameters`);
  }

  if (isVectorType(type)) {
    const innerType = getVectorInnerType(type);
    if (!isSupportedScalarType(innerType)) {
      throw new Error(`Unsupported parameter type "${type}". Only vector of scalar types is supported`);
    }
    return;
  }

  if (!isSupportedScalarType(type)) {
    throw new Error(
      `Unsupported parameter type "${type}". Supported types are int, long long, double, bool, char, string, and vector<scalar>`
    );
  }
}

function parseArrayLiteral(rawValue) {
  const trimmed = String(rawValue ?? "").trim();

  if (!trimmed.startsWith("[") || !trimmed.endsWith("]")) {
    throw new Error(`Expected an array literal but received "${trimmed}"`);
  }

  const inner = trimmed.slice(1, -1).trim();
  if (!inner) {
    return [];
  }

  return splitTopLevel(inner);
}

function stripOuterQuotes(value) {
  const trimmed = String(value ?? "").trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function serializeParameterInput(type, rawValue) {
  validateSupportedType(type);
  const normalizedType = stripReferenceQualifier(type);

  if (isVectorType(normalizedType)) {
    const values = parseArrayLiteral(rawValue);
    return `${values.length}\n${values.map((value) => stripOuterQuotes(value)).join(" ")}`;
  }

  if (isStringType(normalizedType)) {
    return stripOuterQuotes(rawValue);
  }

  if (isCharType(normalizedType)) {
    return stripOuterQuotes(rawValue);
  }

  if (isBoolType(normalizedType)) {
    const value = stripOuterQuotes(rawValue).toLowerCase();
    return value === "true" ? "true" : "false";
  }

  return String(rawValue ?? "").trim();
}

function transformTestCaseInput(question, rawInput) {
  const parameters = Array.isArray(question?.Parameters) ? question.Parameters : [];

  if (!parameters.length) {
    return String(rawInput ?? "");
  }

  const assignments = parseAssignments(rawInput);

  return parameters
    .map((parameter) => {
      const parameterName = String(parameter?.name ?? "").trim();
      if (!(parameterName in assignments)) {
        throw new Error(`Missing input for parameter "${parameterName}"`);
      }

      return serializeParameterInput(parameter.type, assignments[parameterName]);
    })
    .join("\n");
}

function buildWrappedTestCase(question, testCase) {
  return {
    input: transformTestCaseInput(question, testCase.input),
    expectedOutput: testCase.output ?? testCase.Output,
  };
}

async function waitForJudgeStatus(jobId, maxAttempts = 120, delayMs = 2000) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const statusRes = await fetch(`http://localhost:8000/status/${jobId}`);
    console.log("🔵 Status attempt", attempt, "for jobId:", jobId, "Response status:", statusRes.status);
    
    if (!statusRes.ok) {
      const errorBody = await statusRes.text();
      console.error("❌ Status response not OK:", { status: statusRes.status, body: errorBody });
      
      // If 404, check if the error body contains verdict info
      if (statusRes.status === 404) {
        try {
          const errorData = JSON.parse(errorBody);
          if (errorData.message && errorData.message.includes("still queued")) {
            // Job still queued, continue polling
            if (attempt === maxAttempts) {
              return {
                verdict: 'Timeout',
                error: `Judge status polling timed out after ${maxAttempts} attempts`,
              };
            }
            await sleep(delayMs);
            continue;
          }
        } catch (e) {
          // Couldn't parse error body, throw original error
        }
      }
      
      throw new Error(`Judge status request failed: ${statusRes.status} - ${errorBody}`);
    }

    const statusData = await statusRes.json();
    console.log("🔵 Judge status response:", { attempt, statusData });
    const verdict = String(statusData?.verdict ?? "").toLowerCase();

    if (!verdict || ['queued', 'pending', 'running', 'in progress'].includes(verdict)) {
      if (attempt === maxAttempts) {
        return {
          ...statusData,
          verdict: 'Timeout',
          error: `Judge status polling timed out after ${maxAttempts} attempts`,
        };
      }
      await sleep(delayMs);
      continue;
    }

    return statusData;
  }
}

async function runpLocalHostJudge(lang, code, testcases) {
  try {
    console.log("🔵 Calling LocalHostJudge API:", { lang, testcasesCount: Array.isArray(testcases) ? testcases.length : 0 });

    const submitResp = await fetch("http://localhost:8000/judge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        language: lang,
        code: code,
        testcases: testcases,
      }),
    });

    if (!submitResp.ok) {
      throw new Error(`Judge submit request failed: ${submitResp.status}`);
    }

    const submitData = await submitResp.json();
    console.log("🔵 Judge submit response:", JSON.stringify(submitData, null, 2));
    const jobId = submitData?.jobId;
    console.log("🔵 Extracted jobId:", jobId);
    console.log("🔵 Full submit response keys:", Object.keys(submitData));
    if (!jobId) {
      throw new Error("Judge response did not include jobId");
    }

    return await waitForJudgeStatus(jobId);
  } catch (err) {
    console.error("❌ API error:", {
      message: err.message,
      stack: err.stack,
    });
    throw err;
  }
}

function generateCppReadExpression(type) {
  validateSupportedType(type);
  const normalizedType = normalizeType(type);

  if (isVectorType(normalizedType)) {
    const innerType = getVectorInnerType(normalizedType);
    return `readVector<${innerType}>()`;
  }

  if (isStringType(normalizedType)) {
    return "readString()";
  }

  if (isCharType(normalizedType)) {
    return "readChar()";
  }

  if (isBoolType(normalizedType)) {
    return "readBool()";
  }

  return `readScalar<${type}>()`;
}

function getPythonScalarReader(type) {
  validateSupportedType(type);

  if (isStringType(type)) {
    return "read_string()";
  }

  if (isCharType(type)) {
    return "read_char()";
  }

  if (isBoolType(type)) {
    return "read_bool()";
  }

  if (["float", "double"].includes(stripReferenceQualifier(type))) {
    return "read_float()";
  }

  return "read_int()";
}

function generatePythonReadExpression(type) {
  validateSupportedType(type);

  if (isVectorType(type)) {
    return `read_vector(${JSON.stringify(getVectorInnerType(type))})`;
  }

  return getPythonScalarReader(type);
}

function generateJavaScriptReadExpression(type) {
  validateSupportedType(type);

  if (isVectorType(type)) {
    return `readVector(${JSON.stringify(getVectorInnerType(type))})`;
  }

  if (isStringType(type)) {
    return "readString()";
  }

  if (isCharType(type)) {
    return "readChar()";
  }

  if (isBoolType(type)) {
    return "readBool()";
  }

  return "readNumber()";
}

function generateWrappedCode(lang, userCode, question) {
  const functionName = String(question?.Funtion_name ?? "").trim();
  const className = String(question?.Class_name ?? "Solution").trim() || "Solution";
  const returnType = String(question?.Return_type ?? "").trim();
  const parameters = Array.isArray(question?.Parameters) ? question.Parameters : [];

  if (!functionName || !returnType || !parameters.length) {
    return userCode;
  }

  for (const parameter of parameters) {
    validateSupportedType(parameter?.type ?? "");
  }

  if (lang === "cpp") {
    const declarations = parameters
      .map((parameter) => {
        const type = String(parameter?.type ?? "").trim();
        const name = String(parameter?.name ?? "").trim();
        return `    ${type} ${name} = ${generateCppReadExpression(type)};`;
      })
      .join("\n");

    const argumentList = parameters
      .map((parameter) => String(parameter?.name ?? "").trim())
      .join(", ");

    const invocation =
      normalizeType(returnType) === "void"
        ? `    solution.${functionName}(${argumentList});`
        : [
            `    auto result = solution.${functionName}(${argumentList});`,
            "    cout << cubiToString(result);",
          ].join("\n");

    return `#include <bits/stdc++.h>
using namespace std;

template <typename T>
T readScalar() {
    T value;
    cin >> value;
    return value;
}

string readString() {
    string value;
    getline(cin >> ws, value);
    return value;
}

char readChar() {
    char value;
    cin >> value;
    return value;
}

bool readBool() {
    string value;
    cin >> value;
    transform(value.begin(), value.end(), value.begin(), ::tolower);
    return value == "true" || value == "1";
}

template <typename T>
vector<T> readVector() {
    int size;
    cin >> size;
    vector<T> values(size);
    for (int index = 0; index < size; index++) {
        cin >> values[index];
    }
    return values;
}

string cubiToString(const string& value) {
    return value;
}

string cubiToString(const char* value) {
    return string(value);
}

string cubiToString(char value) {
    return string(1, value);
}

string cubiToString(bool value) {
    return value ? "true" : "false";
}

template <typename T>
string cubiToString(const vector<T>& values) {
    string result = "[";
    for (size_t index = 0; index < values.size(); index++) {
        if (index > 0) {
            result += ",";
        }
        result += cubiToString(values[index]);
    }
    result += "]";
    return result;
}

template <typename T>
string cubiToString(const T& value) {
    ostringstream output;
    output << value;
    return output.str();
}

${userCode}

int main() {
    ${className} solution;
${declarations}
${invocation}
    return 0;
}
`;
  }

  if (lang === "python") {
    const declarations = parameters
      .map((parameter) => {
        const name = String(parameter?.name ?? "").trim();
        const type = String(parameter?.type ?? "").trim();
        return `${name} = ${generatePythonReadExpression(type)}`;
      })
      .join("\n");

    const argumentList = parameters
      .map((parameter) => String(parameter?.name ?? "").trim())
      .join(", ");

    const invocation =
      normalizeType(returnType) === "void"
        ? `solution.${functionName}(${argumentList})`
        : [
            `result = solution.${functionName}(${argumentList})`,
            "sys.stdout.write(cubi_to_string(result))",
          ].join("\n");

    return `import sys

lines = sys.stdin.read().splitlines()
line_index = 0

def next_line():
    global line_index
    if line_index >= len(lines):
        return ""
    value = lines[line_index]
    line_index += 1
    return value

def read_int():
    return int(next_line().strip())

def read_float():
    return float(next_line().strip())

def read_string():
    return next_line()

def read_char():
    value = next_line()
    return value[0] if value else ""

def read_bool():
    value = next_line().strip().lower()
    return value in ("true", "1")

def parse_scalar(type_name, token):
    if type_name in ("float", "double"):
        return float(token)
    if type_name == "bool":
        return token.lower() in ("true", "1")
    if type_name == "char":
        return token[0] if token else ""
    if type_name == "string":
        return token
    return int(token)

def read_vector(inner_type):
    size = int(next_line().strip())
    tokens = next_line().strip().split() if size > 0 else []
    return [parse_scalar(inner_type, token) for token in tokens[:size]]

def cubi_to_string(value):
    if isinstance(value, bool):
        return "true" if value else "false"
    if isinstance(value, list):
        return "[" + ",".join(cubi_to_string(item) for item in value) + "]"
    return str(value)

${userCode}

solution = ${className}()
${declarations}
${invocation}
`;
  }

  if (lang === "javascript") {
    const declarations = parameters
      .map((parameter) => {
        const name = String(parameter?.name ?? "").trim();
        const type = String(parameter?.type ?? "").trim();
        return `const ${name} = ${generateJavaScriptReadExpression(type)};`;
      })
      .join("\n");

    const argumentList = parameters
      .map((parameter) => String(parameter?.name ?? "").trim())
      .join(", ");

    const invocation =
      normalizeType(returnType) === "void"
        ? `solution.${functionName}(${argumentList});`
        : [
            `const result = solution.${functionName}(${argumentList});`,
            "process.stdout.write(cubiToString(result));",
          ].join("\n");

    return `const fs = require("fs");
const lines = fs.readFileSync(0, "utf8").split(/\\r?\\n/);
let lineIndex = 0;

function nextLine() {
  if (lineIndex >= lines.length) {
    return "";
  }
  const value = lines[lineIndex];
  lineIndex += 1;
  return value;
}

function readNumber() {
  return Number(nextLine().trim());
}

function readString() {
  return nextLine();
}

function readChar() {
  const value = nextLine();
  return value ? value[0] : "";
}

function readBool() {
  const value = nextLine().trim().toLowerCase();
  return value === "true" || value === "1";
}

function parseScalar(typeName, token) {
  if (typeName === "bool") {
    return token.toLowerCase() === "true" || token === "1";
  }
  if (typeName === "char") {
    return token ? token[0] : "";
  }
  if (typeName === "string") {
    return token;
  }
  return Number(token);
}

function readVector(innerType) {
  const size = Number(nextLine().trim());
  const tokens = size > 0 ? nextLine().trim().split(/\\s+/) : [];
  return tokens.slice(0, size).map((token) => parseScalar(innerType, token));
}

function cubiToString(value) {
  if (Array.isArray(value)) {
    return "[" + value.map((item) => cubiToString(item)).join(",") + "]";
  }
  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }
  return String(value);
}

${userCode}

const solution = new ${className}();
${declarations}
${invocation}
`;
  }

  return userCode;
}

function normalizeOutput(value) {
  return String(value ?? "").trim();
}

route.post("/run_code", async (req, res) => {
  try {
    const { questionId, lang, code } = req.body;
    if (!questionId || !lang || !code) {
      return res
        .status(400)
        .json({ message: "questionId, lang and code are required" });
    }

    const question = await Question.findById(questionId).lean();
    if (!question) {
      return res.status(404).json({ message: "Question not found" });
    }

    const testCases = Array.isArray(question.Visible_tests)
      ? question.Visible_tests
      : [];

    if (!testCases.length) {
      return res
        .status(400)
        .json({ message: "No visible test cases found for this question" });
    }

    const runResults = [];
    let overallVerdict = "Accepted";


    const wrappedCode = generateWrappedCode(lang, code, question);
    const wrappedcases = testCases.map((testCase) =>
      buildWrappedTestCase(question, testCase)
    );
    const apiResponse = await runpLocalHostJudge(lang, wrappedCode, wrappedcases);
    if(apiResponse.verdict=='Accepted'){
      return res.status(200).json({
        Verdict:apiResponse.verdict,
        TestsPassed:apiResponse.passedCount,
        TestResults:apiResponse.testResults,
        TotalTime:apiResponse.TotTime,
        PeakMemory:apiResponse.peakMemory
      });
    }
    else{
      return res.status(200).json({
          Verdict:apiResponse.verdict,
          TestsPassed:apiResponse.passedCount,
          TestResults:apiResponse.testResults,
          Error:apiResponse.error,
      });
    }
  } catch (err) {
    console.error("❌ /run_code error:", err.message, err.response?.data);
    return res.status(500).json({ 
      message: "Error running code", 
      error: err.message,
      details: err.response?.data 
    });
  }
});

route.post("/submit_soln/:id", async (req, res) => {
  try {
    const quest_id = req.params.id;
    const { userid, lang, code } = req.body;

    if (!quest_id || !userid || !lang || !code) {
      return res
        .status(400)
        .json({ message: "question id, userid, lang and code are required" });
    }

    const question = await Question.findById(quest_id);
    if (!question) {
      return res.status(404).json({ message: "Question not found" });
    }

    const hiddenTests = Array.isArray(question.Hidden_tests)
      ? question.Hidden_tests
      : [];

    const wrappedCode = generateWrappedCode(lang, code, question);
    const wrappedtests = hiddenTests.map((testCase) =>
      buildWrappedTestCase(question, testCase)
    );

    const apiresp=await runpLocalHostJudge(lang,wrappedCode,wrappedtests);

    const Verdict = apiresp.verdict;
    const maxruntime = apiresp.TotTime;
    const maxMemory = apiresp.peakMemory;
    const count = apiresp.passedCount;
    let errorMessage = null;
    if (Verdict !== 'Accepted') {
      errorMessage = apiresp.error;
    }

    const submissionData = {
      QuestionId: quest_id,
      UserId: userid,
      language: lang,
      Code: code,
      Verdict,
      Runtime: maxruntime,
      Memory: maxMemory,
      Passed: count,
    };

    if (errorMessage) {
      submissionData.Errors = errorMessage;
    }

    const user_sub = new Submission(submissionData);

    await user_sub.save();
    return res.status(200).json({
      message: "solution judged successfully",
      submitted: user_sub,
    });
  } catch (err) {
    console.error("❌ /submit_soln error:", err);
    return res.status(500).json({
      message: "can't submit solution, please try again!",
      error: err.message,
      stack: err.stack,
    });
  }
});

module.exports = route;
