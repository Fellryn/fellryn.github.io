let mouseIsDown = false;
let level = 30;
const FRAME_SIZE = 600;
const COVER_TRANSITION_TIME = 250;
let isChangingLevel = false;



let mainFrameRef = null;
let mainFrameRect = null;
let bubbleSize = 0;

let currentColor = "rgb(255,0,0)";
const DEFAULT_BUBBLE_COLOR = "rgb(247, 246, 233)";

let lastDrynessCheck = 0;
const drynessCheckInterval = 500;
let lastBubbleCheck = 0;
const bubbleCheckInterval = 1000;
let lastDrawCheck = 0;
const drawCheckInterval = 5;

let allBubbles = null;
let allBubbleRects = null;
let bubbleRectNeedsUpdate = new Map();
let bubbleSpatialGrid = new Map();
let cellSize = 50;

let currItem = "rollPin";
let item = null;
let itemActiveEl = null;
let itemCollisionBox = null;
let itemMoveSpeed = 500;
let itemRect = null;
const MAX_SATURATION = 20000;
let saturationLevelPerTick = 1;
// let saturationLevel = MAX_SATURATION;
let lastMouseX = 0;
let lastMouseY = 0;
let lastAngle = 0;

window.addEventListener("load", (e) => {
    mainFrameRef = document.getElementById("mainFrame"); 
    mainFrameRect = mainFrameRef.getBoundingClientRect();
    const mainFrame = document.getElementById("mainFrame");
    if (mainFrame){
        setupMainFrame(mainFrame);
    }

    const btnPopAllBubbles = document.getElementById("btnPopAllBubbs");
    if (btnPopAllBubbles) {
        setupPopAllBubblesButton(btnPopAllBubbles);
    }

    const btnReset = document.getElementById("btnReset");
    if (btnReset) {
        setupResetButton(btnReset, mainFrame);
    }

    const btnRed = document.getElementById("btnColorRed");
    if (btnRed) {
        setupRedButton(btnRed);
    }

    const btnBlue = document.getElementById("btnColorBlue");
    if (btnBlue) {
        setupBlueButton(btnBlue);
    }

    checkAllBubbles();
});

async function checkAllBubbles() {
    await wait(500);
    allBubbles.forEach((bubb) => {
        // const [r, g, b] = bubb.bubbleColor.match(/\d+/g).map(Number);
        if (bubb.bubbleColor.includes("NaN")) {
            console.log("this one LYING" + bubb.x, bubb.y)
        }
    })
}

function setupMainFrame(mainFrame) {
    // Setup clicking/dragging events.
    mainFrame.addEventListener('click', (e) => {
        handleMainFrameClick(e);
    });

    document.addEventListener('mousedown', (e) => {
        handleMainFrameMouseDown(e);
    });

    document.addEventListener('mouseup', (e) => {
        handleMainFrameMouseUp(e);
    });

    document.addEventListener('mousemove', (e) => {
        handleMainFrameMouseMove(e);
    });

    // Setup bubbles in frame.
    setupBubbles(mainFrame);

    // Begin tick loop.
    requestAnimationFrame(tick);

    // Setup painting items.
    setupPaintItems();
}

function setupPaintItems() {
    const paintRollerPlaceholder = document.getElementById("rollingPinPlaceholder");
    const paintBrushPlaceholder = document.getElementById("paintBrushPlaceholder");
    const allItems = [paintRollerPlaceholder, paintBrushPlaceholder];

    paintRollerPlaceholder.firstElementChild.rotates = true;
    paintBrushPlaceholder.firstElementChild.rotates = false;

    allItems.forEach((i) => {
        const originalColor = window.getComputedStyle(i.querySelector('.active-el')).backgroundColor;
        i.querySelector('.active-el').origColor = originalColor;
        i.firstElementChild.currColor = originalColor;
        i.firstElementChild.saturationLevel = 0;
    });
    
    // const placeHolderActiveEl = paintRollerPlaceholder.querySelector('.active-el');
    // const originalColor = window.getComputedStyle(placeHolderActiveEl).backgroundColor;
    // placeHolderActiveEl.origColor = originalColor;

    if (paintRollerPlaceholder) {
        paintRollerPlaceholder.addEventListener('click', () => {

            if (!item) {
            item = paintRollerPlaceholder.firstElementChild;
            item.parentElement.style.zIndex = "30";
            itemActiveEl = paintRollerPlaceholder.querySelector('.active-el');
            itemCollisionBox = paintRollerPlaceholder.querySelector('.rolling-pin-collision-box');
            currentColor = item.currColor;
            item.style.willChange = "transform";
            } 
            else {
                resetItem(item);
            }
        });
    }

    if (paintBrushPlaceholder) {
        paintBrushPlaceholder.addEventListener('click', () => {

            if (!item) {
            item = paintBrushPlaceholder.firstElementChild;
            item.parentElement.style.zIndex = "30";
            itemActiveEl = paintBrushPlaceholder.querySelector('.active-el');
            itemCollisionBox = paintBrushPlaceholder.querySelector('.paintbrush-collision-box');
            currentColor = item.currColor;
            item.style.willChange = "transform";
            } 
            else {
                resetItem(item);
            }
        });
    }
}

