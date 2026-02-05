'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      User.hasMany(models.Transaction, { foreignKey: 'userId', as: 'transactions' });
    }
  }
  User.init({
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    password: DataTypes.STRING,
    role: DataTypes.STRING,
    kyc_status: DataTypes.STRING, // 'pending', 'verified', 'rejected'
    kyc_document: DataTypes.STRING,
    full_name: DataTypes.STRING,
    phone: DataTypes.STRING,
    profile_picture: DataTypes.STRING,
    country: DataTypes.STRING,
    transaction_pin: DataTypes.STRING, // 4-digit PIN (hashed)
    balance_ghs: DataTypes.DECIMAL,
    balance_cad: DataTypes.DECIMAL,
    is_email_verified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    verification_token: DataTypes.STRING,
    verification_token_expires: DataTypes.DATE,
    reset_password_token: DataTypes.STRING,
    reset_password_expires: DataTypes.DATE
  }, {
    sequelize,
    modelName: 'User',
  });
  return User;
};