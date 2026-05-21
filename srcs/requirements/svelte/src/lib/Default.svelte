<svelte:head>
    <title>Ultra Xake Online</title> 
</svelte:head>

<style>
	:global(body) {
		margin: 0;
		font-family: 'Segoe UI', Roboto, sans-serif;
		background: linear-gradient(135deg, #1e3c72, #2a5298);
		color: #fff;
		overflow-x: hidden;
  		overflow-y: auto;
	}

	.floating-piece {
		position: absolute;
		font-size: 3rem;
		animation: float 6s ease-in-out infinite;
		opacity: 0.3;
		z-index: -1;
	}

	@keyframes float {
		0%, 100% { transform: translateY(0px) rotate(0deg); }
		50% { transform: translateY(-20px) rotate(15deg); }
	}

</style>

<span class="floating-piece" style="top: 5%; left: 10%; animation-delay: 0.5s;">♟</span>
<span class="floating-piece" style="top: 15%; left: 70%; animation-delay: 1.2s;">♘</span>
<span class="floating-piece" style="top: 25%; left: 35%; animation-delay: 2.3s;">♖</span>
<span class="floating-piece" style="top: 30%; left: 85%; animation-delay: 0.8s;">♝</span>
<span class="floating-piece" style="top: 45%; left: 15%; animation-delay: 3s;">♞</span>
<span class="floating-piece" style="top: 55%; left: 50%; animation-delay: 1.7s;">♜</span>
<span class="floating-piece" style="top: 65%; left: 75%; animation-delay: 2.8s;">♛</span>
<span class="floating-piece" style="top: 70%; left: 25%; animation-delay: 0.3s;">♚</span>
<span class="floating-piece" style="top: 85%; left: 60%; animation-delay: 4.1s;">♟</span>
<span class="floating-piece" style="top: 90%; left: 5%; animation-delay: 2.6s;">♘</span>
<span class="floating-piece" style="top: 12%; left: 40%; animation-delay: 3.4s;">♝</span>
<span class="floating-piece" style="top: 38%; left: 55%; animation-delay: 1.9s;">♖</span>
<span class="floating-piece" style="top: 48%; left: 90%; animation-delay: 0.6s;">♞</span>
<span class="floating-piece" style="top: 60%; left: 5%; animation-delay: 2.2s;">♜</span>
<span class="floating-piece" style="top: 75%; left: 45%; animation-delay: 3.7s;">♛</span>
<span class="floating-piece" style="top: 95%; left: 80%; animation-delay: 1.1s;">♚</span>
