<script>
  import * as utils from '$lib/chess/Utils.js';
  import { getMoves } from '$lib/chess/Moves.js';
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import { goto } from '$app/navigation';

  console.log("Is browser?", browser);

  let gameId = null;
  let fen = null;
  let board = [];
  let username = '';

function toAlgebraic(row, col) {
  const file = String.fromCharCode('a'.charCodeAt(0) + col); // a-h
  const rank = 8 - row; // 8-1
  return `${file}${rank}`;
}

onMount(async () => {
  try {
    console.log("Sending request...");

    // onMount only runs in the browser, so localStorage is safe here
    const token = localStorage.getItem('token');
    const storedUsername = localStorage.getItem('username');

    if (storedUsername) {
      username = storedUsername;
    }

    if (!token) {
      console.error('No auth token found, redirecting to login');
      goto('/login');
      return;
    }

    const res = await fetch('http://localhost:3000/game', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log("Response received:", res);

    const data = await res.json();
    console.log("Parsed JSON:", data);

    gameId = data.id;
    fen = data.fen;

  } catch (err) {
    console.error('Failed to load game', err);
  }
});

  $: board = fen ? utils.fenToBoard(fen) : [];
  $: console.log("FEN:", fen);
  $: console.log("BOARD:", board);

  let selected = null;
  let validMoves = [];

  async function makeMove(from, to) {
    try {
      const token = browser ? localStorage.getItem('token') : null;

      if (!token) {
        console.error('No auth token found, redirecting to login');
        goto('/login');
        return;
      }

      const res = await fetch(
        `http://localhost:3000/game/${gameId}/move`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            from: toAlgebraic(from.row, from.col),
            to: toAlgebraic(to.row, to.col)
          })
        }
      );

      if (!res.ok) {
        console.error("Illegal move");
        selected = null;
        return;
      }

      const data = await res.json();
      fen = data.fen;
      selected = null;

    } catch (err) {
      console.error('Move failed', err);
      selected = null;
    }
  }

  function handleClick(r, c) {
    const cell = board[r][c];

    // ── no selection yet → select piece
    if (!selected) {
      if (cell) {
        selected = { row: r, col: c };
      }
      return;
    }

    // ── try to move
    const move = validMoves.find(m => m.row === r && m.col === c);

    const temp = { row: r, col: c };
    if (move) {
      makeMove(selected, temp);
      return;
    }

    // ── clicked another piece → reselect
    if (cell) {
      selected = { row: r, col: c };
      return;
    }

    // ── clicked empty invalid square → deselect
    selected = null;
  }

  const isMoveSquare = (r, c) =>
    validMoves.some(m => m.row === r && m.col === c);

  const isCaptureSquare = (r, c) =>
    validMoves.find(m => m.row === r && m.col === c)?.capture;

  $: validMoves =
    selected
      ? getMoves(board, selected.row, selected.col)
      : [];
</script>


<style>
  :global(body) {
    margin: 0;
    font-family: 'Segoe UI', Roboto, sans-serif;
    background: linear-gradient(135deg, #1e3c72, #2a5298);
    color: #fff;
  }

  .page {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    position: relative;
    z-index: 1;
  }

  .board {
    display: grid;
    grid-template-columns: repeat(8, 80px);
  }

  .square {
    position: relative;
    width: 80px;
    height: 80px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .square::before {
    content: '';
    position: absolute;
    inset: 0;
    background: transparent;
    pointer-events: none;
  }

  .square.selected::before {
    background: rgba(255, 215, 0, 0.35); /* chess.com-ish yellow */
  }

  .light { background: #f0d9b5; }
  .dark  { background: #b58863; }

  img { 
    width: 70%;
    position: relative;
    z-index: 2;
  }

  .move-dot::after {
    content: '';
    width: 25%;
    height: 25%;
    background: rgba(0, 0, 0, 0.25);
    border-radius: 50%;
    position: absolute;
  }

  .move-capture::after {
    content: '';
    width: 87%;
    height: 87%;
    border: 5px solid rgba(0, 0, 0, 0.25);
    border-radius: 50%;
    position: absolute;
  }

  .nav-button {
    padding: 0.6rem 1.2rem;
    font-size: 0.9rem;
    border-radius: 12px;
    border: none;
    cursor: pointer;
    background: linear-gradient(135deg, #ff7e5f, #feb47b);
    color: #fff;
    box-shadow: 0 4px 15px rgba(0,0,0,0.3);
    transition: all 0.3s ease;
  }

  .nav-button:hover {
    transform: translateY(-3px) scale(1.05);
    box-shadow: 0 6px 20px rgba(0,0,0,0.4);
  }

  .floating-piece {
    position: absolute;
    font-size: 3rem;
    animation: float 6s ease-in-out infinite;
    opacity: 0.3;
    z-index: 0;
    pointer-events: none;
  }

  @keyframes float {
    0%, 100% { transform: translateY(0px) rotate(0deg); }
    50% { transform: translateY(-20px) rotate(15deg); }
  }

</style>

<div class="page">
  <div style="width: 100%; max-width: 640px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; padding: 0 1rem; box-sizing: border-box;">
	<button on:click={() => goto('/')} class="nav-button">⬅ Back to home</button>
    <h4>Hello, {username}</h4>
  </div>
  <div class="board">
    {#each board as row, r}
      {#each row as cell, c}
          <div
            class="square {(r + c) % 2 ? 'dark' : 'light'}"
            class:selected={selected?.row === r && selected?.col === c}
            class:move-dot={isMoveSquare(r, c) && !isCaptureSquare(r, c)}
            class:move-capture={isCaptureSquare(r, c)}
            on:click={() => handleClick(r, c)}
          >
          {#if cell}
            <img src={utils.pieceImage(cell)} alt="" />
          {/if}
        </div>
      {/each}
    {/each}
  </div>
</div>

<!-- Floating chess pieces for style (same as home page) -->
<span class="floating-piece" style="top: 10%; left: 20%;">♞</span>
<span class="floating-piece" style="top: 40%; left: 80%; animation-delay: 2s;">♜</span>
<span class="floating-piece" style="top: 70%; left: 16%; animation-delay: 4s;">♚</span>
<span class="floating-piece" style="top: 20%; left: 60%; animation-delay: 1s;">♛</span>
