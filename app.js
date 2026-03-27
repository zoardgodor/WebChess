const boardEl = document.getElementById("board");
let squareLayer = document.getElementById("squareLayer");
let pieceLayer = document.getElementById("pieceLayer");
const statusEl = document.getElementById("status");
const evalEl = document.getElementById("eval");
const movesEl = document.getElementById("moves");
const resetBtn = document.getElementById("resetBtn");
const flipToggle = document.getElementById("flipToggle");
const freeToggle = document.getElementById("freeToggle");
const engineToggle = document.getElementById("engineToggle");
const depthInput = document.getElementById("depthInput");
const sideSelect = document.getElementById("sideSelect");
const tipsBtn = document.getElementById("tipsBtn");
const tipsModal = document.getElementById("tipsModal");
const closeTipsBtn = document.getElementById("closeTipsBtn");
const endModal = document.getElementById("endModal");
const endTitle = document.getElementById("endTitle");
const endMessage = document.getElementById("endMessage");
const closeEndBtn = document.getElementById("closeEndBtn");
const promoModal = document.getElementById("promoModal");
const coordTop = document.getElementById("coordTop");
const coordBottom = document.getElementById("coordBottom");
const coordLeft = document.getElementById("coordLeft");
const coordRight = document.getElementById("coordRight");

const PIECE_UNICODE = {
  P: "♙",
  N: "♘",
  B: "♗",
  R: "♖",
  Q: "♕",
  K: "♔",
  p: "♟",
  n: "♞",
  b: "♝",
  r: "♜",
  q: "♛",
  k: "♚",
};

const VALUES = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 0,
};

const PST = {
  p: [
    0, 0, 0, 0, 0, 0, 0, 0,
    50, 50, 50, 50, 50, 50, 50, 50,
    10, 10, 20, 30, 30, 20, 10, 10,
    5, 5, 10, 25, 25, 10, 5, 5,
    0, 0, 0, 20, 20, 0, 0, 0,
    5, -5, -10, 0, 0, -10, -5, 5,
    5, 10, 10, -20, -20, 10, 10, 5,
    0, 0, 0, 0, 0, 0, 0, 0,
  ],
  n: [
    -50, -40, -30, -30, -30, -30, -40, -50,
    -40, -20, 0, 0, 0, 0, -20, -40,
    -30, 0, 10, 15, 15, 10, 0, -30,
    -30, 5, 15, 20, 20, 15, 5, -30,
    -30, 0, 15, 20, 20, 15, 0, -30,
    -30, 5, 10, 15, 15, 10, 5, -30,
    -40, -20, 0, 5, 5, 0, -20, -40,
    -50, -40, -30, -30, -30, -30, -40, -50,
  ],
  b: [
    -20, -10, -10, -10, -10, -10, -10, -20,
    -10, 0, 0, 0, 0, 0, 0, -10,
    -10, 0, 5, 10, 10, 5, 0, -10,
    -10, 5, 5, 10, 10, 5, 5, -10,
    -10, 0, 10, 10, 10, 10, 0, -10,
    -10, 10, 10, 10, 10, 10, 10, -10,
    -10, 5, 0, 0, 0, 0, 5, -10,
    -20, -10, -10, -10, -10, -10, -10, -20,
  ],
  r: [
    0, 0, 0, 0, 0, 0, 0, 0,
    5, 10, 10, 10, 10, 10, 10, 5,
    -5, 0, 0, 0, 0, 0, 0, -5,
    -5, 0, 0, 0, 0, 0, 0, -5,
    -5, 0, 0, 0, 0, 0, 0, -5,
    -5, 0, 0, 0, 0, 0, 0, -5,
    -5, 0, 0, 0, 0, 0, 0, -5,
    0, 0, 0, 5, 5, 0, 0, 0,
  ],
  q: [
    -20, -10, -10, -5, -5, -10, -10, -20,
    -10, 0, 0, 0, 0, 0, 0, -10,
    -10, 0, 5, 5, 5, 5, 0, -10,
    -5, 0, 5, 5, 5, 5, 0, -5,
    0, 0, 5, 5, 5, 5, 0, -5,
    -10, 5, 5, 5, 5, 5, 0, -10,
    -10, 0, 5, 0, 0, 0, 0, -10,
    -20, -10, -10, -5, -5, -10, -10, -20,
  ],
  k: [
    -30, -40, -40, -50, -50, -40, -40, -30,
    -30, -40, -40, -50, -50, -40, -40, -30,
    -30, -40, -40, -50, -50, -40, -40, -30,
    -30, -40, -40, -50, -50, -40, -40, -30,
    -20, -30, -30, -40, -40, -30, -30, -20,
    -10, -20, -20, -20, -20, -20, -20, -10,
    20, 20, 0, 0, 0, 0, 20, 20,
    20, 30, 10, 0, 0, 10, 30, 20,
  ],
};

