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
  .page {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
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

</style>

<div class="page">
  <div style="width: 100%; max-width: 640px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; padding: 0 1rem; box-sizing: border-box;">
    <button on:click={() => goto('/')} style="font-size: 0.9rem; padding: 0.4rem 0.8rem;">⬅ Back to home</button>
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
