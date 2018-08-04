import fs from 'fs';
import path from 'path';
import Sequelize from 'sequelize';
import config from '../config/config'; //eslint-disable-line

const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';
const actualConfig = config[env];
const db = {};
console.log(env, config);

const sequelize = new Sequelize(actualConfig);

fs
  .readdirSync(__dirname)
  .filter(file => (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-3) === '.js'))
  .forEach((file) => {
    const model = sequelize.import(path.join(__dirname, file));
    db[model.name] = model;
  });

Object.keys(db).forEach((modelName) => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
