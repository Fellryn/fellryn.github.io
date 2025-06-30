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
                /* 12 */ new Line({ text: "That's a shame! Well, goodluck and have a nice day! I was after red paint on the entire wall if you're interested...", waitForInput: true, inputEvent: "wallPaintedRed", tooltipText: [`"Fine, here's your red wall!`, `"Na mate, I'm out!"`], charAnim: "shame", charAnimAfter: "question" }),
                /* 13 */ new Line({ text: "Yep, that's it, nicely done! Now, onto something a bit harder if you're interested! (Press fast forward to go to the next level)" }),
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
                        // console.log(`Broke on ${b.x}, ${b.y}: Color ${b.bubbleColor}`);
                        if (maxMissedBubbles <= 0) {
                            isAllColor = false;
                            break;
                        }
                    }
                }
                return isAllColor;
            }
        }
        ,
        colors: ["rgb(237,28,36)"]
    },
    {
        textContent:
            new TextLines(
                {
                    lines:
                        [
                            new Line({ text: "Welcome back!" }),
                            new Line({ text: "This one is a little trickier! You may have noticed the second colour there..." }),
                            new Line({ text: "The client would like yellow and blue stripes on the wall, starting with red on the left-most panel. You should be able to see the lines separating the sections. Let us know when you're finished!", waitForInput: true, inputEvent: "wallMatchesTarget", tooltipText: [`"The stripes are up!"`, `"Any other advice?"`], charAnimAfter: "question" }),
                            new Line({ text: "Perfect! I think that's the finest stripes I've ever seen! (Press fast forward to go to the next level)" }),
                            new Line({ text: "Nice try! But you might need some more paint, or maybe those lines aren't straight enough! Give it another go."}),
                            new Line({ text: "See ya at the next jobsite!" })
                        ],
                        questionAtLine: [[2, 3, 1, 4], []],
                        linesNext: [1, 2, 3, -1, 2, -1]
                }
            ),
        functions: {
            wallMatchesTarget({ allBubbles, levelTarget }) {
                let isAllColor = true;
                let maxMissedBubbles = 15;
                const bubbleCount = allBubbles.length;
                for (let i = 0; i < bubbleCount; i++) {
                    const targetRgbString = rgbToString({ r: levelTarget[i][0], g: levelTarget[i][1], b: levelTarget[i][2] });
                    if (getRgbSimilarity(allBubbles[i].bubbleColor, targetRgbString) < 0.75) {
                        maxMissedBubbles--;
                        // console.log(`Broke on ${b.x}, ${b.y}: Color ${b.bubbleColor}`);
                        if (maxMissedBubbles <= 0) {
                            isAllColor = false;
                            break;
                        }
                    }
                }
                return isAllColor;
            }
        }
        ,
        colors: ["rgb(242,242,48)", "rgb(0, 162, 232)"]
    },
    {
        textContent:
            new TextLines(
                {
                    lines:
                        [
                            new Line({ text: "Well, we're really getting into it now..." }),
                            new Line({ text: "This client has heard all about your expert skills and wants something a little more peculiar." }),
                            new Line({ text: "Let me know when you've finished with the squares, and good luck!", waitForInput: true, inputEvent: "wallMatchesTarget", tooltipText: [`"Those bloody squares are done!"`, `"Come again boss?"`], charAnimAfter: "question" }),
                            new Line({ text: "You've done it again! Absolutely outstanding! We might have to start charging more! (Press fast forward to go to the next level)" }),
                            new Line({ text: "So closeeee! Check those edges and maybe put more paint on spots that are darker!"}), 
                            new Line({ text: "Catch ya tomorrow!" })
                        ],
                        questionAtLine: [[2, 3, 1, 4], []],
                        linesNext: [1, 2, 3, -1, 2, -1]
                }
            ),
        functions: {
            wallMatchesTarget({ allBubbles, levelTarget }) {
                let isAllColor = true;
                let maxMissedBubbles = 15;
                const bubbleCount = allBubbles.length;
                for (let i = 0; i < bubbleCount; i++) {
                    const targetRgbString = rgbToString({ r: levelTarget[i][0], g: levelTarget[i][1], b: levelTarget[i][2] });
                    if (getRgbSimilarity(allBubbles[i].bubbleColor, targetRgbString) < 0.85) {
                        maxMissedBubbles--;
                        // console.log(`Broke on ${b.x}, ${b.y}: Color ${b.bubbleColor}`);
                        if (maxMissedBubbles <= 0) {
                            isAllColor = false;
                            break;
                        }
                    }
                }
                return isAllColor;
            }
        }
        ,
        colors: ["rgb(240, 174, 201)", "rgb(247, 247, 247)"]
    },
    {
        textContent:
            new TextLines(
                {
                    lines:
                        [
                            new Line({ text: "Woah now doggy! You've come quite a ways now haven't ya!" }),
                            new Line({ text: "We got something a little trickier for you. This time, we can't touch the glass at all! " }),
                            new Line({ text: "If you do, the owner won't be happy and we'll be thrown out for sure! You might have to break out those smaller brushes this time." }),
                            new Line({ text: "I've supplied some brown paint for the frame if you overlap that a little bit, but for heavens sake, do not hit the glass! Otherwise, its just a green two-tone piece, nothing complicated. Let me know when you're done!", waitForInput: true, inputEvent: "wallMatchesTarget", tooltipText: [`"Phew, it's done!"`, `"Any other advice?"`], charAnimAfter: "question" }),
                            new Line({ text: "Well shiver me timbers, you've absolutely nailed it again! And you didn't even touch the glass, now thats an expert. (Press fast forward to go to the next level)" }),
                            new Line({ text: "Might need some touch ups on the frame, or maybe the green wall hasn't got enough coats, or the trim is off? What do you think?"}),
                            new Line({ text: "You hit the window!! We will have to scoot! Leave the wall like it is, lets go! (Click fast forward to repeat level)", charAnim: "shame" }),
                            new Line({ text: "Cya at the next job!" })
                        ],
                        questionAtLine: [[3, 4, 1, 5], []],
                        linesNext: [1, 2, 3, 4, -1, 3, -2, -1],
                        loseLineIndex: 6
                }
            ),
        functions: {
            wallMatchesTarget({ allBubbles, levelTarget }) {
                let isAllColor = true;
                let maxMissedBubbles = 15;
                const bubbleCount = allBubbles.length;
                for (let i = 0; i < bubbleCount; i++) {
                    const targetRgbString = rgbToString({ r: levelTarget[i][0], g: levelTarget[i][1], b: levelTarget[i][2] });
                    if (getRgbSimilarity(allBubbles[i].bubbleColor, targetRgbString) < 0.75) {
                        maxMissedBubbles--;
                        // console.log(`Broke on ${b.x}, ${b.y}: Color ${b.bubbleColor}`);
                        if (maxMissedBubbles <= 0) {
                            isAllColor = false;
                            break;
                        }
                    }
                }
                return { result: isAllColor, endsLevel: false };
            }
            ,
            paintedNoPaintArea({ allBubbles, levelTarget, levelSpecial }) {
                let paintInWrongArea = false;
                for (let ls of levelSpecial) {
                    const pixel = ls.pixel;
                    if (allBubbles[pixel].bubbleColor != rgbToString({ r: levelTarget[pixel][0], g: levelTarget[pixel][1], b: levelTarget[pixel][2] })
                        && ls.special === "NO_DRAW" ) {
                        paintInWrongArea = true;
                        break;
                    }
                }
                return { result: paintInWrongArea, endsLevel: true };
            }   
        }
        ,
        colors: ["rgb(92, 116, 87)", "rgb(33, 78, 52)", "rgb(239, 183, 67)"]
    },
        {
        textContent:
            new TextLines(
                {
                    lines:
                        [
                            new Line({ text: "Well that's it for now bucko!" }),
                            new Line({ text: "If you wanna keep painting go right ahead, I'll give you a few paints."}),
                            new Line({ text: "More levels and features might be added if I feel like it. And bug fixes as well! I especially want to work on the performance of the app."}),
                            new Line({ text: "Anyhow, thanks for playing! Feel free to leave a note on Github if you enjoyed this or have any suggestions. Thanks!", waitForInput: true, inputEvent: "gameOver"})
                        ],
                }
            ),
        colors: ["rgb(190, 23, 23)", "rgb(23, 20, 196)", "rgb(26, 192, 20)", "rgb(218, 233, 14)", "rgb(192, 19, 207)"]
    }


]

