import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Problems.css";


function Problems() {

    const [questions, setQuestions] = useState([]);
    const [search, setSearch] = useState("");
    const [suggestions, setSuggestions] = useState([]);

    const navigate = useNavigate();

    const fetchQuestions = async () => {
        try {

            const response = await fetch(
                "http://localhost:5000/user-dashboard/fetchAllQuestions"
            );

            const data = await response.json();

            if (response.ok) {
                setQuestions(data.Questions);
            }

        } catch (err) {
            console.log(err);
        }
    };

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        fetchQuestions();
    }, []);

    const handleSearch = async (value) => {

        setSearch(value);

        if (!value.trim()) {
            setSuggestions([]);
            return;
        }

        try {

            const response = await fetch(
                `http://localhost:5000/autocomplete/findQuestion?search=${value}`
            );

            const data = await response.json();

            if (response.ok) {
                setSuggestions(data.recommendations || []);
            }

        } catch (err) {
            console.log(err);
        }
    };

    const openQuestion = (id) => {
        navigate(`/workspace/${id}`);
    };

    const filteredQuestions = questions.filter((question) =>
        question.Title.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="problems-container">

            <div className="problems-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <h1 className="problems-title" style={{ margin: 0 }}>
                    Problems
                </h1>
                <button
                    onClick={() => navigate("/dashboard")}
                    style={{
                        padding: "10px 18px",
                        backgroundColor: "#222733",
                        color: "white",
                        border: "1px solid #374151",
                        borderRadius: "10px",
                        cursor: "pointer",
                        fontWeight: "600",
                        transition: "0.2s ease"
                    }}
                >
                    Back to Dashboard
                </button>
            </div>

            <div className="search-container">

                <input
                    type="text"
                    placeholder="Search Questions..."
                    value={search}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="search-input"
                />

                {
                    suggestions.length > 0 && (
                        <div className="suggestions-box">

                            {
                                suggestions.map((item, index) => (
                                    <div
                                        key={index}
                                        className="suggestion-item"
                                        onClick={() => {
                                            setSearch(item);
                                            setSuggestions([]);
                                        }}
                                    >
                                        {item}
                                    </div>
                                ))
                            }

                        </div>
                    )
                }

            </div>

            <div className="questions-list">

                {
                    filteredQuestions.map((question) => (
                        <div
                            key={question._id}
                            className="question-card"
                            onClick={() => openQuestion(question._id)}
                        >

                            <h3 className="question-title">
                                {question.Title}
                            </h3>

                            <p
                                className={`question-difficulty ${question.Difficulty.toLowerCase()}`}
                            >
                                Difficulty: {question.Difficulty}
                            </p>

                        </div>
                    ))
                }

            </div>

        </div>
    );
}

export default Problems;