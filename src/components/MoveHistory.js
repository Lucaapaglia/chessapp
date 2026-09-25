import React from "react";

export default function MoveHistory({ history }) {
  const rows = [];

  for (let index = 0; index < history.length; index += 2) {
    rows.push({
      number: index / 2 + 1,
      white: history[index] || "",
      black: history[index + 1] || "",
    });
  }

  return (
    <section className="panel history-panel" aria-label="Move history">
      <div className="panel-heading panel-heading--compact">
        <div>
          <p className="eyebrow">Notation</p>
          <h2>Move history</h2>
        </div>
        <span className="move-count">{history.length} ply</span>
      </div>

      {rows.length === 0 ? (
        <p className="empty-state">Make a move to start the game.</p>
      ) : (
        <div className="move-list">
          {rows.map((row) => (
            <div className="move-row" key={row.number}>
              <span className="move-number">{row.number}.</span>
              <span>{row.white}</span>
              <span>{row.black}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
