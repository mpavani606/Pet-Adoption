import { Link } from 'react-router-dom';

export default function NotFound() { return <main className="route-state"><p className="eyebrow">404 · Missing friend</p><h2>This page wandered off.</h2><p>There is nothing here, but there are plenty of good places to begin.</p><Link className="primary-button" to="/">Browse pets <span>→</span></Link></main>; }
