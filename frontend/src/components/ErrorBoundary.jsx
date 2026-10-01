import { Component } from 'react';
import { Link } from 'react-router-dom';

export default class ErrorBoundary extends Component {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  render() { return this.state.hasError ? <main className="route-state"><p className="eyebrow">A small detour</p><h2>That page needs a moment.</h2><p>Something unexpected happened. Return home and try again.</p><Link className="primary-button" to="/">Back to Kindred</Link></main> : this.props.children; }
}
