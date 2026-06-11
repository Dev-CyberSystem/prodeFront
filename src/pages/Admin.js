import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import api from '../api/axios';
import './Admin.css';

const STAGES = ['Fase de Grupos', 'Ronda de 32', 'Octavos de Final', 'Cuartos de Final', 'Semifinal', 'Tercer Puesto', 'Final'];
const GROUPS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];

const emptyMatch = {
  homeTeam: '', awayTeam: '', homeFlag: '', awayFlag: '',
  matchDate: '', stage: 'Fase de Grupos', group: 'C',
};

export default function Admin() {
  const [matches, setMatches] = useState([]);
  const [form, setForm] = useState(emptyMatch);
  const [scores, setScores] = useState({});
  const [tab, setTab] = useState('matches');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [togglingRole, setTogglingRole] = useState(null);
  const [recalcing, setRecalcing] = useState(false);

  const fetchMatches = useCallback(async () => {
    try {
      const { data } = await api.get('/matches');
      setMatches(data);
    } catch (err) {
      toast.error('Error cargando partidos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchMatches(); }, [fetchMatches]);

  const fetchUsers = useCallback(async () => {
    setUsersLoading(true);
    try {
      const { data } = await api.get('/users');
      setUsers(data);
    } catch (err) {
      toast.error('Error cargando usuarios');
    } finally {
      setUsersLoading(false);
    }
  }, []);

  useEffect(() => { if (tab === 'users') fetchUsers(); }, [tab, fetchUsers]);

  const handleRecalcPoints = async () => {
    if (!window.confirm('¿Recalcular los puntos de todos los usuarios desde las predicciones existentes?')) return;
    setRecalcing(true);
    try {
      const { data } = await api.post('/users/recalc-points');
      toast.success(data.message);
      fetchUsers();
    } catch (err) {
      toast.error('Error al recalcular');
    } finally {
      setRecalcing(false);
    }
  };

  const handleToggleRole = async (userId, currentRole) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    setTogglingRole(userId);
    try {
      await api.patch(`/users/${userId}/role`, { role: newRole });
      toast.success(`Rol actualizado a ${newRole}`);
      fetchUsers();
    } catch (err) {
      toast.error('Error al cambiar rol');
    } finally {
      setTogglingRole(null);
    }
  };

  const handleAddMatch = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/matches', form);
      toast.success('Partido agregado!');
      setForm(emptyMatch);
      fetchMatches();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error');
    } finally {
      setSaving(false);
    }
  };

  const handleSetScore = async (matchId) => {
    const s = scores[matchId];
    if (!s || s.home === '' || s.away === '') return toast.error('Completá ambos scores');
    try {
      await api.put(`/matches/${matchId}/score`, {
        homeScore: Number(s.home),
        awayScore: Number(s.away),
      });
      toast.success('Resultado cargado y puntos calculados!');
      setScores((prev) => { const n = { ...prev }; delete n[matchId]; return n; });
      fetchMatches();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error');
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const { data } = await api.post('/sync/results');
      if (data.updated > 0) {
        toast.success(`✅ ${data.updated} resultado(s) sincronizado(s)`);
        fetchMatches();
      } else {
        toast.info(`Sin resultados nuevos (${data.total} partidos consultados)`);
      }
      if (data.errors?.length > 0) console.warn('Sync warnings:', data.errors);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al sincronizar');
    } finally {
      setSyncing(false);
    }
  };

  const handleDelete = async (matchId) => {
    if (!window.confirm('¿Eliminar este partido y sus predicciones?')) return;
    try {
      await api.delete(`/matches/${matchId}`);
      toast.success('Partido eliminado');
      fetchMatches();
    } catch (err) {
      toast.error('Error al eliminar');
    }
  };

  const ALL_STAGES_ORDER = ['Fase de Grupos', 'Ronda de 32', 'Octavos de Final', 'Cuartos de Final', 'Semifinal', 'Tercer Puesto', 'Final'];
  const pending = matches.filter((m) => !m.isFinished && m.homeTeam !== 'TBD');
  const finished = matches.filter((m) => m.isFinished);
  const pendingByStage = ALL_STAGES_ORDER.map(s => ({
    stage: s,
    matches: pending.filter(m => m.stage === s),
  })).filter(s => s.matches.length > 0);

  return (
    <div className="admin-page">
      <div className="admin-hero">
        <h1 className="admin-title">⚙️ Panel de Admin</h1>
        <p className="admin-subtitle">Gestión del Prode · Mundial 2026</p>
      </div>

      <div className="admin-body">
        <div className="admin-tabs">
          <button className={`tab-btn ${tab === 'matches' ? 'active' : ''}`} onClick={() => setTab('matches')}>
            Cargar Resultados ({pending.length})
          </button>
          <button className={`tab-btn ${tab === 'bracket' ? 'active' : ''}`} onClick={() => setTab('bracket')}>
            Estado Bracket
          </button>
          <button className={`tab-btn ${tab === 'add' ? 'active' : ''}`} onClick={() => setTab('add')}>
            Agregar Partido
          </button>
          <button className={`tab-btn ${tab === 'finished' ? 'active' : ''}`} onClick={() => setTab('finished')}>
            Finalizados ({finished.length})
          </button>
          <button className={`tab-btn ${tab === 'users' ? 'active' : ''}`} onClick={() => setTab('users')}>
            Usuarios
          </button>
        </div>

        {tab === 'add' && (
          <div className="admin-card">
            <h2>Nuevo Partido</h2>
            <form onSubmit={handleAddMatch} className="add-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Equipo Local</label>
                  <input value={form.homeTeam} onChange={(e) => setForm({ ...form, homeTeam: e.target.value })} placeholder="Argentina" required />
                </div>
                <div className="form-group emoji-field">
                  <label>Bandera</label>
                  <input value={form.homeFlag} onChange={(e) => setForm({ ...form, homeFlag: e.target.value })} placeholder="🇦🇷" />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Equipo Visitante</label>
                  <input value={form.awayTeam} onChange={(e) => setForm({ ...form, awayTeam: e.target.value })} placeholder="Brasil" required />
                </div>
                <div className="form-group emoji-field">
                  <label>Bandera</label>
                  <input value={form.awayFlag} onChange={(e) => setForm({ ...form, awayFlag: e.target.value })} placeholder="🇧🇷" />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Fecha y Hora</label>
                  <input type="datetime-local" value={form.matchDate} onChange={(e) => setForm({ ...form, matchDate: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>Etapa</label>
                  <select value={form.stage} onChange={(e) => setForm({ ...form, stage: e.target.value })}>
                    {STAGES.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Grupo</label>
                  <select value={form.group} onChange={(e) => setForm({ ...form, group: e.target.value })}>
                    <option value="">—</option>
                    {GROUPS.map((g) => <option key={g}>{g}</option>)}
                  </select>
                </div>
              </div>
              <button type="submit" className="btn-admin" disabled={saving}>
                {saving ? 'Guardando...' : 'Agregar Partido'}
              </button>
            </form>
          </div>
        )}

        {tab === 'matches' && (
          <div className="admin-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border)' }}>
              <h2 style={{ margin: 0 }}>Cargar Resultados</h2>
              <button className="btn-sync" onClick={handleSync} disabled={syncing}>
                {syncing ? '⏳ Sincronizando...' : '🔄 Sincronizar con API'}
              </button>
            </div>
            {loading ? <p className="loading-text">Cargando...</p> : pendingByStage.length === 0 ? (
              <p className="empty-text">No hay partidos pendientes con equipos definidos.</p>
            ) : (
              pendingByStage.map(({ stage, matches: stageMatches }) => (
                <div key={stage} className="stage-section">
                  <div className="stage-section-title">{stage}</div>
                  <div className="results-list">
                    {stageMatches.map((m) => (
                      <div key={m._id} className="result-row">
                        <div className="result-teams">
                          <span>{m.homeFlag} {m.homeTeam}</span>
                          <span className="vs-text">vs</span>
                          <span>{m.awayTeam} {m.awayFlag}</span>
                          {m.group && <span className="group-tag">Grupo {m.group}</span>}
                        </div>
                        <div className="result-date">{new Date(m.matchDate).toLocaleDateString('es-AR')}</div>
                        <div className="result-inputs">
                          <input
                            type="number" min="0" placeholder="0"
                            value={scores[m._id]?.home ?? ''}
                            onChange={(e) => setScores((p) => ({ ...p, [m._id]: { ...p[m._id], home: e.target.value } }))}
                          />
                          <span>-</span>
                          <input
                            type="number" min="0" placeholder="0"
                            value={scores[m._id]?.away ?? ''}
                            onChange={(e) => setScores((p) => ({ ...p, [m._id]: { ...p[m._id], away: e.target.value } }))}
                          />
                          <button className="btn-score" onClick={() => handleSetScore(m._id)}>
                            Guardar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {tab === 'bracket' && (
          <div className="admin-card">
            <h2>Estado del Bracket</h2>
            <div className="bracket-status-list">
              {['Ronda de 32','Octavos de Final','Cuartos de Final','Semifinal','Tercer Puesto','Final'].map(stage => {
                const stageMs = matches.filter(m => m.stage === stage);
                const defined = stageMs.filter(m => m.homeTeam !== 'TBD').length;
                const finished = stageMs.filter(m => m.isFinished).length;
                return (
                  <div key={stage} className="bracket-status-row">
                    <span className="bs-stage">{stage}</span>
                    <span className="bs-stat">{defined}/{stageMs.length} definidos</span>
                    <span className="bs-stat">{finished}/{stageMs.length} jugados</span>
                    <span className={`bs-bar-wrap`}>
                      <span className="bs-bar" style={{ width: `${stageMs.length ? (finished/stageMs.length)*100 : 0}%` }} />
                    </span>
                  </div>
                );
              })}
            </div>
            <p className="empty-text" style={{marginTop:'1rem',fontSize:'0.8rem'}}>
              El bracket se actualiza automáticamente al cargar resultados. Los mejores terceros se asignan cuando todos los grupos terminan.
            </p>
          </div>
        )}

        {tab === 'finished' && (
          <div className="admin-card">
            <h2>Partidos Finalizados</h2>
            {finished.length === 0 ? <p className="empty-text">No hay partidos finalizados.</p> : (
              <div className="results-list">
                {finished.map((m) => (
                  <div key={m._id} className="result-row finished-row">
                    <div className="result-teams">
                      <span>{m.homeFlag} {m.homeTeam}</span>
                      <span className="final-badge">{m.homeScore} - {m.awayScore}</span>
                      <span>{m.awayTeam} {m.awayFlag}</span>
                    </div>
                    <span className="stage-tag">{m.stage}</span>
                    <button className="btn-delete" onClick={() => handleDelete(m._id)}>
                      Eliminar
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        {tab === 'users' && (
          <div className="admin-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border)' }}>
              <h2 style={{ margin: 0 }}>Usuarios registrados ({users.length})</h2>
              <button className="btn-sync" onClick={handleRecalcPoints} disabled={recalcing}>
                {recalcing ? '⏳ Recalculando...' : '🔁 Recalcular puntos'}
              </button>
            </div>
            {usersLoading ? (
              <p className="loading-text">Cargando usuarios...</p>
            ) : users.length === 0 ? (
              <p className="empty-text">No hay usuarios registrados.</p>
            ) : (
              <div className="users-table-wrap">
                <table className="users-table">
                  <thead>
                    <tr>
                      <th>Usuario</th>
                      <th>Email</th>
                      <th>Registro</th>
                      <th>Predicciones</th>
                      <th>Puntos</th>
                      <th>Rol</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u._id} className={u.role === 'admin' ? 'user-row admin-row' : 'user-row'}>
                        <td className="user-name-cell">
                          <span className="user-avatar">{u.name.charAt(0).toUpperCase()}</span>
                          {u.name}
                        </td>
                        <td className="user-email">{u.email}</td>
                        <td className="user-date">{new Date(u.createdAt).toLocaleDateString('es-AR')}</td>
                        <td className="user-num">{u.predictions}</td>
                        <td className="user-pts">{u.points}</td>
                        <td>
                          <button
                            className={`role-btn ${u.role === 'admin' ? 'role-admin' : 'role-user'}`}
                            onClick={() => handleToggleRole(u._id, u.role)}
                            disabled={togglingRole === u._id}
                          >
                            {u.role === 'admin' ? '⭐ Admin' : '👤 Usuario'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
