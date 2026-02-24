'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn('Transactions', 'transaction_id', {
            type: Sequelize.STRING,
            unique: true,
            allowNull: true // Allow null for existing records, or we can populate them
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.removeColumn('Transactions', 'transaction_id');
    }
};
