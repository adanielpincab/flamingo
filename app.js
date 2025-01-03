function mulberry32(a) {
    return function() {
      let t = a += 0x6D2B79F5;
      t = Math.imul(t ^ t >>> 15, t | 1);
      t ^= t + Math.imul(t ^ t >>> 7, t | 61);
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }
}

function count(item, array) {
    let count = 0
    for (el of array) {
        if (el == item) { count++ }
    }
    return count
}

class Game {
    constructor (code) {
        // PRNG
        if (code) {
            this.code = code
        } else {
            this.code = (Math.random()*2**32)
        }
        this.getRand = mulberry32((this.code)>>>0)

        console.log("PRNG CODE: " + this.code)

        // Bruteforce a random solved table
        let found = false;
        while (!found) {
            this.emptyTable()

            console.log("Bruteforcing new table...");
            found = true
            for (let i = 0; i < 6; i++) {
                for (let j = 0; j < 6; j++) {
                    let copy = Array.from(this.table)
                    let choice = this.randomChoice(this.validsAtPosition(i, j))
                    copy[i][j] = choice
                    this.table = copy

                    if (choice == undefined) { found = false }
                }    
            }
        }
        console.log("New table created");
        console.log(this.table);

        // Create random helps for the player
        console.log("Creating helps...")
        this.helps = []
        let numberOfHelps = this.getRandomInt(2, 18);
        // TEST let numberOfHelps = this.getRandomInt(50, 50);
        for (let i = 0; i < numberOfHelps; i++) {
            let help = {};
            let possibleDirections = []
            help.position = this.randomPos()
            if (help.position.i > 0) possibleDirections.push("up");
            if (help.position.i < 5) possibleDirections.push("down");
            if (help.position.j > 0) possibleDirections.push("left");
            if (help.position.j < 5) possibleDirections.push("right");

            help.direction = this.randomChoice(possibleDirections)

            let compareWith = structuredClone(help.position)
            switch (help.direction) {
                case "up": 
                    compareWith.i -= 1; 
                    break;
                case "down": 
                    compareWith.i += 1; 
                    break;
                case "left": 
                    compareWith.j -= 1; 
                    break;
                case "right": 
                    compareWith.j += 1; 
                    break;
            }

            if (this.table[help.position.i][help.position.j] == this.table[compareWith.i][compareWith.j]) {
                help.sign = "="
            } else {
                help.sign = "×"
            }

            this.helps.push(help)
        }
        console.log(this.helps)

        console.log("Creating shown tiles...")
        this.shows = []
        let numberOfShows = this.getRandomInt(2, 10);
        // TEST let numberOfShows = this.getRandomInt(35, 35);
        for (let i = 0; i < numberOfShows; i++) {
            this.shows.push(this.randomPos())
        }
        console.log(this.shows)
    }

    getRandomInt(min, max) {
        /**
         * Returns a random integer between min (inclusive) and max (inclusive).
         * The value is no lower than min (or the next integer greater than min
         * if min isn't an integer) and no greater than max (or the next integer
         * lower than max if max isn't an integer).
         * Using Math.round() will give you a non-uniform distribution!
         */
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(this.getRand() * (max - min + 1)) + min;
    }

    randomPos() {
        return {i: this.getRandomInt(0, 5), j: this.getRandomInt(0, 5)}
    }

    randomChoice(list) {
        return list[this.getRandomInt(0, list.length-1)]
    }
    
    validsAtPosition(i, j) {
        let row = Array.from(this.table[i])
        let column = []
        for (let r = 0; r < 6; r++) {
            column.push(this.table[r][j])
        }

        // we don't have in account the tile we are checking
        row[j] = 0
        column[i] = 0

        let possible = []

        for ( let letter of ["A", "B"] ) {
            if (
                (count(letter, row) < 3)
                && (count(letter, column) < 3)
                && (count(letter, column.slice(Math.max(0, i-2), i)) < 2)
                && (count(letter, column.slice(i+1, Math.min(i+3, 6))) < 2)
                && (count(letter, row.slice(Math.max(0, j-2), j)) < 2)
                && (count(letter, row.slice(j+1, Math.min(j+3, 6))) < 2)
                && (count(letter, [row[Math.max(j-1, 0)], row[Math.min(j+1, 5)]]) < 2)
                && (count(letter, [column[Math.max(i-1, 0)], column[Math.min(i+1, 5)]]) < 2)
            ) {
                possible.push(letter)
            }
        }

        return possible
    }

