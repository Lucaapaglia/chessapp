import React from "react";

function evaluationLabel(evaluation, mate) {
  if (Number.isFinite(mate)) {
    return `${mate > 0 ? "+" : "-"}M${Math.abs(mate)}`;
  }

  if (Number.isFinite(evaluation)) {
    const pawns = evaluation / 100;
    return `${pawns >= 0 ? "+" : ""}${pawns.toFixed(1)}`;
  }

  return "0.0";
}

function whiteShare(evaluation, mate) {
  if (Number.isFinite(mate)) {
    return mate > 0 ? 96 : 4;
  }

  if (!Number.isFinite(evaluation)) {
    return 50;
  }

  const pawns = evaluation / 100;
  const bounded = Math.max(-8, Math.min(8, pawns));

  return 50 + (bounded / 8) * 45;
}

export default function EvaluationBar({
  evaluation,
  mate,
  orientation = "white",
}) {
  const white = whiteShare(evaluation, mate);
  const black = 100 - white;

  const topHeight = orientation === "white" ? black : white;
  const bottomHeight = orientation === "white" ? white : black;
  const topClass =
    orientation === "white" ? "evaluation-bar__black" : "evaluation-bar__white";
  const bottomClass =
    orientation === "white" ? "evaluation-bar__white" : "evaluation-bar__black";

  return (
    <div
      className="evaluation-bar"
      aria-label={`Engine evaluation ${evaluationLabel(evaluation, mate)}`}
      title={`Engine evaluation ${evaluationLabel(evaluation, mate)}`}
    >
      <div
        className={`evaluation-bar__segment ${topClass}`}
        style={{ height: `${topHeight}%` }}
      />
      <div
        className={`evaluation-bar__segment ${bottomClass}`}
        style={{ height: `${bottomHeight}%` }}
      />
      <span className="evaluation-bar__label">
        {evaluationLabel(evaluation, mate)}
      </span>
    </div>
  );
}
