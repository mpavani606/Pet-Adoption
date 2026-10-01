import { createRoot } from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';
import PrivateRoute from './components/PrivateRoute';
import Home from './pages/Home';
import PetDetail from './pages/PetDetail';
import AuthPage from './pages/AuthPage';
import MyRequests from './pages/MyRequests';
import PetForm from './pages/PetForm';
import ManageRequests from './pages/ManageRequests';
import NotFound from './pages/NotFound';
import ErrorBoundary from './components/ErrorBoundary';
import './styles.css';

function App() {
  return <ErrorBoundary><AuthProvider><BrowserRouter><Routes><Route element={<Layout />}><Route path="/" element={<Home />} /><Route path="/pets/:id" element={<PetDetail />} /><Route path="/login" element={<AuthPage mode="login" />} /><Route path="/register" element={<AuthPage mode="register" />} /><Route element={<PrivateRoute />}><Route path="/my-requests" element={<MyRequests />} /></Route><Route element={<PrivateRoute roles={['shelter', 'admin']} />}><Route path="/pets/new" element={<PetForm />} /><Route path="/pets/:id/edit" element={<PetForm />} /><Route path="/requests" element={<ManageRequests />} /></Route><Route path="*" element={<NotFound />} /></Route></Routes></BrowserRouter></AuthProvider></ErrorBoundary>;
}

createRoot(document.getElementById('root')).render(<App />);
