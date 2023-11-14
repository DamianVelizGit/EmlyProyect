const multer = require('multer')     //Cargamos el módulo multer

//Definimos una instancia para multer
const upload = multer({
    //Configuramos el limite de tamaño
    limits: {
        //Máximo 2 MB
        fileSize: 2000000
    },
    //Configuramos el tipo de archivo permitido
    fileFilter(req, file, cb) {
        //Validamos si el archivo no coincide con las extensiones permitidas
        if (!file.originalname.match(/\.(png|jpg|jpeg)$/)) {
            //Retornamos el callback de error en caso de no cumplir
            return cb(new Error("¡Por favor sube una imagen!"))
        }

        //Callback en caso de cumplir
        cb(undefined, true)
    }
})

//Exportamos el middleware de validación de archivo
module.exports = upload