function resetItem(itemEl) {
    itemEl.animate({
        left: `${itemEl.parentElement.offsetLeft}px`,
        top: `${itemEl.parentElement.offsetTop}px`,
        rotate: `0deg`
    }, { duration: itemMoveSpeed, fill: "forwards", easing: "cubic-bezier(.07,.91,.02,1)" });
    itemEl.parentElement.style.zIndex = "";
    itemEl.style.willChange = "";
    item = null;
}

async function setupBubbles(mainFrame) {
    const cover = mainFrame.querySelector('.cover');
    if (cover) {
        cover.classList.remove("fade-out");
        cover.classList.add("fade-in");
    
    
        await wait(COVER_TRANSITION_TIME);
    }
    
    mainFrame.textContent = "";

    const size = FRAME_SIZE / (level * 2);
    let totalCount = (FRAME_SIZE / size) * (FRAME_SIZE / size);
    totalCount = Math.trunc((totalCount * 100)/ 100);
    const fragment = document.createDocumentFragment();
    bubbleSize = size; 

    const coverElement = document.createElement("div");
    coverElement.classList = "cover";
    coverElement.classList.add("fade-out");
    fragment.appendChild(coverElement);

    let cellX = 0;
    let cellY = 0; 
    const rowLength = Math.trunc((FRAME_SIZE / size) * 100 / 100);

    for (let i = 0; i < totalCount; i++){

        const newBubble = document.createElement("div");
        newBubble.classList.add("bubble");

        // const bubbleStyle = window.getComputedStyle(newBubble);
        // const backgroundColor = bubbleStyle.backgroundColor;
        newBubble.bubbleColor = DEFAULT_BUBBLE_COLOR;
        newBubble.style.backgroundColor = newBubble.bubbleColor;

        
        newBubble.style.width = `${size}px`;
        newBubble.style.height = `${size}px`;

        newBubble.dataset.recent = 0;

        newBubble.x = cellX;
        newBubble.y = cellY;

        cellX++;
        if (i == rowLength * (cellY + 1) - 1)
        {
            cellY++;
            cellX = 0;
        }

        fragment.appendChild(newBubble);
    }

    mainFrame.appendChild(fragment);

    isChangingLevel = false;
    allBubbles = document.querySelectorAll(".bubble:not(.popped)");

    bubbleSpatialGrid.clear();
    allBubbles.forEach((bubble) => {
        const bubbleXPos = bubble.x * bubbleSize;
        const bubbleYPos = bubble.y * bubbleSize;

        const key = `${Math.floor(bubbleXPos / cellSize)},${Math.floor(bubbleYPos / cellSize)}`;
        if (!bubbleSpatialGrid.has(key)) {
            bubbleSpatialGrid.set(key, []);
        }
        bubbleSpatialGrid.get(key).push(bubble);
    });

    // item = document.querySelector(".rolling-pin-middle");
    bubbleRectNeedsUpdate = true;
    // console.log("is changing level false")
    console.log(`Created ${totalCount} bubbles`);
}

function checkBubbles() {
    if (!isChangingLevel) {
        const anyBubble = mainFrame.querySelector(".bubble:not(.popped)");

        if (!anyBubble)
        {
            console.log('level finished');
            isChangingLevel = true;
            console.log("is changing level true")
            level++;
            setupBubbles(mainFrame);
            checkLevelRules(mainFrame);
        }        
    }
    
    // requestAnimationFrame(checkBubbles);
}