const MATE_SCORE = 100000;

let pieceIdCounter = 1;
const pieceEls = new Map();
let state = initialState();
let turn = "w";
let engineColor = "b";
let selected = null;
let legalTargets = [];
let engineBusy = false;
let moveHistory = [];
let gameOver = false;
let pendingPromotion = null;

if (boardEl) {
  if (!squareLayer) {
    squareLayer = document.createElement("div");
    squareLayer.id = "squareLayer";
    squareLayer.className = "square-layer";
    boardEl.appendChild(squareLayer);
  }
  if (!pieceLayer) {
    pieceLayer = document.createElement("div");
    pieceLayer.id = "pieceLayer";
    pieceLayer.className = "piece-layer";
    boardEl.appendChild(pieceLayer);
  }
}

function initialBoard() {
  return [
    "r", "n", "b", "q", "k", "b", "n", "r",
    "p", "p", "p", "p", "p", "p", "p", "p",
    null, null, null, null, null, null, null, null,
    null, null, null, null, null, null, null, null,
    null, null, null, null, null, null, null, null,
    null, null, null, null, null, null, null, null,
    "P", "P", "P", "P", "P", "P", "P", "P",
    "R", "N", "B", "Q", "K", "B", "N", "R",
  ];
}

function initialState() {
  pieceIdCounter = 1;
  const board = initialBoard();
  return {
    board,
    castling: { wK: true, wQ: true, bK: true, bQ: true },
    pieceIds: initialPieceIds(board),
  };
}

function initialPieceIds(board) {
  const ids = new Array(64).fill(null);
  for (let i = 0; i < 64; i++) {
    const piece = board[i];
    if (!piece) continue;
    ids[i] = `${piece}${pieceIdCounter++}`;
  }
  return ids;
}

function idx(r, c) {
  return r * 8 + c;
}

function coord(i) {
  return { r: Math.floor(i / 8), c: i % 8 };
}

function pieceColor(piece) {
  if (!piece) return null;
  return piece === piece.toUpperCase() ? "w" : "b";
}

function inBounds(r, c) {
  return r >= 0 && r < 8 && c >= 0 && c < 8;
}

function cloneBoard(b) {
  return b.slice();
}

function cloneCastling(c) {
  return { wK: c.wK, wQ: c.wQ, bK: c.bK, bQ: c.bQ };
}

function makeMove(b, move) {
  const next = cloneBoard(b);
  const fromIndex = idx(move.from.r, move.from.c);
  const toIndex = idx(move.to.r, move.to.c);
  const piece = next[fromIndex];
  next[fromIndex] = null;

  if (move.castle) {
    if (piece === "K") {
      if (move.castle === "K") {
        next[idx(7, 6)] = "K";
        next[idx(7, 5)] = "R";
        next[idx(7, 7)] = null;
      } else {
        next[idx(7, 2)] = "K";
        next[idx(7, 3)] = "R";
        next[idx(7, 0)] = null;
      }
    } else {
      if (move.castle === "K") {
        next[idx(0, 6)] = "k";
        next[idx(0, 5)] = "r";
        next[idx(0, 7)] = null;
      } else {
        next[idx(0, 2)] = "k";
        next[idx(0, 3)] = "r";
        next[idx(0, 0)] = null;
      }
    }
    return next;
  }

  if (move.promotion) {
    next[toIndex] = move.promotion;
  } else {
    next[toIndex] = piece;
  }
  return next;
}

