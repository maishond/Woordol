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

    wordleState.word = await getWordleByDay(today);
    wordleState.date = today;
    return wordleState.word;
}

export async function getWordleByDay(date) {
    const response = await fetch(`https://www.nytimes.com/svc/wordle/v2/${date}.json`);
    if (!response.ok) {
        throw new Error('Failed to fetch Wordle');
    }
    const data = await response.json();
    return data.solution.toLowerCase();
}
