import React from "react";

function MoveButton({ san, ply, currentPly, onNavigate }) {
  if (!san) {
    return <span className="move-placeholder" />;
  }

  const isCurrent = ply === currentPly;

  return (
    <button
      type="button"
      className={`move-button${isCurrent ? " move-button--current" : ""}`}
      onClick={() => onNavigate(ply)}
      aria-current={isCurrent ? "step" : undefined}
      title={`Jump to position after ${san}`}
    >
      {san}
    </button>
  );
}

export default function MoveHistory({
  history,
  currentPly,
  onNavigate,
}) {
  const rows = [];

  for (let index = 0; index < history.length; index += 2) {
    rows.push({
      number: index / 2 + 1,
      white: history[index] || "",
      black: history[index + 1] || "",
      whitePly: index + 1,
      blackPly: index + 2,
    });
  }

  return (
    <section className="panel history-panel" aria-label="Move history">
      <div className="panel-heading panel-heading--compact">
        <div>
          <p className="eyebrow">Notation</p>
          <h2>Move history</h2>
        </div>
        <span className="move-count">
          {currentPly} / {history.length} ply
        </span>
      </div>

      <div className="history-navigation" aria-label="Move navigation">
        <button
          type="button"
          onClick={() => onNavigate(0)}
          disabled={currentPly === 0}
          aria-label="Go to start position"
        >
          |←
        </button>
        <button
          type="button"
          onClick={() => onNavigate(currentPly - 1)}
          disabled={currentPly === 0}
          aria-label="Previous move"
        >
          ←
        </button>
        <button
          type="button"
          onClick={() => onNavigate(currentPly + 1)}
          disabled={currentPly === history.length}
          aria-label="Next move"
        >
          →
        </button>
        <button
          type="button"
          onClick={() => onNavigate(history.length)}
          disabled={currentPly === history.length}
          aria-label="Go to latest position"
        >
          →|
        </button>
      </div>

      {rows.length === 0 ? (
        <p className="empty-state">Make a move to start the game.</p>
      ) : (
        <div className="move-list">
          {rows.map((row) => (
            <div className="move-row" key={row.number}>
              <span className="move-number">{row.number}.</span>
              <MoveButton
                san={row.white}
                ply={row.whitePly}
                currentPly={currentPly}
                onNavigate={onNavigate}
              />
              <MoveButton
                san={row.black}
                ply={row.blackPly}
                currentPly={currentPly}
                onNavigate={onNavigate}
              />
            </div>
          ))}
        </div>
      )}

      <p className="history-help">
        Click a move or use ← / → to analyze earlier positions.
      </p>
    </section>
  );
}
