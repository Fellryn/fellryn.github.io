import { levelText } from "./level-text/levelText.js";
import { getRgbSimilarity, rgbToString, stringToRgb } from "./helpers.js";

let mouseIsDown = false;
let bubbleFidelity = 30;
let level = 1;
const FRAME_SIZE = 600;
const COVER_TRANSITION_TIME = 250;
let isChangingLevel = false;

let mainFrameRef = null;
let mainFrameRect = null;
let bubbleSize = 0;

let currentColor = "rgb(255,0,0)";
const DEFAULT_BUBBLE_COLOR = "rgb(247, 246, 233)";
const COLOR_SIMILARITY_THRESHOLD = 0.9;
const FULL_PAINT_OFFSET = 0;
const EMPTY_PAINT_OFFSET = 80;
const AMOUNT_LOSS_MULTIPLIER = 5;

let lastDrynessCheck = 0;
const DRYNESS_CHECK_INTERVAL = 500;
const DRYNESS_COLOR_MODIFIER = 0.02;
const WETNESS_THRESHOLD_MIX_COLOR = 3;

let lastBubbleCheck = 0;
const BUBBLE_CHECK_INTERVAL = 1000;
let lastDrawCheck = 0;
const DRAW_CHECK_INTERVAL = 10;

let allBubbles = null;
let allBubbleRects = null;
let bubbleRectNeedsUpdate = new Map();
let bubbleSpatialGrid = new Map();
let cellSize = 50;

let item = null;
let itemActiveEl = null;
let itemCollisionBox = null;
let itemMoveSpeed = 500;
let itemRect = null;
const MAX_SATURATION = 20000;
let saturationLevelPerTick = 1;

let lastMouseX = 0;
let lastMouseY = 0;
let lastAngle = 0;

let debugActive = false;
let debugCurrX = null;
let debugCurrY = null;
let debugCurrColor = null;
let debugCurrColorOnBrush = null;
let debugMixRatio = null;

let hasTextToDisplay = false;
let lastTextUpdate = 0;
const TEXT_UPDATE_INTERVAL = 125;
let doTextPauseForCycles = 0;
const TEXT_PAUSE_CYCLES_LONG = 3;
const TEXT_PAUSE_CYCLES_SHORT = 1;
let hasDoneFirstCheck = false;
let talkTextArea = null;
let waitingForEventPre = false;
let waitingForEvent = false;
let lastEventFinished = false;
let targetEventString = "";
let eventString = "";
let blockSkipButton = false;
let lastEventCheck = 0;
const EVENT_CHECK_INTERVAL = 100;
let levelFunctions = [];
let lastFunctionCheck = 0;
const FUNCTION_CHECK_INTERVAL = 1000;
let latestImageRequest = 0;

const worker = new Worker("js/worker.js");

let levelBackground = [];
let levelGuideLines = [];
let levelTarget = [];


window.addEventListener("load", (e) => {
    mainFrameRef = document.getElementById("mainFrame"); 
    mainFrameRect = mainFrameRef.getBoundingClientRect();
    const mainFrame = document.getElementById("mainFrame");

    if ()

    if (mainFrame){
        setupMainFrame(mainFrame);
    }

    // const btnPopAllBubbles = document.getElementById("btnPopAllBubbs");
    // if (btnPopAllBubbles) {
    //     setupPopAllBubblesButton(btnPopAllBubbles);
    // }

    setTimeout(() => {

    const btnReset = document.getElementById("btnReset");
    if (btnReset) {
        setupResetButton(btnReset, mainFrame);
    }

    const btnDebugMenu = document.getElementById("btnDebugMenu");
    if (btnDebugMenu) {
        setupDebugButton(btnDebugMenu);
    }

    const btnRed = document.getElementById("btnColorRed");
    if (btnRed) {
        setupRedButton(btnRed);
    }

    const btnBlue = document.getElementById("btnColorBlue");
    if (btnBlue) {
        setupBlueButton(btnBlue);
    }

    const btnPainterView = document.getElementById("btnPainterView");
    if (btnPainterView) {
        setupPainterViewButton(btnPainterView);
    }

    setupScreenChangesListeners();

    setupPaints();

    setupTalkArea();

    setupFunctions();

    // checkAllBubbles();
}, 500);
});

