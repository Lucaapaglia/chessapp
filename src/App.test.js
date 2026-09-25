import { Chess } from "chess.js";

test("Chess.js validates and records a legal opening move", () => {
  const game = new Chess();
  const move = game.move({ from: "e2", to: "e4" });

  expect(move.san).toBe("e4");
  expect(game.history()).toEqual(["e4"]);
  expect(game.turn()).toBe("b");
});
