import React from "react";

function formatEvaluation(evaluation, mate) {
  if (Number.isFinite(mate)) {
    const prefix = mate > 0 ? "+" : "-";
    return `${prefix}M${Math.abs(mate)}`;
  }

  if (Number.isFinite(evaluation)) {
    const pawns = evaluation / 100;
    return `${pawns >= 0 ? "+" : ""}${pawns.toFixed(2)}`;
  }

  return "—";
}

function statusLabel(status) {
  if (status === "loading") return "Loading engine";
  if (status === "analyzing") return "Analyzing";
  if (status === "error") return "Engine error";
  return "Engine ready";
}

export default function AnalysisPanel({
  analysis,
  status,
  bestMoveSan,
  principalVariation,
}) {
  const evaluation = formatEvaluation(
    analysis.evaluation,
    analysis.mate
  );

  return (
    <section className="panel analysis-panel" aria-label="Stockfish analysis">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Stockfish 16.1</p>
          <h2>Position analysis</h2>
        </div>
        <span className={`engine-status engine-status--${status}`}>
          {statusLabel(status)}
        </span>
      </div>

      <div className="analysis-grid">
        <div className="metric">
          <span className="metric-label">Evaluation</span>
          <strong>{evaluation}</strong>
        </div>

        <div className="metric">
          <span className="metric-label">Depth</span>
          <strong>{analysis.depth ?? "—"}</strong>
        </div>
      </div>

      <div className="analysis-row">
        <span>Best move</span>
        <strong>{bestMoveSan || analysis.bestMove || "—"}</strong>
      </div>

      <div className="analysis-line">
        <span>Principal variation</span>
        <p>
          {principalVariation.length > 0
            ? principalVariation.join(" ")
            : "Waiting for engine line…"}
        </p>
      </div>
    </section>
  );
}
