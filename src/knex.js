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

