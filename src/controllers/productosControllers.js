require("dotenv").config();
const { Productos } = require("../db");
const resultadosPaginados = require("../utils/paginacion");
const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

const todosLosProductos = async (paginaActual) => {
  const itemsPorPagina = 8;

  return resultadosPaginados(paginaActual, itemsPorPagina, Productos);
};

const productosDestacados = async (limite) => {
  try {
    const productos = await Productos.findAll({
      where: {
        destacado: true,
      },
      limit: limite,
      attributes: [
        "producto_id",
        "nombre",
        "descripcion",
        "imagen_principal",
        "precio",
      ],
    });

    return productos;
  } catch (error) {
    return error;
  }
};

const traerProducto = async (id) => {
  const response = await Productos.findByPk(id);
  if (response === null) {
    return "El producto no existe";
  } else {
    return response;
  }
};

const borrarProducto = async (producto_id) => {
  try {
    const producto = await Productos.findByPk(producto_id);

    if (!producto) {
      return "No existe ese producto";
    }

    await Productos.update(
      { inactivo: !producto.inactivo },
      {
        where: { producto_id: producto_id },
      }
    );

    return await Productos.findByPk(producto_id);
  } catch (error) {
    return error;
  }
};

const modificarProducto = async (
  producto_id,
  nombre,
  descripcion,
  imagen_principal,
  imagenes_secundarias,
  edad,
  genero,
  precio,
  destacado,
  inactivo,
  stock) => {
    try {
      console.log("id: " + producto_id);
      console.log("nombre: " + nombre);
      console.log("desc: "+ descripcion);
      console.log("imag1:" + imagen_principal);
      console.log("imags: " + imagenes_secundarias);
      console.log("edad: " + edad);
      console.log("genero: " + genero);
      console.log("precio:" + precio);
      console.log("destacado:" + destacado);
      console.log("inactivo:" + inactivo);
      console.log("stock:" + stock);
      const productoActual = await Productos.findByPk(producto_id,{
        attributes: { exclude: ["createdAt", "updatedAt"]},
      })
      const cloudinaryRegex = /^https:\/\/res\.cloudinary\.com\/dk4ysl2hw\/image\/upload\//;
      const extensionRegex = /\.(png|jpe?g|gif|webp|svg|heic|heif)$/i;

      //todo Actualizacion por cambio de nombre
      if (nombre !== productoActual.nombre) {
        await Productos.update(
          { nombre: nombre },
          { where: { producto_id: producto_id } }
        );
      }

      //todo Actualizacion por cambio de descripcion
      if (descripcion !== productoActual.descripcion) {
        await Productos.update(
          { descripcion: descripcion },
          { where: { producto_id: producto_id } }
        );
      }

      //todo Actualizacion por cambio de Imagen Principal
      if (imagen_principal !== productoActual.imagen_principal) {
        //Caso: imagen nueva, aún no subida a Cloudinary --> Imagen de PC o de celular. ¿LLegará hasheada?
        if (!cloudinaryRegex.test(imagen_principal)) {
          //Condición: ¿Cumple con los formatos permitidos?
          /////////////////////////////////////////////////////////
          const img_principal_cloud = await cloudinary.uploader.upload(
            imagen_principal,
            {
              upload_preset: "preset_imagenes_productos",
              allowed_formats: ["png", "jpg", "jpeg", "gif", "webp", "svg", "heic"],
            },
            function (err, result) {
              if (err) {
                throw new Error("Error al subir la imagen primaria: ", err);
              }
              try {
                return result.secure_url;
              } catch (err) {
                throw new Error("Error en img_principal_cloud: ", err);
              }
            }
          );
          await Productos.update(
            { imagen_principal: img_principal_cloud.secure_url },
            { where: { producto_id: producto_id } }
          );
          /////////////////////////////////////////////////////////
          // if (extensionRegex.test(imagen_principal)) {
          //   const imgPrincipal_cloudinary = await cloudinary.uploader.upload(
          //     imagen_principal,
          //     {
          //       upload_preset: "preset_imagenes_productos",
          //       allowed_formats: ["png", "jpg", "jpeg", "gif", "webp", "svg", "heic"],
          //     },
          //     function (err, result) {
          //       if (err) {
          //         throw new Error("Error al subir nueva imagen primaria: ", err);
          //       }
          //       try {
          //         return result.secure_url;
          //       } catch (err) {
          //         throw new Error("ModificarProducto Controller: Error en imgPrincipal_cloudinary. ", err);
          //       }
          //     }
          //   );
            
          //   await Productos.update(
          //     { imagen_principal: imgPrincipal_cloudinary.secure_url },
          //     { where: { producto_id: producto_id } }
          //   );
          // } else {
          //   throw new Error ('ModificarProducto Controller: Formato de imagen principal no permitido')
          // }
        } else{
          await Productos.update(
            { imagen_principal: imagen_principal },
            { where: { producto_id: producto_id } }
          );
        }
      }

      //todo Actualizacion por cambio de Imagenes secundarias
      //Si el arreglo llega vacío, lo actualiza inmediatamente.
      // if (imagenes_secundarias.length === 0) {
      //   await Productos.update(
      //     { imagenes_secundarias: imagenes_secundarias },
      //     { where: { producto_id: producto_id } }
      //   );
      // }
       imagenes_secundarias = [...new Set(imagenes_secundarias)];
      const imagenes_secundarias_cloud = [];

      for (let i = 0; i < imagenes_secundarias.length; i++) {
        if (!cloudinaryRegex.test(imagenes_secundarias[i])) {
          console.log("entro al if")
        await cloudinary.uploader.upload(
          imagenes_secundarias[i],
          {
            upload_preset: "preset_imagenes_productos",
            allowed_formats: ["png", "jpg", "jpeg", "gif", "webp", "svg", "heic"],
          },
          function (err, result) {
            if (err) {
              throw new Error("Error al subir las imagenes secundarias: ", err);
            }
  
            try {
              console.log("entro al push")
              imagenes_secundarias_cloud.push(result.secure_url);
            } catch (err) {
              throw new Error(
                "Error al construir el array imagenes_secundarias_cloud: ",
                err
              );
            }
          }
        );
      }else{
        imagenes_secundarias_cloud.push(imagenes_secundarias[i]);
      }
    }
      await Productos.update(
        { imagenes_secundarias: imagenes_secundarias_cloud },
        { where: { producto_id: producto_id } }
      );
      console.log('Array de imagenes recibido:', imagenes_secundarias_cloud)
     

      //todo Actualizacion por cambio de edad/categoría
      if (edad !== productoActual.edad) {
        await Productos.update(
          { edad: edad },
          { where: { producto_id: producto_id } }
        );
      }

      //todo Actualizacion por cambio de genero
      if (genero !== productoActual.genero) {
        await Productos.update(
          { genero: genero },
          { where: { producto_id: producto_id } }
        );
      }

      //todo Actualizacion por cambio de precio
      if (precio !== productoActual.precio) {
        await Productos.update(
          { precio: precio },
          { where: { producto_id: producto_id } }
        );
      }

      //todo Actualizacion por cambio de destacado
      if (destacado !== productoActual.destacado) {
        await Productos.update(
          { destacado: destacado },
          { where: { producto_id: producto_id } }
        );
      }

      //todo Actualizacion por cambio de inactivo
      if (inactivo !== productoActual.inactivo) {
        await Productos.update(
          { inactivo: inactivo },
          { where: { producto_id: producto_id } }
        );
      }

      //todo Actualizacion por cambio de stock
      if (stock !== productoActual.stock) {
        await Productos.update(
          { stock: stock },
          { where: { producto_id: producto_id } }
        );
      }

      console.log(`Se modificó exitosamente el producto ${producto_id}`)
      return await Productos.findByPk(producto_id);
    } catch (error) {
     console.error(error)
     throw new Error ("Error en modificarProducto Controller")
    }
};

