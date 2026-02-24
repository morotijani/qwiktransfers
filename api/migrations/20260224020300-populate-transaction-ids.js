'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        const [transactions] = await queryInterface.sequelize.query(
            'SELECT id, "createdAt" FROM "Transactions" WHERE "transaction_id" IS NULL OR "transaction_id" = \'\';'
        );

        for (const tx of transactions) {
            const datePart = new Date(tx.createdAt).toISOString().slice(0, 10).replace(/-/g, '');
            const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
            const transaction_id = `QT-${datePart}-${randomPart}`;

            await queryInterface.sequelize.query(
                `UPDATE "Transactions" SET "transaction_id" = :transaction_id WHERE id = :id`,
                {
                    replacements: { transaction_id, id: tx.id },
                    type: Sequelize.QueryTypes.UPDATE
                }
            );
        }
    },

    async down(queryInterface, Sequelize) {
        // No reverse action needed for data population in this context
    }
};
