import React from "react";

export default function GameControls({
  onNewGame,
  onUndo,
  onRedo,
  onFlip,
  canUndo,
  canRedo,
}) {
  return (
    <section className="panel controls-panel" aria-label="Game controls">
      <div className="panel-heading panel-heading--compact">
        <div>
          <p className="eyebrow">Board controls</p>
          <h2>Game</h2>
        </div>
      </div>

      <div className="controls-grid">
        <button type="button" onClick={onNewGame}>
          New game
        </button>
        <button type="button" onClick={onUndo} disabled={!canUndo}>
          Undo
        </button>
        <button type="button" onClick={onRedo} disabled={!canRedo}>
          Redo
        </button>
        <button type="button" onClick={onFlip}>
          Flip board
        </button>
      </div>
    </section>
  );
}
