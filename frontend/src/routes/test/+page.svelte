<script>
  let _name = "Player";
</script>

<div class="container text-center mt-5">
  <h1 class="mb-4">Welcome to Chess</h1>

  <input
    class="form-control mb-3"
    placeholder="Enter your name"
    bind:value={_name}
  />

  <button class="btn btn-primary">
    Play as {_name}
  </button>
</div>