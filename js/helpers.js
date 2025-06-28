export function getRgbSimilarity(c1, c2) {

    const { r:r1, g: g1, b: b1} = stringToRgb(c1);
    const { r:r2, g: g2, b: b2} = stringToRgb(c2);

    const rSim = (1 - (Math.abs((r1 - r2)) / 255));
    const gSim = (1 - (Math.abs((g1 - g2)) / 255));
    const bSim = (1 - (Math.abs((b1 - b2)) / 255));

    return ((rSim * 0.33) + (gSim * 0.33) + (bSim * 0.33));
}

export function rgbToString({r, g, b}) {
    return `rgb(${r},${g},${b})`;
}

export function stringToRgb(color) {
    const [r, g, b] = color.match(/\d+/g).map(Number);
    return {r, g, b};
}

export async function fileExists(url) {
    try {
        const response = await fetch(url, { method: "HEAD" });
        return response.ok;
    } 
    catch (err) {
        return false;
    }
}
