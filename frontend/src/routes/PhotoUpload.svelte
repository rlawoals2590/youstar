<script>
    import { onMount } from 'svelte';

    let file = null;
    let message = '';

    function handleFileChange(event) {
        file = event.target.files[0];
    }

    async function uploadFile() {
        if (!file) {
            message = 'Please select a file.';
            return;
        }

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch('http://localhost:3000/photo/upload', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error('Upload failed.');
            }

            const url = await response.text();

            const uploadResult = await fetch(url, {
                method: "PUT",
                body: file,
                headers: {
                    "Content-Type": file.type,
                },
            });

            if (!uploadResult.ok) {
                throw new Error('Upload failed.');
            }

            message = 'File uploaded successfully';
        } catch (error) {
            message = error.message;
        }
    }

</script>

<head>
    <title>YOUSTAR</title>
    <link rel="icon" type="image/svg+xml" href="/logo.png" />
    <script src="https://kit.fontawesome.com/c087d0c2fc.js" crossorigin="anonymous"></script>
</head>
<body>
<div class="container">
    <div class="content">
        <div class="logo">UPLOAD</div>
        <div>
            <label for="file">Upload File</label>
            <input type="file" on:change={handleFileChange} />
        </div>
        <button on:click={uploadFile}>Upload</button>
        {#if message}
            <p>{message}</p>
        {/if}
    </div>
</div>
</body>