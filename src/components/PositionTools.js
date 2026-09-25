import React, { useEffect, useState } from "react";

export default function PositionTools({
  fen,
  pgn,
  onLoadFen,
}) {
  const [fenInput, setFenInput] = useState(fen);
  const [message, setMessage] = useState("");

  useEffect(() => {
    setFenInput(fen);
  }, [fen]);

  const copyText = async (text, successMessage) => {
    try {
      await navigator.clipboard.writeText(text);
      setMessage(successMessage);
    } catch {
      setMessage("Clipboard access was blocked by the browser.");
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const result = onLoadFen(fenInput.trim());

    if (result.ok) {
      setMessage("Position loaded.");
      return;
    }

    setMessage(result.error || "Invalid FEN.");
  };

  return (
    <section className="panel tools-panel" aria-label="Position tools">
      <div className="panel-heading panel-heading--compact">
        <div>
          <p className="eyebrow">Position tools</p>
          <h2>FEN & PGN</h2>
        </div>
      </div>

      <form className="fen-form" onSubmit={handleSubmit}>
        <label htmlFor="fen-input">FEN</label>
        <textarea
          id="fen-input"
          value={fenInput}
          onChange={(event) => setFenInput(event.target.value)}
          spellCheck="false"
          rows="3"
        />

        <div className="tool-actions">
          <button type="submit">Load FEN</button>
          <button
            type="button"
            onClick={() => copyText(fen, "FEN copied.")}
          >
            Copy FEN
          </button>
          <button
            type="button"
            onClick={() =>
              copyText(pgn || "(no moves yet)", "PGN copied.")
            }
          >
            Copy PGN
          </button>
        </div>
      </form>

      <p className="tool-message" aria-live="polite">
        {message || "Load a custom position or copy the current game state."}
      </p>
    </section>
  );
}
