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

function generateWrappedCode(_lang, userCode) {
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


    const wrappedcases=[];
    for (const testCase of testCases) {
      const element={
        input:testCase.input,
        expectedOutput:testCase.Output,
      }
      wrappedcases.push(element);
    }
    const apiResponse = await runpLocalHostJudge(lang,code,wrappedcases);
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

    const wrappedCode = generateWrappedCode(lang, code, question);
    const hiddenTests = Array.isArray(question.Hidden_tests)
      ? question.Hidden_tests
      : [];

    const wrappedtests=[];
    for (const testCase of hiddenTests) {
      const element={
        input:testCase.input,
        expectedOutput:testCase.Output,
      }
      wrappedtests.push(element);
    }

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
