import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import './Leaderboard.css';

const MEDALS = ['🥇', '🥈', '🥉'];

export default function Leaderboard() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    api.get('/leaderboard')
      .then((res) => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-ball">🏆</div>
        <p>Cargando tabla...</p>
      </div>
    );
  }

  return (
    <div className="leaderboard-page">
      <div className="lb-hero">
        <div className="lb-trophy">🏆</div>
        <h1 className="lb-title">TABLA DE POSICIONES</h1>
        <p className="lb-subtitle">Prode Familiar · Mundial 2026</p>
      </div>

      <div className="lb-body">
        {data.length === 0 ? (
          <div className="empty-state">No hay jugadores en la tabla todavía.</div>
        ) : (
          <div className="lb-table">
            <div className="lb-header">
              <span>#</span>
              <span>Jugador</span>
              <span>Predicciones</span>
              <span>Resultados ✓</span>
              <span>Exactos ⭐</span>
              <span>Puntos</span>
            </div>
            {data.map((entry, i) => (
              <div
                key={entry.user.id}
                className={`lb-row ${entry.user.id === user?.id ? 'my-row' : ''} ${i < 3 ? `top-${i + 1}` : ''}`}
              >
                <span className="rank">
                  {i < 3 ? MEDALS[i] : <span className="rank-num">{entry.rank}</span>}
                </span>
                <span className="player-name">
                  {entry.user.name}
                  {entry.user.id === user?.id && <span className="you-tag">Vos</span>}
                </span>
                <span className="lb-stat">{entry.totalPredictions}</span>
                <span className="lb-stat green">{entry.correctResults}</span>
                <span className="lb-stat gold">{entry.exactScores}</span>
                <span className="lb-points">{entry.points}</span>
              </div>
            ))}
          </div>
        )}

        <div className="lb-legend">
          <div className="legend-item">
            <span className="legend-badge gold-badge">+5</span>
            <span>Marcador exacto (resultado + goles)</span>
          </div>
          <div className="legend-item">
            <span className="legend-badge green-badge">+3</span>
            <span>Resultado correcto (ganador o empate)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
