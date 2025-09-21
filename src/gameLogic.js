export const GUESS_WRONG = 0;
export const GUESS_MISPLACED = 1;
export const GUESS_CORRECT = 2;

export function evaluateGuess(guess, solution) {
    const result = Array(5).fill(GUESS_WRONG);
    const solutionLetters = solution.split('');
    const guessLetters = guess.split('');

    // First pass: check for correct letters in correct positions
    for (let i = 0; i < 5; i++) {
        if (guessLetters[i] === solutionLetters[i]) {
            result[i] = GUESS_CORRECT;
            solutionLetters[i] = null; // Mark this letter as used
            guessLetters[i] = null; // Mark this letter as processed
        }
    }

    // Second pass: check for correct letters in wrong positions
    for (let i = 0; i < 5; i++) {
        if (guessLetters[i] && solutionLetters.includes(guessLetters[i])) {
            result[i] = GUESS_MISPLACED;
            const index = solutionLetters.indexOf(guessLetters[i]);
            solutionLetters[index] = null; // Mark this letter as used
        }
    }

    return result;
}
