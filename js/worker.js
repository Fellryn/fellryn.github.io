const SHADOW_VALUES = [
    { r: 14, g: 245, b: 245, shadow: "N", zIndex: 30 },
    { r: 163, g: 20, b: 239, shadow: "NE", zIndex: 20 },
    { r: 193, g: 62, b: 170, shadow: "E", zIndex: 30 },
    { r: 154, g: 95, b: 158, shadow: "SE", zIndex: 20 },
    { r: 108, g: 145, b: 143, shadow: "S", zIndex: 30 },
    { r: 130, g: 159, b: 96, shadow: "SW", zIndex: 20 },
    { r: 192, g: 196, b: 60, shadow: "W", zIndex: 30 },
    { r: 153, g: 220, b: 14, shadow: "NW", zIndex: 20 },

    { r: 14, g: 245, b: 246, shadow: "ND", zIndex: 30 },
    { r: 163, g: 20, b: 240, shadow: "NED", zIndex: 20 },
    { r: 193, g: 62, b: 171, shadow: "ED", zIndex: 30 },
    { r: 154, g: 95, b: 159, shadow: "SED", zIndex: 40 },
    { r: 108, g: 145, b: 144, shadow: "SD", zIndex: 30 },
    { r: 130, g: 159, b: 97, shadow: "SWD", zIndex: 20 },
    { r: 192, g: 196, b: 61, shadow: "WD", zIndex: 30},
    { r: 153, g: 220, b: 15, shadow: "NWD", zIndex: 20},

    { r: 79, g: 202, b: 199, shadow: "BLOCK", zIndex: 50 }
];

const SPECIAL_VALUES = [
    { r: 237, g: 28, b: 36, special: "NO_DRAW" }
]



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

    if (e.data.type === "processSpecial") {
        const bitmap = e.data.bitmap;
        const data = getImageData(bitmap);

        let specialPixels = [];
        for (let i = 0; i < data.length; i += 4) {
            const [r, g, b] = [data[i], data[i + 1], data[i + 2]];
            
            for (let match of SPECIAL_VALUES) {
                if (r === match.r && g === match.g && b === match.b) {
                    const pixelIndex = i / 4;
                    specialPixels.push({
                        pixel: pixelIndex,
                        special: match.special
                    });
                }
                break;
            }
        }
        postMessage( {type: "specialResult", specialPixels});
    }
};

function getImageData(image) {
        const canvas = new OffscreenCanvas(image.width, image.height);
        const ctx = canvas.getContext("2d");

        ctx.drawImage(image, 0, 0);
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        return data = imageData.data;
}

