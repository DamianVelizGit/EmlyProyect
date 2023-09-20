import { Router } from "express";
import authentification from '../Middlewares/authentication.js'
import rolValidator from '../Middlewares/rolValidation.js';

//Importamos los controllers para nuestras rutas
import { methods as productController } from './../controllers/productos.controller.js';

const router = Router();


//Ruta get para obtener todas las categorias
router.get('/list/category', productController.getCategory)

//Ruta post para crear las categorias
router.post('/new/category', authentification, rolValidator("administrator"), productController.createCategory)

router.patch('/update/category/:id', authentification, rolValidator("administrator"), productController.updateCategory)

//Ruta delete para borrar una categoria
router.delete('/delete/category/:id', authentification, rolValidator("administrator"), productController.CategoryDeleted)

//Ruta get para obtener todos los productos
router.get('/list/products', productController.getProducts)

router.get('/search/category', productController.searchProductsByCategories)


//Ruta post para crear un producto
router.post('/new/product', authentification, rolValidator("administrator"), productController.createProduct)


router.patch('/update/product/:id', authentification, rolValidator("administrator"), productController.updateProduct)


router.delete('/delete/product/:id', authentification, rolValidator("administrator"), productController.deleteProduct)

router.get('/searchProduc', authentification, productController.searchProducts);

router.post('/restore-stock', authentification, rolValidator("administrator"), productController.RestoreStock)



export default router