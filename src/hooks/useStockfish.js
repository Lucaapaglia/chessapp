import { useCallback, useEffect, useRef, useState } from "react";

const EMPTY_ANALYSIS = {
  depth: null,
  evaluation: null,
  mate: null,
  bestMove: "",
  pv: [],
};

function normalizeScore(value, sideToMove) {
  return sideToMove === "b" ? -value : value;
}

function parseInfoLine(message, sideToMove) {
  const tokens = message.trim().split(/\s+/);

  if (tokens[0] !== "info") {
    return null;
  }

  const result = {};

  const depthIndex = tokens.indexOf("depth");
  if (depthIndex >= 0) {
    const depth = Number.parseInt(tokens[depthIndex + 1], 10);
    if (Number.isFinite(depth)) {
      result.depth = depth;
    }
  }

  const scoreIndex = tokens.indexOf("score");
  if (scoreIndex >= 0) {
    const scoreType = tokens[scoreIndex + 1];
    const rawValue = Number.parseInt(tokens[scoreIndex + 2], 10);

    if (Number.isFinite(rawValue)) {
      if (scoreType === "cp") {
        result.evaluation = normalizeScore(rawValue, sideToMove);
        result.mate = null;
      }

      if (scoreType === "mate") {
        result.mate = normalizeScore(rawValue, sideToMove);
        result.evaluation = null;
      }
    }
  }

  const pvIndex = tokens.indexOf("pv");
  if (pvIndex >= 0) {
    result.pv = tokens.slice(pvIndex + 1);
  }

  return result;
}

export function useStockfish({ depth = 16 } = {}) {
  const workerRef = useRef(null);
  const pendingFenRef = useRef(null);
  const activeFenRef = useRef(null);
  const waitingForReadyRef = useRef(false);
  const searchActiveRef = useRef(false);
  const engineReadyRef = useRef(false);

  const [status, setStatus] = useState("loading");
  const [analysis, setAnalysis] = useState(EMPTY_ANALYSIS);

  const startPendingSearch = useCallback(() => {
    const worker = workerRef.current;
    const fen = pendingFenRef.current;

    if (!worker || !fen || !engineReadyRef.current) {
      return;
    }

    pendingFenRef.current = null;
    activeFenRef.current = fen;
    searchActiveRef.current = true;

    worker.postMessage(`position fen ${fen}`);
    worker.postMessage(`go depth ${depth}`);
    setStatus("analyzing");
  }, [depth]);

  useEffect(() => {
    const worker = new Worker(
      `${process.env.PUBLIC_URL}/js/stockfish-16.1-lite-single.js`
    );

    workerRef.current = worker;

    worker.onmessage = (event) => {
      const message = String(event.data || "").trim();

      if (!message) {
        return;
      }

      if (message === "uciok") {
        worker.postMessage("isready");
        return;
      }

      if (message === "readyok") {
        engineReadyRef.current = true;
        waitingForReadyRef.current = false;
        setStatus("ready");
        startPendingSearch();
        return;
      }

      if (message.startsWith("info ") && searchActiveRef.current) {
        const fen = activeFenRef.current;

        if (!fen) {
          return;
        }

        const sideToMove = fen.split(" ")[1] || "w";
        const parsed = parseInfoLine(message, sideToMove);

        if (parsed) {
          setAnalysis((current) => ({
            ...current,
            ...parsed,
          }));
        }

        return;
      }

      if (message.startsWith("bestmove") && searchActiveRef.current) {
        const bestMove = message.split(/\s+/)[1] || "";

        searchActiveRef.current = false;
        setAnalysis((current) => ({
          ...current,
          bestMove: bestMove === "(none)" ? "" : bestMove,
        }));
        setStatus("ready");
      }
    };

    worker.onerror = () => {
      searchActiveRef.current = false;
      setStatus("error");
    };

    worker.postMessage("uci");

    return () => {
      worker.postMessage("stop");
      worker.terminate();
      workerRef.current = null;
      pendingFenRef.current = null;
      activeFenRef.current = null;
      waitingForReadyRef.current = false;
      searchActiveRef.current = false;
      engineReadyRef.current = false;
    };
  }, [startPendingSearch]);

  const analyze = useCallback(
    (fen) => {
      const worker = workerRef.current;

      if (!worker || !fen) {
        return;
      }

      pendingFenRef.current = fen;
      searchActiveRef.current = false;
      activeFenRef.current = null;

      setAnalysis(EMPTY_ANALYSIS);

      if (!engineReadyRef.current) {
        setStatus("loading");
        return;
      }

      if (waitingForReadyRef.current) {
        return;
      }

      waitingForReadyRef.current = true;
      setStatus("analyzing");
      worker.postMessage("stop");
      worker.postMessage("isready");
    },
    []
  );

  const stop = useCallback(() => {
    const worker = workerRef.current;

    pendingFenRef.current = null;
    activeFenRef.current = null;
    searchActiveRef.current = false;

    if (worker) {
      worker.postMessage("stop");
    }

    setStatus(engineReadyRef.current ? "ready" : "loading");
  }, []);

  return {
    analysis,
    status,
    analyze,
    stop,
  };
}
