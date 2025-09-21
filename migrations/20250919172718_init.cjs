/**
 * @param knex { import("knex").Knex }
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
    await knex.schema.createTable('guesses', (table) => {
        table.string('guesser').notNullable();
        table.integer('date').notNullable();
        table.string('guess').notNullable();
        table.string('game_canvas_id').nullable();
        table.integer('attempt').notNullable();
    });
    await knex.schema.createTable('attempts', (table) => {
        table.string('guesser').notNullable();
        table.integer('date').notNullable();
        table.integer('amount').notNullable();
        table.integer('right_after').nullable();
        table.unique(['guesser', 'date']);
    });
    await knex.schema.createTable('day_reports', (table) => {
        table.integer('date').notNullable().unique();
        table.string('message_id').notNullable();
    });
};

/**
 * @param knex { import("knex").Knex }
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
    await knex.schema.dropTableIfExists('day_reports');
    await knex.schema.dropTableIfExists('attempts');
    await knex.schema.dropTableIfExists('guesses');
};
