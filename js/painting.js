import { levelText } from "./level-text/levelText.js";
import { getRgbSimilarity, rgbToString, stringToRgb, fileExists, shadowSettings } from "./helpers.js";

let mouseIsDown = false;
let bubbleFidelity = 30;
let level = 0;
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
const DRYNESS_COLOR_MODIFIER = 0.015;
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
const ITEM_ORIGINAL_COLOR = "rgb(240, 237, 237)";
const MAX_SATURATION = 20000;
let saturationLevelPerTick = 1;
let itemsController = new AbortController();
let bucketController = new AbortController();
const MINIMUM_BUCKET_PERCENT = 46;

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
let levelFailed = false;
const EVENT_CHECK_INTERVAL = 100;
let levelFunctions = [];
let lastFunctionCheck = 0;
const FUNCTION_CHECK_INTERVAL = 1000;
let latestImageRequest = 0;
let talkAreaController = new AbortController();

const worker = new Worker("js/worker.js");

let levelBackground = [];
let levelGuideLines = [];
let levelTarget = [];
let levelSpecial = [];
let isExampleShown = false;

// level = window.localStorage.getItem("highestPlayerLevel");


window.addEventListener("load", (e) => {
    mainFrameRef = document.getElementById("mainFrame"); 
    mainFrameRect = mainFrameRef.getBoundingClientRect();
    const mainFrame = document.getElementById("mainFrame");

    // if ()

    // level = window.localStorage.getItem("highestPlayerLevel");
    // console.log(level);


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

    // const btnRed = document.getElementById("btnColorRed");
    // if (btnRed) {
    //     setupRedButton(btnRed);
    // }

    // const btnBlue = document.getElementById("btnColorBlue");
    // if (btnBlue) {
    //     setupBlueButton(btnBlue);
    // }

    const btnPainterView = document.getElementById("btnPainterView");
    if (btnPainterView) {
        setupPainterViewButton(btnPainterView);
    }

    const btnExample = document.getElementById("btnExample");
    if (btnExample) {
        setupExampleButton(btnExample);
    };

    const btnCheat = document.getElementById("btnCheat");
    if (btnCheat) {
        setupCheatButton(btnCheat);
    }

    const btnLevelSelect = document.getElementById("btnLevelSelect");
    if (btnLevelSelect) {
        setupLevelSelectButton(btnLevelSelect);
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

    talkAreaController.abort();
    talkAreaController = new AbortController();

    talkTextArea = document.getElementById("talkText");
    const talkSkipButton = document.getElementById("btnTalkSkip");
    const yesButton = document.getElementById("btnTalkYes");
    const noButton = document.getElementById("btnTalkNo");
    talkTextArea.textContent = "";

    waitingForEvent = false;
    waitingForEventPre = false;
    eventString = "";

    yesButton.classList.remove("fade-in");
    yesButton.classList.remove("fade-out");
    noButton.classList.remove("fade-in");
    noButton.classList.remove("fade-out");

    levelText[level].textContent.reset();

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
        }, {signal: talkAreaController.signal});
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
        }, {signal: talkAreaController.signal});
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
            if ((levelText[level].textContent.nextLineTarget === -2 && !hasTextToDisplay) || levelText[level].textContent.currentLineIndex === -2) {
                changeLevel(level, true);
                return;
            }
            if ((levelText[level].textContent.lineIndex == -1 || 
                (levelText[level].textContent.nextLineTarget == -1) && levelText[level].textContent.currentLine.isLastWord)) {
                    if (level < levelText.length -1)
                    {
                        changeLevel(1);
                        return;
                    }
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
        }, {signal: talkAreaController.signal});
    }
}

function showTextArea() {

}

