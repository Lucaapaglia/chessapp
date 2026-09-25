import { Chess } from "chess.js";
import {
  buildGame,
  createTimeline,
  formatPrincipalVariation,
  formatUciMoveAsSan,
  getGameStatus,
  requiresPromotion,
  splitTimeline,
  uciToMove,
} from "./chess";

const STARTING_FEN = new Chess().fen();

describe("chess utilities", () => {
  test("rebuilds a game from stored moves", () => {
    const game = buildGame(STARTING_FEN, [
      { from: "e2", to: "e4" },
      { from: "e7", to: "e5" },
      { from: "g1", to: "f3" },
    ]);

    expect(game.history()).toEqual(["e4", "e5", "Nf3"]);
    expect(game.turn()).toBe("b");
  });

  test("converts UCI moves to move objects and SAN", () => {
    expect(uciToMove("e2e4")).toEqual({
      from: "e2",
      to: "e4",
      promotion: undefined,
    });

    expect(formatUciMoveAsSan(STARTING_FEN, "e2e4")).toBe("e4");
  });

  test("formats a principal variation as SAN", () => {
    expect(
      formatPrincipalVariation(STARTING_FEN, ["e2e4", "e7e5", "g1f3"])
    ).toEqual(["e4", "e5", "Nf3"]);
  });

  test("detects promotion moves", () => {
    const game = new Chess("7k/P7/8/8/8/8/8/7K w - - 0 1");

    expect(requiresPromotion(game, "a7", "a8")).toBe(true);
    expect(requiresPromotion(game, "h1", "h2")).toBe(false);
  });

  test("splits a move timeline for history navigation", () => {
    const timeline = createTimeline(
      [{ from: "e2", to: "e4" }],
      [
        { from: "e7", to: "e5" },
        { from: "g1", to: "f3" },
      ]
    );

    expect(splitTimeline(timeline, 2)).toEqual({
      moves: [
        { from: "e2", to: "e4" },
        { from: "e7", to: "e5" },
      ],
      redoStack: [{ from: "g1", to: "f3" }],
    });
  });

  test("reports checkmate status", () => {
    const game = new Chess();
    game.move("f3");
    game.move("e5");
    game.move("g4");
    game.move("Qh4#");

    expect(getGameStatus(game)).toBe("Black wins by checkmate");
  });
});