function updateCastlingRights(b, castling, move) {
  const next = cloneCastling(castling);
  const fromIndex = idx(move.from.r, move.from.c);
  const toIndex = idx(move.to.r, move.to.c);
  const piece = b[fromIndex];
  const color = pieceColor(piece);

  if (piece && piece.toLowerCase() === "k") {
    if (color === "w") {
      next.wK = false;
      next.wQ = false;
    } else {
      next.bK = false;
      next.bQ = false;
    }
  }

  if (piece && piece.toLowerCase() === "r") {
    if (color === "w") {
      if (move.from.r === 7 && move.from.c === 0) next.wQ = false;
      if (move.from.r === 7 && move.from.c === 7) next.wK = false;
    } else {
      if (move.from.r === 0 && move.from.c === 0) next.bQ = false;
      if (move.from.r === 0 && move.from.c === 7) next.bK = false;
    }
  }

  const captured = b[toIndex];
  if (captured && captured.toLowerCase() === "r") {
    if (toIndex === idx(7, 0)) next.wQ = false;
    if (toIndex === idx(7, 7)) next.wK = false;
    if (toIndex === idx(0, 0)) next.bQ = false;
    if (toIndex === idx(0, 7)) next.bK = false;
  }

  return next;
}

function makeMoveState(current, move) {
  return {
    board: makeMove(current.board, move),
    castling: updateCastlingRights(current.board, current.castling, move),
  };
}

function inferCastlingFromBoard(board) {
  const wKing = board[idx(7, 4)] === "K";
  const bKing = board[idx(0, 4)] === "k";
  return {
    wK: wKing && board[idx(7, 7)] === "R",
    wQ: wKing && board[idx(7, 0)] === "R",
    bK: bKing && board[idx(0, 7)] === "r",
    bQ: bKing && board[idx(0, 0)] === "r",
  };
}

function applyMoveToState(current, move, options = {}) {
  const free = options.free === true;
  const nextBoard = cloneBoard(current.board);
  const nextIds = current.pieceIds.slice();
  const fromIndex = idx(move.from.r, move.from.c);
  const toIndex = idx(move.to.r, move.to.c);
  const piece = nextBoard[fromIndex];
  const pieceId = nextIds[fromIndex];
  nextBoard[fromIndex] = null;
  nextIds[fromIndex] = null;

  if (move.castle) {
    if (piece === "K") {
      if (move.castle === "K") {
        const rookIndex = idx(7, 7);
        const rookId = nextIds[rookIndex];
        nextBoard[idx(7, 6)] = "K";
        nextIds[idx(7, 6)] = pieceId;
        nextBoard[idx(7, 5)] = "R";
        nextIds[idx(7, 5)] = rookId;
        nextBoard[rookIndex] = null;
        nextIds[rookIndex] = null;
      } else {
        const rookIndex = idx(7, 0);
        const rookId = nextIds[rookIndex];
        nextBoard[idx(7, 2)] = "K";
        nextIds[idx(7, 2)] = pieceId;
        nextBoard[idx(7, 3)] = "R";
        nextIds[idx(7, 3)] = rookId;
        nextBoard[rookIndex] = null;
        nextIds[rookIndex] = null;
      }
    } else {
      if (move.castle === "K") {
        const rookIndex = idx(0, 7);
        const rookId = nextIds[rookIndex];
        nextBoard[idx(0, 6)] = "k";
        nextIds[idx(0, 6)] = pieceId;
        nextBoard[idx(0, 5)] = "r";
        nextIds[idx(0, 5)] = rookId;
        nextBoard[rookIndex] = null;
        nextIds[rookIndex] = null;
      } else {
        const rookIndex = idx(0, 0);
        const rookId = nextIds[rookIndex];
        nextBoard[idx(0, 2)] = "k";
        nextIds[idx(0, 2)] = pieceId;
        nextBoard[idx(0, 3)] = "r";
        nextIds[idx(0, 3)] = rookId;
        nextBoard[rookIndex] = null;
        nextIds[rookIndex] = null;
      }
    }
    return {
      board: nextBoard,
      castling: free ? inferCastlingFromBoard(nextBoard) : updateCastlingRights(current.board, current.castling, move),
      pieceIds: nextIds,
    };
  }

  if (move.promotion) {
    nextBoard[toIndex] = move.promotion;
  } else {
    nextBoard[toIndex] = piece;
  }
  nextIds[toIndex] = pieceId;

  return {
    board: nextBoard,
    castling: free ? inferCastlingFromBoard(nextBoard) : updateCastlingRights(current.board, current.castling, move),
    pieceIds: nextIds,
  };
}