function changeLevel(count, absolute = false) {
    if (absolute) {
        level = count;
    } 
    else {
        level += count;
    }
    window.localStorage.setItem("playerLevel", level);
    const levelLabel = document.getElementById("lblCurrentLevel");
    levelLabel.textContent = `Level ${level + 1}`;
    
    const highestPlayerLevel = Number(window.localStorage.getItem("highestPlayerLevel"));
    if (highestPlayerLevel == null || level > highestPlayerLevel) {
        window.localStorage.setItem("highestPlayerLevel", level);
    }

    isChangingLevel = true;
    levelFailed = false;

    // setupPaintItems();
    refreshPaintItems();
    setupBubbles(mainFrameRef);
    setupPaints();
    setupTalkArea();
    setupFunctions();
    swapTargetImage();
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

    if (levelFailed && levelText[level].textContent.currentLine.isLastWord) {
        hasTextToDisplay = false;
        return;
    }

    // If its the first word in the line, then clear the existing text.
    // Could change this so the existing text remains but is added to the text box.
    if (wordIndex == 0 && lineIndex != 0) {
        talkTextArea.textContent = "";
        blockSkipButton = false;
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
        else {
            waitingForEvent = false;
            waitingForEventPre = false;
        }

        const questionInfo = levelText[level].textContent.isLineQuestion;
        if (questionInfo != null) {
            const tooltipText = levelText[level].textContent.currentLine.tooltipText;
            showQuestionButtons(questionInfo, tooltipText);
        }
    }

    // if (lineIndex == -2) {
    //     hasTextToDisplay = false;
    //     return;
    // }

    // If its the last word and last line, then all text has been displayed so end display.
    // Or if there is no more lines to display because of branching choices.
    if (lineIndex == -1 ||
        (levelText[level].textContent.lines[lineIndex].isLastWord && levelText[level].textContent.isLastLine )) {
            // if (levelText[level].textContent.nextLineTarget != -1) {
            //     levelText[level].textContent.getNextLine();
            //     return;
            // } 
        hasTextToDisplay = false;
        // setCharacterImage(levelText[level].textContent.currentLine.char, levelText[level].textContent.currentLine.charAnimAfter);
        return;
    } 
    // If its the last word, but not the last line, get the delay and the next word.
    else if (levelText[level].textContent.lines[lineIndex].isLastWord && !levelText[level].textContent.isLastLine) {
        // Get the delay from the line.
        const delayBeforeNextLine = levelText[level].textContent.currentLine.delayAfterWhole;
        blockSkipButton = true;


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

function swapTargetImage() {
    const targetImage = document.getElementById("targetImage");
    targetImage.classList.remove("fade-in");
    targetImage.classList.add("fade-out");

    setTimeout(() => {
        const targetImageSource = `/images/level-images/target-${level + 1}.png`;
        targetImage.setAttribute("src", targetImageSource);
        targetImage.classList.remove("fade-out");
        targetImage.classList.add("fade-in");
    }, COVER_TRANSITION_TIME);
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

    document.addEventListener('pointerdown', (e) => {
        handleMainFrameMouseDown(e);
    });

    document.addEventListener('pointerup', (e) => {
        handleMainFrameMouseUp(e);
    });

    document.addEventListener('pointermove', (e) => {
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

    const imgSource = `images/level-images/background-${level + 1}.png`;
    fileExists(imgSource).then(exists => {
        if (exists) {
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.onload = async () => {
                const bitmap = await createImageBitmap(img);
                worker.postMessage({ type: "processBackground", bitmap }, [bitmap])
            };
            img.src = imgSource;
        }
    });


    const targetSource = `images/level-images/target-${level + 1}.png`;
    fileExists(targetSource).then(exists => {
        if (exists) {
            const imgTarget = new Image();
            imgTarget.crossOrigin = "anonymous";
            imgTarget.onload = async () => {
                const bitmap = await createImageBitmap(imgTarget);
                worker.postMessage({ type: "processTarget", bitmap }, [bitmap])
            };
            imgTarget.src = targetSource;
        }
    });
    
    const guideLineSource = `images/level-images/guidelines-${level + 1}.png`;
    fileExists(guideLineSource).then(exists => {
        if (exists) {
            const imgGuideLines = new Image(); 
            imgGuideLines.crossOrigin = "anonymous";
            imgGuideLines.onload = async () => {
                const bitmap = await createImageBitmap(imgGuideLines);
                worker.postMessage({ type: "processGuidelines", bitmap }, [bitmap])
            };
            imgGuideLines.src = guideLineSource;
        }
    });

    const specialSource = `images/level-images/special-${level + 1}.png`;
    fileExists(specialSource).then(exists => {
        if (exists) {
            const imgSpecial = new Image();
            imgSpecial.crossOrigin = "anonymous";
            imgSpecial.onload = async () => {
                const bitmap = await createImageBitmap(imgSpecial);
                worker.postMessage({ type: "processSpecial", bitmap }, [bitmap])
            };
            imgSpecial.src = specialSource;
        }
    });
}

function setupPaints() {
    const paintSideBar = document.getElementById("paintSideBar");
    const paintPlaceHolders = paintSideBar.querySelectorAll(".paint-bucket");

    paintPlaceHolders.forEach((paint) => {
        paint.classList.add("hidden");
    })


    // const redPaintPlaceholder = document.getElementById("paintBucketOnePlaceholder");

    // const allPaints = [paintBucketOnePlaceholder];

    const colorsForLevel = levelText[level].colors;
    const colorCount = colorsForLevel.length;

    // paintPlaceHolders.forEach((paint) => {

    

        
    // });
    bucketController.abort();
    bucketController = new AbortController();

    for (let i = 0; i < colorCount; i++) {
        

        const currentBucket = paintPlaceHolders[i];
        const currentBucketColor = colorsForLevel[i];
        const { r, g, b } = stringToRgb(currentBucketColor);
        const [rl, gl, bl] = [r, g, b].map(v => v + 30);
        const [rd, gd, bd] = [r, g, b].map(v => v - 30);
        const currentBucketColorLighter = rgbToString({r: rl, g: gl, b: bl});
        const currentBucketColorDarker = rgbToString({r: rd, g: gd, b: bd});

        currentBucket.activeEls = currentBucket.querySelectorAll(".active-el");
        currentBucket.amount = 100;
        const topOffset = calculateBucketPaintHeight(currentBucket.amount);
        currentBucket.activeEls.forEach((el) => {
            el.style.top = topOffset + "px";
        });

        currentBucket.bucketColor = currentBucketColor;
        currentBucket.classList.remove("hidden");

        currentBucket.querySelector(".paint-bucket-label").style.backgroundColor = currentBucketColor;
        currentBucket.activeEls[0].style.backgroundColor = currentBucketColorLighter;
        currentBucket.activeEls[1].style.background = `linear-gradient(90deg, ${currentBucketColorDarker} 0%, ${currentBucketColor} 22%, ${currentBucketColor} 78%, ${currentBucketColorDarker} 100%`;    
        
        currentBucket.addEventListener('click', () => {
            
            if (currentBucket.amount <= MINIMUM_BUCKET_PERCENT || item == null) {
                return;
                // TODO: Show message informing bucket is empty.
            }

            const colorSimilarity = getRgbSimilarity(item.currColor, currentBucketColor);
            if (colorSimilarity < COLOR_SIMILARITY_THRESHOLD && item.querySelector(".active-el").origColor != currentColor) {
                item.saturationLevel = 0;
            }
                // Get how much to take from the bucket (by a percentage of how much saturation is on the item).
                const amountLoss = 1 - (item.saturationLevel / MAX_SATURATION);
                let saturationAvailable = MAX_SATURATION - item.saturationLevel;

                // Get how much will be left over once paint is removed.
                //         -0.5          1.5                    2
                const finalAmount = currentBucket.amount - amountLoss * AMOUNT_LOSS_MULTIPLIER;
                // If its less than 0, calculate how much paint will go on the item.
                if (finalAmount < MINIMUM_BUCKET_PERCENT) {
                    saturationAvailable = currentBucket.amount * MAX_SATURATION / AMOUNT_LOSS_MULTIPLIER;
                    currentBucket.amount = MINIMUM_BUCKET_PERCENT;
                } 
                else {
                    currentBucket.amount -= amountLoss * AMOUNT_LOSS_MULTIPLIER;
                }
                // console.log("Bucket %: " + currentBucket.amount);

                // Get the new height of the paint in the bucket - Give it the percentage of paint left (0 - 100);
                const newTopOffset = calculateBucketPaintHeight(currentBucket.amount);

                // Set the new height of the paint in the bucket.
                currentBucket.activeEls.forEach((el) => {
                    el.style.top = newTopOffset + "px";
                });

                // Get the current colour and apply it to the variable and item.
                currentColor = currentBucketColor;
                setColorOnItem(currentColor, saturationAvailable);

                // If waiting for an event, broadcast that this event has fired.
                if (waitingForEvent || waitingForEventPre) {
                    eventString = "putPaintOnTool";
                }
            
        }, { signal: bucketController.signal })
    }
}

// Set the height of the paint in the bucket - Give it the percentage of paint left (0 - 100);
function calculateBucketPaintHeight(amount) {
    return Math.abs(((amount / 100) * (FULL_PAINT_OFFSET - EMPTY_PAINT_OFFSET)) - (FULL_PAINT_OFFSET - EMPTY_PAINT_OFFSET));
}

function setupPaintItems() {
    itemsController.abort();
    itemsController = new AbortController();

    const paintRollerPlaceholder = document.getElementById("rollingPinPlaceholder");
    const paintBrushPlaceholder = document.getElementById("paintBrushPlaceholder");
    const paintBrushSmallPlaceholder = document.getElementById("paintBrushSmallPlaceholder")
    const allItems = [paintRollerPlaceholder, paintBrushPlaceholder, paintBrushSmallPlaceholder];

    paintRollerPlaceholder.firstElementChild.rotates = true;
    paintBrushPlaceholder.firstElementChild.rotates = false;
    paintBrushSmallPlaceholder.firstElementChild.rotates = false;

    allItems.forEach((i) => {
        // const originalColor = window.getComputedStyle(i.querySelector('.active-el')).backgroundColor;
        i.querySelector('.active-el').origColor = ITEM_ORIGINAL_COLOR;
        i.firstElementChild.currColor = ITEM_ORIGINAL_COLOR;
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
        }, {signal: itemsController.signal});
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
        }, {signal: itemsController.signal});
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
        }, {signal: itemsController.signal});
    }
}

