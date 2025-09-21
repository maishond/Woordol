import * as sdk from 'matrix-js-sdk';
import {ClientEvent, KnownMembership, RoomEvent} from 'matrix-js-sdk';
import {isDmRoom} from './matrixUtil.js';
import {wordList} from './wordList.js';
import {getTodaysWordle} from './nyt.js';
import {evaluateGuess} from './gameLogic.js';
import {renderGame} from './canvas.js';
import knex, {getDbDay} from './knex.js';
import {updateDayReport} from './dayReporter.js';

export const client = sdk.createClient({
    baseUrl: process.env.MATRIX_BASE_URL,
    userId: process.env.MATRIX_USER_ID,
    accessToken: process.env.MATRIX_ACCESS_TOKEN
});

await client.startClient({initialSyncLimit: 0});

client.once(ClientEvent.Sync, async () => {
    await updateDayReport();
});

client.on(RoomEvent.MyMembership, async (room, membership, prevMembership) => {
    if (membership !== KnownMembership.Invite) return;
    let event = room.getMember(client.getUserId())?.events?.member;
    if (!event) return;
    if (!event.getContent().is_direct) return;
    if (Date.now() - event.getTs() > 60_000) return; // Ignore invites older than 1 minute
    await client.joinRoom(room.roomId);
});

function timeoutResponse(resp, event) {
    setTimeout(async () => {
        try {
            await client.redactEvent(event.getRoomId(), resp.event_id);
            await client.redactEvent(event.getRoomId(), event.getId());
        } catch(ignored) {
        }
    }, 5000);
}

client.on(RoomEvent.Timeline, async function (event, room, toStartOfTimeline) {
    if (event.getType() !== 'm.room.message' || event.event.sender === client.getUserId()) return;
    if (!isDmRoom(room)) return;
    if (Date.now() - event.getTs() > 10_000) return; // Ignore messages older than 10 seconds, likely replays from earlier
    console.log(1)

    let guessHistoryRaw = await knex('guesses').where('guesser', event.event.sender).andWhere('date', getDbDay());
    let attempt = await knex('attempts').where('guesser', event.event.sender).andWhere('date', getDbDay()).first();

    if (attempt && attempt.right_after) {
        let resp = await client.sendTextMessage(room.roomId, 'Je hebt vandaag al gespeeld!');
        timeoutResponse(resp, event);
        return;
    }

    const guess = event.event.content.body.toLowerCase();
    if (!/^[a-zA-Z]{5}$/.test(guess)) {
        let resp = await client.sendTextMessage(room.roomId, 'Je gok moet vijf letters lang zijn!');
        timeoutResponse(resp, event);
        return;
    }
    if (!wordList.includes(guess)) {
        let resp = await client.sendTextMessage(room.roomId, 'Sorry, dat woord ken ik niet!');
        timeoutResponse(resp, event);
        return;
    }

    const todaysWord = await getTodaysWordle();

    const result = evaluateGuess(guess, todaysWord);
    const guessHistory = guessHistoryRaw.map((g) => [g.guess, evaluateGuess(g.guess, todaysWord)]);
    const storedResult = [guess, result];
    guessHistory.push(storedResult);
    await knex('guesses').insert({
        guesser: event.event.sender,
        date: getDbDay(),
        guess,
        attempt: guessHistory.length
    });
    if (!attempt) {
        attempt = {
            guesser: event.event.sender,
            date: getDbDay(),
            amount: 1,
            right_after: guess === todaysWord ? 1 : null
        };
        await knex('attempts').insert(attempt);
    } else {
        attempt.amount++;
        if (guess === todaysWord && !attempt.right_after) {
            attempt.right_after = attempt.amount;
        }
        await knex('attempts').where('guesser', event.event.sender).andWhere('date', getDbDay()).update(attempt);
    }

    const render = await renderGame(guessHistory);
    const asset = await client.uploadContent(
        render.data,
        {
            name: 'wordle.png',
            type: 'image/png'
        }
    );
    let resp = await client.sendImageMessage(room.roomId, asset.content_uri, {
        w: render.width,
        h: render.height
    }, '');
    await knex('guesses').update('game_canvas_id', resp.event_id).where({
        guesser: event.event.sender,
        date: getDbDay(),
        attempt: guessHistory.length
    });
    if (guess === todaysWord) {
        await client.sendTextMessage(room.roomId, `Gefeliciteerd! Je hebt het woord ${todaysWord.toUpperCase()} in ${guessHistory.length} poging${guessHistory.length !== 1 ? 'en' : ''} geraden!`);
    } else if (guessHistory.length >= 6) {
        await client.sendTextMessage(room.roomId, `Helaas, al je pogingen zijn op. Het woord was ${todaysWord.toUpperCase()}...`);
    }
    try {
        if (guessHistoryRaw.length > 1) {
            await client.redactEvent(room.roomId, guessHistoryRaw[guessHistoryRaw.length - 1].game_canvas_id);
        }
        await client.redactEvent(room.roomId, event.getId());
    } catch (ignored) {
    }
    await updateDayReport();
});

