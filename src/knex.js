import Knex from 'knex';

export default Knex({
    client: 'sqlite3',
    connection: {
        filename: './db.sqlite3'
    },
    useNullAsDefault: true
});

export function getDbDay() {
    const now = new Date(new Date().toLocaleString('en-US', {timeZone: 'Europe/Amsterdam'}));
    return parseInt(`${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`);
}

export function dbDayToNYT(dbDay) {
    const str = String(dbDay);
    return `${str.substring(0, 4)}-${str.substring(4, 6)}-${str.substring(6, 8)}`;
}

export function getYesterdayDbDay() {
    const now = new Date(new Date().toLocaleString('en-US', {timeZone: 'Europe/Amsterdam'}));
    now.setDate(now.getDate() - 1);
    return parseInt(`${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`);
}

export function dbDayToDate(dbDay) {
    const str = String(dbDay);
    return `${str.substring(0, 4)}-${str.substring(4, 6)}-${str.substring(6, 8)}`;
}
