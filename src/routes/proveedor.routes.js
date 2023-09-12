import { Router } from "express";
import authentification from '../Middlewares/authentication.js'
import rolValidator from '../Middlewares/rolValidation.js';
import validation from '../Middlewares/joiValidation.js';

//Importamos los controllers para nuestras rutas
import { methods as providerControler } from './../controllers/proveedor.controller.js';


const router = Router();


router.post('/new', authentification, rolValidator("administrator"), providerControler.createProvider)

router.get('/list/providers', authentification, rolValidator("administrator"), providerControler.viewProviders)

//Ruta patch para actualizar un usuario
router.patch('/update/:id', authentification, rolValidator("administrator"), providerControler.UpdateProvider)


router.delete('/deletePr/:id', authentification, rolValidator("administrator"), providerControler.DeleteProvider)





export default router