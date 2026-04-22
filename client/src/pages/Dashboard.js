import React, { useContext, useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const [summary, setSummary] = useState({
    totalPoints: 0,
    rank: null,
  });
  const [leaderboard, setLeaderboard] = useState([]);
  const [myLeaderboardEntry, setMyLeaderboardEntry] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    const loadDashboard = async () => {
      try {
        setIsLoading(true);
        const [{ data: summaryData }, { data: leaderboardData }] = await Promise.all([
          api.get('/quiz/summary'),
          api.get('/quiz/leaderboard'),
        ]);

        if (!isMounted) {
          return;
        }

        setSummary(summaryData.summary);
        setLeaderboard(leaderboardData.leaderboard || []);
        setMyLeaderboardEntry(leaderboardData.myLeaderboardEntry || null);
        setError('');
      } catch (requestError) {
        if (isMounted) {
          setError(requestError.response?.data?.message || 'Could not load this page. Try again in a bit.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadDashboard();

    return () => {
      isMounted = false;
    };
  }, []);

  const topScorer = leaderboard.length ? leaderboard[0] : null;
  const myScore = myLeaderboardEntry?.totalPoints ?? summary.totalPoints ?? 0;
  const myRank = myLeaderboardEntry?.rank ?? summary.rank;

  return (
    <div className="page-shell page-shell--notion">
      <Navbar />
      <main className="notion-report">
        <header className="notion-report__header">
          <div className="notion-report__content">
            <p className="notion-report__breadcrumb" style={{ fontWeight: 'bold', fontSize: '1.5rem', color: '#1a1a1a' }}>Dashboard</p>
          </div>
        </header>

        {error ? (
          <div className="notion-callout notion-callout--warn" role="alert">
            <span className="notion-callout__icon" aria-hidden="true">
              !
            </span>
            <p>{error}</p>
          </div>
        ) : null}

        <section className="notion-properties">
          <h2 className="notion-report__h2">Properties</h2>
          <table className="notion-props-table">
            <tbody>
              <tr>
                <th scope="row">Account</th>
                <td>{user?.email || '—'}</td>
              </tr>
              <tr>
                <th scope="row">Your rank</th>
                <td>{myRank ? `#${myRank}` : 'Not ranked yet'}</td>
              </tr>
              <tr>
                <th scope="row">Points</th>
                <td>
                  <strong className="notion-props-table__strong">{myScore}</strong>
                </td>
              </tr>
            </tbody>
          </table>
        </section>

        <section className="notion-toggle-block">
          <h2 className="notion-report__h2">Leaderboard snapshot</h2>
          <p className="notion-report__muted">We only show the #1 spot here plus your row — keeps the page short.</p>

          <details className="notion-details" open>
            <summary className="notion-details__summary">
              <span className="notion-chevron" aria-hidden="true">
                ▸
              </span>
              Top score
            </summary>
            <div className="notion-details__body">
              {isLoading ? (
                <p className="notion-report__muted">Loading…</p>
              ) : topScorer ? (
                <table className="notion-data-table">
                  <thead>
                    <tr>
                      <th scope="col">#</th>
                      <th scope="col">Name</th>
                      <th scope="col">Points</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>{topScorer.rank}</td>
                      <td>{topScorer.isCurrentUser ? `${topScorer.name} (you)` : topScorer.name}</td>
                      <td>{topScorer.totalPoints}</td>
                    </tr>
                  </tbody>
                </table>
              ) : (
                <p className="notion-report__muted">No one on the board yet. Run a quiz or interview first.</p>
              )}
            </div>
          </details>

          <details className="notion-details" open>
            <summary className="notion-details__summary">
              <span className="notion-chevron" aria-hidden="true">
                ▸
              </span>
              You
            </summary>
            <div className="notion-details__body">
              {isLoading ? (
                <p className="notion-report__muted">Loading…</p>
              ) : (
                <table className="notion-data-table">
                  <thead>
                    <tr>
                      <th scope="col">#</th>
                      <th scope="col">Name</th>
                      <th scope="col">Points</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>{myRank || '—'}</td>
                      <td>{user?.name || 'You'} (you)</td>
                      <td>{myScore}</td>
                    </tr>
                  </tbody>
                </table>
              )}
            </div>
          </details>
        </section>
      </main>
    </div>
  );
};

export default Dashboard;
