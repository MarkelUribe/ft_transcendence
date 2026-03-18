<span class="floating-piece" style="top: 10%; left: 20%;">♞</span>
<span
  class="floating-piece"
  style="top: 40%; left: 80%; animation-delay: 2s;"
>
  ♜
</span>
<span
  class="floating-piece"
  style="top: 70%; left: 30%; animation-delay: 4s;"
>
  ♚
</span>
<span
  class="floating-piece"
  style="top: 20%; left: 60%; animation-delay: 1s;"
>
  ♛
</span>

<style>
  .floating-piece {
    position: absolute;
    font-size: 3rem;
    animation: float 6s ease-in-out infinite;
    opacity: 0.3;
  }

  @keyframes float {
    0%,
    100% {
      transform: translateY(0px) rotate(0deg);
    }
    50% {
      transform: translateY(-20px) rotate(15deg);
    }
  }
</style>
