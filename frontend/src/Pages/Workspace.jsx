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

function buildEditorTemplate(question, language) {
    if (!question) {
        return "";
    }

    if (language === "cpp") {
        return buildCppTemplate(question);
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
        }
    };

    const handleSubmit = async () => {
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
        }
    };

    return (
        <div className="workspace-container">

            {/* LEFT PANEL */}
            <div className="question-panel">
                <button
                    onClick={() => navigate("/problems")}
                    style={{
                        background: "none",
                        border: "none",
                        color: "#2f81f7",
                        cursor: "pointer",
                        fontSize: "14px",
                        fontWeight: "600",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        marginBottom: "20px",
                        padding: "0"
                    }}
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
                        >
                            Run Code
                        </button>

                        <button
                            className="submit-btn"
                            onClick={handleSubmit}
                        >
                            Submit
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

                    {runResult && (
                        <div className="result-box">
                            <pre>
                                {JSON.stringify(
                                    runResult,
                                    null,
                                    2
                                )}
                            </pre>
                        </div>
                    )}

                    {submitResult && (
                        <div className="result-box">
                            <pre>
                                {JSON.stringify(
                                    submitResult,
                                    null,
                                    2
                                )}
                            </pre>
                        </div>
                    )}

                </div>

            </div>

        </div>
    );
}

export default Workspace;