function isSquareAttacked(b, r, c, byColor) {
  const pawnDir = byColor === "w" ? 1 : -1;
  const pawnRows = r + pawnDir;
  if (inBounds(pawnRows, c - 1)) {
    const p = b[idx(pawnRows, c - 1)];
    if (p && pieceColor(p) === byColor && p.toLowerCase() === "p") return true;
  }
  if (inBounds(pawnRows, c + 1)) {
    const p = b[idx(pawnRows, c + 1)];
    if (p && pieceColor(p) === byColor && p.toLowerCase() === "p") return true;
  }

  const knightOffsets = [
    [-2, -1], [-2, 1], [-1, -2], [-1, 2],
    [1, -2], [1, 2], [2, -1], [2, 1],
  ];
  for (const [dr, dc] of knightOffsets) {
    const nr = r + dr;
    const nc = c + dc;
    if (!inBounds(nr, nc)) continue;
    const p = b[idx(nr, nc)];
    if (p && pieceColor(p) === byColor && p.toLowerCase() === "n") return true;
  }

  const directions = [
    [-1, 0], [1, 0], [0, -1], [0, 1],
    [-1, -1], [-1, 1], [1, -1], [1, 1],
  ];

  for (let i = 0; i < directions.length; i++) {
    const [dr, dc] = directions[i];
    let nr = r + dr;
    let nc = c + dc;
    while (inBounds(nr, nc)) {
      const p = b[idx(nr, nc)];
      if (p) {
        if (pieceColor(p) === byColor) {
          const type = p.toLowerCase();
          const isStraight = i < 4;
          if (type === "q") return true;
          if (isStraight && type === "r") return true;
          if (!isStraight && type === "b") return true;
        }
        break;
      }
      nr += dr;
      nc += dc;
    }
  }

  for (const [dr, dc] of directions) {
    const nr = r + dr;
    const nc = c + dc;
    if (!inBounds(nr, nc)) continue;
    const p = b[idx(nr, nc)];
    if (p && pieceColor(p) === byColor && p.toLowerCase() === "k") return true;
  }

  return false;
}

function kingIndex(b, color) {
  const king = color === "w" ? "K" : "k";
  return b.findIndex((p) => p === king);
}

function isKingInCheck(b, color) {
  const kIndex = kingIndex(b, color);
  if (kIndex === -1) return true;
  const { r, c } = coord(kIndex);
  const enemy = color === "w" ? "b" : "w";
  return isSquareAttacked(b, r, c, enemy);
}

