import React, { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import MatchCard from '../components/MatchCard';
import Standings from '../components/Standings';
import BracketView from '../components/BracketView';
import './Home.css';

const GROUP_STAGES = ['Fase de Grupos'];
const KNOCKOUT_STAGES = ['Ronda de 32', 'Octavos de Final', 'Cuartos de Final', 'Semifinal', 'Tercer Puesto', 'Final'];
const STAGE_FILTERS = ['Todos','Grupo A','Grupo B','Grupo C','Grupo D','Grupo E','Grupo F','Grupo G','Grupo H','Grupo I','Grupo J','Grupo K','Grupo L'];

const TABS = [
  { id: 'predictions', label: '⚽ Partidos' },
  { id: 'standings',   label: '📊 Posiciones' },
  { id: 'bracket',     label: '🏆 Bracket' },
];

export default function Home() {
  const [matches, setMatches] = useState([]);
  const [predictions, setPredictions] = useState({});
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('predictions');
  const [filter, setFilter] = useState('Todos');
  const [phase, setPhase] = useState('groups'); // 'groups' | 'knockout'

  const fetchData = useCallback(async () => {
    try {
      const [mRes, pRes] = await Promise.all([api.get('/matches'), api.get('/predictions/my')]);
      setMatches(mRes.data);
      const map = {};
      pRes.data.forEach(p => { map[p.match._id] = p; });
      setPredictions(map);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const groupMatches = matches.filter(m => GROUP_STAGES.includes(m.stage));
  const knockoutMatches = matches.filter(m => KNOCKOUT_STAGES.includes(m.stage));
  const pendingGroup = groupMatches.filter(m => !m.isFinished && new Date() < new Date(m.matchDate)).length;
  const predicted = Object.keys(predictions).length;
  const totalPoints = Object.values(predictions).reduce((s, p) => s + (p.points || 0), 0);

  const filteredGroup = filter === 'Todos'
    ? groupMatches
    : groupMatches.filter(m => `Grupo ${m.group}` === filter);

  if (loading) return (
    <div className="loading-screen">
      <div className="loading-ball">⚽</div>
      <p>Cargando partidos...</p>
    </div>
  );

  return (
    <div className="home-page">
      {/* Hero */}
      <div className="home-hero">
        <div className="hero-content">
          <div className="hero-badge">MUNDIAL 2026</div>
          <h1 className="hero-title"><span className="hero-flag">🇦🇷</span> ARGENTINA</h1>
          <p className="hero-subtitle">Tricampeones del Mundo · Qatar 2022 · USA · MEX · CAN 2026</p>
        </div>
        <div className="hero-stats">
          <div className="stat-box"><span className="stat-num">{predicted}</span><span className="stat-label">Predicciones</span></div>
          <div className="stat-box gold"><span className="stat-num">{totalPoints}</span><span className="stat-label">Puntos</span></div>
          <div className="stat-box"><span className="stat-num">{pendingGroup}</span><span className="stat-label">Pendientes</span></div>
        </div>
      </div>

      {/* Tabs */}
      <div className="home-tabs">
        {TABS.map(t => (
          <button
            key={t.id}
            className={`home-tab ${tab === t.id ? 'active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ─── TAB: Partidos ─── */}
      {tab === 'predictions' && (
        <div className="home-body">
          <div className="points-legend">
            <h3>Sistema de puntos</h3>
            <div className="legend-items">
              <div className="legend-item"><span className="legend-badge gold-badge">+3</span><span>Resultado correcto</span></div>
              <div className="legend-item"><span className="legend-badge blue-badge">+2</span><span>Marcador exacto (además de los 3 pts)</span></div>
            </div>
          </div>

          {/* Phase toggle */}
          <div className="phase-toggle">
            <button className={`phase-btn ${phase === 'groups' ? 'active' : ''}`} onClick={() => setPhase('groups')}>
              Fase de Grupos <span className="phase-count">({groupMatches.length})</span>
            </button>
            <button className={`phase-btn ${phase === 'knockout' ? 'active' : ''}`} onClick={() => setPhase('knockout')}>
              Fase Eliminatoria <span className="phase-count">({knockoutMatches.length})</span>
            </button>
          </div>

          {phase === 'groups' && (
            <>
              <div className="stage-filters">
                {STAGE_FILTERS.map(f => (
                  <button key={f} className={`filter-btn ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
                    {f}
                  </button>
                ))}
              </div>
              {filteredGroup.length === 0
                ? <div className="empty-state">No hay partidos en este grupo.</div>
                : <div className="matches-grid">
                    {filteredGroup.map(m => (
                      <MatchCard key={m._id} match={m} prediction={predictions[m._id]} onPredictionSaved={fetchData} />
                    ))}
                  </div>
              }
            </>
          )}

          {phase === 'knockout' && (
            <>
              {knockoutMatches.filter(m => m.homeTeam !== 'TBD' || m.isFinished).length === 0
                ? <div className="empty-state">Los partidos eliminatorios se van completando a medida que avanza el torneo.</div>
                : <div className="matches-grid">
                    {knockoutMatches
                      .filter(m => m.homeTeam !== 'TBD' || m.isFinished)
                      .map(m => (
                        <MatchCard key={m._id} match={m} prediction={predictions[m._id]} onPredictionSaved={fetchData} />
                      ))}
                  </div>
              }
            </>
          )}
        </div>
      )}

      {/* ─── TAB: Posiciones ─── */}
      {tab === 'standings' && <Standings />}

      {/* ─── TAB: Bracket ─── */}
      {tab === 'bracket' && <BracketView />}
    </div>
  );
}
