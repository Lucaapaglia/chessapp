import React, { useEffect, useMemo, useState } from "react";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";

import "./App.css";
import AnalysisPanel from "./components/AnalysisPanel";
import GameControls from "./components/GameControls";
import MoveHistory from "./components/MoveHistory";
import { useStockfish } from "./hooks/useStockfish";

const STARTING_FEN = new Chess().fen();

function buildGame(baseFen, moves) {
  const nextGame = new Chess(baseFen);

  moves.forEach((move) => {
    nextGame.move(move);
  });

  return nextGame;
}

function uciToMove(uciMove) {
  if (!uciMove || uciMove.length < 4) {
    return null;
  }

  return {
    from: uciMove.slice(0, 2),
    to: uciMove.slice(2, 4),
    promotion: uciMove[4] || undefined,
  };
}

function formatUciMoveAsSan(fen, uciMove) {
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

function formatPrincipalVariation(fen, pv) {
  if (!pv || pv.length === 0) {
    return [];
  }

  try {
    const game = new Chess(fen);
    const line = [];

    for (const uciMove of pv.slice(0, 10)) {
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
    return pv.slice(0, 10);
  }
}

function getGameStatus(game) {
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

function initialBoardWidth() {
  if (typeof window === "undefined") {
    return 520;
  }

  return Math.max(280, Math.min(560, window.innerWidth - 40));
}

function App() {
  const [baseFen, setBaseFen] = useState(STARTING_FEN);
  const [moves, setMoves] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const [orientation, setOrientation] = useState("white");
  const [boardWidth, setBoardWidth] = useState(initialBoardWidth);

  const game = useMemo(
    () => buildGame(baseFen, moves),
    [baseFen, moves]
  );

  const fen = game.fen();
  const history = game.history();

  const { analysis, status, analyze } = useStockfish({
    depth: 16,
  });

  useEffect(() => {
    analyze(fen);
  }, [analyze, fen]);

  useEffect(() => {
    const handleResize = () => {
      setBoardWidth(initialBoardWidth());
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const bestMoveSan = useMemo(
    () => formatUciMoveAsSan(fen, analysis.bestMove),
    [analysis.bestMove, fen]
  );

  const principalVariation = useMemo(
    () => formatPrincipalVariation(fen, analysis.pv),
    [analysis.pv, fen]
  );

  const onDrop = (sourceSquare, targetSquare) => {
    try {
      const validationGame = new Chess(fen);
      const move = validationGame.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: "q",
      });

      if (!move) {
        return false;
      }

      setMoves((currentMoves) => [
        ...currentMoves,
        {
          from: sourceSquare,
          to: targetSquare,
          promotion: move.promotion || undefined,
        },
      ]);
      setRedoStack([]);

      return true;
    } catch {
      return false;
    }
  };

  const handleNewGame = () => {
    setBaseFen(STARTING_FEN);
    setMoves([]);
    setRedoStack([]);
  };

  const handleUndo = () => {
    if (moves.length === 0) {
      return;
    }

    const lastMove = moves[moves.length - 1];

    setMoves((currentMoves) => currentMoves.slice(0, -1));
    setRedoStack((currentRedo) => [lastMove, ...currentRedo]);
  };

  const handleRedo = () => {
    if (redoStack.length === 0) {
      return;
    }

    const [nextMove, ...remainingRedo] = redoStack;

    setMoves((currentMoves) => [...currentMoves, nextMove]);
    setRedoStack(remainingRedo);
  };

  const handleFlip = () => {
    setOrientation((current) =>
      current === "white" ? "black" : "white"
    );
  };

  const gameStatus = getGameStatus(game);

  return (
    <main className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">React · Chess.js · Stockfish WASM</p>
          <h1>Stockfish Analysis Board</h1>
          <p className="app-description">
            Play legal moves on the board and analyze each position locally
            with Stockfish running in a Web Worker.
          </p>
        </div>

        <div className="turn-indicator">
          <span className={`turn-dot turn-dot--${game.turn()}`} />
          {gameStatus}
        </div>
      </header>

      <div className="workspace">
        <section className="board-column" aria-label="Chess board">
          <div className="board-frame">
            <Chessboard
              id="analysis-board"
              position={fen}
              onPieceDrop={onDrop}
              boardOrientation={orientation}
              boardWidth={boardWidth}
              arePiecesDraggable={!game.isGameOver()}
              animationDuration={180}
              customBoardStyle={{
                borderRadius: "12px",
                boxShadow: "0 24px 60px rgba(0, 0, 0, 0.28)",
              }}
              customDarkSquareStyle={{ backgroundColor: "#4b7399" }}
              customLightSquareStyle={{ backgroundColor: "#e8edf3" }}
            />
          </div>

          <GameControls
            onNewGame={handleNewGame}
            onUndo={handleUndo}
            onRedo={handleRedo}
            onFlip={handleFlip}
            canUndo={moves.length > 0}
            canRedo={redoStack.length > 0}
          />
        </section>

        <aside className="side-column">
          <AnalysisPanel
            analysis={analysis}
            status={status}
            bestMoveSan={bestMoveSan}
            principalVariation={principalVariation}
          />
          <MoveHistory history={history} />
        </aside>
      </div>

      <footer className="app-footer">
        Analysis runs entirely in your browser. No chess position is sent to a
        server.
      </footer>
    </main>
  );
}

export default App;
