import React, { useEffect, useMemo, useState } from "react";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";

import "./App.css";
import AnalysisPanel from "./components/AnalysisPanel";
import EvaluationBar from "./components/EvaluationBar";
import GameControls from "./components/GameControls";
import MoveHistory from "./components/MoveHistory";
import PositionTools from "./components/PositionTools";
import PromotionDialog from "./components/PromotionDialog";
import { useStockfish } from "./hooks/useStockfish";
import {
  buildGame,
  createTimeline,
  formatPrincipalVariation,
  formatUciMoveAsSan,
  getGameStatus,
  requiresPromotion,
  splitTimeline,
  uciToMove,
} from "./utils/chess";

const STARTING_FEN = new Chess().fen();

function initialBoardWidth() {
  if (typeof window === "undefined") {
    return 520;
  }

  return Math.max(220, Math.min(560, window.innerWidth - 90));
}

function App() {
  const [baseFen, setBaseFen] = useState(STARTING_FEN);
  const [moves, setMoves] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const [orientation, setOrientation] = useState("white");
  const [boardWidth, setBoardWidth] = useState(initialBoardWidth);
  const [pendingPromotion, setPendingPromotion] = useState(null);

  const timeline = useMemo(
    () => createTimeline(moves, redoStack),
    [moves, redoStack]
  );

  const game = useMemo(
    () => buildGame(baseFen, moves),
    [baseFen, moves]
  );

  const fullGame = useMemo(
    () => buildGame(baseFen, timeline),
    [baseFen, timeline]
  );

  const fen = game.fen();
  const history = fullGame.history();
  const currentPly = moves.length;
  const pgn = game.pgn();

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

  useEffect(() => {
    const handleKeyDown = (event) => {
      const target = event.target;
      const tagName = target?.tagName?.toLowerCase();

      if (
        tagName === "input" ||
        tagName === "textarea" ||
        tagName === "select" ||
        target?.isContentEditable
      ) {
        return;
      }

      if (event.key === "ArrowLeft" && moves.length > 0) {
        event.preventDefault();
        const lastMove = moves[moves.length - 1];
        setMoves((current) => current.slice(0, -1));
        setRedoStack((current) => [lastMove, ...current]);
        setPendingPromotion(null);
      }

      if (event.key === "ArrowRight" && redoStack.length > 0) {
        event.preventDefault();
        const [nextMove, ...remaining] = redoStack;
        setMoves((current) => [...current, nextMove]);
        setRedoStack(remaining);
        setPendingPromotion(null);
      }

      if (event.key === "Home" && timeline.length > 0) {
        event.preventDefault();
        const split = splitTimeline(timeline, 0);
        setMoves(split.moves);
        setRedoStack(split.redoStack);
        setPendingPromotion(null);
      }

      if (event.key === "End" && redoStack.length > 0) {
        event.preventDefault();
        const split = splitTimeline(timeline, timeline.length);
        setMoves(split.moves);
        setRedoStack(split.redoStack);
        setPendingPromotion(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [moves, redoStack, timeline]);

  const bestMoveSan = useMemo(
    () => formatUciMoveAsSan(fen, analysis.bestMove),
    [analysis.bestMove, fen]
  );

  const principalVariation = useMemo(
    () => formatPrincipalVariation(fen, analysis.pv),
    [analysis.pv, fen]
  );

  const bestMoveArrow = useMemo(() => {
    const move = uciToMove(analysis.bestMove);

    if (!move) {
      return [];
    }

    return [[move.from, move.to, "rgba(96, 165, 250, 0.9)"]];
  }, [analysis.bestMove]);

  const lastMoveStyles = useMemo(() => {
    const lastMove = moves[moves.length - 1];

    if (!lastMove) {
      return {};
    }

    return {
      [lastMove.from]: {
        boxShadow: "inset 0 0 0 9999px rgba(250, 204, 21, 0.18)",
      },
      [lastMove.to]: {
        boxShadow: "inset 0 0 0 9999px rgba(250, 204, 21, 0.24)",
      },
    };
  }, [moves]);

  const commitMove = (move) => {
    setMoves((currentMoves) => [...currentMoves, move]);
    setRedoStack([]);
  };

  const onDrop = (sourceSquare, targetSquare) => {
    try {
      const validationGame = new Chess(fen);

      if (requiresPromotion(validationGame, sourceSquare, targetSquare)) {
        const piece = validationGame.get(sourceSquare);

        setPendingPromotion({
          from: sourceSquare,
          to: targetSquare,
          color: piece.color,
        });

        return false;
      }

      const move = validationGame.move({
        from: sourceSquare,
        to: targetSquare,
      });

      if (!move) {
        return false;
      }

      commitMove({
        from: sourceSquare,
        to: targetSquare,
      });

      return true;
    } catch {
      return false;
    }
  };

  const handlePromotion = (promotion) => {
    if (!pendingPromotion) {
      return;
    }

    try {
      const validationGame = new Chess(fen);
      const move = validationGame.move({
        from: pendingPromotion.from,
        to: pendingPromotion.to,
        promotion,
      });

      if (move) {
        commitMove({
          from: pendingPromotion.from,
          to: pendingPromotion.to,
          promotion,
        });
      }
    } finally {
      setPendingPromotion(null);
    }
  };

  const handleNewGame = () => {
    setBaseFen(STARTING_FEN);
    setMoves([]);
    setRedoStack([]);
    setPendingPromotion(null);
  };

  const handleUndo = () => {
    if (moves.length === 0) {
      return;
    }

    const lastMove = moves[moves.length - 1];

    setMoves((currentMoves) => currentMoves.slice(0, -1));
    setRedoStack((currentRedo) => [lastMove, ...currentRedo]);
    setPendingPromotion(null);
  };

  const handleRedo = () => {
    if (redoStack.length === 0) {
      return;
    }

    const [nextMove, ...remainingRedo] = redoStack;

    setMoves((currentMoves) => [...currentMoves, nextMove]);
    setRedoStack(remainingRedo);
    setPendingPromotion(null);
  };

  const handleNavigate = (ply) => {
    const split = splitTimeline(timeline, ply);

    setMoves(split.moves);
    setRedoStack(split.redoStack);
    setPendingPromotion(null);
  };

  const handleFlip = () => {
    setOrientation((current) =>
      current === "white" ? "black" : "white"
    );
  };

  const handleLoadFen = (nextFen) => {
    try {
      const loadedGame = new Chess(nextFen);

      setBaseFen(loadedGame.fen());
      setMoves([]);
      setRedoStack([]);
      setPendingPromotion(null);

      return { ok: true };
    } catch {
      return {
        ok: false,
        error: "That FEN could not be loaded. Check all six FEN fields.",
      };
    }
  };

  const gameStatus = getGameStatus(game);

  return (
    <main className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">React · Chess.js · Stockfish WASM</p>
          <h1>Stockfish Analysis Board</h1>
          <p className="app-description">
            Play legal moves, inspect earlier positions, and analyze each
            position locally with Stockfish running in a Web Worker.
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
            <div className="board-stage">
              <EvaluationBar
                evaluation={analysis.evaluation}
                mate={analysis.mate}
                orientation={orientation}
              />

              <Chessboard
                id="analysis-board"
                position={fen}
                onPieceDrop={onDrop}
                boardOrientation={orientation}
                boardWidth={boardWidth}
                arePiecesDraggable={!game.isGameOver()}
                animationDuration={180}
                customArrows={bestMoveArrow}
                customSquareStyles={lastMoveStyles}
                customBoardStyle={{
                  borderRadius: "12px",
                  boxShadow: "0 24px 60px rgba(0, 0, 0, 0.28)",
                }}
                customDarkSquareStyle={{ backgroundColor: "#4b7399" }}
                customLightSquareStyle={{ backgroundColor: "#e8edf3" }}
              />
            </div>
          </div>

          <GameControls
            onNewGame={handleNewGame}
            onUndo={handleUndo}
            onRedo={handleRedo}
            onFlip={handleFlip}
            canUndo={moves.length > 0}
            canRedo={redoStack.length > 0}
          />

          <PositionTools
            fen={fen}
            pgn={pgn}
            onLoadFen={handleLoadFen}
          />
        </section>

        <aside className="side-column">
          <AnalysisPanel
            analysis={analysis}
            status={status}
            bestMoveSan={bestMoveSan}
            principalVariation={principalVariation}
          />
          <MoveHistory
            history={history}
            currentPly={currentPly}
            onNavigate={handleNavigate}
          />
        </aside>
      </div>

      <footer className="app-footer">
        <span>
          Analysis runs entirely in your browser. No chess position is sent to
          a server.
        </span>
        <span className="keyboard-hint">
          Keyboard: ← previous · → next · Home start · End latest
        </span>
      </footer>

      <PromotionDialog
        pendingPromotion={pendingPromotion}
        onChoose={handlePromotion}
        onCancel={() => setPendingPromotion(null)}
      />
    </main>
  );
}

export default App;
