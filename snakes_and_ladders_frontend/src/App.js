import React, { useState, useEffect, useRef } from "react";
import "./App.css";

// --- COLOR THEME ---
const COLORS = {
  primary: "#FFD600",
  accent: "#FF4081",
  secondary: "#00C853",
  playerAvatars: [
    "#FF4081", // Pink
    "#00C853", // Green
    "#FFD600", // Yellow
    "#536DFE", // Blue (overflow/fallback/contrast)
  ],
  snake: "#FF4081",
  ladder: "#00C853",
  boardBG: "#fff8e1",
  tileNumbers: "#757575",
  boardBorder: "#FFD600",
};
// --- END COLOR THEME ---

// --- CONFIG ---
const BOARD_SIZE = 10; // 10x10
const BOARD_LENGTH = BOARD_SIZE * BOARD_SIZE; // 100
// Array of objects: {from: int, to: int}
const SNAKES = [
  { from: 16, to: 6 },
  { from: 47, to: 26 },
  { from: 49, to: 11 },
  { from: 56, to: 53 },
  { from: 62, to: 19 },
  { from: 64, to: 60 },
  { from: 87, to: 24 },
  { from: 93, to: 73 },
  { from: 95, to: 75 },
  { from: 98, to: 78 },
];
const LADDERS = [
  { from: 1, to: 38 },
  { from: 4, to: 14 },
  { from: 9, to: 31 },
  { from: 21, to: 42 },
  { from: 28, to: 84 },
  { from: 36, to: 44 },
  { from: 51, to: 67 },
  { from: 71, to: 91 },
  { from: 80, to: 100 },
];

const AVATAR_ICONS = [
  // SVGs for avatars, color will be injected via fill property
  (color) => (
    <svg width="30" height="30" viewBox="0 0 28 28">
      <circle cx="14" cy="12" r="8" fill={color} />
      <ellipse cx="14" cy="24" rx="10" ry="4" fill={color} opacity="0.5" />
    </svg>
  ),
  (color) => (
    <svg width="30" height="30" viewBox="0 0 28 28">
      <rect x="7" y="7" width="14" height="14" rx="7" fill={color} />
      <ellipse cx="14" cy="24" rx="9" ry="4" fill={color} opacity="0.5" />
    </svg>
  ),
  (color) => (
    <svg width="30" height="30" viewBox="0 0 28 28">
      <polygon points="14,4 24,24 4,24" fill={color} />
      <ellipse cx="14" cy="24" rx="8" ry="4" fill={color} opacity="0.5" />
    </svg>
  ),
  (color) => (
    <svg width="30" height="30" viewBox="0 0 28 28">
      <ellipse cx="14" cy="14" rx="10" ry="7" fill={color} />
      <ellipse cx="14" cy="24" rx="7" ry="4" fill={color} opacity="0.5" />
    </svg>
  ),
];
// --- END CONFIG ---

// Helper: returns x,y in grid coordinates (0-indexed)
function getTileXY(pos) {
  const row = BOARD_SIZE - 1 - Math.floor((pos - 1) / BOARD_SIZE);
  let col = (pos - 1) % BOARD_SIZE;
  if ((BOARD_SIZE - row) % 2 === 0) {
    // Even row (from bottom): right->left
    col = BOARD_SIZE - 1 - col;
  }
  return { x: col, y: row };
}

// --- COMPONENTS ---
function PlayerAvatar({ playerIdx, name, color, style, active, winner }) {
  return (
    <div
      className="player-avatar"
      style={{
        borderColor: active ? COLORS.accent : "transparent",
        background: winner
          ? `linear-gradient(135deg, ${color} 60%, ${COLORS.primary} 100%)`
          : "#fff",
        ...style,
      }}
      aria-label={`Player ${playerIdx + 1}${winner ? " winner" : ""}${
        active ? " (current turn)" : ""
      }`}
      tabIndex={0}
    >
      {AVATAR_ICONS[playerIdx % AVATAR_ICONS.length](color)}
      <span className="player-name">{name}</span>
    </div>
  );
}

