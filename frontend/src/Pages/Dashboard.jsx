import { useContext, useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/authContext";
import "../styles/Dashboard.css";
import { useLocation } from "react-router-dom";

function Dashboard() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [questions, setQuestions] = useState(null);
  const [accepted, setAccepted] = useState(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const userId = user?.id || user?._id;

        if (!userId) return;

        const [
          profileResponse,
          statsResponse,
          questionsResponse,
          acceptedResponse,
        ] = await Promise.all([
          fetch(
            `http://localhost:5000/user-dashboard/profile/${userId}`
          ),
          fetch(
            `http://localhost:5000/user-dashboard/stats/${userId}`
          ),
          fetch(
            `http://localhost:5000/user-dashboard/fetchAllQuestions`
          ),
          fetch(
            `http://localhost:5000/user-dashboard/AcceptedSubmissions/${userId}`
          ),
        ]);

        const profileData = await profileResponse.json();
        const statsData = await statsResponse.json();
        const questionsData = await questionsResponse.json();
        const acceptedData = await acceptedResponse.json();

        setProfile(profileData);
        setStats(statsData);
        setQuestions(questionsData);
        setAccepted(acceptedData);
      } catch (err) {
        console.log(err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user,location.pathname]);

  const handleLogout = async () => {
    try {
      const response = await fetch("http://localhost:5000/user-dashboard/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
      const data = await response.json();

      if (response.ok) {
        logout();
        navigate("/");
      } else {
        alert(data.message || data.error || "Logout failed");
      }
    } catch (err) {
      console.log(err);
      alert("Server Error");
    }
  };

  if (!user) {
    return <Navigate to="/" />;
  }

  if (loading) {
    return (
      <div className="dashboard-loading">
        <h2>Loading Dashboard...</h2>
      </div>
    );
  }

  const totalQuestions = questions?.total || 0;
  const solvedQuestions = stats?.totalSolved || 0;

  const solvedPercentage =
    totalQuestions === 0
      ? 0
      : (solvedQuestions / totalQuestions) * 100;

  return (
    <div className="dashboard-container">
      {/* LEFT SIDEBAR */}

      <div className="dashboard-left">
        <div className="profile-card">
          <div className="profile-image-container">
            <img
              src="https://cdn-icons-png.flaticon.com/512/149/149071.png"
              alt="Profile"
              className="profile-image"
            />
          </div>

          <h2 className="username">
            {profile?.Username || "User"}
          </h2>

          <p className="email">
            {profile?.Email}
          </p>

          <button
            className="edit-profile-btn"
            onClick={() => navigate("/problems")}
          >
            Browse Problems
          </button>

          <div className="profile-info">
            <div className="info-row">
              <span>Joined</span>
              <span>
                {stats?.DateCreated
                  ? new Date(
                      stats.DateCreated
                    ).toLocaleDateString()
                  : "N/A"}
              </span>
            </div>

            <div className="info-row">
              <span>Role</span>
              <span>
                {profile?.Role || "User"}
              </span>
            </div>
          </div>

          <button
            className="logout-btn"
            style={{
              width: "100%",
              padding: "12px",
              border: "none",
              borderRadius: "12px",
              backgroundColor: "#dc3545",
              color: "white",
              cursor: "pointer",
              fontSize: "15px",
              fontWeight: "600",
              marginTop: "20px",
              transition: "0.3s ease"
            }}
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </div>

      {/* RIGHT CONTENT */}

      <div className="dashboard-right">

        {/* TOP STATS */}

        <div className="top-row">

          <div className="stats-card">

            <div
              className="solved-circle"
              style={{
                background: `conic-gradient(
                  #00b8a3 ${solvedPercentage}%,
                  #2b313d ${solvedPercentage}% 100%
                )`,
              }}
            >
              <div className="circle-inner">
                <h1>{solvedQuestions}</h1>

                <p>
                  / {totalQuestions}
                </p>

                <span>Solved</span>
              </div>
            </div>

            <div className="difficulty-panel">

              <div className="difficulty-box easy">
                <span>Easy</span>
                <h3>
                  {stats?.difficultyStats?.easy || 0}
                </h3>
              </div>

              <div className="difficulty-box medium">
                <span>Medium</span>
                <h3>
                  {stats?.difficultyStats?.medium || 0}
                </h3>
              </div>

              <div className="difficulty-box hard">
                <span>Hard</span>
                <h3>
                  {stats?.difficultyStats?.hard || 0}
                </h3>
              </div>

            </div>
          </div>

          <div className="overview-card">

            <div className="overview-item">
              <h3>Total Submissions</h3>
              <p>{stats?.totalSubmissions || 0}</p>
            </div>

            <div className="overview-item">
              <h3>Accepted</h3>
              <p>{stats?.acceptedSubmissions || 0}</p>
            </div>

            <div className="overview-item">
              <h3>Acceptance Rate</h3>
              <p>{stats?.acceptanceRate || 0}%</p>
            </div>

            <div className="overview-item">
              <h3>Attempted</h3>
              <p>{stats?.attemptedQuestions || 0}</p>
            </div>

          </div>

        </div>

        {/* LANGUAGE STATS */}

        <div className="languages-card">

          <h2>Languages Used</h2>

          {stats?.languageStats?.length > 0 ? (
            stats.languageStats.map((lang, index) => (
              <div
                key={index}
                className="language-row"
              >
                <span>{lang._id}</span>
                <span>{lang.count}</span>
              </div>
            ))
          ) : (
            <p>No submissions yet.</p>
          )}

        </div>

        {/* RECENT ACCEPTED */}

        <div className="recent-card">

          <div className="recent-header">
            <h2>Recent Accepted Submissions</h2>
          </div>

          {accepted?.Submissions?.length > 0 ? (
            accepted.Submissions.slice(0, 5).map((submission) => (
              <div
                key={submission._id}
                className="submission-row"
              >
                <div className="submission-left">
                  <p className="submission-title">
                    {submission.QuestionId?.Title}
                  </p>

                  <span className="submission-language">
                    {submission.language}
                  </span>
                  <span className="submission-difficulty">
                    {submission.QuestionId?.Difficulty}
                  </span>
                </div>

                <div className="submission-right">
                  <span className="accepted-badge">
                    {submission.Verdict}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="empty-state">
              No accepted submissions yet.
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

export default Dashboard;