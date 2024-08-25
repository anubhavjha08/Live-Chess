const express = require("express");
const socket = require("socket.io");
const http = require("http");
const { Chess } = require("chess.js");
const path = require("path");

const app = express();
const server = http.createServer(app);

const io = socket(server);

// Create a new Chess instance to manage the game state
const chess = new Chess();

// Object to store player information (socket IDs)
let players = {};

// Keep track of the current player's turn (either "W" or "B")
let currentPlayer = "W";

// Set the view engine for server-side rendering (optional for a basic setup)
app.set("view engine", "ejs");

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, "public")));

// Route handler for the main page (replace with your actual game interface)
app.get("/", (req, res) => {
  res.render("index", { title: "Custom Chess Game" });
});

io.on("connection", (socket) => {
  console.log("Player connected");

  // Assign player roles based on availability
  if (!players.white) {
    players.white = socket.id;
    socket.emit("playerRole", "w");
  } else if (!players.black) {
    players.black = socket.id;
    socket.emit("playerRole", "b");
  } else {
    // Handle spectators (if implemented)
    socket.emit("spectatorRole");
  }

  // Handle player disconnection
  socket.on("disconnect", () => {
    if (socket.id === players.white) {
      delete players.white;
    } else if (socket.id === players.black) {
      delete players.black;
    }
    console.log("Player disconnected");
  });

  // Handle received move from a player
  socket.on("move", (move) => {
    try {
      // Validate the move based on current turn and player's socket ID
      if ((chess.turn() === "w" && socket.id !== players.white) ||
          (chess.turn() === "b" && socket.id !== players.black)) {
        return;
      }

      // Attempt the move using the chess.js library
      const result = chess.move(move);

      if (result) {
        // Move was valid, update game state and notify clients
        currentPlayer = chess.turn();
        io.emit("move", move); // Broadcast the move to all clients
        io.emit("boardState", chess.fen()); // Update the board representation
      } else {
        // console.log("Invalid move:", move);
        // socket.emit("invalidMove", move); // Send an error message to the player
      }
    } catch (err) {
      // console.error("Error processing move:", err);
      socket.emit("error", "An error occurred while processing your move.");
    }
  });
});

server.listen(3000, () => {
  console.log("Server listening on port 3000");
});