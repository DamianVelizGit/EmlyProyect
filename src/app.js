import express from "express"
import morgan from "morgan";
import {SECRET} from './config'
const session = require('express-session');
import {sessionStore} from './database/database.js'

const app = express();

//Importacion del los archivos de rutas 
import empleadosRoutes from "./routes/empleados.routes";
import administradorRoutes from "./routes/admin.routes";
import logoutRoutes from "./routes/logout.routes";
import productoctRoutes from "./routes/productos.routes";
import userRoutes from "./routes/user.routes";

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


//Middlewares
//Usamos morgan para ver las salidas http en consola
app.use(morgan('dev'));
//Se convertiran los datos en formato JSON 
app.use(express.json());


//Rutas
app.use('/v1',empleadosRoutes)
app.use('/v1/administrators', administradorRoutes); 
app.use('/v1/user', userRoutes); 
app.use('/v1', logoutRoutes); 
app.use('/v1/product', productoctRoutes); 


app.use((req, res, next) =>{
    res.status(404).json({message: 'Not found endopoint'});
})

export default app;