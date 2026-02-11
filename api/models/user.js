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
      User.hasMany(models.Transaction, { foreignKey: 'vendorId', as: 'handledTransactions' });
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
    kyc_document_type: DataTypes.STRING,
    kyc_document_id: DataTypes.STRING,
    kyc_front_url: DataTypes.STRING,
    kyc_back_url: DataTypes.STRING,
    full_name: DataTypes.STRING,
    phone: {
      type: DataTypes.STRING,
      unique: true
    },
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
    reset_password_expires: DataTypes.DATE,
    is_online: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    sequelize,
    modelName: 'User',
  });
  return User;
};