import { render, screen } from "@testing-library/react";
import App from "./App";

jest.mock("react-chessboard", () => ({
  Chessboard: () => <div data-testid="chessboard" />,
}));

class WorkerMock {
  constructor() {
    this.onmessage = null;
    this.onerror = null;
  }

  postMessage() {}

  terminate() {}
}

beforeAll(() => {
  window.Worker = WorkerMock;
});

test("renders the Stockfish analysis workspace", () => {
  render(<App />);

  expect(
    screen.getByRole("heading", { name: /stockfish analysis board/i })
  ).toBeInTheDocument();

  expect(screen.getByTestId("chessboard")).toBeInTheDocument();
  expect(screen.getByText(/position analysis/i)).toBeInTheDocument();
  expect(screen.getByText(/move history/i)).toBeInTheDocument();
});
