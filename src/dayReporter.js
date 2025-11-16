import knex, {dbDayToNYT, getDbDay, getYesterdayDbDay} from './knex.js';
import {client} from './index.js';
import {getWordleByDay} from './nyt.js';
import {evaluateGuess} from './gameLogic.js';
import {renderOverview} from './canvas.js';

const ROOM_ID = process.env.DAY_REPORTS_ROOM_ID;

scheduleNextUpdate();

export async function updateDayReport(day, isToday = true) {
    const guesses = await knex('guesses').where('date', day);

    const guessers = {};
    const todaysWord = await getWordleByDay(dbDayToNYT(day));

    for (let guess of guesses) {
        let guesser = guessers[guess.guesser] ?? [];
        guessers[guess.guesser] = guesser;
        guesser.push([guess.attempt, evaluateGuess(guess.guess, todaysWord), guess.guess]);
    }

    for (let guesser in guessers) {
        guessers[guesser].sort((a, b) => a[0] - b[0]);
    }

    if (Object.keys(guessers).length === 0) {
        await createOrEditDayReport(day, {
            body: 'Nog niemand heeft Wordle gespeeld vandaag. Stuur mij een DM met je eerste gok!',
            msgtype: 'm.text'
        }, isToday);
    } else {
        const render = await renderOverview(guessers, !isToday);
        const upload = await client.uploadContent(
            render.data,
            {
                name: `overview-${getDbDay()}.png`,
                type: 'image/png'
            }
        );

        await createOrEditDayReport(day, {
            body: 'Image',
            info: {
                w: render.width,
                h: render.height,
            },
            msgtype: 'm.image',
            url: upload.content_uri
        }, isToday);
    }
}

async function createOrEditDayReport(day, content, createIfMissing) {
    const dayReport = await knex('day_reports').where('date', day).first();
    if (!dayReport) {
        if (!createIfMissing) return;
        const msg = await client.sendMessage(ROOM_ID, content);
        await knex('day_reports').insert({
            date: getDbDay(),
            message_id: msg.event_id
        });
    } else {
        await client.sendEvent(ROOM_ID, 'm.replace', {
            'm.new_content': content,
            'm.relates_to': {
                'rel_type': 'm.replace',
                'event_id': dayReport.message_id
            }
        });
    }
}

function scheduleNextUpdate() {
    const now = new Date();
    const nextMidnight = new Date(now);
    nextMidnight.setHours(24, 0, 5, 0); // 5 seconds after midnight
    const msUntilNextMidnight = nextMidnight - now;
    setTimeout(async () => {
        scheduleNextUpdate();
        await updateDayReport(getDbDay());
        await updateDayReport(getYesterdayDbDay());
    }, msUntilNextMidnight);
}