// async function checkAllBubbles() {
//     await wait(500);
//     allBubbles.forEach((bubb) => {
//         // const [r, g, b] = bubb.bubbleColor.match(/\d+/g).map(Number);
//         if (bubb.bubbleColor.includes("NaN")) {
//             console.log("this one LYING" + bubb.x, bubb.y)
//         }
//     })
// }

function setupTalkArea() {
    talkTextArea = document.getElementById("talkText");
    const talkSkipButton = document.getElementById("btnTalkSkip");
    const yesButton = document.getElementById("btnTalkYes");
    const noButton = document.getElementById("btnTalkNo");

    if (yesButton) {
        yesButton.addEventListener('click', () => {
            if (waitingForEvent || waitingForEventPre) {
                if (eventString !== levelText[level].textContent.currentLine.eventString) {
                    levelText[level].textContent.lineIndex = yesButton.failedIndex;
                }
                else {
                    levelText[level].textContent.lineIndex = yesButton.targetIndex;
                    waitingForEvent = false;
                    waitingForEventPre = false;
                }
            }
            else {
                levelText[level].textContent.lineIndex = yesButton.targetIndex;
            }
            // levelText[level].textContent.currentLine.wordIndex = 0;
            hasTextToDisplay = true;
            doTextPauseForCycles = 1;
            hasDoneFirstCheck = false;

            yesButton.classList.remove("fade-in");
            yesButton.classList.add("fade-out");
            noButton.classList.remove("fade-in");
            noButton.classList.add("fade-out");
        });
    }

    if (noButton) {
        noButton.addEventListener('click', () => {
            levelText[level].textContent.lineIndex = noButton.targetIndex;
            // levelText[level].textContent.currentLine.wordIndex = 0;
            hasTextToDisplay = true;
            doTextPauseForCycles = 1;
            hasDoneFirstCheck = false;


            noButton.classList.remove("fade-in");
            noButton.classList.add("fade-out");
            yesButton.classList.remove("fade-in");
            yesButton.classList.add("fade-out");
        });
    }
    
    if (levelText.length - 1 >= level) {
        if (levelText[level].textContent) {
            hasTextToDisplay = true;
        }
    }
    else {
        return;
    }

    if (talkSkipButton) {
        talkSkipButton.addEventListener('click', () => {
            if (blockSkipButton) { return; }
            if (waitingForEvent && !hasTextToDisplay) { return; }
            if (levelText[level].textContent.lineIndex == -1) { return };
            if (levelText[level].textContent.nextLineTarget == -1) {
                changeLevel(1);
                return;
            }
            if (!hasTextToDisplay) { return; }

            // Get the delay that the current line has.
            const delayBeforeNextLine = levelText[level].textContent.currentLine.delayAfterWhole;
            // Check if there has been two cycles since the delay started.
            if (doTextPauseForCycles >= delayBeforeNextLine - 2) {
                // If so, don't let the skip button be pressed.
                return;
            } 
            // Otherwise, set the timer to 0 so the next line appears.
            else if (doTextPauseForCycles > 0) {
                doTextPauseForCycles = 0;
            }
            // If there is no active timer, then show the next line except the last word,
            // so that the normal checks may be performed. 
            // Block the skip button until the next text check.
            else {
                blockSkipButton = true;
                const newEl = document.createElement("span");
                let newText = levelText[level].textContent.currentLine.skipToLastWordAndDisplay().join(" ");
                newText += " ";
                newEl.textContent = newText;
                talkTextArea.textContent = "";
                talkTextArea.appendChild(newEl);
                setTextAreaHeight(true);
                // doTextPauseForCycles = delayBeforeNextLine;

                // if (levelText[level].textContent.getNextLine() == -1) {
                //     hasTextToDisplay = false;
                //     return;
                // };
            }
        });
    }
}

