// Importa los módulos necesarios
const express = require('express');
const mysql = require('mysql');
const cors = require('cors');
const bodyParser = require('body-parser');

// Configuración de Express
const app = express();
app.use(express.json());
app.use(bodyParser.json());
app.use(cors({ origin: 'http://localhost:3000' }));


// Configuración de la conexión a la base de datos MySQL
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'Admin1234',
  database: 'listapacientes'
});

// Conectar a la base de datos MySQL
connection.connect(err => {
  if (err) {
    console.error('Error al conectar a la base de datos MySQL:', err);
    return;
  }
  console.log('Conexión a la base de datos MySQL exitosa');
});
/*================================================================================MUESTRA LISTADO*/
//Ruta para obtener la lista de nombres
app.get('/names', (req, res) => {
  connection.query('SELECT * FROM pacientes', (err, results) => {
    if (err) {
      console.error('Error al obtener la lista de nombres desde la base de datos:', err);
      res.status(500).json({ error: 'Error al obtener la lista de nombres' });
      return;
    }
    res.json(results.map(row => row.Nombre));
  });
});
/*================================================================================*/

/*================================================================================AGREGA NOMBRES*/ 

app.post('/names', (req, res) => {
  const { name } = req.body;

  // Obtener el próximo índice disponible
  connection.query('SELECT MAX(indice) AS maxIndex FROM pacientes', (error, results) => {
    if (error) {
      console.error('Error al obtener el máximo índice:', error);
      res.status(500).json({ error: 'Error al agregar un nuevo nombre' });
      return;
    }

    const nextIndex = results[0].maxIndex != null ? results[0].maxIndex + 1 : 1;

    // Insertar el nuevo nombre con el próximo índice disponible
    const INSERT_QUERY = `INSERT INTO pacientes (Nombre, indice) VALUES (?, ?)`;
    connection.query(INSERT_QUERY, [name, nextIndex], (error, results) => {
      if (error) {
        console.error('Error al agregar un nuevo nombre:', error);
        res.status(500).json({ error: 'Error al agregar un nuevo nombre' });
        return;
      }

      console.log('Nuevo nombre agregado correctamente a la base de datos');
      res.status(200).json({ success: true, name });
    });
  });
});


/*================================================================================EDITA NOMBRES*/

// Endpoint para editar un nombre
app.put('/names/:index', (req, res) => {
  const { index } = req.params;
  const { name } = req.body;

  const UPDATE_QUERY = `UPDATE pacientes SET Nombre = ? WHERE indice = ?`;

  connection.query(UPDATE_QUERY, [name, index], (error, results) => {
    if (error) {
      console.error('Error al editar el nombre en la base de datos:', error);
      res.status(500).json({ error: 'Error al editar el nombre en la base de datos' });
      return;
    }
    res.status(200).json({ success: true });
  });
});
/*================================================================================*/

