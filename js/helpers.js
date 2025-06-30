const SHADOW_COLOR = "#00000020";

export const shadowSettings = Object.freeze({
  "N":    `0px -1px 0px ${SHADOW_COLOR}`,
  "NE":   `1px -1px 0px ${SHADOW_COLOR}`,
  "E":    `1px 0px 0px ${SHADOW_COLOR}`,
  "SE":   `1px 1px 0px ${SHADOW_COLOR}`,
  "S":    `0px 1px 0px ${SHADOW_COLOR}`,
  "SW":   `-1px 1px 0px ${SHADOW_COLOR}`,
  "W":    `-1px 0px 0px ${SHADOW_COLOR}`,
  "NW":   `-1px -1px 0px ${SHADOW_COLOR}`,

  "ND":   `0px -4px 0px ${SHADOW_COLOR}`,
  "NED":  `4px 4px 0px ${SHADOW_COLOR}, 0px -1px 0px ${SHADOW_COLOR}`,
  "ED":   `4px 4px 0px ${SHADOW_COLOR}`,
  "SED":  `4px 4px 0px ${SHADOW_COLOR}`,
  "SD":   `4px 4px 0px ${SHADOW_COLOR}`,
  "SWD":  `4px 4px 0px ${SHADOW_COLOR}, -1px 0px 0px ${SHADOW_COLOR}`,
  "WD":   `-4px 0px 0px ${SHADOW_COLOR}`,
  "NWD":  `4px 4px 0px ${SHADOW_COLOR}, 0px -1px 0px ${SHADOW_COLOR}`,

  "BLOCK": ""
});



// export const shadowSettings = Object.freeze({
//     "N": "0px -1px 0px",
//     "NE": "1px -1px 0px",
//     "E": "1px 0px 0px",
//     "SE": "1px 1px 0px",
//     "S": "0px 1px 0px",
//     "SW": "-1px 1px 0px",
//     "W": "-1px 0px 0px",
//     "NW": "-1px -1px 0px",

//     "ND": "0px -3px 0px",
//     "NED": "2px -3px 0px",
//     "ED": "2px 2px 0px",
//     "SED": "2px 3px 0px",
//     "SD": "2px 3px 0px",
//     "SWD": "-2px 3px 0px",
//     "WD": "-2px 0px 0px",
//     "NWD": "-2px -3px 0px"
// });




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

