import express from "express"
import morgan from "morgan";
import {SECRET} from './config'
import {sessionStore} from './database/database.js'
const multer = require('multer') 
const session = require('express-session');


const app = express();

//Importacion del los archivos de rutas 
import administradorRoutes from "./routes/admin.routes";
import logoutRoutes from "./routes/logout.routes";
import productoctRoutes from "./routes/productos.routes";
import userRoutes from "./routes/user.routes";
import imageRoutes  from "./routes/uploadImage.routes"
import proveedorRoutes from "./routes/proveedor.routes"


//Configuraciones
app.set('port', 3001)

//Configuración de cors
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Methods', 'GET,PATCH,POST,DELETE');
  res.setHeader("Access-Control-Allow-Headers", "Origin, Content-Type, Authorization");
  next();
})

//Configuración para el uso de sesiones
     app.use(session({
        key: "cookieUser",
        secret: SECRET,
        maxAge: 24 * 60 * 60 * 1000,
        store: sessionStore,
        resave: false,
        saveUninitialized: false
    }))



const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Directorio donde se guardarán las imágenes
  },
  filename: (req, file, cb) => {
    // Renombra el archivo para evitar colisiones de nombres
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + '.' + file.originalname.split('.').pop());
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 1024 * 1024, // Tamaño máximo de 1MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten imágenes.'));
    }
  },
});

//Middlewares
//Usamos morgan para ver las salidas http en consola
app.use(morgan('dev'));
//Se convertiran los datos en formato JSON 
app.use(express.json());

app.use(express.urlencoded({ extended: true }));



//Rutas
app.use('/v1/administrators', administradorRoutes); 
app.use('/v1/user', userRoutes); 
app.use('/v1', logoutRoutes); 
app.use('/v1/product', productoctRoutes); 
app.use('/v1/imagen', imageRoutes);
app.use('/v1/proveedor', proveedorRoutes);



app.use((req, res, next) =>{
    res.status(404).json({message: 'Not found endopoint'});
})

export default app;