import React from 'react';
import FileUpload from './components/FileUpload';
import './App.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faDove } from '@fortawesome/free-solid-svg-icons'

const App = () => {      

    const bird = <FontAwesomeIcon icon={faDove} size="xs" color="#007bff" />

    return ( 
    <div className = "container mt-4">
        <h4 className="display-4 text-center mb-4">
      
            <p>{bird} Report Birding App</p>
        </h4>

        <FileUpload />
    </div>
    );
}

export default App;


/* Dentro de la carpeta componentes hay un componente DateForm.js que tiene como state a name, este name debe ser pasado a una funcion 
que se encuentra en myLogic.js, a su vez ejecuto esta función en server.js despues de haber subido hecho upload de un archivo .csv

el problema es que no puedo usar 'require' para importar un modulo de React.js hacia un archivo de node.js 

INTENTOS DE SOLUCION
1.- Escribir "type": "module",dentro de los package.json para que reconozca 'import', al hacer esto ya no te permite usar require, así que cambié todos los require por import module from 'module', 
reconoce todo excepto mi file myLogic.js, que es el necesito para invocar la funcion en server.js

2.- Hice un react component Generate.js para tratar de ejecutar allí la funcion que está en el file myLogic.js pero no reconoce un paquete 'office-gen' cuando hago import officegen from 'officegen'. 
Obtengo este error 
-----------------------------------
[1] Module not found: Can't resolve 'readable-stream/passthrough' in '/home/alexf/react_2020/REACT_FILE_UPLOAD/client/node_modules/officegen/lib/core'
-----------------------------------

Todos los paquetes de node necesarios están instalados como puedes ver en los packages.json

EN RESUMEN:

Quiero un dato que el usuario ingresa y se guarda en el state name (línea 4 y 17 en DateForm.js), 
que será usado por una función (línea 17 en myLogic.js) que a su vez se ejecuta en server.js en la línea 37.
*/