function showTextArea() {

}

function changeLevel(count) {
    level += count;
    window.localStorage.setItem("playerLevel", level);
    
    const highestPlayerLevel = Number(window.localStorage.getItem("playerLevel"));
    if (highestPlayerLevel == null || level > highestPlayerLevel) {
        window.localStorage.setItem("highestPlayerLevel", highestPlayerLevel);
    }

    setupBubbles(mainFrameRef);
}

function setTextAreaHeight(calculate = false, height = 0) {
    const talkPanel = document.querySelector('.talk-panel');
    if (calculate) {
        height = talkPanel.scrollHeight;
    }
    talkPanel.style.maxHeight = height + "px";
}

function updateText() {
    // Get some common properties that will be used throughout.
    const lineIndex = levelText[level].textContent.lineIndex;
    const wordIndex = lineIndex == -1 ? null : levelText[level].textContent.wordIndex;


    // If its the first word in the line, then clear the existing text.
    // Could change this so the existing text remains but is added to the text box.
    if (wordIndex == 0 && lineIndex != 0) {
        talkTextArea.textContent = "";
    }

    // Insert new line below version of above.
    // if (wordIndex == 0 && lineIndex != 0) {
    //     const lineBreak = document.createElement("br");
    //     talkTextArea.appendChild(lineBreak);
    // }

    // Check line first once for special details like is it a question, functions etc.

    if (!hasDoneFirstCheck && levelText[level].textContent.currentLine != null) {
        setCharacterImage(levelText[level].textContent.currentLine.char, levelText[level].textContent.currentLine.charAnim);
        levelText[level].textContent.currentLine.wordIndex = 0;
        talkTextArea.textContent = "";
        hasDoneFirstCheck = true;
        if (levelText[level].textContent.currentLine.willWaitForEvent) {
            // hasTextToDisplay = false;
            waitingForEventPre = true;
            lastEventFinished = false;
            // eventString = levelText[level].textContent.currentLine.eventString;
            // TODO: Optionally hide skip button for some events.
        }

        const questionInfo = levelText[level].textContent.isLineQuestion;
        if (questionInfo != null) {
            const tooltipText = levelText[level].textContent.currentLine.tooltipText;
            showQuestionButtons(questionInfo, tooltipText);
        }
    }


    // If its the last word and last line, then all text has been displayed so end display.
    // Or if there is no more lines to display because of branching choices.
    if (lineIndex == -1 ||
        (levelText[level].textContent.lines[lineIndex].isLastWord && levelText[level].textContent.isLastLine)) { 
        hasTextToDisplay = false;
        setCharacterImage(levelText[level].textContent.currentLine.char, levelText[level].textContent.currentLine.charAnimAfter);
        return;
    } 
    // If its the last word, but not the last line, get the delay and the next word.
    else if (levelText[level].textContent.lines[lineIndex].isLastWord && !levelText[level].textContent.isLastLine) {
        // Get the delay from the line.
        const delayBeforeNextLine = levelText[level].textContent.currentLine.delayAfterWhole;

        // Check if its a question. If it is, then wait for a response.
        const questionInfo = levelText[level].textContent.isLineQuestion;
        if (questionInfo != null ) {
            // const tooltipText = levelText[level].textContent.currentLine.tooltipText;
            hasTextToDisplay = false;
            setCharacterImage(levelText[level].textContent.currentLine.char, levelText[level].textContent.currentLine.charAnimAfter);
            // showQuestionButtons(questionInfo, tooltipText);
            return;
        }

        // Wait for an event (like during the tutorial).
        if (levelText[level].textContent.currentLine.willWaitForEvent && !lastEventFinished) {
            hasTextToDisplay = false;
            if (!lastEventFinished) {
                setCharacterImage(levelText[level].textContent.currentLine.char, levelText[level].textContent.currentLine.charAnimAfter);
                waitingForEvent = true;
                return;
            }
            // eventString = levelText[level].textContent.currentLine.eventString;
            // TODO: Optionally hide skip button for some events.
        }

        // If there is a delay, cause the delay and get the next line.
        if (delayBeforeNextLine) {
            doTextPauseForCycles = delayBeforeNextLine;
            setCharacterImage(levelText[level].textContent.currentLine.char, levelText[level].textContent.currentLine.charAnimAfter);
            levelText[level].textContent.getNextLine();
            hasDoneFirstCheck = false;
            return;
        // If there is no delay, then go straight to the next line.
        }
        else {
            setCharacterImage(levelText[level].textContent.currentLine.char, levelText[level].textContent.currentLine.charAnimAfter);
            levelText[level].textContent.getNextLine();
            hasDoneFirstCheck = false;
            return;
        }
    } 

    // Setup pause for next word if the current word has one.
    const hasPause = levelText[level].textContent.lines[lineIndex].checkPunctuationPause();
    doTextPauseForCycles = hasPause;
    
    // Add the current word to the display area and check text area height.
    const newEl = document.createElement("span");
    newEl.classList.add("fade-in");
    newEl.textContent = levelText[level].textContent.lines[lineIndex].getNextWord() + " ";
    talkTextArea.appendChild(newEl);
    setTextAreaHeight(true);


    // const testString = "Hello my good fellow! I see you want to paint today! Well, you're in luck, we have a wall you can paint right here! Hello my good fellow! I see you want to paint today! Well, you're in luck, we have a wall you can paint right here!";
    // const words = testString.split(" ");
    // currTextLength = words.length;
    // // currTextLength = testString.length;
    // if (currTextIndex < currTextLength) {
    //     const newEl = document.createElement("span");
    //     newEl.classList.add("fade-in");
    //     newEl.textContent = words[currTextIndex++] + " ";
    //     talkTextArea.appendChild(newEl);
    //     setTextAreaHeight(true);

    //     // Check if word contains punctation and do delay if so.
    //     // The tick counts down for a few beats rather than sending the next word.
    //     const punctation = words[currTextIndex - 1].match(/[.,!?;:]/);
    //     if (punctation?.includes(",")) {
    //         doTextPauseForCycles = TEXT_PAUSE_CYCLES_SHORT;
    //     } 
    //     else if (punctation) {
    //         doTextPauseForCycles = TEXT_PAUSE_CYCLES_LONG;
    //     }
    //     // talkTextArea.innerHTML += `<span class="fade-in">${words[currTextIndex++]} </span>`;
    // } else {
    //     hasTextToDisplay = false;
    // }
}