function tick(timestamp) {
    if (timestamp - lastDrawCheck >= drawCheckInterval) {
        checkCollisions();
        lastDrawCheck = timestamp;
    }

    if (timestamp - lastDrynessCheck >= drynessCheckInterval) {
        // console.log("fired check");
        checkPaint();
        lastDrynessCheck = timestamp;
    }

    if (timestamp - lastBubbleCheck >= bubbleCheckInterval) {
        // console.log("fired bubble check");
        checkBubbles();
        lastBubbleCheck = timestamp;
    }

    if (bubbleRectNeedsUpdate) {

        allBubbleRects = new Map(Array.from(allBubbles).map(b => [b, b.getBoundingClientRect()]));
        bubbleRectNeedsUpdate = false;
    }
    requestAnimationFrame(tick);
}

async function checkPaint() {
    const recentBubbles = Array.from(allBubbles).filter(b => b.dataset.recent !== "0");
    recentBubbles.forEach((bubble) => {
        currDryness = Number(bubble.dataset.recent);
        bubble.dataset.recent = --currDryness;
        if (currDryness < 0) {
            bubble.dataset.recent = 0;
        }
        if (currDryness < 6 && currDryness > 0) {
            currColor = window.getComputedStyle(bubble).backgroundColor;
            bubble.style.backgroundColor = mixRgb(currColor, 'rgb(0,0,0)', 0.01);

        }
    });
    //  await wait(250);
    // requestAnimationFrame(() => checkPaint(mainFrame));
}

function checkLevelRules(mainFrame) {
    // switch (level) {
        // case default:
            const randomAngle = getRandomNumber(-60, 60);

            // mainFrame.style.transform = `perspective(1000px) rotateY(${randomAngle}deg) rotateX(${randomAngle / 2}deg) rotateZ(${randomAngle / 4}deg) translateX(50%) translateY(50%)`;
            // break;
    // }
}

function setupPopAllBubblesButton(button) {
    button.addEventListener('click', () => {
        const allBubbles = document.querySelectorAll('.bubble');
        allBubbles.forEach((bubble) => {
            bubble.classList.add("popped");
        });
    });
}

function setupResetButton(button, mainFrame) {
    button.addEventListener('click', () => {
       level = 30;

       setupBubbles(mainFrame); 
    });
}

function setupRedButton(button) {
    button.addEventListener('click', () => {
        currentColor = "rgb(255,0,0)";
        setColorOnItem(currentColor);
    });
}

function setupBlueButton(button) {
    button.addEventListener('click', () => {
        currentColor = "rgb(0,0,255)";
        setColorOnItem(currentColor);        
    });
}

function setColorOnItem(color) {
    const itemActiveEl = item.querySelector('.active-el');
    itemActiveEl.style.backgroundColor = color;
    item.saturationLevel = MAX_SATURATION;
    item.currColor = color;
}

function handleMainFrameClick(e) {
    // const target = e.target;
    // if (target) {
    //     popBubble(target);
    // }
}

function handleMainFrameMouseDown(e) {
    mouseIsDown = true;
    // requestAnimationFrame(checkCollisions);
}

function handleMainFrameMouseUp(e) {
    mouseIsDown = false;
}

function handleMainFrameMouseMove(e) {
    if (item != null) {
        // const rollingPin = document.getElementById('rollingPin');
        let x = e.clientX + window.scrollX;
        let y = e.clientY + window.scrollY;

        let rotationAngle = lastAngle;
        if (item.rotates ) {
            if (!mouseIsDown) {
                rotationAngle = getRotationAngle(lastMouseX, lastMouseY, x, y);
                rotationAngle = getSmoothedAngle(lastAngle, rotationAngle);
            }
        } else {
            rotationAngle = -135;
        }
        

        item.animate({
            left: `${x - 50}px`,
            top: `${y - 50}px`,
            rotate: `${rotationAngle + 90}deg`
        }, {duration: itemMoveSpeed, fill: "forwards"})

        lastMouseX = x;
        lastMouseY = y;
        lastAngle = rotationAngle;


    }
    
    // if (!mouseIsDown) {
    //     return;
    // }
    // const target = e.target;
    
    // if (target) {
    //     popBubble(target);
    // }
}

function popBubble(bubble) {
    
    if (bubble.classList.contains("bubble") && !bubble.classList.contains("popped")){
        bubble.classList.add("popped");

        const randomNum = getRandomNumber(0.8, 0.95);
        console.log(randomNum);

        bubble.style.transform = `scaleX(${randomNum}) scaleY(${randomNum})`;
    }
}

function getRandomNumber(min, max) {
    const randomNum = Math.random() * (max - min) + min;
    return Math.trunc(randomNum * 100) / 100;
}

