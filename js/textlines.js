export class TextLines {
    // Current line that is going to be displayed.
    currentLineIndex = 0;
    // All the lines that will be said in the level/interaction.
    // Always pass lines as an array, even if there is only one line.
    lines = [];
    // Does the line automatically go to the next one once the delay is complete.
    autoNextLine = true;
    // The next line that will be displayed after the current one finishes as a set of 
    // integers. E.g. [0, 1, 2, 3, 4]
    linesNext = [];
    // Denotes which line is a question, and which line to go to for either yes or no.
    questionAtLine = [];


    constructor(startIndex, lines, autoNextLine = true, questionAtLine = null, linesNext = -1) {
        this.currentLineIndex = startIndex;
        this.lines = lines;
        this.autoNextLine = autoNextLine;
        if (linesNext === -1) {
            let i = 1;
            this.linesNext = [];
            for (const l of lines) {
                this.linesNext.push(i++);
            }
            this.linesNext[this.linesNext.length - 1] = -1;
        }
        else {
            this.linesNext = linesNext;
        }
        this.questionAtLine = questionAtLine;

    }
    
    getLineAtIndex(index = 0) {
        return this.lines[index];
    }

    set lineIndex(index) {
        this.currentLineIndex = index; 
    }

    getNextLine() {
        if (this.currentLineIndex == this.lines.length - 1) {
            return -1;
        }
        else {
            this.currentLineIndex = this.linesNext[this.currentLineIndex];
            return this.lines[this.currentLineIndex];
        }
    }

    getSameLine() {
        return this.lines[this.currentLineIndex - 1];
    }

    get lineIndex() {
        return this.currentLineIndex;
    }

    get wordIndex() {
        return this.currentLine.wordIndex;
    }

    get isLastLine() {
        return this.currentLineIndex == this.lines.length - 1;
    }

    get currentLine() {
        return this.lines[this.currentLineIndex];
    }

    get isAutoNextLine() {
        return this.autoNextLine;
    }

    get isLineQuestion() {
        if (this.questionAtLine.length == 0) {
            return null;
        }
        const questionMatch = this.questionAtLine.find(q => q[0] == this.currentLineIndex);
        return questionMatch;
    }
}


export class Line {
    text = "";
    delayAfterWhole = 200;
    delayAfterWord = 200;
    textWords = [];
    tooltipText = [];
    wordCount = 0;
    currentIndex = 0;
    textFullPunctuationPositions = [];
    textHalfPunctuationPositions = [];
    waitForEvent = false;
    inputEvent = "";

    constructor (text, delayAfterWhole = 200, waitForInput = false, inputEvent = "", tooltipText = [], delayAfterWord = 120) {
        this.text = text;
        this.delayAfterWhole = delayAfterWhole;
        this.delayAfterWord = delayAfterWord;
        this.textWords = text.split(" ");
        this.wordCount = this.textWords.length;
        this.tooltipText = tooltipText;
        this.waitForEvent = waitForInput;
        this.inputEvent = inputEvent;

        for (let i = 0; i < this.wordCount; i ++) {
            const punctation = this.textWords[i].match(/[.,!?;:]/);
            if (punctation?.includes(",")) {
                this.textHalfPunctuationPositions.push(i);
            }
            else if (punctation) {
                this.textFullPunctuationPositions.push(i);
            }
        }
    }

    checkPunctuationPause() {
        let pauseModifier = 0;
        pauseModifier = this.textHalfPunctuationPositions.includes(this.currentIndex) == true ? 1 : 0;
        pauseModifier = this.textFullPunctuationPositions.includes(this.currentIndex) == true ? 3 : 0;
        return pauseModifier; 
    }

    get isLastWord() {
        return this.textWords[this.currentIndex] == null;
    }

    getNextWord() {
        return this.textWords[this.currentIndex++];
    }

    skipToLastWord() {
        this.currentIndex = this.wordCount - 1;
    }

    get wordIndex() {
        return this.currentIndex;
    }

    get delayAfterWord() {
        return this.delayAfterWord;
    }

    get delayAfterWhole() {
        return this.delayAfterWhole;
    }

    get tooltipText() {
        return this.tooltipText;
    }

    get willWaitForEvent() {
        return this.waitForEvent;
    }

    get eventString() {
        return this.inputEvent;
    }




}