function showQuestionButtons(questionInfo, tooltipText) {
    const yesButton = document.getElementById("btnTalkYes");
    const noButton = document.getElementById("btnTalkNo");
    const yesToolTip = document.getElementById("talkTooltipTextYes");
    const noToolTip = document.getElementById("talkTooltipTextNo");
    const skipButton = document.getElementById("btnTalkSkip");

    skipButton.disabled = true;

    yesButton.classList.remove("fade-out");
    noButton.classList.remove("fade-out");
    yesButton.classList.add("fade-in");
    noButton.classList.add("fade-in");

    yesButton.targetIndex = questionInfo[1];
    yesButton.failedIndex = questionInfo[3];
    noButton.targetIndex = questionInfo[2];

    yesToolTip.textContent = tooltipText[0];
    noToolTip.textContent = tooltipText[1];
}

function setCharacterImage(char, charAnim) {
    const requestTime = Date.now();
    latestImageRequest = requestTime;
    
    const image = document.getElementById("talkGraphicImage");
    const preload = new Image();
    preload.onload = () => {
        if (requestTime === latestImageRequest) {
            image.setAttribute("src", preload.src);
        }
    }

    preload.src = `images/${charAnim}-char${char}.gif`;
}


function setupScreenChangesListeners() {
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            doUIRefresh();
        }, 100);
    });

    window.addEventListener('scroll', () => {
        let scrollTimeout;
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
            doUIRefresh();
        }, 50);
    });
}

