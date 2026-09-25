import React from "react";

const PIECES = [
  { type: "q", label: "Queen", symbol: { w: "♕", b: "♛" } },
  { type: "r", label: "Rook", symbol: { w: "♖", b: "♜" } },
  { type: "b", label: "Bishop", symbol: { w: "♗", b: "♝" } },
  { type: "n", label: "Knight", symbol: { w: "♘", b: "♞" } },
];

export default function PromotionDialog({
  pendingPromotion,
  onChoose,
  onCancel,
}) {
  if (!pendingPromotion) {
    return null;
  }

  const color = pendingPromotion.color || "w";

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onMouseDown={onCancel}
    >
      <section
        className="promotion-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="promotion-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <p className="eyebrow">Pawn promotion</p>
        <h2 id="promotion-title">Choose a piece</h2>
        <p className="promotion-copy">
          Promote the pawn on {pendingPromotion.to.toUpperCase()}.
        </p>

        <div className="promotion-options">
          {PIECES.map((piece) => (
            <button
              type="button"
              key={piece.type}
              onClick={() => onChoose(piece.type)}
              aria-label={`Promote to ${piece.label}`}
            >
              <span aria-hidden="true">{piece.symbol[color]}</span>
              <small>{piece.label}</small>
            </button>
          ))}
        </div>

        <button
          type="button"
          className="promotion-cancel"
          onClick={onCancel}
        >
          Cancel
        </button>
      </section>
    </div>
  );
}
