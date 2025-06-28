import { TextLines } from "../textlines.js";
import { Line } from "../textlines.js";
import { getRgbSimilarity, stringToRgb, rgbToString } from "../helpers.js";

export const levelText = [
    {
        textContent:
            new TextLines(
                {
                    lines:
                        [
                /* 0 */ new Line({ text: "Hello there!" }),
                /* 1 */ new Line({ text: "Welcome to the game!" }),
                /* 2 */ new Line({ text: "We're all about painting here!" }),
                /* 3 */ new Line({ text: "So, you're probably wondering what the hell is going on, right?" }),
                /* 4 */ new Line({ text: "Well, you see, this game is all about filling that canvas up with as much paint as possible, and sometimes in a certain pattern!" }),
                /* 5 */ new Line({ text: "So, are you ready to paint?", tooltipText: [`"Sure am!"`, `"Maybe not..." (Skip Tutorial)`], charAnimAfter: "question" }),
                /* 6 */ new Line({ text: "Well, lets get going then partner!" }),
                /* 7 */ new Line({ text: "Pick up one of those paint tools by clicking on it!", delayAfterWhole: 3, waitForInput: true, inputEvent: "pickUpTool" }),
                /* 8 */ new Line({ text: "Good! Now, dip the tool in the bucket so you have some paint on your brush!", delayAfterWhole: 3, waitForInput: true, inputEvent: "putPaintOnTool" }),
                /* 9 */ new Line({ text: "Now, put it on the canvas and press it down to paint!", delayAfterWhole: 3, waitForInput: true, inputEvent: "putPaintOnCanvas" }),
                /* 10 */ new Line({ text: "Excellent! Now you're all set!" }),
                /* 11 */ new Line({ text: "If you just paint this whole wall red you'll be all done, let me know when you're finished!", waitForInput: true, inputEvent: "wallPaintedRed", tooltipText: [`"All done chief!`, "How do I paint again?"] }),
                /* 12 */ new Line({ text: "That's a shame! Well, goodluck and have a nice day! I was after red paint on the entire wall if you're interested...", waitForInput: true, inputEvent: "wallPaintedRed", tooltipText: [`"Fine, here's your red wall!`, `"Na mate, I'm out!"`], charAnimAfter: "question" }),
                /* 13 */ new Line({ text: "Yep, that's it, nicely done! Now, onto something a bit harder if you're interested! (Press fast forward to go to the next level)", waitForInput: true, inputEvent: "skipButtonPressed" }),
                /* 14 */ new Line({ text: "Woah now, you need more paint than that! Make sure most of the wall is a solid red color, you may need two coats.", charAnimAfter: "exclaim" }),
                /* 15 */ new Line({ text: "Well, feel free to paint the wall anyway if you want! (Press fast forward to go to the next level)" })
                        ],
                    questionAtLine: [[5, 6, 12, 5], [11, 13, 7, 14], [12, 13, 15, 14]],
                    linesNext: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, -1, 11, -1]
                }
            )
        ,
        functions: {
            wallPaintedRed({ allBubbles }) {
                // debugger;
                let isAllColor = true;
                let maxMissedBubbles = 30;
                for (let b of allBubbles) {
                    if (getRgbSimilarity(b.bubbleColor, "rgb(255,0,0)") < 0.50) {
                        maxMissedBubbles--;
                        console.log(`Broke on ${b.x}, ${b.y}: Color ${b.bubbleColor}`);
                        if (maxMissedBubbles <= 0) {
                            isAllColor = false;
                            break;
                        }
                    }
                }
                return isAllColor;
            }
        }
    }
]