function doUIRefresh() {
    if (mainFrameRef != null) {
        mainFrameRect = mainFrameRef.getBoundingClientRect();
    }

    if (allBubbles.length > 0) {
        bubbleRectNeedsUpdate = true;
    }
}

async function setupMainFrame(mainFrame) {
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
    await setupBubbles(mainFrame);

    // Begin tick loop.
    requestAnimationFrame(tick);

    // Setup painting items.
    setupPaintItems();


}

function getLevelInformation() {

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = async () => {
        const bitmap = await createImageBitmap(img);
        worker.postMessage({ type: "processBackground", bitmap }, [bitmap])
    };
    img.src = `images/level-images/background-${level + 1}.png`;
    

    const imgTarget = new Image();
    imgTarget.crossOrigin = "anonymous";
    imgTarget.onload = async () => {
        const bitmap = await createImageBitmap(img);
        worker.postMessage({ type: "processTarget", bitmap }, [bitmap])
    };
    imgTarget.src = `images/level-images/target-${level + 1}.png`;

    const imgGuideLines = new Image();
    imgGuideLines.crossOrigin = "anonymous";
    imgGuideLines.onload = async () => {
        const bitmap = await createImageBitmap(imgGuideLines);
        worker.postMessage({ type: "processGuidelines", bitmap }, [bitmap])
    };
    imgGuideLines.src = `images/level-images/guidelines-${level + 1}.png`;
}

function setupPaints() {
    const redPaintPlaceholder = document.getElementById("paintBucketRedPlaceholder");

    const allPaints = [redPaintPlaceholder];

    allPaints.forEach((paint) => {
        paint.amount = 100;
        paint.activeEls = redPaintPlaceholder.querySelectorAll(".active-el");
    });

    if (redPaintPlaceholder) {
        redPaintPlaceholder.addEventListener('click', () => {
            // currentColor = "rgb(255,0,0)";
            // setColorOnItem(currentColor);

            const colorSimilarity = getRgbSimilarity(item.currColor, "rgb(255,0,0)");
            if (colorSimilarity > COLOR_SIMILARITY_THRESHOLD || item.querySelector(".active-el").origColor == currentColor) {

                const amountLoss = 1 - (item.saturationLevel / MAX_SATURATION);
                redPaintPlaceholder.amount -= amountLoss * AMOUNT_LOSS_MULTIPLIER;
                const newTopOffset = Math.abs(((redPaintPlaceholder.amount / 100) * (FULL_PAINT_OFFSET - EMPTY_PAINT_OFFSET)) - (FULL_PAINT_OFFSET - EMPTY_PAINT_OFFSET));

                redPaintPlaceholder.activeEls.forEach((el) => {
                    el.style.top = newTopOffset + "px";
                });
                currentColor =  "rgb(255,0,0)";
                setColorOnItem(currentColor);

                if (waitingForEvent || waitingForEventPre) {
                    eventString = "putPaintOnTool";
                }
            }
        });
    }
    
}

