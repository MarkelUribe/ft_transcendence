<div class="page">
  <div class="game-container">
    <div class="game-layout">
      <div class="board-area">BOARD</div>
      <div class="side-area">SIDE (logs/chat)</div>
    </div>
  </div>
</div>

<style>

.page {
	min-height: 100vh;
	display: flex;
	justify-content: center;
	align-items: center;
}

body {
	margin: 0;
	min-height: 100vh;
	display: flex;
	justify-content: center;
	align-items: center;
	background: #f8f9fa;
}

.game-container {
	width: 90vw;
	max-width: 1400px;
	height: 90vh;
}

.game-layout {
	display: flex;
	width: 100%;
	height: 100%;
	gap: 20px;
}

.board-area {
	flex: 2;  /* takes more space */
	display: flex;
	justify-content: center;
	align-items: center;
	background: #ddd; /* temporary */
}

.side-area {
	flex: 1;  /* smaller column */
	display: flex;
	flex-direction: column;
	background: #bbb; /* temporary */
}

</style>