    isValidPos(i, j) {
        let char = this.table[i][j]

        if (char == 0) { return true }

        for (let help of this.helps) {
            let compareWith = structuredClone(help.position)
            switch (help.direction) {
                case "up": 
                    compareWith.i -= 1; 
                    break;
                case "down": 
                    compareWith.i += 1; 
                    break;
                case "left": 
                    compareWith.j -= 1; 
                    break;
                case "right": 
                    compareWith.j += 1; 
                    break;
            }
            if (
                (help.position.i == i && help.position.j == j) || 
                (compareWith.i == i && compareWith.j == j) 
                ){
                if (this.table[compareWith.i][compareWith.j] == 0) { continue }
                if (this.table[help.position.i][help.position.j] == 0) { continue }
                if (
                    ((help.sign == "=") && (
                        this.table[help.position.i][help.position.j] != 
                        this.table[compareWith.i][compareWith.j])) ||
                    ((help.sign == "×") && (
                        this.table[help.position.i][help.position.j] == 
                        this.table[compareWith.i][compareWith.j]))
                ){
                    return false;
                }
            }
        }

        for (let x of this.validsAtPosition(i, j)) {
            if (char == x) {
                return true
            }
        }

        return false
    }

    invalidPositions() {
        let invalidList = []
        for (let i = 0; i < 6; i++) {
            for (let j = 0; j < 6; j++) {
                if (!this.isValidPos(i, j)) {
                    invalidList.push({i: i, j: j})
                }
            }   
        }
        return invalidList
    }

    isFinished() {
        for (let i = 0; i < 6; i++) {
            for (let j = 0; j < 6; j++) {
                if (this.table[i][j] == 0) {
                    return false
                }
            }   
        }

        return (this.invalidPositions().length == 0)
    }

    emptyTable() {
        this.table = [] // 0 (empty) |  A  |  B
        for (let i = 0; i < 6; i++) {
            this.table.push(
                [0, 0, 0, 0, 0, 0]
            )
        }
    }
} 

class PlayerTable extends Game {
    constructor(code) {
        super(code)
        this.clear()
    }

    clear() {
        let savedShows = []
        for (let show of this.shows) {
            savedShows.push(this.table[show.i][show.j])
        }

        this.emptyTable()
        
        for (let show of this.shows) {
            this.table[show.i][show.j] = savedShows.shift()
        }
    }

    toggle(i, j) {
        this.lastClicked = null;

        if (this.isFinished()) {return}
        for (let show of this.shows) {
            if (show.i == i && show.j == j) {
                return
            }
        }

        switch (this.table[i][j]) {
            case "A":
                this.table[i][j] = "B"
                break;
            case "B":
                this.table[i][j] = 0
                break;
            default:
                this.table[i][j] = "A";
        }
        this.lastClicked = {i: i, j: j};
        if (!this.started) {
            this.started = Date.now()
        }
        if (this.isFinished()) {
            this.completionTime = Date.now()-this.started
        }
    }
}

// ---------------------------------------------------------------------------

const oneDay = 24 * 60 * 60 * 1000; // hours*minutes*seconds*milliseconds
const firstDate = new Date('2024-12-27T00:00:00');
const secondDate = new Date();

const diffDays = Math.round(Math.abs((firstDate - secondDate) / oneDay));

console.log("days elapsed since start:", diffDays)

game = new Game(diffDays)
playerTable = new PlayerTable(game.code)

const debug = document.getElementById("debug")
const table = document.getElementById("table")
const emojis = {
    A: "🍑",
    B: "🍏",
    0: " "
}
const clear = document.getElementById("clear")
const cronometer = document.getElementById("cronometer")
const finalScreen = document.getElementById("final-screen")
const shareBtn = document.getElementById("share")
const finalTime = document.getElementById("final-time")
const title = document.getElementById("title")
const dateSubtitle = document.getElementById("date")
const readableDate = secondDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
});
const helpButton = document.getElementById("help-button")
const tutorialReady = document.getElementById("tutorial-ready")
const helpScreen = document.getElementById("help-screen")

