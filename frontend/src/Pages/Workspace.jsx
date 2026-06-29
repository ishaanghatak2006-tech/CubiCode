import { useContext, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/authContext.jsx";
import Editor from "@monaco-editor/react";
import "../styles/Workspace.css";

function buildCppTemplate(question) {
    const className = question?.Class_name || "Solution";
    const functionName = question?.Funtion_name || "solve";
    const returnType = question?.Return_type || "int";
    const parameters = Array.isArray(question?.Parameters)
        ? question.Parameters
        : [];

    const parameterList = parameters.length
        ? parameters
            .map((parameter) => `${parameter.type} ${parameter.name}`)
            .join(", ")
        : "";

    return `class ${className} {
public:
    ${returnType} ${functionName}(${parameterList}) {
        
    }
};`;
}

function buildPythonTemplate(question) {
    const functionName = question?.Funtion_name || "solve";
    const parameters = Array.isArray(question?.Parameters)
        ? question.Parameters
        : [];

    const parameterList = parameters.length
        ? parameters.map((parameter) => parameter.name).join(", ")
        : "";

    return `class Solution:
    def ${functionName}(self${parameterList ? `, ${parameterList}` : ""}):
        pass`;
}

function buildJavascriptTemplate(question) {
    const className = question?.Class_name || "Solution";
    const functionName = question?.Funtion_name || "solve";
    const parameters = Array.isArray(question?.Parameters)
        ? question.Parameters
        : [];

    const parameterList = parameters.length
        ? parameters.map((parameter) => parameter.name).join(", ")
        : "";

    return `class ${className} {
    ${functionName}(${parameterList}) {
        
    }
}`;
}

function buildEditorTemplate(question, language) {
    if (!question) {
        return "";
    }

    if (language === "cpp") {
        return buildCppTemplate(question);
    }

    if (language === "python") {
        return buildPythonTemplate(question);
    }

    if (language === "javascript") {
        return buildJavascriptTemplate(question);
    }

    return "";
}

function Workspace() {
    const [question, setQuestion] = useState(null);
    const [userid, setUserid] = useState(() => {
        const savedUser = localStorage.getItem("cubicode_user");
        if (savedUser) {
            try {
                const parsed = JSON.parse(savedUser);
                return parsed.id ?? parsed._id ?? "";
            } catch {
                localStorage.removeItem("cubicode_user");
            }
        }
        return "";
    });
    const [language, setLanguage] = useState("cpp");
    const [code, setCode] = useState("");
    const [runResult, setRunResult] = useState(null);
    const [submitResult, setSubmitResult] = useState(null);
    const [hasEditedCode, setHasEditedCode] = useState(false);
    const [runLoading, setRunLoading] = useState(false);
    const [submitLoading, setSubmitLoading] = useState(false);

    const { questionId: questionIdParam } = useParams();
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);

    const fetchQuestion = async (id) => {
        try {
            const response = await fetch(
                `http://localhost:5000/quest/Fetch_details/${id}`
            );

            const data = await response.json();

            if (response.ok) {
                setQuestion(data);
                setHasEditedCode(false);
            } else {
                alert(data.message);
            }
        } catch (err) {
            console.log(err);
            alert("Server Error");
        }
    };

    useEffect(() => {
        if (user) {
            const nextUserId = user.id ?? user._id ?? "";
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setUserid((prev) => (prev !== nextUserId ? nextUserId : prev));
        }
    }, [user]);

    useEffect(() => {
        if (questionIdParam) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            fetchQuestion(questionIdParam);
        }
    }, [questionIdParam]);

    useEffect(() => {
        if (!question || hasEditedCode) {
            return;
        }

        setCode(buildEditorTemplate(question, language));
    }, [question, language, hasEditedCode]);


    const handleRunCode = async () => {
        setRunLoading(true);
        setRunResult(null);
        setSubmitResult(null);
        try {
            const response = await fetch(
                "http://localhost:5000/submit/run_code",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        questionId: questionIdParam,
                        lang: language,
                        code,
                    }),
                }
            );

            const data = await response.json();

            if (response.ok) {
                setRunResult(data);
                setSubmitResult(null);
            } else {
                setRunResult({
                    message: data.message || "Error running code",
                    error: data.error || null,
                    details: data.details || null,
                    stack: data.stack || null,
                });
                setSubmitResult(null);
                alert(data.error || data.message || "Error running code");
            }
        } catch (err) {
            console.log(err);
            alert("Server Error");
        } finally {
            setRunLoading(false);
        }
    };

    const handleSubmit = async () => {
        setSubmitLoading(true);
        setSubmitResult(null);
        setRunResult(null);
        try {
            const response = await fetch(
                `http://localhost:5000/submit/submit_soln/${questionIdParam}`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        userid,
                        lang: language,
                        code,
                    }),
                }
            );

            const data = await response.json();

            if (response.ok) {
                setSubmitResult(data);
                setRunResult(null);
            } else {
                setSubmitResult({
                    message: data.message || "Error submitting code",
                    error: data.error || null,
                    details: data.details || null,
                    stack: data.stack || null,
                });
                setRunResult(null);
                alert(data.error || data.message || "Error submitting code");
            }
        } catch (err) {
            console.log(err);
            alert("Server Error");
        } finally {
            setSubmitLoading(false);
        }
    };

    const getVerdictClass = (verdict) => {
        if (!verdict) return "";
        const v = String(verdict).toLowerCase();
        if (v === "accepted") return "verdict-accepted";
        if (v === "wrong answer" || v === "wrong" || v === "rejected") return "verdict-wrong";
        if (v === "time limit exceeded" || v === "tle") return "verdict-tle";
        if (v === "runtime error" || v === "error") return "verdict-error";
        return "verdict-other";
    };

    return (
        <div className="workspace-container">

            {/* LEFT PANEL */}
            <div className="question-panel">
                <button
                    className="workspace-back-btn"
                    onClick={() => navigate("/problems")}
                >
                    &larr; Back to Problems
                </button>

                {question ? (
                    <>
                        <h1 className="question-title">
                            {question.Title}
                        </h1>

                        <p className="question-description">
                            {question.Description}
                        </p>

                        <h3 className="section-heading">
                            Difficulty
                        </h3>

                        <p>
                            {question.Difficulty}
                        </p>

                        {question.Constraints && (
                            <>
                                <h3 className="section-heading">
                                    Constraints
                                </h3>

                                <p>
                                    {question.Constraints}
                                </p>
                            </>
                        )}

                        <h3 className="section-heading">
                            Examples
                        </h3>

                        {question.Visible_tests?.map((test, index) => (
                            <div
                                key={index}
                                className="example-box"
                            >
                                <p>
                                    <strong>Input:</strong>{" "}
                                    {test.input}
                                </p>

                                <p>
                                    <strong>Output:</strong>{" "}
                                    {test.output ?? test.Output}
                                </p>
                            </div>
                        ))}
                    </>
                ) : (
                    <h2>Loading Question...</h2>
                )}

            </div>

            {/* RIGHT PANEL */}
            <div className="editor-panel">

                <div className="editor-toolbar">

                    <select
                        value={language}
                        onChange={(e) => {
                            setLanguage(e.target.value);
                            setHasEditedCode(false);
                        }}
                        className="language-select"
                    >
                        <option value="cpp">
                            C++
                        </option>

                        <option value="python">
                            Python
                        </option>

                        <option value="javascript">
                            JavaScript
                        </option>
                    </select>

                    <div className="button-group">

                        <button
                            className="run-btn"
                            onClick={handleRunCode}
                            disabled={runLoading}
                        >
                            {runLoading ? "Running..." : "Run Code"}
                        </button>

                        <button
                            className="submit-btn"
                            onClick={handleSubmit}
                            disabled={submitLoading}
                        >
                            {submitLoading ? "Submitting..." : "Submit"}
                        </button>

                    </div>

                </div>

                <div className="editor-wrapper">

                    <Editor
                        height="100%"
                        language={language}
                        value={code}
                        onChange={(value) => {
                            setHasEditedCode(true);
                            setCode(value || "");
                        }}
                        theme="vs-dark"
                    />

                </div>

                <div className="results-panel">

                    <h3>
                        Results
                    </h3>

                    {/* RUN RESULT DISPLAY */}
                    {runResult && !runResult.error && runResult.Verdict && (
                        <div className="result-content">
                            <div className={`verdict-banner ${getVerdictClass(runResult.Verdict)}`}>
                                <span className="verdict-icon">
                                    {String(runResult.Verdict).toLowerCase() === "accepted" ? "\u2713" : "\u2717"}
                                </span>
                                <span className="verdict-text">{runResult.Verdict}</span>
                            </div>

                            <div className="result-stats">
                                {runResult.TestsPassed !== undefined && (
                                    <div className="stat-chip">
                                        <span className="stat-label">Tests Passed</span>
                                        <span className="stat-value">{runResult.TestsPassed}</span>
                                    </div>
                                )}
                                {runResult.TotalTime !== undefined && (
                                    <div className="stat-chip">
                                        <span className="stat-label">Total Time</span>
                                        <span className="stat-value">{Number(runResult.TotalTime).toFixed(2)} ms</span>
                                    </div>
                                )}
                                {runResult.PeakMemory !== undefined && (
                                    <div className="stat-chip">
                                        <span className="stat-label">Peak Memory</span>
                                        <span className="stat-value">{runResult.PeakMemory} MiB</span>
                                    </div>
                                )}
                            </div>

                            {runResult.TestResults && runResult.TestResults.length > 0 && (
                                <div className="test-results">
                                    <h4 className="test-results-heading">Test Case Details</h4>
                                    {runResult.TestResults.map((test, idx) => (
                                        <div key={idx} className={`test-case ${test.passed ? "test-passed" : "test-failed"}`}>
                                            <div className="test-header">
                                                <span className="test-number">Test #{test.testcase}</span>
                                                <span className={`test-status ${test.passed ? "status-passed" : "status-failed"}`}>
                                                    {test.passed ? "Passed" : "Failed"}
                                                </span>
                                            </div>
                                            <div className="test-details">
                                                {test.timeMs !== undefined && (
                                                    <span className="test-metric">{Number(test.timeMs).toFixed(2)} ms</span>
                                                )}
                                                {test.memory && (
                                                    <span className="test-metric">{test.memory}</span>
                                                )}
                                            </div>
                                            {!test.passed && (
                                                <div className="test-io">
                                                    <div className="test-io-item">
                                                        <span className="io-label">Input:</span>
                                                        <pre className="io-value">{test.input}</pre>
                                                    </div>
                                                    <div className="test-io-item">
                                                        <span className="io-label">Expected:</span>
                                                        <pre className="io-value">{test.expected}</pre>
                                                    </div>
                                                    <div className="test-io-item">
                                                        <span className="io-label">Output:</span>
                                                        <pre className="io-value">{test.output}</pre>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {runResult && runResult.error && (
                        <div className="result-content">
                            <div className="verdict-banner verdict-error">
                                <span className="verdict-icon">!</span>
                                <span className="verdict-text">Error</span>
                            </div>
                            <div className="result-error-box">
                                <pre>{runResult.error}</pre>
                                {runResult.details && <pre className="error-details">{runResult.details}</pre>}
                            </div>
                        </div>
                    )}

                    {runResult && runResult.message && !runResult.Verdict && !runResult.error && (
                        <div className="result-content">
                            <div className="result-error-box">
                                <pre>{runResult.message}</pre>
                            </div>
                        </div>
                    )}

                    {/* SUBMIT RESULT DISPLAY */}
                    {submitResult && submitResult.submitted && (
                        <div className="result-content">
                            <div className={`verdict-banner ${getVerdictClass(submitResult.submitted.Verdict)}`}>
                                <span className="verdict-icon">
                                    {String(submitResult.submitted.Verdict).toLowerCase() === "accepted" ? "\u2713" : "\u2717"}
                                </span>
                                <span className="verdict-text">{submitResult.submitted.Verdict}</span>
                            </div>

                            <div className="result-stats">
                                {submitResult.submitted.Passed !== undefined && (
                                    <div className="stat-chip">
                                        <span className="stat-label">Tests Passed</span>
                                        <span className="stat-value">{submitResult.submitted.Passed}</span>
                                    </div>
                                )}
                                {submitResult.submitted.Runtime !== undefined && (
                                    <div className="stat-chip">
                                        <span className="stat-label">Runtime</span>
                                        <span className="stat-value">{Number(submitResult.submitted.Runtime).toFixed(2)} ms</span>
                                    </div>
                                )}
                                {submitResult.submitted.Memory !== undefined && (
                                    <div className="stat-chip">
                                        <span className="stat-label">Memory</span>
                                        <span className="stat-value">{submitResult.submitted.Memory} MiB</span>
                                    </div>
                                )}
                                {submitResult.submitted.language && (
                                    <div className="stat-chip">
                                        <span className="stat-label">Language</span>
                                        <span className="stat-value">{submitResult.submitted.language}</span>
                                    </div>
                                )}
                            </div>

                            {submitResult.submitted.Errors && (
                                <div className="result-error-box">
                                    <pre>{submitResult.submitted.Errors}</pre>
                                </div>
                            )}
                        </div>
                    )}

                    {submitResult && submitResult.message && !submitResult.submitted && (
                        <div className="result-content">
                            <div className="result-error-box">
                                <pre>{submitResult.message}</pre>
                            </div>
                        </div>
                    )}

                </div>

            </div>

        </div>
    );
}

export default Workspace;