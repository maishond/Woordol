const wordleState = {
    word: null,
    date: null
};

export async function getTodaysWordle() {
    const now = new Date(new Date().toLocaleString('en-US', {timeZone: 'Europe/Amsterdam'}));
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    if (wordleState.word && wordleState.date === today) {
        return wordleState.word;
    }

    const response = await fetch(`https://www.nytimes.com/svc/wordle/v2/${today}.json`);
    if (!response.ok) {
        throw new Error('Failed to fetch today\'s Wordle');
    }

    const data = await response.json();
    wordleState.word = data.solution.toLowerCase();
    wordleState.date = today;
    return wordleState.word;
}