function Scoreboard({ players, currentTurnIdx, winnerIdx, positions }) {
  return (
    <section className="scoreboard" aria-label="Scoreboard">
      <h2>Scoreboard</h2>
      {players.map((p, idx) => (
        <div
          key={idx}
          className={`score-row${winnerIdx === idx ? " winner" : ""}`}
          aria-current={currentTurnIdx === idx}
        >
          <PlayerAvatar
            playerIdx={idx}
            name={p}
            color={COLORS.playerAvatars[idx % COLORS.playerAvatars.length]}
            active={currentTurnIdx === idx}
            winner={winnerIdx === idx}
          />
          <div className="score-pos">
            <span>Tile: {positions[idx]}</span>
            {winnerIdx === idx && (
              <span className="winner-badge" aria-label="Winner">
                🏆
              </span>
            )}
            {currentTurnIdx === idx && <span>🎲</span>}
          </div>
        </div>
      ))}
    </section>
  );
}

// Dice rolling animation as SVG/canvas dots; basic for modern+fast, colorized
function Dice({ rolling, value, onRoll, disabled }) {
  // Generate dice SVG
  function DiceFace({ value }) {
    const dot = (cx, cy) => (
      <circle cx={cx} cy={cy} r="4" fill={COLORS.secondary} />
    );
    switch (value) {
      case 1:
        return <>{dot(15, 15)}</>;
      case 2:
        return (
          <>
            {dot(7, 7)}
            {dot(23, 23)}
          </>
        );
      case 3:
        return (
          <>
            {dot(7, 7)}
            {dot(15, 15)}
            {dot(23, 23)}
          </>
        );
      case 4:
        return (
          <>
            {dot(7, 7)}
            {dot(23, 7)}
            {dot(7, 23)}
            {dot(23, 23)}
          </>
        );
      case 5:
        return (
          <>
            {dot(7, 7)}
            {dot(23, 7)}
            {dot(7, 23)}
            {dot(23, 23)}
            {dot(15, 15)}
          </>
        );
      case 6:
        return (
          <>
            {dot(7, 7)}
            {dot(7, 15)}
            {dot(7, 23)}
            {dot(23, 7)}
            {dot(23, 15)}
            {dot(23, 23)}
          </>
        );
      default:
        return null;
    }
  }
  return (
    <div className="dice-block">
      <button
        className={`dice-btn ${rolling ? "rolling" : ""}`}
        onClick={onRoll}
        disabled={rolling || disabled}
        aria-label={rolling ? "Rolling dice..." : "Roll dice"}
        tabIndex={0}
      >
        <svg
          className="dice-face"
          width={32}
          height={32}
          viewBox="0 0 32 32"
          style={{
            transition: "box-shadow 0.2s",
            filter: rolling ? "brightness(1.2)" : "none",
          }}
        >
          <rect
            x="2"
            y="2"
            width="28"
            height="28"
            rx="7"
            fill={COLORS.primary}
            stroke={COLORS.secondary}
            strokeWidth={2}
          />
          <g className="dice-dots">
            <DiceFace value={value} />
          </g>
        </svg>
        <span className="dice-label">
          {rolling ? "Rolling..." : "Roll Dice"}
        </span>
      </button>
    </div>
  );
}