function generatePseudoMoves(current, color) {
  const b = current.board;
  const moves = [];
  for (let i = 0; i < 64; i++) {
    const piece = b[i];
    if (!piece || pieceColor(piece) !== color) continue;
    const { r, c } = coord(i);
    const type = piece.toLowerCase();

    if (type === "p") {
      const dir = color === "w" ? -1 : 1;
      const startRow = color === "w" ? 6 : 1;
      const promoRow = color === "w" ? 0 : 7;
      const oneR = r + dir;
      if (inBounds(oneR, c) && !b[idx(oneR, c)]) {
        const move = { from: { r, c }, to: { r: oneR, c } };
        if (oneR === promoRow) move.promotion = color === "w" ? "Q" : "q";
        moves.push(move);
        const twoR = r + dir * 2;
        if (r === startRow && !b[idx(twoR, c)]) {
          moves.push({ from: { r, c }, to: { r: twoR, c } });
        }
      }
      for (const dc of [-1, 1]) {
        const capR = r + dir;
        const capC = c + dc;
        if (!inBounds(capR, capC)) continue;
        const target = b[idx(capR, capC)];
        if (target && target.toLowerCase() === "k") continue;
        if (target && pieceColor(target) !== color) {
          const move = { from: { r, c }, to: { r: capR, c: capC } };
          if (capR === promoRow) move.promotion = color === "w" ? "Q" : "q";
          moves.push(move);
        }
      }
    }

    if (type === "n") {
      const offsets = [
        [-2, -1], [-2, 1], [-1, -2], [-1, 2],
        [1, -2], [1, 2], [2, -1], [2, 1],
      ];
      for (const [dr, dc] of offsets) {
        const nr = r + dr;
        const nc = c + dc;
        if (!inBounds(nr, nc)) continue;
        const target = b[idx(nr, nc)];
        if (target && target.toLowerCase() === "k") continue;
        if (!target || pieceColor(target) !== color) {
          moves.push({ from: { r, c }, to: { r: nr, c: nc } });
        }
      }
    }

    if (type === "b" || type === "r" || type === "q") {
      const dirs = [];
      if (type === "b" || type === "q") {
        dirs.push([-1, -1], [-1, 1], [1, -1], [1, 1]);
      }
      if (type === "r" || type === "q") {
        dirs.push([-1, 0], [1, 0], [0, -1], [0, 1]);
      }
      for (const [dr, dc] of dirs) {
        let nr = r + dr;
        let nc = c + dc;
        while (inBounds(nr, nc)) {
          const target = b[idx(nr, nc)];
          if (!target) {
            moves.push({ from: { r, c }, to: { r: nr, c: nc } });
          } else {
            if (target.toLowerCase() !== "k" && pieceColor(target) !== color) {
              moves.push({ from: { r, c }, to: { r: nr, c: nc } });
            }
            break;
          }
          nr += dr;
          nc += dc;
        }
      }
    }

    if (type === "k") {
      const dirs = [
        [-1, 0], [1, 0], [0, -1], [0, 1],
        [-1, -1], [-1, 1], [1, -1], [1, 1],
      ];
      for (const [dr, dc] of dirs) {
        const nr = r + dr;
        const nc = c + dc;
        if (!inBounds(nr, nc)) continue;
        const target = b[idx(nr, nc)];
        if (target && target.toLowerCase() === "k") continue;
        if (!target || pieceColor(target) !== color) {
          moves.push({ from: { r, c }, to: { r: nr, c: nc } });
        }
      }

      const enemy = color === "w" ? "b" : "w";
      if (color === "w" && current.castling.wK) {
        if (!b[idx(7, 5)] && !b[idx(7, 6)]) {
          if (!isSquareAttacked(b, 7, 4, enemy) && !isSquareAttacked(b, 7, 5, enemy) && !isSquareAttacked(b, 7, 6, enemy)) {
            moves.push({ from: { r, c }, to: { r: 7, c: 6 }, castle: "K" });
          }
        }
      }
      if (color === "w" && current.castling.wQ) {
        if (!b[idx(7, 1)] && !b[idx(7, 2)] && !b[idx(7, 3)]) {
          if (!isSquareAttacked(b, 7, 4, enemy) && !isSquareAttacked(b, 7, 3, enemy) && !isSquareAttacked(b, 7, 2, enemy)) {
            moves.push({ from: { r, c }, to: { r: 7, c: 2 }, castle: "Q" });
          }
        }
      }
      if (color === "b" && current.castling.bK) {
        if (!b[idx(0, 5)] && !b[idx(0, 6)]) {
          if (!isSquareAttacked(b, 0, 4, enemy) && !isSquareAttacked(b, 0, 5, enemy) && !isSquareAttacked(b, 0, 6, enemy)) {
            moves.push({ from: { r, c }, to: { r: 0, c: 6 }, castle: "K" });
          }
        }
      }
      if (color === "b" && current.castling.bQ) {
        if (!b[idx(0, 1)] && !b[idx(0, 2)] && !b[idx(0, 3)]) {
          if (!isSquareAttacked(b, 0, 4, enemy) && !isSquareAttacked(b, 0, 3, enemy) && !isSquareAttacked(b, 0, 2, enemy)) {
            moves.push({ from: { r, c }, to: { r: 0, c: 2 }, castle: "Q" });
          }
        }
      }
    }
  }
  return moves;
}