/*================================================================================*/
// Endpoint para mover un nombre
app.put('/names', (req, res) => {
  //const { fromIndex, toIndex } = req.body;
  const {names} = req.body;
  console.log(req.body);

const updateQueries = names.map((name, index) => {
  return new Promise((resolve, reject) => {
    const UPDATE_QUERY = `UPDATE pacientes SET Nombre = ? WHERE indice = ?`;
    connection.query(UPDATE_QUERY, [name, index+1], (error, results) => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });
});

Promise.all(updateQueries)
  .then(() => {
    res.status(200).json({ success: true });
  })
  .catch(error => {
    console.error('Error al actualizar los nombres en la base de datos:', error);
    res.status(500).json({ error: 'Error al actualizar los nombres en la base de datos' });
  });
});
/*================================================================================*/


app.delete('/names/:index', (req, res) => {
  const { index } = req.params;

  // Eliminar el elemento de la base de datos por su índice
  connection.query('DELETE FROM pacientes WHERE indice = ?', [index], (error, results) => {
    if (error) {
      console.error('Error al eliminar el elemento de la base de datos:', error);
      res.status(500).json({ error: 'Error al eliminar el elemento de la base de datos' });
      return;
    }

    console.log('Elemento eliminado de la base de datos');

    // Actualizar los índices restantes para que sean secuenciales
    connection.query('UPDATE pacientes SET indice = indice - 1 WHERE indice > ?', [index], (error, results) => {
      if (error) {
        console.error('Error al actualizar los índices en la base de datos:', error);
        res.status(500).json({ error: 'Error al actualizar los índices en la base de datos' });
        return;
      }

      console.log('Índices actualizados en la base de datos');

      // Envía una respuesta de éxito al cliente
      res.status(200).json({ success: true });
    });
  });
});

// =============CODIGO PARA LA AGENDA==================================

const createTableQuery = `
    CREATE TABLE IF NOT EXISTS A2024 (
      fecha DATE,
      hora TIME,
      nombre VARCHAR(255)
    )
  `;
  connection.query(createTableQuery, (error, results) => {
    if (error) {
      console.error('Error al crear la tabla A2024:', error);
    } else {
      console.log('Tabla A2024 creada exitosamente');
    }
  });


// Ruta para guardar un nuevo paciente
app.post('/guardarPaciente', (req, res) => {
  const { fecha, hora, nombre,oSocial } = req.body;
  console.log("fecha hora y nombre en guardarPaciente: ", fecha, hora, nombre,oSocial);
  const [dia, mes, año] = fecha.split('/');
 
  // Insertar el paciente en la tabla A2024
  const insertQuery = `
    INSERT INTO A2024 (fecha, hora, nombre, oSocial)
    VALUES (?, ?, ?, ?)
  `;

  connection.query(insertQuery, [fecha , hora, nombre,oSocial], (error, results) => {
    if (error) {
      console.error('Error al guardar el paciente:', error);
      res.status(500).json({ error: 'Error al guardar el paciente' });
      return;
    }
    res.status(201).json({ message: 'Paciente guardado exitosamente' });
  });
});


// Consultar citas para la fecha especificada en la base de datos
// Ruta para obtener citas para una fecha específica
app.get('/getCitas/:fecha', (req, res) => {
  const fecha = req.params.fecha;

  const query = `
    SELECT hora, nombre, oSocial FROM A2024 
    WHERE fecha = ? 
    ORDER BY hora
  `;
  connection.query(query, [fecha], (error, results) => {
    if (error) {
      console.error('Error al obtener las citas:', error);
      res.status(500).json({ error: 'Error al obtener las citas' });
      return;
    }

    // Si no hay citas disponibles, enviar un mensaje personalizado
    if (results.length === 0) {
      res.status(404).json({ message: 'Todavía no hay turnos asignados para esta fecha' });
      return;
    }

    // Si hay citas disponibles, enviar los resultados
    res.json(results);
  });
});

// Ruta para actualizar el nombre de la cita
app.put('/actualizarNombre', (req, res) => {
  const { fecha, hora, nuevoNombre, nuevaOsocial } = req.body;
console.log(fecha, hora, nuevoNombre,nuevaOsocial)
  // Consulta SQL para actualizar el nombre de la cita
  const sql = `UPDATE a2024 SET nombre = ?, hora = ?, oSocial = ? WHERE fecha = ?`;

  // Ejecutar la consulta SQL con los parámetros
  connection.query(sql, [nuevoNombre, hora, nuevaOsocial, fecha], (err, result) => {
    if (err) {
      console.error('Error al actualizar el nombre de la cita:', err);
      res.status(500).send('Error al actualizar el nombre de la cita');
    } else {
      console.log('Nombre de la cita actualizado');
      res.status(200).send('Nombre de la cita actualizado');
    }
  });
});


//ELIMINAR UN NOMBRE DE LA AGENDA=========================
app.delete('/eliminarCita', (req, res) => {
  const { fecha, hora, nombre, oSocial } = req.body;
console.log(fecha, hora, nombre, oSocial);
  const sql = `DELETE FROM a2024 WHERE fecha = ? AND hora = ? AND nombre = ? And oSocial = ?`;
  connection.query(sql, [fecha, hora, nombre, oSocial], (err, result) => {
    if (err) {
      console.error('Error al eliminar la cita:', err);
      res.status(500).json({ error: 'Error al eliminar la cita' });
    } else {
      console.log('Cita eliminada con éxito:', result.affectedRows);
      res.status(200).json({ message: 'Cita eliminada con éxito' });
    }
  });
});




// Configuración del servidor para escuchar en el puerto 5000
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Servidor Express funcionando en el puerto ${PORT}`);
});
