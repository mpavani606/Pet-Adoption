import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import client from '../api/client';

export default function MyRequests() {
  const [requests, setRequests] = useState([]); const [error, setError] = useState('');
  useEffect(() => { client.get('/requests/mine').then(({ data }) => setRequests(data)).catch(() => setError('Your requests could not be loaded.')); }, []);
  return <main className="dashboard-page"><div className="dashboard-heading"><div><p className="eyebrow">Your adoption journey</p><h1>My requests.</h1></div><Link className="secondary-button" to="/">Find more friends</Link></div>{error && <p className="form-error">{error}</p>}{!error && requests.length === 0 && <div className="empty-state"><h2>Your next hello is out there.</h2><p>When you send an adoption request, it will appear here.</p><Link className="primary-button" to="/">Browse pets <span>→</span></Link></div>}<div className="request-list">{requests.map((request) => <article className="request-card" key={request._id}><img src={request.pet?.photoUrl} alt={request.pet?.name}/><div><p className="request-type">{request.status}</p><h2>{request.pet?.name}</h2><p>{request.pet?.breed} · {request.message}</p></div><span className={`status status-${request.status}`}>{request.status}</span></article>)}</div></main>;
}
