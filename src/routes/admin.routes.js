import { Router } from "express";
import  authentification from '../Middlewares/authentication.js'
import validation from '../Middlewares/joiValidation.js';
import rolValidator from '../Middlewares/rolValidation.js';

//Importamos los controllers para nuestras rutas
import { methods as adminController } from './../controllers/admin.controller.js';

import { methods as logoutController } from './../controllers/logout.controller.js';

const router = Router();


//Ruta get para obtener los usuarios
router.get('/list/users', authentification, adminController.getUsers)
//rolValidator("administrator"),

//Ruta get para obtener un usuario por ID
router.get('/list/user/:id', authentification,rolValidator("administrator"), adminController.getUser)

//Ruta delete para borrar un usuario
router.delete('/delete/:id', authentification,rolValidator("administrator"), adminController.DeleteUser)


//Ruta get para obtener los administradores
router.get('/administrators',authentification )

//Ruta get para obtener un administrador por ID
router.get('/administrator/:id',authentification)

//Ruta post para crear un administrador
router.post('/new')

//Ruta get para ver perfil de un administrador
router.get('/view/profile',authentification)

//Ruta patch para actualizar un administrador
router.patch('/update',authentification)

//Ruta delete para borrar un administrador
router.delete('/delete/:id',authentification)


export default router