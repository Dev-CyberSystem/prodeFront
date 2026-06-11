import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import './Standings.css';

const GROUPS = ['A','B','C','D','E','F','G','H','I','J','K','L'];

export default function Standings() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/standings')
      .then(r => setData(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="standings-loading">Cargando posiciones...</div>;
  if (!data) return null;

  return (
    <div className="standings-wrap">
      <div className="standings-grid">
        {GROUPS.map(g => (
          <GroupTable key={g} group={g} teams={data[g] || []} />
        ))}
      </div>
      <p className="standings-note">* Los 2 primeros de cada grupo y los 8 mejores terceros clasifican a la Ronda de 32.</p>
    </div>
  );
}

function GroupTable({ group, teams }) {
  return (
    <div className="group-card">
      <div className="group-header">
        <span className="group-letter">Grupo {group}</span>
      </div>
      <table className="group-table">
        <thead>
          <tr>
            <th className="col-pos">#</th>
            <th className="col-team">Equipo</th>
            <th>PJ</th>
            <th>G</th>
            <th>E</th>
            <th>P</th>
            <th>GF</th>
            <th>GC</th>
            <th>DG</th>
            <th className="col-pts">Pts</th>
          </tr>
        </thead>
        <tbody>
          {teams.map((t, i) => (
            <tr key={t.team} className={getRowClass(i)}>
              <td className="col-pos">{i + 1}</td>
              <td className="col-team">
                <span className="team-flag-sm">{t.flag}</span>
                <span className="team-name-sm">{t.team}</span>
              </td>
              <td>{t.P}</td>
              <td>{t.W}</td>
              <td>{t.D}</td>
              <td>{t.L}</td>
              <td>{t.GF}</td>
              <td>{t.GA}</td>
              <td className={t.GD > 0 ? 'pos-gd' : t.GD < 0 ? 'neg-gd' : ''}>
                {t.GD > 0 ? '+' : ''}{t.GD}
              </td>
              <td className="col-pts"><strong>{t.pts}</strong></td>
            </tr>
          ))}
          {teams.length === 0 && (
            <tr><td colSpan="10" className="empty-group">Sin datos aún</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function getRowClass(i) {
  if (i === 0) return 'qualify-1';
  if (i === 1) return 'qualify-2';
  if (i === 2) return 'maybe-qualify';
  return '';
}
