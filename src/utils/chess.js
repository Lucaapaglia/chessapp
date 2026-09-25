import { Chess } from "chess.js";

export function buildGame(baseFen, moves) {
  const game = new Chess(baseFen);

  moves.forEach((move) => {
    game.move(move);
  });

  return game;
}

export function uciToMove(uciMove) {
  if (!uciMove || uciMove.length < 4) {
    return null;
  }

  return {
    from: uciMove.slice(0, 2),
    to: uciMove.slice(2, 4),
    promotion: uciMove[4] || undefined,
  };
}

export function formatUciMoveAsSan(fen, uciMove) {
  const move = uciToMove(uciMove);

  if (!move) {
    return "";
  }

  try {
    const game = new Chess(fen);
    return game.move(move)?.san || uciMove;
  } catch {
    return uciMove;
  }
}

export function formatPrincipalVariation(fen, pv, maxMoves = 10) {
  if (!pv || pv.length === 0) {
    return [];
  }

  try {
    const game = new Chess(fen);
    const line = [];

    for (const uciMove of pv.slice(0, maxMoves)) {
      const move = uciToMove(uciMove);

      if (!move) {
        break;
      }

      const playedMove = game.move(move);

      if (!playedMove) {
        break;
      }

      line.push(playedMove.san);
    }

    return line;
  } catch {
    return pv.slice(0, maxMoves);
  }
}

export function getGameStatus(game) {
  if (game.isCheckmate()) {
    const winner = game.turn() === "w" ? "Black" : "White";
    return `${winner} wins by checkmate`;
  }

  if (game.isStalemate()) {
    return "Draw by stalemate";
  }

  if (game.isInsufficientMaterial()) {
    return "Draw by insufficient material";
  }

  if (game.isThreefoldRepetition()) {
    return "Draw by threefold repetition";
  }

  if (game.isDraw()) {
    return "Draw";
  }

  const sideToMove = game.turn() === "w" ? "White" : "Black";

  if (game.isCheck()) {
    return `${sideToMove} to move — check`;
  }

  return `${sideToMove} to move`;
}

export function requiresPromotion(game, sourceSquare, targetSquare) {
  const piece = game.get(sourceSquare);

  if (!piece || piece.type !== "p") {
    return false;
  }

  const targetRank = targetSquare?.[1];

  return (
    (piece.color === "w" && targetRank === "8") ||
    (piece.color === "b" && targetRank === "1")
  );
}

export function createTimeline(moves, redoStack) {
  return [...moves, ...redoStack];
}

export function splitTimeline(timeline, ply) {
  const safePly = Math.max(0, Math.min(ply, timeline.length));

  return {
    moves: timeline.slice(0, safePly),
    redoStack: timeline.slice(safePly),
  };
}
