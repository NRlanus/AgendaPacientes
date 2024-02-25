import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './ListaPacientes.css';



const ListadoPacientes = () => {
  const [listaPacientes, setListaPacientes] = useState([]);

  // Función para obtener la lista de nombres desde el servidor
  const obtenerListaPacientes = () => {
    axios.get('http://localhost:5000/names')
      .then(response => {
        setListaPacientes(response.data);
      })
      .catch(error => {
        console.error('Error al obtener la lista de nombres:', error);
      });
  };

  // Utilizamos useEffect para ejecutar la función una vez al cargar el componente
  useEffect(() => {
    obtenerListaPacientes();

    // Establecer un intervalo para actualizar la lista cada 5 segundos (por ejemplo)
    const intervalo = setInterval(() => {
      obtenerListaPacientes();
    }, 5000); // 5000 milisegundos = 5 segundos

    // Limpiar el intervalo al desmontar el componente para evitar fugas de memoria
    return () => clearInterval(intervalo);
  }, []);
  return (
    <div className="container">
    <div className="left">
     
      <div className="item">{listaPacientes.slice(0,1)}</div>
    </div>
    <div className="right">
      
      <div className="item">{listaPacientes.slice(1).map((name, index)=>(

<ul key={index}>{name}</ul>


      ))}</div>
      
    
    </div>
  </div>
  
  );
};

export default ListadoPacientes;

 