function generateLegalMoves(current, color) {
  const moves = generatePseudoMoves(current, color);
  return moves.filter((move) => {
    const next = makeMoveState(current, move);
    return !isKingInCheck(next.board, color);
  });
}

function evaluate(b) {
  let score = 0;
  for (let i = 0; i < 64; i++) {
    const piece = b[i];
    if (!piece) continue;
    const color = pieceColor(piece);
    const type = piece.toLowerCase();
    const value = VALUES[type];
    const table = PST[type];
    const { r, c } = coord(i);
    const pstIndex = color === "w" ? i : idx(7 - r, c);
    const pstValue = table[pstIndex];
    const signed = color === "w" ? 1 : -1;
    score += signed * (value + pstValue);
  }
  return score;
}

function negamax(current, depth, alpha, beta, color, rootDepth) {
  if (depth === 0) {
    return color * evaluate(current.board);
  }

  const side = color === 1 ? "w" : "b";
  const moves = generateLegalMoves(current, side);
  if (moves.length === 0) {
    if (isKingInCheck(current.board, side)) {
      return -MATE_SCORE + (rootDepth - depth);
    }
    return 0;
  }

  let best = -Infinity;
  for (const move of moves) {
    const next = makeMoveState(current, move);
    const score = -negamax(next, depth - 1, -beta, -alpha, -color, rootDepth);
    if (score > best) best = score;
    if (best > alpha) alpha = best;
    if (alpha >= beta) break;
  }
  return best;
}

function findBestMove(current, side, depth) {
  const color = side === "w" ? 1 : -1;
  const moves = generateLegalMoves(current, side);
  if (moves.length === 0) return null;

  let bestMove = moves[0];
  let bestScore = -Infinity;
  let alpha = -Infinity;
  let beta = Infinity;
  for (const move of moves) {
    const next = makeMoveState(current, move);
    const score = -negamax(next, depth - 1, -beta, -alpha, -color, depth);
    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
    if (score > alpha) alpha = score;
  }
  return { move: bestMove, score: bestScore };
}

function squareName(r, c) {
  const files = "abcdefgh";
  return `${files[c]}${8 - r}`;
}

function moveToString(move) {
  if (move.castle === "K") return "O-O";
  if (move.castle === "Q") return "O-O-O";
  const from = squareName(move.from.r, move.from.c);
  const to = squareName(move.to.r, move.to.c);
  if (move.promotion) {
    return `${from}-${to}=${move.promotion.toUpperCase()}`;
  }
  return `${from}-${to}`;
}

function renderCoordinates(flipped) {
  if (!coordTop || !coordBottom || !coordLeft || !coordRight) return;
  const files = "abcdefgh".split("");
  const ranks = ["8", "7", "6", "5", "4", "3", "2", "1"];
  const fileLabels = flipped ? files.slice().reverse() : files;
  const rankLabels = flipped ? ranks.slice().reverse() : ranks;

  coordTop.innerHTML = "";
  coordBottom.innerHTML = "";
  coordLeft.innerHTML = "";
  coordRight.innerHTML = "";

  for (const file of fileLabels) {
    const top = document.createElement("div");
    top.textContent = file;
    coordTop.appendChild(top);
    const bottom = document.createElement("div");
    bottom.textContent = file;
    coordBottom.appendChild(bottom);
  }

  for (const rank of rankLabels) {
    const left = document.createElement("div");
    left.textContent = rank;
    coordLeft.appendChild(left);
    const right = document.createElement("div");
    right.textContent = rank;
    coordRight.appendChild(right);
  }
}

function renderPieces(flipped) {
  if (!pieceLayer) return;
  const activeIds = new Set();
  for (let i = 0; i < 64; i++) {
    const piece = state.board[i];
    if (!piece) continue;
    let pieceId = state.pieceIds[i];
    if (!pieceId) {
      pieceId = `${piece}${pieceIdCounter++}`;
      state.pieceIds[i] = pieceId;
    }
    activeIds.add(pieceId);
    let el = pieceEls.get(pieceId);
    if (!el) {
      el = document.createElement("div");
      el.className = "piece";
      el.dataset.pieceId = pieceId;
      pieceLayer.appendChild(el);
      pieceEls.set(pieceId, el);
    }
    el.textContent = PIECE_UNICODE[piece];
    const { r, c } = coord(i);
    const dr = flipped ? 7 - r : r;
    const dc = flipped ? 7 - c : c;
    el.style.transform = `translate(${dc * 100}%, ${dr * 100}%)`;
  }

  for (const [id, el] of pieceEls.entries()) {
    if (!activeIds.has(id)) {
      el.remove();
      pieceEls.delete(id);
    }
  }
}

