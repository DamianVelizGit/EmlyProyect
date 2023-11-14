import { Router } from "express";
import authentification from '../Middlewares/authentication.js'
import uploadMidleware from '../Middlewares/upload.js'


const router = Router();

import { methods as uploadImageController } from './../controllers/uploadImage.controller.js';


router.post('/uploadAvatar', authentification, uploadMidleware.single("avatarProfile"), uploadImageController.addUserAvatar, (error, req, res, next) => {
    res.status(400).send({ error: error.message });
});
router.get('/uploadAvatar/view', authentification, uploadImageController.ViewUserAvatar);


router.post('/uploadProductImg/:id', authentification, uploadMidleware.single("productImg"), uploadImageController.addProductImg, (error, req, res, next) => {
    res.status(400).send({ error: error.message });
});

router.get('/uploadProductImg/view/:id', uploadImageController.ViewProductImg);


export default router