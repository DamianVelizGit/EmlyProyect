import { Router } from "express";
import authentification from '../Middlewares/authentication.js'
import uploadMidleware from '../Middlewares/upload.js'


const router = Router();

import { methods as uploadImageController } from './../controllers/uploadImage.controller.js';


router.post('/upload', authentification, uploadImageController.uploadImage);

router.post('/uploadAvatar', authentification, uploadMidleware.single("avatarProfile") ,uploadImageController.addUserAvatar, (error, req, res, next) => {
    res.status(400).send({ error: error.message });
});


export default router