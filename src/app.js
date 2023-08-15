import express from "express"
import morgan from "morgan";

//Importacion del los archivos de rutas 
import empleadosRoutes from "./routes/empleados.routes";
const app = express();



//Configuraciones
app.set('port', 4000)


//Middlewares
//Usamos morgan para ver las salidas http en consola
app.use(morgan('dev'));
//Se convertiran los datos en formato JSON 
app.use(express.json());


//Rutas
app.use("/v1/empleados", empleadosRoutes);


export default app;