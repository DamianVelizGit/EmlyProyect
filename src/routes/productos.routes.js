import { Router } from "express";
import authentification from '../Middlewares/authentication.js'
import rolValidator from '../Middlewares/rolValidation.js';

//Importamos los controllers para nuestras rutas
import { methods as productController } from './../controllers/productos.controller.js';

const router = Router();


//Ruta get para obtener todas las categorias
router.get('/list/category', productController.getCategory)

router.get('/list/categoryPaginacion', productController.getCategoryPaginacion)

router.get('/list/countCategory', productController.countProductsByCategory)

//Ruta post para crear las categorias
router.post('/new/category', authentification,  rolValidator("SuperAdministrator"), productController.createCategory)

router.patch('/update/category/:id', authentification, rolValidator("SuperAdministrator"), productController.updateCategory)

//Ruta delete para borrar una categoria
router.delete('/delete/category/:id', authentification, rolValidator("SuperAdministrator"), productController.CategoryDeleted)

//Ruta get para obtener todos los productos
router.get('/list/products', productController.getProducts)

router.get('/list/All-products', productController.getAllProducts)

router.post('/detaill/product', productController.getDetaillProduct)

router.get('/search/category', productController.searchProductsbyCategory)

//Ruta post para crear un producto
router.post('/new/product', authentification, rolValidator("SuperAdministrator"), productController.createProduct)


router.patch('/update/product/:id', authentification, rolValidator("SuperAdministrator"), productController.updateProduct)


router.delete('/delete/product/:id', authentification, rolValidator("SuperAdministrator"), productController.deleteProduct)

router.get('/searchProduc', productController.searchProducts);

router.post('/restore-stock', authentification, rolValidator("SuperAdministrator"), productController.RestoreStock)



export default router