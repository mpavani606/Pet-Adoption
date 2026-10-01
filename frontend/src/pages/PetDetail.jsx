import { ArrowLeft, ArrowRight, Heart } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import client from '../api/client';
import { demoPets } from '../data/demoPets';
import { useAuth } from '../context/AuthContext';

export default function PetDetail() {
  const { id } = useParams(); const navigate = useNavigate(); const { user } = useAuth();
  const [pet, setPet] = useState(demoPets.find((item) => item._id === id)); const [message, setMessage] = useState(''); const [notice, setNotice] = useState(''); const [busy, setBusy] = useState(false);
  useEffect(() => { client.get(`/pets/${id}`).then(({ data }) => setPet(data)).catch(() => {}); }, [id]);
  const isOwner = user && (user.role === 'admin' || (pet?.shelter?._id || pet?.shelter) === user._id);
  async function deleteListing() { if (!window.confirm(`Delete ${pet.name}'s listing?`)) return; try { await client.delete(`/pets/${id}`); navigate('/'); } catch (error) { setNotice(error.response?.data?.message || 'This listing could not be deleted.'); } }
  if (!pet) return <div className="route-state"><h2>We could not find that friend.</h2><Link to="/">Back to all pets</Link></div>;
  async function requestAdoption(event) { event.preventDefault(); if (!user) return navigate('/login', { state: { from: `/pets/${id}` } }); setBusy(true); setNotice(''); try { await client.post('/requests', { pet: id, message }); setNotice('Your request is on its way. The shelter will be in touch soon.'); } catch (error) { setNotice(error.response?.data?.message || 'We could not send your request.'); } finally { setBusy(false); } }
  return <main className="detail-page"><Link className="back-link" to="/"><ArrowLeft size={16}/> Back to friends</Link><div className="detail-grid"><div className="detail-photo"><img src={pet.photoUrl || demoPets[0].photoUrl} alt={pet.name}/><span className="available-tag">{pet.status}</span></div><div className="detail-copy"><p className="eyebrow">{pet.type} · {pet.gender}</p><h1>Meet {pet.name}.</h1><p className="detail-meta">{pet.breed} · {pet.age} {pet.age === 1 ? 'year' : 'years'} old</p><p className="detail-description">{pet.description}</p>{notice && <p className="success-note">{notice}</p>}{isOwner && <div className="owner-actions"><Link className="secondary-button" to={`/pets/${id}/edit`}>Edit listing</Link><button className="danger-button" onClick={deleteListing}>Delete listing</button></div>}{pet.status === 'available' && !isOwner && <form className="request-form" onSubmit={requestAdoption}><label htmlFor="message">Tell the shelter a little about yourself</label><textarea id="message" value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Why would you be a great match?" required minLength="10"/><button className="primary-button" disabled={busy}>{busy ? 'Sending...' : 'Request adoption'} <ArrowRight size={17}/></button></form>}{pet.status !== 'available' && !isOwner && <p className="status-note"><Heart size={17}/> This friend is already meeting families.</p>}</div></div></main>;
}
