import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import './BracketView.css';

const STAGE_ORDER = ['Ronda de 32','Octavos de Final','Cuartos de Final','Semifinal','Final'];
const STAGE_LABELS = {
  'Ronda de 32': 'R32',
  'Octavos de Final': 'Octavos',
  'Cuartos de Final': 'Cuartos',
  'Semifinal': 'Semis',
  'Final': 'Final',
};

function formatDate(d) {
  return new Date(d).toLocaleDateString('es-AR', { day:'numeric', month:'short' });
}

function MatchBox({ match, isArgentina }) {
  const homeTbd = match.homeTeam === 'TBD';
  const awayTbd = match.awayTeam === 'TBD';
  const homeWon = match.isFinished && match.homeScore > match.awayScore;
  const awayWon = match.isFinished && match.awayScore > match.homeScore;
  const argHome = match.homeTeam === 'Argentina';
  const argAway = match.awayTeam === 'Argentina';

  return (
    <div className={`bracket-match ${isArgentina ? 'arg-match' : ''}`}>
      <div className="bracket-date">{formatDate(match.matchDate)}</div>
      <div className={`bracket-team ${homeWon ? 'winner' : ''} ${homeTbd ? 'tbd' : ''} ${argHome ? 'arg-team' : ''}`}>
        <span className="b-flag">{match.homeFlag}</span>
        <span className="b-name">{homeTbd ? '?' : match.homeTeam}</span>
        {match.isFinished && <span className="b-score">{match.homeScore}</span>}
      </div>
      <div className={`bracket-team ${awayWon ? 'winner' : ''} ${awayTbd ? 'tbd' : ''} ${argAway ? 'arg-team' : ''}`}>
        <span className="b-flag">{match.awayFlag}</span>
        <span className="b-name">{awayTbd ? '?' : match.awayTeam}</span>
        {match.isFinished && <span className="b-score">{match.awayScore}</span>}
      </div>
    </div>
  );
}

export default function BracketView() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeStage, setActiveStage] = useState('Ronda de 32');

  useEffect(() => {
    api.get('/matches')
      .then(r => {
        const knockout = r.data.filter(m => m.stage !== 'Fase de Grupos');
        setMatches(knockout);
        // Auto-select the most advanced stage with known teams
        const stagesWithTeams = STAGE_ORDER.filter(s =>
          knockout.filter(m => m.stage === s).some(m => m.homeTeam !== 'TBD' || m.isFinished)
        );
        if (stagesWithTeams.length > 0) setActiveStage(stagesWithTeams[stagesWithTeams.length - 1]);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="bracket-loading">Cargando bracket...</div>;

  const stageMatches = matches.filter(m => m.stage === activeStage);
  const thirdPlace = matches.find(m => m.stage === 'Tercer Puesto');

  const isArgMatch = (m) =>
    m.homeTeam === 'Argentina' || m.awayTeam === 'Argentina' || m.homeSlot?.includes('J') || m.awaySlot?.includes('J');

  return (
    <div className="bracket-wrap">
      <div className="bracket-stages">
        {STAGE_ORDER.map(s => {
          const stageData = matches.filter(m => m.stage === s);
          const hasProgress = stageData.some(m => m.homeTeam !== 'TBD' || m.isFinished);
          return (
            <button
              key={s}
              className={`stage-btn ${activeStage === s ? 'active' : ''} ${!hasProgress ? 'locked' : ''}`}
              onClick={() => setActiveStage(s)}
            >
              {STAGE_LABELS[s]}
              {stageData.some(m => m.isFinished) && <span className="stage-done">✓</span>}
            </button>
          );
        })}
      </div>

      <div className="bracket-content">
        <div className="bracket-phase-label">{activeStage}</div>

        {activeStage === 'Final' && thirdPlace && (
          <div className="third-place-box">
            <div className="third-place-label">🥉 Tercer Puesto · {formatDate(thirdPlace.matchDate)}</div>
            <MatchBox match={thirdPlace} isArgentina={isArgMatch(thirdPlace)} />
          </div>
        )}

        <div className={`bracket-grid ${activeStage === 'Ronda de 32' ? 'grid-r32' : activeStage === 'Octavos de Final' ? 'grid-r16' : activeStage === 'Cuartos de Final' ? 'grid-qf' : 'grid-small'}`}>
          {stageMatches.map(m => (
            <MatchBox key={m._id} match={m} isArgentina={isArgMatch(m)} />
          ))}
        </div>
      </div>

      <div className="bracket-legend">
        <div className="legend-item"><span className="leg-box arg"></span> Partido de Argentina</div>
        <div className="legend-item"><span className="leg-box win"></span> Ganador</div>
        <div className="legend-item"><span className="leg-box tbd-leg"></span> Por definir</div>
      </div>
    </div>
  );
}