function setupPaintItems() {
    const paintRollerPlaceholder = document.getElementById("rollingPinPlaceholder");
    const paintBrushPlaceholder = document.getElementById("paintBrushPlaceholder");
    const paintBrushSmallPlaceholder = document.getElementById("paintBrushSmallPlaceholder")
    const allItems = [paintRollerPlaceholder, paintBrushPlaceholder, paintBrushSmallPlaceholder];

    paintRollerPlaceholder.firstElementChild.rotates = true;
    paintBrushPlaceholder.firstElementChild.rotates = false;
    paintBrushSmallPlaceholder.firstElementChild.rotates = false;

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

            if (!item || item != paintRollerPlaceholder.firstElementChild) {
                if (item) {
                    resetItem(item);
                }
                item = paintRollerPlaceholder.firstElementChild;
                item.parentElement.style.zIndex = "30";
                itemActiveEl = paintRollerPlaceholder.querySelector('.active-el');
                itemCollisionBox = paintRollerPlaceholder.querySelector('.rolling-pin-collision-box');
                currentColor = item.currColor;
                item.style.willChange = "transform";
                if (waitingForEvent || waitingForEventPre) {
                    eventString = "pickUpTool";
                }
            }
            else {
                resetItem(item);
            }
        });
    }

    if (paintBrushPlaceholder) {
        paintBrushPlaceholder.addEventListener('click', () => {

            if (!item || item != paintBrushPlaceholder.firstElementChild) {
                if (item) {
                    resetItem(item);
                }
                item = paintBrushPlaceholder.firstElementChild;
                item.parentElement.style.zIndex = "30";
                itemActiveEl = paintBrushPlaceholder.querySelector('.active-el');
                itemCollisionBox = paintBrushPlaceholder.querySelector('.paintbrush-collision-box');
                currentColor = item.currColor;
                item.style.willChange = "transform";
                if (waitingForEvent || waitingForEventPre) {
                    eventString = "pickUpTool";
                }
            }
            else {
                resetItem(item);
            }
        });
    }

    if (paintBrushSmallPlaceholder) {
        paintBrushSmallPlaceholder.addEventListener('click', () => {

            if (!item || item != paintBrushSmallPlaceholder.firstElementChild) {
                if (item) {
                    resetItem(item);
                }
                item = paintBrushSmallPlaceholder.firstElementChild;
                item.parentElement.style.zIndex = "30";
                itemActiveEl = paintBrushSmallPlaceholder.querySelector('.active-el');
                itemCollisionBox = paintBrushSmallPlaceholder.querySelector('.paintbrush-small-collision-box');
                currentColor = item.currColor;
                item.style.willChange = "transform";
                if (waitingForEvent || waitingForEventPre) {
                    eventString = "pickUpTool";
                }
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

    worker.onmessage = (e) => {
        if (e.data.type === "backgroundResult") {
            // console.log(e.data.pixelColors.join())
            levelBackground = e.data.pixelColors;
        }

        if (e.data.type === "guideLinesResult") {
            levelGuideLines = e.data.shadowInformation;
        }
    };

    // Get level information like background color and where shapes are on the wall.
    getLevelInformation(); 

    await wait(500);

    const size = FRAME_SIZE / (bubbleFidelity * 2);
    let totalCount = (FRAME_SIZE / size) * (FRAME_SIZE / size);
    totalCount = Math.trunc((totalCount * 100)/ 100);
    const fragment = document.createDocumentFragment();
    bubbleSize = size; 

    const coverElement = document.createElement("div");
    coverElement.classList = "cover";
    coverElement.classList.add("fade-out");
    fragment.appendChild(coverElement);

    const halfCoverElement = document.createElement("div");
    halfCoverElement.classList.add("half-cover");
    halfCoverElement.classList.add("fade-out");
    mainFrameRef.prepend(halfCoverElement);

    let cellX = 0;
    let cellY = 0; 
    const rowLength = Math.trunc((FRAME_SIZE / size) * 100 / 100);

    for (let i = 0; i < totalCount; i++){

        

        const newBubble = document.createElement("div");
        newBubble.classList.add("bubble");

        // const bubbleStyle = window.getComputedStyle(newBubble);
        // const backgroundColor = bubbleStyle.backgroundColor;

        const r = levelBackground[i][0];
        const g = levelBackground[i][1];
        const b = levelBackground[i][2];

        newBubble.bubbleColor = `rgb(${r},${g},${b})`;
        // newBubble.bubbleColor = DEFAULT_BUBBLE_COLOR;
        newBubble.style.backgroundColor = newBubble.bubbleColor;

        if (levelGuideLines.length > 0) {
            for (let info of levelGuideLines) {
                if (info.pixel === i) {
                    // console.log("shadow set on cell " + i);
                    newBubble.style.boxShadow = "1px 0px 0px #00000020";
                    newBubble.style.zIndex = "20";
                    continue;
                }
            }
        }
        
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
    // console.log(`Created ${totalCount} bubbles`);

    const debugBubbles = document.getElementById("debugBubbles");
    debugBubbles.textContent = totalCount;

    const debugPerAxis = document.getElementById("debugPerAxis");
    debugPerAxis.textContent = rowLength;

    debugCurrX = document.getElementById("debugCurrX");
    debugCurrY = document.getElementById("debugCurrY");
    debugCurrColor = document.getElementById("debugCurrColor");
    debugCurrColorOnBrush = document.getElementById("debugCurrColorBrush");
    debugMixRatio = document.getElementById("debugMixRatio");
}

function setupFunctions() {
    if (levelText.length - 1 >= level) {
        if (levelText[level].functions) {
            levelFunctions = Object.keys(levelText[level].functions);
        }
    }
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
    if (timestamp - lastDrawCheck >= DRAW_CHECK_INTERVAL) {
        checkCollisions();
        lastDrawCheck = timestamp;
    }

    if (timestamp - lastDrynessCheck >= DRYNESS_CHECK_INTERVAL) {
        // console.log("fired check");
        checkPaint();
        lastDrynessCheck = timestamp;
    }

    if (timestamp - lastBubbleCheck >= BUBBLE_CHECK_INTERVAL) {
        // console.log("fired bubble check");
        checkBubbles();
        lastBubbleCheck = timestamp;
    }

    if (bubbleRectNeedsUpdate) {
        if (allBubbles != null && allBubbles.length > 0) {
            allBubbleRects = new Map(Array.from(allBubbles).map(b => [b, b.getBoundingClientRect()]));
            bubbleRectNeedsUpdate = false;
        }
    }

    if (hasTextToDisplay) {
        if (timestamp - lastTextUpdate >= TEXT_UPDATE_INTERVAL) {
            if (blockSkipButton) {
                blockSkipButton = false;
            }
            if (doTextPauseForCycles > 0) {
                doTextPauseForCycles--;
            } 
            else {
                updateText();
            }
            lastTextUpdate = timestamp;
        }
    }
    
    if (waitingForEvent || waitingForEventPre) {
        if (timestamp - lastFunctionCheck >= FUNCTION_CHECK_INTERVAL) {
            const context = {
                allBubbles
            }

            for (let funcName of levelFunctions) {
                if (levelText[level].functions?.[funcName](context)) {
                    eventString = funcName;
                }
            }

            lastFunctionCheck = timestamp;
            // if (levelText[level].functions.checkWholeWallPainted(allBubbles, "rgb(255,0,0)", 0.8)) {
            //     eventString = "wallPaintedRed";
            // }
        } 

        if (timestamp - lastEventCheck >= EVENT_CHECK_INTERVAL) {
            if (eventString === levelText[level].textContent.currentLine.eventString) {
                waitingForEvent = false;
                waitingForEventPre = false;
                hasTextToDisplay = true;
                lastEventFinished = true;
                // doTextPauseForCycles = 0;
                // levelText[level].textContent.getNextLine();
            }
            lastEventCheck = timestamp;
        } 
    }
    

    // debug ticks.
    if (debugActive) {
        const { r: r, g: g, b: b } = stringToRgb(currentColor);
        debugCurrColorOnBrush.textContent = `${r},${g},${b}`;
    }

    requestAnimationFrame(tick);
}

async function checkPaint() {
    if (allBubbles == null || allBubbles.length <= 0) { return; }
    const recentBubbles = Array.from(allBubbles).filter(b => b.dataset.recent !== "0");
    recentBubbles.forEach((bubble) => {
        let currDryness = Number(bubble.dataset.recent);
        bubble.dataset.recent = --currDryness;
        if (currDryness < 0) {
            bubble.dataset.recent = 0;
        }
        if (currDryness < 6 && currDryness > 0) {
            const newColor = mixRgb(bubble.bubbleColor, 'rgb(0,0,0)', DRYNESS_COLOR_MODIFIER); 
            bubble.bubbleColor = newColor;
            // currColor = window.getComputedStyle(bubble).backgroundColor;
            bubble.style.backgroundColor = newColor;

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

// function setupPopAllBubblesButton(button) {
//     button.addEventListener('click', () => {
//         const allBubbles = document.querySelectorAll('.bubble');
//         allBubbles.forEach((bubble) => {
//             bubble.classList.add("popped");
//         });
//     });
// }

function setupResetButton(button, mainFrame) {
    button.addEventListener('click', () => {
    //    bubbleFidelity = 30;
    //    level = 0;

       setupBubbles(mainFrame); 
    });
}

function setupDebugButton(button) {
    const debugMenu = document.getElementById("debugMenu");
    button.addEventListener('click', () => {
        if (debugMenu) {
            const visState = debugMenu.style.visibility;
            if (visState === "") {
                debugMenu.style.visibility = "visible";
                debugActive = true;
            } 
            else {
                debugMenu.style.visibility = "";
                debugActive = false;
            }
        }
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

function setupPainterViewButton(button) {
    button.isOn = false;

    
    button.addEventListener('click', () => {
        const halfCoverElement = document.querySelector(".half-cover");
        button.isOn = !button.isOn;
        if (button.isOn) {
            halfCoverElement.classList.remove("fade-out");
            halfCoverElement.classList.add("fade-in");
            halfCoverElement.style.zIndex = "10";
        }
        else {
            halfCoverElement.classList.add("fade-out");
            halfCoverElement.classList.remove("fade-in");            
        }


        // allBubbles.forEach((bubble) => {
        //     if (button.isOn) {
        //         bubble.classList.add("painter-view");
        //     } 
        //     else {
        //         bubble.classList.remove("painter-view");
        //     }
        // });
    });
}

function setColorOnItem(color) {
    if (item != null) {
        const itemActiveEl = item.querySelector('.active-el');
        itemActiveEl.style.backgroundColor = color;
        item.saturationLevel = MAX_SATURATION;
        item.currColor = color;
    }
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
    // Debug stuff.
    if (e.target.classList.contains("bubble"))
    {
        debugCurrX.textContent = e.target.x;
        debugCurrY.textContent = e.target.y;
        const {r:r, g:g, b:b} = stringToRgb(e.target.bubbleColor);
        debugCurrColor.textContent = `${r},${g},${b}`

    }

    if (item != null) {
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
            
            const currWetLevel = Number(bubble.dataset.recent);
            
            const mixModifier = Math.max(0.7, (currWetLevel / 10));
            const saturationModifier = item.saturationLevel / MAX_SATURATION;

            const newColor = mixRgb(bubble.bubbleColor, currentColor, (mixModifier * saturationModifier));
            // if (newColor.includes("NaN")) {
            //     console.log("nan detect");
            // }

            bubble.bubbleColor = newColor;
            bubble.style.backgroundColor = newColor; 

            if (currWetLevel >= WETNESS_THRESHOLD_MIX_COLOR) {
                const mixRatio = Math.max((1 + (WETNESS_THRESHOLD_MIX_COLOR / 10)) - (currWetLevel / 10), saturationModifier);
                currentColor = mixRgb(bubble.bubbleColor, currentColor, mixRatio);
                debugMixRatio.textContent = Math.trunc(mixRatio * 100) / 100;
            }

            if (item.saturationLevel > 0) {
                item.saturationLevel -= saturationLevelPerTick;
                if (item.saturationLevel % 1000 == 0)
                {
                    // const activeEl = item.querySelector('.active-el');
                    itemActiveEl.style.backgroundColor = mixRgb(itemActiveEl.origColor, currentColor, item.saturationLevel / MAX_SATURATION);
                }
            }

            if (currWetLevel < 10 && item.saturationLevel > 0) {
                bubble.dataset.recent = currWetLevel + roundToQuarter(saturationModifier / 2);
            }

            // scheduler.yield();

            if (waitingForEvent || waitingForEventPre) {
                eventString = "putPaintOnCanvas";
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

function roundToQuarter(num) {
    return Math.round(num / 0.25) * 0.25;
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




function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function setupDebugPanel() {


}