function render() {
  if (!boardEl) return;
  if (!squareLayer) {
    squareLayer = document.createElement("div");
    squareLayer.id = "squareLayer";
    squareLayer.className = "square-layer";
  }
  if (!pieceLayer) {
    pieceLayer = document.createElement("div");
    pieceLayer.id = "pieceLayer";
    pieceLayer.className = "piece-layer";
  }
  if (squareLayer.parentElement !== boardEl) boardEl.appendChild(squareLayer);
  if (pieceLayer.parentElement !== boardEl) boardEl.appendChild(pieceLayer);
  const flipped = flipToggle.checked;
  const inFreeMode = freeToggle.checked;
  const checkColor = !inFreeMode && isKingInCheck(state.board, turn) ? turn : null;
  const checkIndex = checkColor ? kingIndex(state.board, checkColor) : -1;
  const checkSquare = checkIndex >= 0 ? coord(checkIndex) : null;

  squareLayer.innerHTML = "";
  for (let dr = 0; dr < 8; dr++) {
    for (let dc = 0; dc < 8; dc++) {
      const r = flipped ? 7 - dr : dr;
      const c = flipped ? 7 - dc : dc;
      const square = document.createElement("div");
      square.className = `square ${(r + c) % 2 === 0 ? "light" : "dark"}`;
      square.dataset.r = r;
      square.dataset.c = c;
      if (selected && selected.r === r && selected.c === c) {
        square.classList.add("selected");
      }
      if (!inFreeMode && legalTargets.some((t) => t.r === r && t.c === c)) {
        square.classList.add("move");
      }
      if (checkSquare && checkSquare.r === r && checkSquare.c === c) {
        square.classList.add("check");
      }
      square.addEventListener("click", onSquareClick);
      squareLayer.appendChild(square);
    }
  }
  renderPieces(flipped);
  renderCoordinates(flipped);
  const evalScore = evaluate(state.board) / 100;
  evalEl.textContent = `Evaluation: ${evalScore.toFixed(2)}`;
  updateStatus();
}

function updateStatus() {
  if (freeToggle.checked) {
    statusEl.textContent = "Free Mode";
    gameOver = false;
    return;
  }
  const moves = generateLegalMoves(state, turn);
  if (moves.length === 0) {
    if (isKingInCheck(state.board, turn)) {
      statusEl.textContent = `${turn === "w" ? "White" : "Black"} is checkmated`;
      showEndModal("Checkmate", "Checkmate.");
    } else {
      statusEl.textContent = "Stalemate";
      showEndModal("Stalemate", "Stalemate.");
    }
    gameOver = true;
    return;
  }
  const check = isKingInCheck(state.board, turn) ? " (check)" : "";
  statusEl.textContent = `${turn === "w" ? "White" : "Black"} to move${check}`;
}

function setSelection(r, c) {
  selected = { r, c };
  if (freeToggle.checked) {
    legalTargets = [];
    return;
  }
  const moves = generateLegalMoves(state, turn);
  legalTargets = moves
    .filter((m) => m.from.r === r && m.from.c === c)
    .map((m) => m.to);
}

function clearSelection() {
  selected = null;
  legalTargets = [];
}

function applyMove(move, byEngine) {
  state = applyMoveToState(state, move);
  moveHistory.push(moveToString(move));
  const li = document.createElement("li");
  li.textContent = moveToString(move) + (byEngine ? " (engine)" : "");
  movesEl.appendChild(li);
  turn = turn === "w" ? "b" : "w";
  clearSelection();
  render();
}

