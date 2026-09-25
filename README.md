# Stockfish Analysis Board

A browser-based chess analysis application built with React, Chess.js, react-chessboard, and Stockfish 16.1 running locally through a Web Worker and WebAssembly.

## Current functionality

- legal chess moves validated by Chess.js
- Stockfish analysis after each position change
- non-blocking engine execution in a Web Worker
- evaluation normalized from White's perspective
- visual evaluation bar
- engine depth, best move, principal variation, and best-move arrow
- SAN move history
- New Game, Undo, Redo, and Flip Board controls
- promotion selector for queen, rook, bishop, or knight
- load and copy FEN
- copy PGN
- check, checkmate, stalemate, and draw status
- responsive analysis-board layout

The Stockfish engine runs entirely in the browser. Positions are not sent to a backend.

## Architecture

```text
React UI
  ├─ Chess.js
  │    └─ game rules, FEN, SAN, game status
  │
  └─ useStockfish hook
       └─ Web Worker
            └─ Stockfish 16.1 WASM
```

The UI sends the current FEN to the engine hook. The hook coordinates UCI `stop` / `isready` / `go` commands so stale engine output does not overwrite a newer position.

## Run locally

```bash
npm install
npm start
```

Production build:

```bash
npm run build
```

Tests:

```bash
npm test -- --watchAll=false
```

## Roadmap

Phase 1 established reliable engine communication and core game controls.

Phase 2 adds analysis and position tooling:
- evaluation bar
- best-move arrow
- promotion picker
- FEN loading / copying
- PGN copying

Planned next:
- clickable move navigation
- keyboard navigation through game history
- stronger test coverage
- deployment
- final screenshots and portfolio documentation
