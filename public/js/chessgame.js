const socket = io();
const chess = new Chess(); // Library for chess rules
const boardElement = document.querySelector(".chessboard");

let draggedPiece = null;
let sourceSquare = null;
let playerRole = null;

// Function to render the chessboard
const renderBoard = () => {
  const board = chess.board(); // Get the current board state

  // Clear the existing board
  boardElement.innerHTML = "";

  // Iterate through each row and square
  board.forEach((row, rowIndex) => {
    row.forEach((square, colIndex) => {
      // Create a square element
      const squareElement = document.createElement("div");
      squareElement.classList.add(
        "square",
        (rowIndex + colIndex) % 2 === 0 ? "light" : "dark"
      );

      // Set data attributes for row and column
      squareElement.dataset.row = rowIndex;
      squareElement.dataset.col = colIndex;

      // Add a piece element if there's a piece on the square
      if (square) {
        const pieceElement = document.createElement("div");
        pieceElement.classList.add(
          "piece",
          square.color === "w" ? "white" : "black"
        );
        pieceElement.innerText = getPieceUnicode(square);

        // Make the piece draggable only if it's the player's turn
        pieceElement.draggable = playerRole === square.color;

        // Handle drag and drop events
        pieceElement.addEventListener("dragstart", (e) => {
          if (pieceElement.draggable) {
            draggedPiece = pieceElement;
            sourceSquare = { row: rowIndex, col: colIndex };
            e.dataTransfer.setData("text/plain", "");
          }
        });

        pieceElement.addEventListener("dragend", (e) => {
          draggedPiece = null;
          sourceSquare = null;
        });

        squareElement.appendChild(pieceElement);
      }

      // Handle dragover event to allow dropping
      squareElement.addEventListener("dragover", (e) => {
        e.preventDefault();
        if (draggedPiece) {
          const targetSquare = {
            row: parseInt(squareElement.dataset.row),
            col: parseInt(squareElement.dataset.col),
          };
          handleMove(sourceSquare, targetSquare);
        }
      });

      // Add the square element to the board
      boardElement.appendChild(squareElement);
    });
  });

  // Flip the board if the player is black
  if (playerRole === "b") {
    boardElement.classList.add("flipped");
  } else {
    boardElement.classList.remove("flipped");
  }
};

// Function to handle a move
const handleMove = (source, target) => {
  const move = {
    from: `${String.fromCharCode(97 + source.col)}${8 - source.row}`,
    to: `${String.fromCharCode(97 + target.col)}${8 - target.row}`,
    promotion: "q",
  };

  socket.emit("move", move); // Send the move to the server
};

// Function to get the Unicode representation of a chess piece
const getPieceUnicode = (piece) => {
  const unicodePieces = {
    p: "\u265F", // Black Pawn
    r: "\u265C", // Black Rook
    n: "\u265E", // Black Knight
    b: "\u265D", // Black Bishop
    q: "\u265B", // Black Queen
    k: "\u265A", // Black King
    P: "\u2659", // White Pawn
    R: "\u2656", // White Rook
    N: "\u2658", // White Knight
    B: "\u2657", // White Bishop
    Q: "\u2655", // White Queen
    K: "\u2654", // White King
  };

  const key =
    piece.color === "w" ? piece.type.toUpperCase() : piece.type.toLowerCase();
  return unicodePieces[key] || "";
};

// Socket.IO event listeners
socket.on("playerRole", (role) => {
  playerRole = role;
  renderBoard();
});

socket.on("spectatorRole", () => {
  playerRole = null;
  renderBoard();
});

socket.on("boardState", (fen) => {
  chess.load(fen);
  renderBoard();
});

socket.on("move", (move) => {
  chess.move(move);
  renderBoard();
});

// Initial render of the board
renderBoard();