title.textContent = "Flamingo #" + diffDays
dateSubtitle.textContent = readableDate

var finished = false

function finish() {
    console.log("holaaaaaa")
    if (finished) {return}
    finished = true

    table.classList.add("finished")
    finalScreen.style.opacity = 1
    finalTime.textContent = cronometer.textContent

    localStorage.setItem('last-solved', diffDays)
    localStorage.setItem('solved-time', cronometer.textContent)
    localStorage.setItem('solved-state', JSON.stringify(playerTable.table))
}

function renderTable(game) {
    table.innerHTML = "";
    for (let i = 0; i < 6; i++) {
        for (let j = 0; j < 6; j++) {
            let tile = document.createElement("div")
            tile.classList.add("tile")
            tile.id = 6*i + j
            tile.textContent = emojis[game.table[i][j]]
            table.appendChild(tile)
        }
    }
    // helps
    for (let help of game.helps){
        let id = 6*help.position.i + help.position.j
        let h = document.createElement("div")
        h.textContent = help.sign
        h.classList.add("help")
        h.classList.add(help.direction)
        document.getElementById(id).appendChild(h)
    }
    //shows
    for (let show of game.shows) {
        let id = 6*show.i + show.j
        document.getElementById(id).classList.add("show")
    }
    // animations
    if (game.lastClicked) {
        let id = 6*game.lastClicked.i + game.lastClicked.j
        document.getElementById(id).classList.add("last-clicked")
    }
    // wrong tiles
    for (let wrong of game.invalidPositions()) {
        let id = 6*wrong.i + wrong.j
        document.getElementById(id).classList.add("wrong")
    }
}
renderTable(playerTable)

if (!playerTable.started) { cronometer.textContent = "0:00" }

setInterval(() => {
    if (!playerTable.started) {
        cronometer.textContent = "0:00"
        cronometer.classList.add("stopped")
        return
    } else if (finished) {
        cronometer.classList.add("stopped")
        return
    }

    cronometer.classList.remove("stopped")
    const elapsedMilliseconds = Date.now() - playerTable.started; 
    const elapsedSeconds = Math.floor(elapsedMilliseconds / 1000);

    const minutes = Math.floor(elapsedSeconds / 60);
    const seconds = elapsedSeconds % 60;

    cronometer.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
}, 500); 

table.addEventListener('click', (event) => {
    playerTable.toggle(Math.floor(event.target.id / 6), event.target.id % 6)
    renderTable(playerTable)

    if (playerTable.isFinished()) {
        finish()
    }
})

clear.addEventListener('click', () => {
    if (finished) { return }
    playerTable.clear()
    renderTable(playerTable)
})

shareBtn.addEventListener("click", () => {
    if (navigator.share) {
        navigator.share({
          title: document.title,
          text: 'Try to beat ' + cronometer.textContent + '! Flamingo #' + diffDays,
          url: window.location.href
        })
        .then(() => console.log('Page shared successfully!'))
        .catch((error) => console.error('Error sharing the page:', error));
    } else {
    console.log('Web Share API is not supported in this browser.');
    }
});

helpButton.addEventListener("click", ()=>{
    helpScreen.style.display = "flex"
})

tutorialReady.addEventListener("click", ()=>{
    helpScreen.style.display = "none"
})

Array.from(document.getElementsByClassName("example")).forEach((el) => {
    if (el.classList.contains("tile")) {
        el.textContent = emojis[el.textContent]
    }
})

let h = document.createElement("div")
h.textContent = "×"
h.classList.add("help")
h.classList.add("right")
document.getElementById("example1").appendChild(h)

h = document.createElement("div")
h.textContent = "="
h.classList.add("help")
h.classList.add("right")
document.getElementById("example2").appendChild(h)

// If already solved today's, loads the finished state
if (localStorage.getItem('last-solved') == diffDays) {
    playerTable.table = JSON.parse(localStorage.getItem('solved-state'))
    renderTable(playerTable)
    cronometer.textContent = localStorage.getItem('solved-time')
    finish()
}