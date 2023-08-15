import express from "express"
import morgan from "morgan";

const app = express();

//Importacion del los archivos de rutas 
import empleadosRoutes from "./routes/empleados.routes";



//Configuraciones
app.set('port', 3000)


//Middlewares
//Usamos morgan para ver las salidas http en consola
app.use(morgan('dev'));
//Se convertiran los datos en formato JSON 
app.use(express.json());


//Rutas
app.use('/v1',empleadosRoutes)
app.use((req, res, next) =>{
    res.status(404).json({message: 'Not found endopoint'});
})

export default app;