// Game board, including all tiles, snakes, ladders, and player pawns
function Board({
  playerPositions,
  onTileClick,
  animatingIdx,
  animatePawnPos,
  players,
  winner,
}) {
  // SVG board size
  const CELL_SIZE = 48; // px
  const SVG_W = CELL_SIZE * BOARD_SIZE;
  const SVG_H = CELL_SIZE * BOARD_SIZE;
  // Get tile centers for snakes/ladders path
  const getTileCenter = (pos) => {
    const { x, y } = getTileXY(pos);
    return { cx: x * CELL_SIZE + CELL_SIZE / 2, cy: y * CELL_SIZE + CELL_SIZE / 2 };
  };

  // Snakes/Ladders config for rendering
  const snakePaths = SNAKES.map(({ from, to }, idx) => {
    const s = getTileCenter(from);
    const e = getTileCenter(to);
    // Wavy cubic curve for snake
    const dx = (e.cx - s.cx) / 4;
    const dy = (e.cy - s.cy) / 4;
    return {
      key: `snake-${idx}`,
      path: `M${s.cx},${s.cy} C${s.cx + dx},${s.cy + dy * 2} ${
        e.cx - dx
      },${e.cy - dy * 2} ${e.cx},${e.cy}`,
      from,
      to,
    };
  });
  const ladderPaths = LADDERS.map(({ from, to }, idx) => {
    const s = getTileCenter(from);
    const e = getTileCenter(to);
    // Simple line for ladder, rungs are parallel
    return {
      key: `ladder-${idx}`,
      x1: s.cx,
      y1: s.cy,
      x2: e.cx,
      y2: e.cy,
      from,
      to,
    };
  });

  // Render all tiles with odd-even rows, highlight current
  const tiles = [];
  for (let i = 1; i <= BOARD_LENGTH; i++) {
    const { x, y } = getTileXY(i);
    // pos-relative base coloring
    const bg =
      (x + y) % 2 === 0
        ? COLORS.primary
        : "#fff";
    tiles.push(
      <g
        key={`tile-${i}`}
        tabIndex={0}
        aria-label={`Tile ${i}`}
        className="board-tile-group"
      >
        <rect
          x={x * CELL_SIZE}
          y={y * CELL_SIZE}
          width={CELL_SIZE}
          height={CELL_SIZE}
          fill={bg}
          stroke={COLORS.boardBorder}
          strokeWidth={1.2}
          className="board-tile"
          onClick={() => onTileClick && onTileClick(i)}
          style={{ cursor: onTileClick ? "pointer" : "default", fillOpacity: 1 }}
        />
        <text
          x={x * CELL_SIZE + 7}
          y={y * CELL_SIZE + 19}
          fontSize={13}
          fill={COLORS.tileNumbers}
          style={{ fontWeight: 500, userSelect: "none" }}
        >
          {i}
        </text>
      </g>
    );
  }

  // Render pawns: position and animate if needed
  function PlayerPawn({ idx, pos, isAnimating }) {
    const { x, y } = getTileXY(pos);
    // Offset to avoid overlap
    const shift = (idx) => ((idx % 2) * 16 - 8) * (1 + Math.floor(idx / 2));
    const color = COLORS.playerAvatars[idx % COLORS.playerAvatars.length];

    // Animation: absolute pos for smooth movement
    let style = {};
    let classes = "player-pawn";
    if (isAnimating && animatePawnPos) {
      const { cx, cy } = getTileCenter(animatePawnPos);
      const absLeft = cx - 18 + shift(idx);
      const absTop = cy - 18 + shift(idx) * 0.2;
      style = {
        left: absLeft,
        top: absTop,
        transition: "left 0.5s cubic-bezier(.26,.92,.58,1.07), top 0.5s cubic-bezier(.26,.92,.58,1.07)",
        zIndex: 3 + idx,
      };
      classes += " animating";
    } else {
      const { cx, cy } = getTileCenter(pos);
      style = {
        left: cx - 18 + shift(idx),
        top: cy - 18 + shift(idx) * 0.2,
        zIndex: 3 + idx,
      };
    }
    return (
      <div
        className={classes}
        style={style}
        aria-label={`Player ${players[idx]}`}
        aria-current={winner === idx ? "true" : undefined}
      >
        {AVATAR_ICONS[idx % AVATAR_ICONS.length](color)}
      </div>
    );
  }

  // Place pawns using absolute overlay, to allow smooth animations
  return (
    <section
      className="game-board-wrap"
      style={{ minWidth: SVG_W, minHeight: SVG_H }}
      aria-label="Game board"
    >
      <div className="board-abs-pawns">
        {playerPositions.map((pos, idx) => (
          <PlayerPawn
            key={idx}
            idx={idx}
            pos={pos}
            isAnimating={animatingIdx === idx}
          />
        ))}
      </div>
      <svg
        className="game-board-svg"
        width={SVG_W}
        height={SVG_H}
        tabIndex={0}
        aria-hidden="true"
        style={{
          background: COLORS.boardBG,
          borderRadius: 16,
          boxShadow:
            "0 3px 16px 0 rgba(0,0,0,0.06), 0 1.5px 8px 0 rgba(0,0,0,0.07)",
        }}
      >
        {/* Ladders under pawns */}
        {ladderPaths.map((ladder) => (
          <g key={ladder.key}>
            <line
              x1={ladder.x1}
              y1={ladder.y1}
              x2={ladder.x2}
              y2={ladder.y2}
              stroke={COLORS.ladder}
              strokeWidth={9}
              strokeLinecap="round"
              opacity={0.76}
            />
            {/* Rungs */}
            {Array.from({ length: 5 }).map((_, ridx) => {
              const frac = (ridx + 1) / 6;
              const rungX =
                ladder.x1 + (ladder.x2 - ladder.x1) * frac;
              const rungY =
                ladder.y1 + (ladder.y2 - ladder.y1) * frac;
              const dx = (ladder.y2 - ladder.y1) / 18;
              const dy = (ladder.x2 - ladder.x1) / 18;
              return (
                <line
                  key={`${ladder.key}-rung-${ridx}`}
                  x1={rungX - dx}
                  y1={rungY + dy}
                  x2={rungX + dx}
                  y2={rungY - dy}
                  stroke="#fff"
                  strokeWidth={3.5}
                  opacity={0.82}
                />
              );
            })}
          </g>
        ))}
        {/* Tiles */}
        {tiles}
        {/* Snakes on top of tiles but behind pawns */}
        {snakePaths.map((snake) => (
          <g key={snake.key}>
            <path
              d={snake.path}
              stroke={COLORS.snake}
              strokeWidth={7.5}
              fill="none"
              opacity={0.74}
              style={{ filter: "drop-shadow(0px 2px 2px rgba(255,0,102,0.15))" }}
            />
            {/* Snake head (arc) */}
            <ellipse
              cx={getTileCenter(snake.to).cx}
              cy={getTileCenter(snake.to).cy}
              rx="9"
              ry="6"
              fill={COLORS.snake}
              opacity="0.94"
            />
          </g>
        ))}
      </svg>
    </section>
  );
}

