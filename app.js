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
            this.table = [] // 0 (empty) |  A  |  B
            for (let i = 0; i < 6; i++) {
                this.table.push(
                    [0, 0, 0, 0, 0, 0]
                )
            }

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
        let numberOfHelps = this.getRandomInt(2, 8);
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
        let numberOfShows = this.getRandomInt(2, 5);
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

        let possible = []

        for ( let letter of ["A", "B"] ) {
            if (
                (count(letter, row) < 3)
                && (count(letter, column) < 3)
                && (count(letter, column.slice(Math.max(0, i-2), i)) < 2)
                && (count(letter, column.slice(i+1, Math.min(i+3, 6))) < 2)
                && (count(letter, row.slice(Math.max(0, j-2), j)) < 2)
                && (count(letter, row.slice(j+1, Math.min(j+3, 6))) < 2)
            ) {
                possible.push(letter)
            }
        }

        return possible
    }

    isValidPos(i, j) {
        let char = this.table[i][j]

        for (let i of this.validsAtPosition(i, j)) {
            if (char == i) {
                return true
            }
        }

        return false
    }

    isValidTable() {
        // [true, undefined] | [false, error_coordinate]
        for (let i = 0; i < 6; i++) {
            for (let j = 0; j < 6; j++) {
                if (!this.isValidPos(i, j)) {
                    return [false, [i, j]]
                }
            }   
        }
        return [true, undefined]
    }

    isFinished() {
        for (let i = 0; i < 6; i++) {
            for (let j = 0; j < 6; j++) {
                if (this.table[i][j] == 0) {
                    return false
                }
            }   
        }
        return true
    }
} 


game = new Game(10)

const debug = document.getElementById("debug")
const table = document.getElementById("table")
const emojis = {
    A: "🍑",
    B: "🍏"
}

for (let i = 0; i < 6; i++) {
    for (let j = 0; j < 6; j++) {
        let tile = document.createElement("div")
        tile.id = 6*i + j
        tile.textContent = emojis[game.table[i][j]] 
        table.appendChild(tile)

        debug.innerHTML += game.table[i][j]
    }
    debug.innerHTML+="<br/>"
}

for (let help of game.helps){
    let id = 6*help.position.i + help.position.j
    let helpBox = document.createElement("div")
    helpBox.classList.add("help")
    helpBox.classList.add(help.direction)
    helpBox.textContent = help.sign
    document.getElementById(id).appendChild(helpBox)
}