<script>
    import Home from "./routes/Home.svelte"
    import PhotoUpload from "./routes/PhotoUpload.svelte"
    import { Router, Route } from 'svelte-routing';

    export let url = '';
</script>

<Router {url}>
    <div>
        <Route path="/photo-upload" component={PhotoUpload} />
        <Route path="/" component={Home} />
    </div>
</Router>