function TurnIndicator({ currentPlayer, players, winner }) {
  return (
    <div className="turn-indicator" aria-live="polite">
      {!winner ? (
        <>
          <span style={{ fontWeight: "bold", color: COLORS.primary }}>
            {players[currentPlayer]}
          </span>
          <span>'s turn</span>
        </>
      ) : (
        <span>
          <b style={{ color: COLORS.accent }}>
            {players[winner]}
          </b>{" "}
          wins! 🎉
        </span>
      )}
    </div>
  );
}

function PlayerSetup({ defaultNames, onStart, maxPlayers }) {
  const [count, setCount] = useState(2);
  const [names, setNames] = useState(defaultNames.slice(0, 2));
  function setPlayerName(idx, value) {
    setNames((n) =>
      n.map((name, i) => (i === idx ? value : name))
    );
  }
  function updatePlayerCount(newCount) {
    setCount(newCount);
    setNames((n) => {
      let next = n.slice(0, newCount);
      while (next.length < newCount) {
        next.push(`Player ${next.length + 1}`);
      }
      return next;
    });
  }
  return (
    <div className="player-setup">
      <h1>🎲 Snakes & Ladders</h1>
      <div>
        <label>
          Number of players:
          <select
            value={count}
            onChange={(e) => updatePlayerCount(Number(e.target.value))}
            aria-label="Number of players"
          >
            {[2, 3, 4].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onStart(names.slice(0, count));
        }}
        autoComplete="off"
      >
        {Array.from({ length: count }).map((_, idx) => (
          <div key={idx}>
            <label>
              Player {idx + 1} name:
              <input
                type="text"
                value={names[idx] || ""}
                onChange={(e) => setPlayerName(idx, e.target.value)}
                aria-label={`Player ${idx + 1} name`}
                style={{
                  borderColor: COLORS.playerAvatars[idx % COLORS.playerAvatars.length],
                }}
                maxLength="12"
                required
              />
            </label>
          </div>
        ))}
        <button className="btn-start" type="submit">
          Start Game
        </button>
      </form>
    </div>
  );
}

