<script lang="ts">
  import { onMount } from 'svelte';
  import { Chess } from 'chess.js';
  import '@lichess-org/chessground/assets/chessground.base.css';
  import '@lichess-org/chessground/assets/chessground.brown.css';
  import '@lichess-org/chessground/assets/chessground.cburnett.css';

  let boardEl: HTMLDivElement;
  let cg: any;
  const chess = new Chess();

onMount(async () => {
  const { Chessground } = await import('@lichess-org/chessground');

  cg = Chessground(boardEl, {
    fen: chess.fen(),
    orientation: 'white',
    movable: {
      free: true,
      color: 'white',
      showDests: true,
      events: {
        after: (orig: string, dest: string) => {
          chess.move({
            from: orig,
            to: dest,
            promotion: 'q'
          });

          cg.set({ fen: chess.fen() });
        }
      }
    }
  });
});
</script>

<style>
    /* Make pieces smaller */
:global(.cg-piece) {
  width: 60% !important;
  height: 60% !important;
}

  .wrapper {
    display: flex;
    justify-content: center;
    margin-top: 50px;
  }

  .board {
    width: 600px;
    height: 600px;
  }
</style>

<div class="wrapper">
  <div class="board" bind:this={boardEl}></div>
</div>