const crearProducto = async (
  nombre,
  descripcion,
  imagen_principal,
  imagenes_secundarias,
  edad,
  genero,
  precio,
  destacado,
  inactivo,
  stock
) => {
  try {
    // Subimos la imagen principal a Cloudinary y retornamos la URL que nos devuelve el host.
    const img_principal_cloud = await cloudinary.uploader.upload(
      imagen_principal,
      {
        upload_preset: "preset_imagenes_productos",
        allowed_formats: ["png", "jpg", "jpeg", "gif", "webp", "svg", "heic"],
      },
      function (err, result) {
        if (err) {
          throw new Error("Error al subir la imagen primaria: ", err);
        }
        try {
          return result.secure_url;
        } catch (err) {
          throw new Error("Error en img_principal_cloud: ", err);
        }
      }
    );

    // Subimos las imágenes secundarias a Cloudinary y almacenamos las URLs retornadas en un arreglo.
    const imagenes_secundarias_cloud = [];

    for (let i = 0; i < imagenes_secundarias.length; i++) {
      await cloudinary.uploader.upload(
        imagenes_secundarias[i],
        {
          upload_preset: "preset_imagenes_productos",
          allowed_formats: ["png", "jpg", "jpeg", "gif", "webp", "svg", "heic"],
        },
        function (err, result) {
          if (err) {
            throw new Error("Error al subir las imagenes secundarias: ", err);
          }

          try {
            imagenes_secundarias_cloud.push(result.secure_url);
          } catch (err) {
            throw new Error(
              "Error al construir el array imagenes_secundarias_cloud: ",
              err
            );
          }
        }
      );
    }

    return await Productos.create({
      nombre,
      descripcion,
      imagen_principal: img_principal_cloud.secure_url,
      imagenes_secundarias: imagenes_secundarias_cloud,
      edad,
      genero,
      precio,
      destacado,
      inactivo,
      stock,
    });
  } catch (error) {
    throw new Error("Error en el controller crearProducto");
  }
};

const decrementarCantidad = async (producto_id, compra_talla, compra_color, compra_cantidad)=>{

  const producto = await Productos.findByPk(producto_id)
   const modificado = producto.dataValues.stock[compra_talla].filter((item)=> {
    if (item.color === compra_color){
      if ((item.cantidad - compra_cantidad) > 0){
        item.cantidad = item.cantidad - compra_cantidad;
        item.cantidad = item.cantidad.toString();
        return item
      }}else{
        return item
      }
   } )
   console.log(modificado)
   if(modificado.length){
    producto.dataValues.stock[compra_talla] = modificado
   }else{
    delete producto.dataValues.stock[compra_talla]
   }
   await Productos.update(
    { stock: producto.dataValues.stock },
    { where: { producto_id: producto_id } }
  );
  return await Productos.findByPk(producto_id);
}

const filtrarProductos = async () => {};

const destacarProducto = async (producto_id) => {
  if (!producto_id) {
    return "El producto no existe";
  } else {
    const producto = await Productos.findByPk(producto_id);

    await Productos.update(
      { destacado: !producto.destacado },
      {
        where: { producto_id: producto_id },
      }
    );

    return await Productos.findByPk(producto_id);
  }
};

module.exports = {
  todosLosProductos,
  traerProducto,
  borrarProducto,
  modificarProducto,
  crearProducto,
  filtrarProductos,
  destacarProducto,
  productosDestacados,
  decrementarCantidad
};