// --- MAIN APP ---
function App() {
  // === STATE ===
  // Setup
  const [gameSetup, setGameSetup] = useState(false);
  const [playerNames, setPlayerNames] = useState([
    "Alice",
    "Bob",
    "Carol",
    "David",
  ]);
  const [playerPositions, setPlayerPositions] = useState([]);
  const [currentTurnIdx, setCurrentTurnIdx] = useState(0);
  const [winnerIdx, setWinnerIdx] = useState(null);
  // Dice
  const [diceRolling, setDiceRolling] = useState(false);
  const [diceValue, setDiceValue] = useState(1);
  // Pawn animation
  const [animatingIdx, setAnimatingIdx] = useState(null);
  const [animatePawnFrom, setAnimatePawnFrom] = useState(null);
  const [animatePawnTo, setAnimatePawnTo] = useState(null);
  // State for responsiveness/aria
  const boardContainerRef = useRef();

  // Start game: initialize positions
  function startGame(names) {
    setPlayerNames(names);
    setPlayerPositions(Array(names.length).fill(1));
    setCurrentTurnIdx(0);
    setWinnerIdx(null);
    setGameSetup(true);
    setDiceValue(1);
  }

  // --- GAME LOGIC ---
  function applySnakesLadders(pos) {
    let changed = true;
    while (changed) {
      changed = false;
      for (let s of SNAKES) {
        if (pos === s.from) {
          pos = s.to;
          changed = true;
        }
      }
      for (let l of LADDERS) {
        if (pos === l.from) {
          pos = l.to;
          changed = true;
        }
      }
    }
    return pos;
  }

  async function movePawn(idx, steps) {
    setAnimatingIdx(idx);
    let pos = playerPositions[idx];
    let end = Math.min(pos + steps, 100);
    for (let p = pos + 1; p <= end; ++p) {
      await new Promise((res) => setTimeout(res, 340));
      setAnimatePawnTo(p);
      setPlayerPositions((old) =>
        old.map((v, j) => (j === idx ? p : v))
      );
    }
    // Snakes/ladders transport (flash animate)
    const mapped = applySnakesLadders(end);
    if (mapped !== end) {
      setTimeout(() => {
        setAnimatePawnTo(mapped);
        setPlayerPositions((old) =>
          old.map((v, j) => (j === idx ? mapped : v))
        );
      }, 370);
      await new Promise((res) => setTimeout(res, 700));
    }
    setTimeout(() => {
      setAnimatingIdx(null);
      setAnimatePawnTo(null);
    }, 200);
    return mapped;
  }

  // --- HANDLE DICE ROLL ---
  async function onRollDice() {
    if (diceRolling || animatingIdx != null || winnerIdx != null) return;
    setDiceRolling(true);
    // Animation: fake random dice before final
    let steps = Math.floor(Math.random() * 4) + 7;
    for (let i = 0; i < steps; i++) {
      setDiceValue(Math.floor(Math.random() * 6) + 1);
      await new Promise((res) => setTimeout(res, 85));
    }
    const roll = Math.floor(Math.random() * 6) + 1;
    setDiceValue(roll);
    await new Promise((res) => setTimeout(res, 340));
    // Pawn movement with animation + snakes/ladders
    const idx = currentTurnIdx;
    let finalTile = await movePawn(idx, roll);
    if (finalTile === BOARD_LENGTH) {
      setWinnerIdx(idx);
    } else {
      setCurrentTurnIdx((idx + 1) % playerNames.length);
    }
    setDiceRolling(false);
  }

  // --- NEW GAME ---
  function resetGame() {
    setGameSetup(false);
    setPlayerPositions([]);
    setWinnerIdx(null);
    setCurrentTurnIdx(0);
    setDiceRolling(false);
    setDiceValue(1);
    setAnimatingIdx(null);
    setAnimatePawnFrom(null);
    setAnimatePawnTo(null);
  }

  // Accessibility: jump to board on move/turn
  useEffect(() => {
    if (gameSetup && boardContainerRef.current) {
      boardContainerRef.current.focus();
    }
  }, [gameSetup, currentTurnIdx, animatingIdx]);

  // --- RESPONSIVE WRAPPING ---
  return (
    <div className="main-app">
      {!gameSetup ? (
        <PlayerSetup defaultNames={playerNames} onStart={startGame} maxPlayers={4} />
      ) : (
        <>
          <div className="top-bar">
            <TurnIndicator
              currentPlayer={currentTurnIdx}
              players={playerNames}
              winner={winnerIdx}
            />
            <button className="btn-reset" onClick={resetGame} aria-label="Reset game">
              ↩️ New Game
            </button>
          </div>
          <main className="game-layout" ref={boardContainerRef} tabIndex={-1}>
            <div className="board-area">
              <Board
                playerPositions={playerPositions}
                onTileClick={null}
                animatingIdx={animatingIdx}
                animatePawnPos={animatePawnTo}
                players={playerNames}
                winner={winnerIdx}
              />
            </div>
            <aside className="side-right">
              <Scoreboard
                players={playerNames}
                currentTurnIdx={currentTurnIdx}
                winnerIdx={winnerIdx}
                positions={playerPositions}
              />
            </aside>
          </main>
          <footer className="dice-footer">
            <Dice
              rolling={diceRolling}
              value={diceValue}
              onRoll={onRollDice}
              disabled={winnerIdx !== null || animatingIdx !== null}
            />
          </footer>
        </>
      )}
    </div>
  );
}

export default App;
