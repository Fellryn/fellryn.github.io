onmessage = (e) => {
    if (e.data.type === "processImage") {
        const bitmap = e.data.bitmap;

        const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
        const ctx = canvas.getContext("2d");

        ctx.drawImage(bitmap, 0, 0);
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        let pixelColours = [];
        for (let i = 0; i < data.length; i += 4) {
            const [r, g, b] = [data[i], data[i + 1], data[i + 2]];
            pixelColours.push(`rgb(${r},${g},${b})`);
        }

        postMessage({ type: "result", pixelColours });
    }
};