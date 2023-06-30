"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateInputString = void 0;
function validateInputString(inputString) {
    if (inputString.includes('Match')) {
        const matchNumber = inputString.match(/Match (\d+)/);
        if (matchNumber) {
            return { statsType: 'Match', statsTypeValue: matchNumber[1] };
        }
        else {
            throw new Error('Match number not found. Please check your input string.');
        }
    }
    else if (inputString.includes('Player')) {
        const playerName = inputString.match(/Games Player (Person \w+)/);
        if (playerName) {
            return { statsType: 'Player', statsTypeValue: playerName[1] };
        }
        else {
            throw new Error('Player name not found. Please check your input string.');
        }
    }
    else {
        throw new Error('Invalid input string. Please check your input.');
    }
}
exports.validateInputString = validateInputString;
