'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Transaction extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Transaction.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
      Transaction.belongsTo(models.User, { foreignKey: 'vendorId', as: 'vendor' });
    }
  }
  Transaction.init({
    userId: DataTypes.INTEGER,
    type: DataTypes.STRING,
    amount_sent: DataTypes.DECIMAL,
    exchange_rate: DataTypes.DECIMAL,
    amount_received: DataTypes.DECIMAL,
    recipient_details: DataTypes.JSONB,
    status: DataTypes.STRING,
    proof_url: DataTypes.STRING,
    proof_uploaded_at: DataTypes.DATE,
    vendorId: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'Transaction',
  });
  return Transaction;
};