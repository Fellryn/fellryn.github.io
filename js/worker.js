const SHADOW_RIGHT = [196, 60, 63];
const SHADOW_VALUES = [
    { r: 14, g: 245, b: 245, shadow: "N", zIndex: 20 },
    { r: 163, g: 20, b: 239, shadow: "NE", zIndex: 30 },
    { r: 193, g: 62, b: 170, shadow: "E", zIndex: 20 },
    { r: 154, g: 95, b: 158, shadow: "SE", zIndex: 30 },
    { r: 108, g: 145, b: 143, shadow: "S", zIndex: 20 },
    { r: 130, g: 159, b: 96, shadow: "SW", zIndex: 30 },
    { r: 192, g: 196, b: 60, shadow: "W", zIndex: 20},
    { r: 153, g: 220, b: 14, shadow: "NW", zIndex: 30},

    { r: 14, g: 245, b: 246, shadow: "ND", zIndex: 20 },
    { r: 163, g: 20, b: 240, shadow: "NED", zIndex: 30 },
    { r: 193, g: 62, b: 171, shadow: "ED", zIndex: 20 },
    { r: 154, g: 95, b: 159, shadow: "SED", zIndex: 30 },
    { r: 108, g: 145, b: 144, shadow: "SD", zIndex: 20 },
    { r: 130, g: 159, b: 97, shadow: "SWD", zIndex: 30 },
    { r: 192, g: 196, b: 61, shadow: "WD", zIndex: 20},
    { r: 153, g: 220, b: 15, shadow: "NWD", zIndex: 30}
];



onmessage = (e) => {
    if (e.data.type === "processBackground") {
        const bitmap = e.data.bitmap;
        const data = getImageData(bitmap);

        let pixelColors = [];
        for (let i = 0; i < data.length; i += 4) {
            const [r, g, b] = [data[i], data[i + 1], data[i + 2]];
            // pixelColors.push(`rgb(${r},${g},${b})`);
            pixelColors.push([r, g, b]);
        }

        postMessage({ type: "backgroundResult", pixelColors });
    }

    if (e.data.type === "processGuidelines") {
        const bitmap = e.data.bitmap;
        const data = getImageData(bitmap);

        let shadowInformation = [];
        for (let i = 0; i < data.length; i += 4) {
            const [r, g, b] = [data[i], data[i + 1], data[i + 2]];

            for (let match of SHADOW_VALUES) {
                if (r === match.r && g === match.g && b === match.b) {
                    const pixelIndex = i / 4;
                    shadowInformation.push({
                        pixel: pixelIndex,
                        shadow: match.shadow,
                        zIndex: match.zIndex
                    });
                    break;
                }
            }
            
        }

        postMessage({ type: "guideLinesResult", shadowInformation });

    }

    if (e.data.type === "processTarget") {
        const bitmap = e.data.bitmap;
        const data = getImageData(bitmap);

        let pixelColors = [];
        for (let i = 0; i < data.length; i += 4) {
            const [r, g, b] = [data[i], data[i + 1], data[i + 2]];
            // pixelColors.push(`rgb(${r},${g},${b})`);
            pixelColors.push([r, g, b]);
        }
        postMessage({ type: "targetResult", pixelColors});
    }
};

function getImageData(image) {
        const canvas = new OffscreenCanvas(image.width, image.height);
        const ctx = canvas.getContext("2d");

        ctx.drawImage(image, 0, 0);
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        return data = imageData.data;
}