function checkCollisions() {
        if (!mouseIsDown || item == null) {
        return;
    }

    // const allBubbles = document.querySelectorAll(".bubble:not(.popped)");
    // const item = document.querySelector('.rolling-pin-middle');


    const nearbyBubbles = [];
    itemRect = itemCollisionBox.getBoundingClientRect();
    // const mouseGridPosX = Math.trunc(((itemRect.left + (itemRect.width / 2)) - mainFrameRect.left) / bubbleSize) * 100 / 100;
    // const mouseGridPosY = Math.trunc(((itemRect.top + (itemRect.height / 2)) - mainFrameRect.top) / bubbleSize) * 100 / 100;
    const mouseGridPosX = Math.floor(((itemRect.left + (itemRect.width / 2)) - mainFrameRect.left) / cellSize);
    const mouseGridPosY = Math.floor(((itemRect.top + (itemRect.height / 2)) - mainFrameRect.top) / cellSize);

    for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
            const key = `${mouseGridPosX + dx},${mouseGridPosY + dy}`;
            const group = bubbleSpatialGrid.get(key);
            if (group) {
                nearbyBubbles.push(...group);
            }
        }
    }

    // console.log("X: " + mouseGridPosX, "Y: " + mouseGridPosY);

    nearbyBubbles.forEach((bubble) => {
        // bubble.style.backgroundColor = "black";
        if (checkCollisionOfDivs(itemCollisionBox, bubble)) {
            
            const currDryness = Number(bubble.dataset.recent);
            
            const mixModifier = Math.max(0.7, (currDryness / 10));
            const saturationModifier = item.saturationLevel / MAX_SATURATION;

            const newColor = mixRgb(bubble.bubbleColor, currentColor, (mixModifier * saturationModifier));
            if (newColor.includes("NaN")) {
                console.log("nan detect");
            }
            bubble.bubbleColor = newColor;
            bubble.style.backgroundColor = newColor; 

            if (item.saturationLevel > 0) {
                item.saturationLevel -= saturationLevelPerTick;
                if (item.saturationLevel % 1000 == 0)
                {
                    // const activeEl = item.querySelector('.active-el');
                    itemActiveEl.style.backgroundColor = mixRgb(itemActiveEl.origColor, currentColor, item.saturationLevel / 10000);
                }
            }

            if (currDryness < 10 && item.saturationLevel > 0) {
                bubble.dataset.recent = currDryness + 1;
            }
            // console.log(currDryness);
            // console.log(`X: ${bubble.x}, Y: ${bubble.y}`);
        }
    });
        // requestAnimationFrame(checkCollisions);
}

function checkCollisionOfDivs(div1, div2) {
    // const x = window.clientX + window.scrollX;
    // const y = window.clientY + window.scrollY;
    if (!mainFrameRect) {
        return;
    }

    // const mainFrameRect = mainFrameRef.getBoundingClientRect();
    // const r1 = div1.getBoundingClientRect();


    // const dx = itemRect.left - div2.offsetLeft - mainFrameRect.left;
    // const dy = itemRect.top - div2.offsetTop - mainFrameRect.top;
    // if (!(dx * dx + dy * dy < 75 * 75)) {
    //     return;
    // }

    const r2 = allBubbleRects.get(div2);
    // div2.style.backgroundColor = "black";

    return !(
        itemRect.right < r2.left ||
        itemRect.left > r2.right ||
        itemRect.bottom < r2.top ||
        itemRect.top > r2.bottom
    );
}

function getRotationAngle(prevX, prevY, currX, currY) {
    const dx = currX - prevX;
    const dy = currY - prevY;
    const angleRadians = Math.atan2(dy, dx);
    const angleDegrees = angleRadians * (180 / Math.PI);
    return angleDegrees;
}

function getSmoothedAngle(prevAngle, newAngle) {
    let delta = newAngle - prevAngle;
    delta = ((delta + 180) % 360) - 180;
    return prevAngle + delta;
}

function mixRgb(c1, c2, ratio = 0.5) {

    const { r:r1, g: g1, b: b1} = stringToRgb(c1);
    const { r:r2, g: g2, b: b2} = stringToRgb(c2);

    const mixedColour = {
        r: Math.round(r1 * (1 - ratio) + r2 * ratio),
        g: Math.round(g1 * (1 - ratio) + g2 * ratio),
        b: Math.round(b1 * (1 - ratio) + b2 * ratio)
    };
    return rgbToString(mixedColour);
}

function rgbToString({r, g, b}) {
    return `rgb(${r},${g},${b})`;
}

function stringToRgb(color) {
    const [r, g, b] = color.match(/\d+/g).map(Number);
    return {r, g, b};
}

function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

