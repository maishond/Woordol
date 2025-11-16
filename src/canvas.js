import * as PImage from 'pureimage';
import {Buffer} from 'node:buffer';
import {PassThrough} from 'node:stream';
import {client} from './index.js';

const font = PImage.registerFont(
    './JetBrainsMono-Regular.ttf',
    'JetbrainsMono'
);

await font.load();

const KEYBOARD = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm'];

export async function renderOverview(guessers, showGuesses = true) {
    const gc = Object.keys(guessers).length;
    const img = PImage.make(Math.min(180 * 4, gc * 180), (Math.ceil(gc / 4) * 180) + 30);
    const ctx = img.getContext('2d');

    ctx.fillStyle = '#333333';
    ctx.fillRect(0, 0, img.width, img.height);
    ctx.font = '25pt JetbrainsMono';

    ctx.fillStyle = '#999999';
    let today = new Date();
    ctx.fillText(`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`, 5, 25);

    let xO = 0;
    let yO = 30;
    for (let [guesserId, attempts] of Object.entries(guessers)) {
        let guesser = client.getUser(guesserId);
        if (!guesser) continue;

        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.font = '25pt JetbrainsMono';
        ctx.fillText(guesser.displayName || guesserId, xO + 90, yO + 25);

        let j = 0;
        for (let [, attempt, text] of attempts) {
            for (let i = 0; i < 5; i++) {
                let result = attempt[i];

                if (result === 2) {
                    ctx.fillStyle = '#6aaa64'; // Green
                } else if (result === 1) {
                    ctx.fillStyle = '#c9b458'; // Yellow
                } else {
                    ctx.fillStyle = '#787c7e'; // Gray
                }

                ctx.fillRect(xO + 30 + (i * 25), yO + 30 + (j * 25), 20, 20);
                if (showGuesses) {
                    ctx.fillStyle = '#ffffff';
                    ctx.font = '18pt JetbrainsMono';
                    ctx.fillText(text[i].toUpperCase(), xO + 40 + (i * 25), yO + 46 + (j * 25));
                }
            }
            j++;
        }

        xO += 180;
        if (xO + 180 > img.width) {
            xO = 0;
            yO += 180;
        }
    }

    return new Promise((resolve) => {
        const passThroughStream = new PassThrough();
        const pngData = [];
        passThroughStream.on('data', (chunk) => pngData.push(chunk));
        passThroughStream.on('end', () => resolve({
            data: Buffer.concat(pngData),
            width: img.width,
            height: img.height
        }));
        PImage.encodePNGToStream(img, passThroughStream);
    });
}

export function renderGame(answers) {
    const img = PImage.make(90 * 5, (answers.length * 90) + 130);
    const ctx = img.getContext('2d');

    ctx.fillStyle = '#333333';
    ctx.fillRect(0, 0, img.width, img.height);
    ctx.font = '65pt JetbrainsMono';

    let yO = 10;
    for (let answer of answers) {
        let xO = 10;
        for (let i = 0; i < 5; i++) {
            let letter = answer[0][i];
            let result = answer[1][i];

            if (result === 2) {
                ctx.fillStyle = '#6aaa64'; // Green
            } else if (result === 1) {
                ctx.fillStyle = '#c9b458'; // Yellow
            } else {
                ctx.fillStyle = '#787c7e'; // Gray
            }

            ctx.fillRect(xO, yO, 70, 70);
            ctx.fillStyle = '#ffffff';
            ctx.fillText(letter.toUpperCase(), xO + 15, yO + 58);
            xO += 90;
        }
        yO += 90;
    }

    ctx.font = '20pt JetbrainsMono';

    let letterScores = {};
    for (let answer of answers) {
        for (let i = 0; i < 5; i++) {
            let letter = answer[0][i];
            let result = answer[1][i];
            if (!(letter in letterScores) || result > letterScores[letter]) {
                letterScores[letter] = result;
            }
        }
    }

    for (let row of KEYBOARD) {
        let xO = (img.width - (row.length * 30) - ((row.length - 1) * 10)) / 2;
        for (let char of row) {
            let result = letterScores[char];
            if (result === 2) {
                ctx.fillStyle = '#6aaa64'; // Green
            } else if (result === 1) {
                ctx.fillStyle = '#c9b458'; // Yellow
            } else if (result === 0) {
                ctx.fillStyle = '#555555'; // Dark gray for wrong
            } else {
                ctx.fillStyle = '#a6acaf'; // Gray
            }

            ctx.fillRect(xO, yO, 30, 30);
            ctx.fillStyle = '#ffffff';
            ctx.fillText(char.toUpperCase(), xO + 9, yO + 22);
            xO += 40;
        }
        yO += 40;
    }

    return new Promise((resolve) => {
        const passThroughStream = new PassThrough();
        const pngData = [];
        passThroughStream.on('data', (chunk) => pngData.push(chunk));
        passThroughStream.on('end', () => resolve({
            data: Buffer.concat(pngData),
            width: img.width,
            height: img.height
        }));
        PImage.encodePNGToStream(img, passThroughStream);
    });
}

