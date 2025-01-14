import React, { useState, useEffect } from "react";
import { Chessboard } from "react-chessboard";
import { Chess } from "chess.js";

// Function to extract best move and evaluation from Stockfish's message
const getEvaluation = (message, turn) => {
  let result = { bestMove: "", evaluation: "" }; // Initialize with default values

  // Check for "bestmove" in the message to get the best move
  if (message.startsWith("bestmove")) {
    result.bestMove = message.split(" ")[1];
  }

  // Check for "info score" message to get the evaluation
  if (message.includes("info") && message.includes("score")) {
    const scoreParts = message.split(" ");
    const scoreIndex = scoreParts.indexOf("score") + 2; // "cp" or "mate" is two words after "score"

    if (scoreParts[scoreIndex - 1] === "cp") {
      // Extract centipawn evaluation and adjust based on turn
      let score = parseInt(scoreParts[scoreIndex], 10);
      if (turn !== "b") {
        score = -score; // Invert score if it was Black's turn
      }
      result.evaluation = `${score / 100}`; // Convert centipawns to pawns

    } else if (scoreParts[scoreIndex - 1] === "mate") {
      // Extract mate score if available
      const mateIn = parseInt(scoreParts[scoreIndex], 10);
      result.evaluation = `Mate in ${Math.abs(mateIn)}`;
    }
  }

  return result;
};

const App = () => {
  const [game, setGame] = useState(new Chess());
  const [stockfish, setStockfish] = useState(null);
  const [bestMove, setBestMove] = useState("");
  const [evaluation, setEvaluation] = useState(""); // State to store Stockfish's evaluation

  useEffect(() => {
    // Load Stockfish as a Web Worker once when the component mounts
    const stockfishWorker = new Worker("/js/stockfish-16.1-lite-single.js");
    setStockfish(stockfishWorker);

    return () => {
      stockfishWorker.terminate(); // Clean up the worker when the component unmounts
    };
  }, []);

  const onDrop = (sourceSquare, targetSquare) => {
    const gameCopy = new Chess(game.fen());

    try {
      const move = gameCopy.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: "q", // Always promote to a queen for simplicity
      });

      if (move === null) {
        return false; // Invalid move
      }

      setGame(gameCopy);

      // Send the updated position to Stockfish to calculate the best move and evaluation
      if (stockfish) {
        stockfish.postMessage(`position fen ${gameCopy.fen()}`);
        stockfish.postMessage("go depth 15"); // Set depth for Stockfish analysis

        // Listen for Stockfish messages and update best move and evaluation
        stockfish.onmessage = (event) => {
          const { bestMove, evaluation } = getEvaluation(event.data, game.turn());
          if (bestMove) setBestMove(bestMove);
          if (evaluation) setEvaluation(evaluation);
        };
      }

      return true; // Valid move
    } catch (error) {
      console.error(error.message);
      return false; // Catch any error and return false
    }
  };

  return (
    <div>
      <h1>Chess Game with Stockfish</h1>
      <Chessboard
        position={game.fen()}
        onPieceDrop={onDrop}
        boardWidth={500} // Set the board width to 500px
      />
      <div>
        <h3>Best Move: {bestMove || "Calculating..."}</h3>
        <h3>Evaluation: {evaluation || "Evaluating..."}</h3>
      </div>
    </div>
  );
};

export default App;