function refreshPaintItems() {
    const paintRollerPlaceholder = document.getElementById("rollingPinPlaceholder");
    const paintBrushPlaceholder = document.getElementById("paintBrushPlaceholder");
    const paintBrushSmallPlaceholder = document.getElementById("paintBrushSmallPlaceholder")
    const allItems = [paintRollerPlaceholder, paintBrushPlaceholder, paintBrushSmallPlaceholder];
                
    currentColor = ITEM_ORIGINAL_COLOR;

    if (item) {
        item.saturationLevel = 0;
    }

    allItems.forEach((i) => {
        const itemActiveEl = i.querySelector('.active-el');   
        itemActiveEl.style.backgroundColor = ITEM_ORIGINAL_COLOR;
        i.currColor = ITEM_ORIGINAL_COLOR;
        i.saturationLevel = 0;
    });
     
    
}

function setColorOnItem(color, saturation) {
    if (item != null) {
        // console.log("Pre Sat: " + item.saturationLevel);
        const itemActiveEl = item.querySelector('.active-el');
        itemActiveEl.style.backgroundColor = color;
        item.saturationLevel += saturation;
        item.currColor = color;
        // console.log("Post Sat: " + item.saturationLevel + ", Sat Rec: " + saturation);
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

        if (e.data.type === "targetResult") {
            levelTarget = e.data.pixelColors;
        }

        if (e.data.type === "specialResult") {
            levelSpecial = e.data.specialPixels;
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
        newBubble.style.zIndex = "";

        if (levelGuideLines.length > 0) {
            for (let info of levelGuideLines) {
                if (info.pixel === i) {
                    // console.log("shadow set on cell " + i);
                    newBubble.style.boxShadow = shadowSettings[info.shadow];
                    newBubble.style.zIndex = `${info.zIndex}`;
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
    // console.log("Is changing level " + isChangingLevel);
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
    eventString = "";
    levelFunctions = [];
    if (levelText.length - 1 >= level) {
        if (levelText[level].functions) {
            levelFunctions = Object.keys(levelText[level].functions);
        }
    }
}

// function checkBubbles() {
//     if (!isChangingLevel) {
//         const anyBubble = mainFrame.querySelector(".bubble:not(.popped)");

//         if (!anyBubble)
//         {
//             console.log('level finished');
//             isChangingLevel = true;
//             console.log("is changing level true")
//             level++;
//             setupBubbles(mainFrame);
//             checkLevelRules(mainFrame);
//         }        
//     }
    
//     // requestAnimationFrame(checkBubbles);
// }

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

    // if (timestamp - lastBubbleCheck >= BUBBLE_CHECK_INTERVAL) {
    //     // console.log("fired bubble check");
    //     checkBubbles();
    //     lastBubbleCheck = timestamp;
    // }

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
                allBubbles,
                levelTarget,
                levelSpecial
            }

            for (let funcName of levelFunctions) {
                const res = levelText[level].functions?.[funcName](context);
                if (res.result) {
                    eventString = funcName;
                    if (res.endsLevel && !levelFailed) {
                        levelFailed = true;
                        // waitingForEvent = false;
                        // waitingForEventPre = false;
                        // hasTextToDisplay = true;
                        // eventString = "";
                        // hasDoneFirstCheck = true;
                        
                        talkTextArea.textContent = "";
                        hasTextToDisplay = true;
                        levelText[level].textContent.goToLoseLineIndex();
                        const yesButton = document.getElementById("btnTalkYes");
                        const noButton = document.getElementById("btnTalkNo");
                        if (yesButton.classList.contains("fade-in")) {
                            yesButton.classList.remove("fade-in");
                            yesButton.classList.add("fade-out");
                        }

                        if (noButton.classList.contains("fade-in")) {
                            noButton.classList.remove("fade-in");
                            noButton.classList.add("fade-out");
                        }
                    }
                }
            }

            lastFunctionCheck = timestamp;
            // if (levelText[level].functions.checkWholeWallPainted(allBubbles, "rgb(255,0,0)", 0.8)) {
            //     eventString = "wallPaintedRed";
            // }
        } 

        if (timestamp - lastEventCheck >= EVENT_CHECK_INTERVAL) {
            if (!levelFailed && eventString === levelText[level].textContent.currentLine.eventString) {
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
        let currWetness = Number(bubble.dataset.recent);
        bubble.dataset.recent = --currWetness;
        if (currWetness < 0) {
            bubble.dataset.recent = 0;
        }
        if (currWetness < 6 && currWetness > 0) {
            // const newColor = mixRgb(bubble.bubbleColor, 'rgb(0,0,0)', DRYNESS_COLOR_MODIFIER); 
            let {r, g, b} = stringToRgb(bubble.bubbleColor);
            const clamp = v => Math.max(0, v - 1);
            r = clamp(r);
            g = clamp(g);
            b = clamp(b);
            const newColor = rgbToString({ r: r, g: g, b: b });
            bubble.bubbleColor = newColor;
            // currColor = window.getComputedStyle(bubble).backgroundColor;
            bubble.style.backgroundColor = newColor;

        }
    });
    //  await wait(250);
    // requestAnimationFrame(() => checkPaint(mainFrame));
}

// function checkLevelRules(mainFrame) {
//     // switch (level) {
//         // case default:
//             const randomAngle = getRandomNumber(-60, 60);

//             // mainFrame.style.transform = `perspective(1000px) rotateY(${randomAngle}deg) rotateX(${randomAngle / 2}deg) rotateZ(${randomAngle / 4}deg) translateX(50%) translateY(50%)`;
//             // break;
//     // }
// }

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
       setupPaints();
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

// function setupRedButton(button) {
//     button.addEventListener('click', () => {
//         currentColor = "rgb(255,0,0)";
//         setColorOnItem(currentColor);
//     });
// }

// function setupBlueButton(button) {
//     button.addEventListener('click', () => {
//         currentColor = "rgb(0,0,255)";
//         setColorOnItem(currentColor);        
//     });
// }

function setupPainterViewButton(button) {
    button.isOn = false;

    
    button.addEventListener('click', () => {
        const halfCoverElement = document.querySelector(".half-cover");
        button.isOn = !button.isOn;
        if (button.isOn) {
            halfCoverElement.classList.remove("fade-out");
            halfCoverElement.classList.add("fade-in");
            halfCoverElement.style.zIndex = "90";
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

function setupExampleButton(button) {
    isExampleShown = false;

    button.addEventListener('click', () => {
        isExampleShown = !isExampleShown;
        toggleExampleOverlay(isExampleShown);
    });
}

function setupCheatButton(button) {
    button.addEventListener('click', () => {
        for (let i = 0; i < allBubbles.length; i++) {

            const exampleBubbleColor = rgbToString({ r: levelTarget[i][0], g: levelTarget[i][1], b: levelTarget[i][2] });
            allBubbles[i].bubbleColor = exampleBubbleColor;
            allBubbles[i].style.backgroundColor = allBubbles[i].bubbleColor;
        }
    });
}

function toggleExampleOverlay(setting) {
    for (let i = 0; i < allBubbles.length; i++) {
        if (setting) {
            const exampleBubbleColor = rgbToString({ r: levelTarget[i][0], g: levelTarget[i][1], b: levelTarget[i][2] });
            allBubbles[i].style.backgroundColor = exampleBubbleColor;
        }
        else {
            allBubbles[i].style.backgroundColor = allBubbles[i].bubbleColor;
        }
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

    if (isExampleShown) {
        isExampleShown = false;
        toggleExampleOverlay(false);
    }
}

function handleMainFrameMouseUp(e) {
    mouseIsDown = false;
}

function handleMainFrameMouseMove(e) {
    // Debug stuff.
    if (debugActive && e.target.classList.contains("bubble"))
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

function setupLevelSelectButton(button) {
    button.isOn = false;

    button.addEventListener('click', () => {
        button.isOn = !button.isOn;
        toggleLevelSelectMenu(button.isOn);
    });

    const levelSelectMenu = document.getElementById("levelSelectMenu");
    levelSelectMenu.addEventListener('click', (e) => {
        const target = e.target.closest(".button");

        if (target && target.classList.contains("level-button")) {
            changeLevel(target.levelTarget, true);
            toggleLevelSelectMenu(false);
        }

        if (target && target.classList.contains("close-button")) {
            toggleLevelSelectMenu(false);
        }
    });
}

function toggleLevelSelectMenu(setting) {
    const levelSelectMenu = document.getElementById("levelSelectMenu");
    const levelSelectMenuPanel = levelSelectMenu.querySelector(".level-select-panel");
    if (setting) {
        isChangingLevel = true;
        const highestPlayerLevel = Number(window.localStorage.getItem("highestPlayerLevel"));
        const allLevelsCount = levelText.length;

        const fragment = document.createDocumentFragment();
        const titleElement = document.createElement("p");
        titleElement.textContent = "Select Level";
        fragment.appendChild(titleElement);

        levelSelectMenuPanel.textContent = "";

        // const levelSelectAbortController = new AbortController();

        for (let i = 0; i < allLevelsCount; i++) {
            const levelButton = document.createElement("div");
            levelButton.classList.add("button", "main", "level-button");
            levelButton.textContent = i + 1;
            levelButton.levelTarget = i;
            if (i > highestPlayerLevel) {
                levelButton.classList.add("disabled");
            }

            fragment.appendChild(levelButton);
        }

        const closeButton = document.createElement("div");
        closeButton.classList.add("button", "main", "close-button");
        closeButton.textContent = "Close";
        fragment.appendChild(closeButton);
        

        levelSelectMenuPanel.appendChild(fragment);
        levelSelectMenu.style.visibility = "visible";
    }
    else {
        isChangingLevel = false;
        levelSelectMenu.style.visibility = "";
        document.getElementById("btnLevelSelect").isOn = false;
    }
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
        if (!mouseIsDown || item == null || isChangingLevel) {
        return;
    }

    const nearbyBubbles = [];
    itemRect = itemCollisionBox.getBoundingClientRect();
    // const mouseGridPosX = Math.trunc(((itemRect.left + (itemRect.width / 2)) - mainFrameRect.left) / bubbleSize) * 100 / 100;
    // const mouseGridPosY = Math.trunc(((itemRect.top + (itemRect.height / 2)) - mainFrameRect.top) / bubbleSize) * 100 / 100;
    const mouseGridPosX = Math.floor(((itemRect.left + (itemRect.width / 2)) - mainFrameRect.left) / cellSize);
    const mouseGridPosY = Math.floor(((itemRect.top + (itemRect.height / 2)) - mainFrameRect.top) / cellSize);

    for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {

            // const xMap = bubbleSpatialGrid.get(mouseGridPosX + dx);
            // const group = xMap?.get(mouseGridPosY + dy);

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