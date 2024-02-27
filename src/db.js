require("dotenv").config();
const { Sequelize } = require("sequelize");
const fs = require("fs");
const path = require("path");
const { DB } = process.env;

const sequelize = new Sequelize(DB, {
  logging: false,
  native: false,
});
const basename = path.basename(__filename);

const modelDefiners = [];

fs.readdirSync(path.join(__dirname, "/models"))
  .filter(
    (file) =>
      file.indexOf(".") !== 0 && file !== basename && file.slice(-3) === ".js"
  )
  .forEach((file) => {
    modelDefiners.push(require(path.join(__dirname, "/models", file)));
  });

modelDefiners.forEach((model) => model(sequelize));

let entries = Object.entries(sequelize.models);
let capsEntries = entries.map((entry) => [
  entry[0][0].toUpperCase() + entry[0].slice(1),
  entry[1],
]);
sequelize.models = Object.fromEntries(capsEntries);

const {
  Carritos,
  Colores,
  Configuraciones,
  Direcciones,
  Entidades,
  Ordenes,
  Productos_Descuentos,
  Productos,
  Promociones,
  Tallas,
  Usuarios,
} = sequelize.models;

// RELACIONES DE MODELOS (TABLAS)
// Usuarios 1:1 Entidades
Usuarios.hasOne(Entidades, { foreignKey: "usuario_id" });
Entidades.belongsTo(Usuarios, { foreignKey: "usuario_id" });

// Entidades 1:N Direcciones
Entidades.hasMany(Direcciones, { foreignKey: "entidad_id" });
Direcciones.belongsTo(Entidades, { foreignKey: "entidad_id" });

// Usuarios N:N Productos
Usuarios.belongsToMany(Productos, {
  foreignKey: "usuario_id",
  through: "Productos_Favoritos",
});
Productos.belongsToMany(Usuarios, {
  foreignKey: "producto_id",
  through: "Productos_Favoritos",
});

// Usuarios 1:1 Carritos
Usuarios.hasOne(Carritos, { foreignKey: "usuario_id" });
Carritos.belongsTo(Usuarios, { foreignKey: "usuario_id" });

// Usuarios 1:N Ordenes
Usuarios.hasMany(Ordenes, { foreignKey: "usuario_id" });
Ordenes.belongsTo(Usuarios, { foreignKey: "usuario_id" });

// Productos 1:1 Productos_Descuentos
Productos.hasOne(Productos_Descuentos, { foreignKey: "producto_id" });
Productos_Descuentos.belongsTo(Productos, { foreignKey: "producto_id" });

module.exports = {
  ...sequelize.models, // para poder importar los modelos así: const { Product, User } = require('./db.js');
  conn: sequelize, // para importart la conexión { conn } = require('./db.js');
  Carritos,
  Colores,
  Configuraciones,
  Direcciones,
  Entidades,
  Ordenes,
  Productos_Descuentos,
  Productos,
  Promociones,
  Tallas,
  Usuarios,
};