function onSquareClick(e) {
  if (engineBusy || gameOver || pendingPromotion) return;
  const inFreeMode = freeToggle.checked;
  const r = Number(e.currentTarget.dataset.r);
  const c = Number(e.currentTarget.dataset.c);
  const piece = state.board[idx(r, c)];

  if (selected) {
    if (inFreeMode) {
      if (selected.r === r && selected.c === c) {
        clearSelection();
        render();
        return;
      }
      const freeMove = { from: { ...selected }, to: { r, c } };
      state = applyMoveToState(state, freeMove, { free: true });
      moveHistory.push(moveToString(freeMove));
      const li = document.createElement("li");
      li.textContent = moveToString(freeMove);
      movesEl.appendChild(li);
      clearSelection();
      render();
      return;
    }
    const moves = generateLegalMoves(state, turn);
    const chosen = moves.find(
      (m) => m.from.r === selected.r && m.from.c === selected.c && m.to.r === r && m.to.c === c
    );
    if (chosen) {
      if (chosen.promotion) {
        pendingPromotion = { move: chosen, color: turn };
        showPromotionModal();
        return;
      }
      applyMove(chosen, false);
      maybeEngineMove();
      return;
    }
  }

  if (piece && (inFreeMode || pieceColor(piece) === turn)) {
    setSelection(r, c);
  } else {
    clearSelection();
  }
  render();
}

function maybeEngineMove() {
  if (gameOver) return;
  if (freeToggle.checked) return;
  if (!engineToggle.checked) return;
  if (turn !== engineColor) return;
  const depth = Math.max(1, Math.min(6, Number(depthInput.value || 3)));
  engineBusy = true;
  statusEl.textContent = "Engine thinking...";
  setTimeout(() => {
    const result = findBestMove(state, engineColor, depth);
    if (result && result.move) {
      if (result.move.promotion) {
        result.move.promotion = engineColor === "w" ? "Q" : "q";
      }
      applyMove(result.move, true);
    }
    engineBusy = false;
  }, 20);
}

function showTipsModal() {
  tipsModal.classList.remove("hidden");
}

function hideTipsModal() {
  tipsModal.classList.add("hidden");
}

function showEndModal(title, message) {
  endTitle.textContent = title;
  endMessage.textContent = message;
  endModal.classList.remove("hidden");
}

function hideEndModal() {
  endModal.classList.add("hidden");
}

function showPromotionModal() {
  promoModal.classList.remove("hidden");
}

function hidePromotionModal() {
  promoModal.classList.add("hidden");
}

promoModal.addEventListener("click", (e) => {
  const button = e.target.closest("button[data-piece]");
  if (!button || !pendingPromotion) return;
  const piece = button.dataset.piece;
  const isWhite = pendingPromotion.color === "w";
  const promo = isWhite ? piece.toUpperCase() : piece.toLowerCase();
  const move = { ...pendingPromotion.move, promotion: promo };
  pendingPromotion = null;
  hidePromotionModal();
  applyMove(move, false);
  maybeEngineMove();
});

resetBtn.addEventListener("click", () => {
  state = initialState();
  turn = "w";
  selected = null;
  legalTargets = [];
  engineBusy = false;
  moveHistory = [];
  gameOver = false;
  pendingPromotion = null;
  movesEl.innerHTML = "";
  hideEndModal();
  hidePromotionModal();
  render();
  maybeEngineMove();
});

flipToggle.addEventListener("change", render);

freeToggle.addEventListener("change", () => {
  const isFree = freeToggle.checked;
  if (isFree) {
    engineToggle.checked = false;
  }
  engineToggle.disabled = isFree;
  depthInput.disabled = isFree;
  sideSelect.disabled = isFree;
  engineBusy = false;
  pendingPromotion = null;
  clearSelection();
  gameOver = false;
  render();
});

tipsBtn.addEventListener("click", showTipsModal);
closeTipsBtn.addEventListener("click", hideTipsModal);
closeEndBtn.addEventListener("click", hideEndModal);

depthInput.addEventListener("change", () => {
  const depth = Math.max(1, Math.min(6, Number(depthInput.value || 3)));
  depthInput.value = depth;
});

sideSelect.addEventListener("change", () => {
  engineColor = sideSelect.value === "w" ? "b" : "w";
  if (!gameOver && !engineBusy) {
    maybeEngineMove();
  }
});

render();
maybeEngineMove();
