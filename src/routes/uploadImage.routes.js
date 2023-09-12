import { Router } from "express";
import authentification from '../Middlewares/authentication.js'


const router = Router();

import { methods as uploadImageController } from './../controllers/uploadImage.controller.js';


router.post('/upload', authentification, uploadImageController.uploadImage);


export default router