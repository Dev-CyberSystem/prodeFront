import React, { useState } from 'react';
import { toast } from 'react-toastify';
import api from '../api/axios';
import './MatchCard.css';

function getResult(home, away) {
  if (home === null || away === null) return null;
  if (home > away) return 'home';
  if (home < away) return 'away';
  return 'draw';
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('es-AR', {
    weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
    timeZone: 'America/Argentina/Buenos_Aires',
  });
}

function isPast(dateStr) {
  return new Date() >= new Date(dateStr);
}

function getPointsBadge(points) {
  if (points === 5) return { label: '+5 pts', cls: 'badge-exact', title: 'Resultado y marcador exacto!' };
  if (points === 3) return { label: '+3 pts', cls: 'badge-result', title: 'Resultado correcto!' };
  if (points === 0) return { label: '0 pts', cls: 'badge-miss', title: 'Sin puntos' };
  return null;
}

export default function MatchCard({ match, prediction, onPredictionSaved }) {
  const [home, setHome] = useState(prediction?.homeScore ?? '');
  const [away, setAway] = useState(prediction?.awayScore ?? '');
  const [saving, setSaving] = useState(false);

  const locked = isPast(match.matchDate) || match.isFinished;
  const actualResult = getResult(match.homeScore, match.awayScore);
  const predResult = prediction ? getResult(prediction.homeScore, prediction.awayScore) : null;
  const badge = prediction?.isCalculated ? getPointsBadge(prediction.points) : null;

  const handleSave = async () => {
    if (home === '' || away === '') return toast.error('Completá ambos scores');
    if (Number(home) < 0 || Number(away) < 0) return toast.error('Los goles no pueden ser negativos');
    setSaving(true);
    try {
      await api.post('/predictions', {
        matchId: match._id,
        homeScore: Number(home),
        awayScore: Number(away),
      });
      toast.success('Predicción guardada!');
      onPredictionSaved?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={`match-card ${match.isFinished ? 'finished' : ''}`}>
      <div className="match-stage">
        <span>{match.stage}{match.group ? ` · Grupo ${match.group}` : ''}</span>
        <span className="match-date">{formatDate(match.matchDate)}</span>
      </div>

      <div className="match-teams">
        <div className="team home-team">
          <span className="team-flag">{match.homeFlag}</span>
          <span className="team-name">{match.homeTeam}</span>
        </div>

        <div className="match-center">
          {match.isFinished ? (
            <div className="final-score">
              <span className={actualResult === 'home' ? 'winner-score' : ''}>{match.homeScore}</span>
              <span className="score-sep">-</span>
              <span className={actualResult === 'away' ? 'winner-score' : ''}>{match.awayScore}</span>
            </div>
          ) : (
            <div className="score-vs">VS</div>
          )}
          {locked && !match.isFinished && <div className="locked-label">🔒 En curso</div>}
        </div>

        <div className="team away-team">
          <span className="team-name">{match.awayTeam}</span>
          <span className="team-flag">{match.awayFlag}</span>
        </div>
      </div>

      <div className="prediction-section">
        {badge && (
          <div className={`points-badge ${badge.cls}`} title={badge.title}>
            {badge.label}
          </div>
        )}

        {!locked ? (
          <div className="prediction-input">
            <span className="pred-label">Tu predicción:</span>
            <div className="score-inputs">
              <input
                type="number"
                min="0"
                max="99"
                value={home}
                onChange={(e) => setHome(e.target.value)}
                placeholder="0"
              />
              <span>-</span>
              <input
                type="number"
                min="0"
                max="99"
                value={away}
                onChange={(e) => setAway(e.target.value)}
                placeholder="0"
              />
            </div>
            <button className="btn-save" onClick={handleSave} disabled={saving}>
              {saving ? '...' : prediction ? 'Actualizar' : 'Guardar'}
            </button>
          </div>
        ) : prediction ? (
          <div className={`prediction-display ${predResult === actualResult && match.isFinished ? 'correct' : match.isFinished ? 'incorrect' : ''}`}>
            <span className="pred-label">Tu predicción:</span>
            <span className="pred-score">
              {prediction.homeScore} - {prediction.awayScore}
            </span>
            {match.isFinished && (
              <span className="pred-result-icon">
                {predResult === actualResult ? '✓' : '✗'}
              </span>
            )}
          </div>
        ) : (
          <div className="no-prediction">Sin predicción</div>
        )}
      </div>
    </div>
  );
}
