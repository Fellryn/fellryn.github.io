import { TextLines } from "../textlines.js";
import { Line } from "../textlines.js";

export const levelText =
    [
        new TextLines(
            0,
            [
                new Line("Hello there!", 10),
                new Line("Welcome to the game!", 10),
                new Line("We're all about painting here!", 10),
                new Line("So, you're probably wondering what the hell is going on, right?", 10),
                new Line("Well, you see, this game is all about filling that canvas up with as much paint as possible, and accurately as well sometimes!", 10),
                new Line("So, are you ready to paint?", 10, false, "", [`"Sure am!"`, `"Maybe not..." (Skip Tutorial)`]),
                new Line("Well lets get going then partner! Pick up one of those paint tools by clicking on it!", 2, true, "pickUpTool"),
                new Line("Good! Now, dip the tool in the bucket so you have some paint on your brush!", 2, true, "putPaintOnTool"),
                new Line("Now, put it on the canvas and press it down to paint!", 2, true, "putPaintOnCanvas"),
                new Line("Excellent! Now you're all set!", 10),
                new Line("If you just paint this whole wall red, you're finished and come talk to me again!", 10),
                new Line("That's a shame! Well, goodluck and have a nice day!", 10)
            ],
            true,
            [[5, 6, 11], []],
            [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, -1, -1]
        )
    ];