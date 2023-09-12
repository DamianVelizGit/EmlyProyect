import { Router } from "express";
import authentification from '../Middlewares/authentication.js'
import validation from '../Middlewares/joiValidation.js';

//Importamos los controllers para nuestras rutas
import { methods as providerControler } from './../controllers/proveedor.controller.js';


const router = Router();

//Ruta get para ver perfil de un usuario
router.get('/view/profile')

//Ruta post para crear un usuario
router.post('/new', authentification, providerControler.createProvider)

//Ruta post para inicio de sesion de usuario
router.post('/login')

//Ruta patch para actualizar un usuario
router.patch('/update/:id')




export default router