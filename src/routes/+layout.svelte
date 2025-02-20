<!-- src/routes/+layout.svelte -->
<script>
	import 'the-new-css-reset/css/reset.css';
	import '@fortawesome/fontawesome-free/css/all.min.css';
	import '../app.css';
</script>

<svelte:head>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
	<link href="https://fonts.googleapis.com/css2?family=Montserrat&display=swap" rel="stylesheet" />
</svelte:head>

<slot />
