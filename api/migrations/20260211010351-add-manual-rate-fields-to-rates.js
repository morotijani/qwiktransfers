'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Rates', 'use_api', {
      type: Sequelize.BOOLEAN,
      defaultValue: true
    });
    await queryInterface.addColumn('Rates', 'manual_rate', {
      type: Sequelize.DECIMAL(10, 4),
      allowNull: true
    });
    await queryInterface.addColumn('Rates', 'spread', {
      type: Sequelize.DECIMAL(5, 2),
      defaultValue: 5.0
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Rates', 'use_api');
    await queryInterface.removeColumn('Rates', 'manual_rate');
    await queryInterface.removeColumn('Rates', 'spread');
  }
};
