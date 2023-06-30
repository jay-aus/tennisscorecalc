import { validateInputString } from '../validate/validate';
import { getRawFileData, transformAndExtractMatchData } from './util/util';
require('dotenv').config();

/**
 * Main function; starting point; invoke this based on user input; total 5 steps
 * @param {String} inputString User input text; rule based; See README.md for details
 */
function TennisScoreCalculator(inputString: string): void {
  // Step 1 - Validate input text
  const { statsType, statsTypeValue } = validateInputString(inputString);

  // Step 2 - Read the test file data
  const filePath = process.env.FILEPATH; // Set the file path here
  const fileData = getRawFileData(filePath as string);
  if (!fileData) {
    throw new Error('No file data found');
  }

  // Step 3 - Refine the data in our desired format
  const refinedFileData = transformAndExtractMatchData(fileData);

  // Step 4 - Statistics calculation
  const score = calculateMatchAndGameStats(refinedFileData, statsType, statsTypeValue);

  // Step 5 - Print the result in the required format
  printFinalResult(score, statsType);
}

/**
 * This functions filters the refines data to only include relevant information for calculating the score; match or player
 *
 * @param {Array} matchesData Object array; refined data after test file read
 * @param {String} statsType Can be Match or Player
 * @param {String} statsTypeValue Example like: 01 or Player A
 * @returns
 */
function calculateMatchAndGameStats(
  matchesData: any[],
  statsType: string,
  statsTypeValue: string
): any {
  if (statsType === 'Match') {
    // filter by match id
    const gamesData = matchesData.find((obj) => obj.Match === statsTypeValue);
    if (!gamesData) throw new Error('No data found for this match. Please enter the correct match id');
    return matchStatistics(gamesData);
  } else if (statsType === 'Player') {
    // filter by player name
    const gamesData = matchesData.filter((obj) => obj.Players.includes(statsTypeValue));
    if (gamesData.length === 0) throw new Error('No data found for this player. Please enter the correct player name');
    return gameStatistics(gamesData, statsTypeValue);
  }
}

/**
 * Statistics calculation for a Player to show total games won and lost
 *
 * @param {Array} matches Object Array which contains all the Matches for a given Player
 * @param {String} statsTypeValue Can be Player or Match
 * @returns {Object} Consolidated match information for a player
 */
function gameStatistics(matches: any[], statsTypeValue: string): any {
  let totalGamesWonByPlayer = 0;
  let totalGamesLostByPlayer = 0;

  for (const item of matches) {
    const matchResult = matchStatistics(item);

    if (matchResult.player1 === statsTypeValue) {
      totalGamesWonByPlayer += matchResult.player1GamesWon;
      totalGamesLostByPlayer += matchResult.player2GamesWon;
    } else if (matchResult.player2 === statsTypeValue) {
      totalGamesWonByPlayer += matchResult.player2GamesWon;
      totalGamesLostByPlayer += matchResult.player1GamesWon;
    }
  }

  return {
    playerName: statsTypeValue,
    totalGamesWon: totalGamesWonByPlayer,
    totalGamesLost: totalGamesLostByPlayer,
  };
}

/**
 * Statistics calculation for a match to show outcome
 *
 * @param {Object} match Input passed is a match object
 * Sample input
 * {
 *    Match: '02',
 *    Players: 'Person A vs Person C',
 *    Points: [
 *      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
 *      0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1,
 *    ]
 * }
 * @returns {Object}
 * {
 *    player1: Player A,
 *    player2: Player B,
 *    player1GamesWon: 12,
 *    player2GamesWon: 6,
 *    player1SetsWon: 2,
 *    player2SetsWon: 1
 * };
 */
function matchStatistics(match: any): any {
  const POINTS_NEEDED_TO_WIN_GAME = 4;
  const POINTS_DIFF_NEEDED_TO_WIN_GAME = 2;
  const points = match.Points;
  const [player1, player2] = match.Players.split(' vs ');

  let games1 = 0;
  let games2 = 0;
  let sets1 = 0;
  let sets2 = 0;
  let points1 = 0;
  let points2 = 0;
  let totalgames1 = 0;
  let totalgames2 = 0;

  for (const point of points) {
    if (point === 0) {
      points1++;
    } else if (point === 1) {
      points2++;
    }
    // game calculation; first to reach 4 points
    if (points1 >= POINTS_NEEDED_TO_WIN_GAME && points1 - points2 >= POINTS_DIFF_NEEDED_TO_WIN_GAME) {
      games1++;
      points1 = 0;
      points2 = 0;
    } else if (points2 >= POINTS_NEEDED_TO_WIN_GAME && points2 - points1 >= POINTS_DIFF_NEEDED_TO_WIN_GAME) {
      games2++;
      points1 = 0;
      points2 = 0;
    }

    // set calculation; 6 games
    if (games1 === 6) {
      totalgames1 += games1;
      totalgames2 += games2;
      sets1++;
      games1 = 0;
      games2 = 0;
    } else if (games2 === 6) {
      totalgames1 += games1;
      totalgames2 += games2;
      sets2++;
      games1 = 0;
      games2 = 0;
    }
  }

  totalgames1 += games1;
  totalgames2 += games2;

  return {
    player1: player1,
    player2: player2,
    player1GamesWon: totalgames1,
    player2GamesWon: totalgames2,
    player1SetsWon: sets1,
    player2SetsWon: sets2,
  };
}

/**This function prints the result on the console based on the type of user input
 *
 * @param score Object either match object or consolidated user game data object
 * @param statsType String can be Player or Match
 */
function printFinalResult(score: any, statsType: string): void {
  if (statsType === 'Match') {
    let winner = '';

    if (score.player1SetsWon > score.player2SetsWon) {
      winner = `${score.player1} defeated ${score.player2}\n${score.player1SetsWon} sets to ${score.player2SetsWon}`;
    } else if (score.player1SetsWon < score.player2SetsWon) {
      winner = `${score.player2} defeated ${score.player1}\n${score.player2SetsWon} sets to ${score.player1SetsWon}`;
    } else {
      console.log('Match in progress scenario encountered?');
    }

    /*  TO DO

    Additional conditions to show match in progress? Per the original readme sample data; A wins 2 games but still wins the match 2 sets to 0
    Assuming it is a mistake??; this should be a match in progress scenario? Currently, a set is 6 games won by a player

    */

    console.log(winner);
  } else if (statsType === 'Player') {
    console.log(`${score.totalGamesWon} ${score.totalGamesLost}`);
  }
}

export {
  TennisScoreCalculator,
  calculateMatchAndGameStats,
  matchStatistics
};
