import { TextLines } from "../textlines.js";
import { Line } from "../textlines.js";

export const levelText =
    [
        new TextLines(
            0,
            [
                /* 0 */ new Line("Hello there!", 10),
                /* 1 */ new Line("Welcome to the game!", 10),
                /* 2 */ new Line("We're all about painting here!", 10),
                /* 3 */ new Line("So, you're probably wondering what the hell is going on, right?", 10),
                /* 4 */ new Line("Well, you see, this game is all about filling that canvas up with as much paint as possible, and accurately as well sometimes!", 10),
                /* 5 */ new Line("So, are you ready to paint?", 10, false, "", [`"Sure am!"`, `"Maybe not..." (Skip Tutorial)`]),
                /* 6 */ new Line("Well, lets get going then partner!", 10),
                /* 7 */ new Line("Pick up one of those paint tools by clicking on it!", 3, true, "pickUpTool"),
                /* 8 */ new Line("Good! Now, dip the tool in the bucket so you have some paint on your brush!", 3, true, "putPaintOnTool"),
                /* 9 */ new Line("Now, put it on the canvas and press it down to paint!", 3, true, "putPaintOnCanvas"),
                /* 10 */ new Line("Excellent! Now you're all set!", 10),
                /* 11 */ new Line("If you just paint this whole wall red you'll be all done, let me know when you're finished!", 10, true, "wallPaintedRed", [`"All done chief!`, "How do I paint again?"]),
                /* 12 */ new Line("That's a shame! Well, goodluck and have a nice day! I was after red paint on the entire wall if you're interested...", 10, true, "wallPaintedRed", [`"Fine, here's your red wall!`, `"Na mate, I'm out!"`]),
                /* 13 */ new Line("Yep, that's it! Nice one, nicely done. Now, something a bit harder if you're interested! (Press fast forward to go to the next level)", 10, true, "skipButtonPressed"),
                /* 14 */ new Line("Now, don't try pull a fast one on me! That isn't done! I think you may have put some more red paint on that wall!", 10),
                /* 15 */ new Line("Well, feel free to paint the wall anyway if you want!", 10)
            ],
            true,
            [[5, 6, 12], [11, 13, 7, 14], [12, 13, 15, 14]],
            [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, -1, 11, -1]
        )
    ];