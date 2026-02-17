'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        // First, ensure there are no duplicates before adding the constraint
        // (In a real production app, we should handle existing duplicates, 
        // but for this dev environment, we'll assume or fix locally)
        await queryInterface.addIndex('Rates', ['pair'], {
            unique: true,
            name: 'rates_pair_unique'
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.removeIndex('Rates', 'rates_pair_unique');
    }
};
