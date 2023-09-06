import { Router } from "express";

//Importamos los controllers para nuestras rutas
import { methods as productController } from './../controllers/productos.controller.js';

const router = Router();

//Ruta get para obtener todos los productos
router.get('/list/products', productController.getProducts )

//Ruta get para obtener todas las categorias
router.get('/list/category', productController.getCategory )

//Ruta get para obtener un producto por ID
router.get('/list/product/:id')

//Ruta post para crear un producto
router.post('/new/product')

//Ruta patch para actualizar un producto
router.patch('/update/product/:id')

//Ruta delete para borrar un producto
router.delete('/delete/product/:id')


export default router