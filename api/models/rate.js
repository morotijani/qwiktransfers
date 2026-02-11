'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Rate extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Rate.init({
    pair: DataTypes.STRING,
    rate: DataTypes.DECIMAL,
    use_api: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    manual_rate: DataTypes.DECIMAL,
    spread: {
      type: DataTypes.DECIMAL,
      defaultValue: 5.0
    }
  }, {
    sequelize,
    modelName: 'Rate',
  });
  return Rate;
};