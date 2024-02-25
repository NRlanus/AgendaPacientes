// Importa los módulos necesarios
import React, { useState, useRef, useEffect } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import axios from 'axios';
 


const ItemType = 'NAME';


// Componente Name (sin cambios)
const Name = ({ name, index, moveName, onSelect, isSelected, onContextMenu }) => {
  const [, ref] = useDrag({
    type: ItemType,
    item: { index },
  });

  const [, drop] = useDrop({
    accept: ItemType,
    hover: (draggedItem) => {
      if (draggedItem.index !== index) {
        moveName(draggedItem.index, index);
        draggedItem.index = index;
        onSelect(index);
      }
    },
  });

  const handleClick = () => {
    onSelect(index);
  };

  const handleContextMenu = (e) => {
    e.preventDefault();
    onContextMenu(e, index);
  };

  return (
    <div
      ref={(node) => ref(drop(node))}
      onContextMenu={handleContextMenu}
      style={{
        padding: '8px',
        border: '1px solid #ddd',
        marginBottom: '4px',
        fontWeight: isSelected ? 'bold' : 'normal',
      }}
      onClick={handleClick}
    >
      {name}
    </div>
  );
};

// Componente ContextMenu (sin cambios)
const ContextMenu = ({ visible, position, handleContextMenuClose, handleContextMenuItemClick }) => {
  if (!visible) {
    return null;
  }

  return (
    <div
      style={{
        position: 'absolute',
        top: position.y,
        left: position.x,
        background: '#fff',
        border: '1px solid #ddd',
        boxShadow: '0px 2px 5px rgba(0, 0, 0, 0.1)',
        borderRadius: '4px',
        zIndex: 1000,
      }}
    >
      <div onClick={() => handleContextMenuItemClick('A')} style={{ padding: '8px', cursor: 'pointer' }}>
        Editar
      </div>
      <div onClick={() => handleContextMenuItemClick('B')} style={{ padding: '8px', cursor: 'pointer' }}>
        Eliminar
      </div>
    </div>
  );
};

// Componente DragAndDropList
const DragAndDropList = () => {
  const [listaPacientes, setListaPacientes] = useState([]);
  const [newName, setNewName] = useState('');
  const [selectedItemIndex, setSelectedItemIndex] = useState(null);
  const [contextMenu, setContextMenu] = useState({ visible: false, index: null, position: { x: 0, y: 0 } });

  const containerRef = useRef(null);

  useEffect(() => {
    // Obtener la lista de nombres desde el servidor al cargar la página
    axios.get('http://localhost:5000/names')
      .then(response => {
        setListaPacientes(response.data);
      })
      .catch(error => {
        console.error('Error al obtener la lista de nombres:', error);
      });
  }, []);

  const addName = () => {
    if (newName.trim() !== '') {
      axios.post('http://localhost:5000/names', { name: newName})
        .then(response => {
          setListaPacientes([...listaPacientes, response.data.name ]);
          setNewName('');
        })
        .catch(error => {
          console.error('Error al agregar un nuevo nombre:', error);
        });
    }
  };

  const moveName = (fromIndex, toIndex) => {
    const updatedNames = [...listaPacientes];
    const [movedName] = updatedNames.splice(fromIndex, 1);
    updatedNames.splice(toIndex, 0, movedName);
    setListaPacientes(updatedNames);
   
    axios.put('http://localhost:5000/names', { names: updatedNames })
    .then(response => {
      console.log('Orden de nombres actualizado en la base de datos');
    
    })
    .catch(error => {
      console.error('Error al actualizar el orden de los nombres en la base de datos:', error);
    });

  };

  const handleSelect = (index) => {
    setSelectedItemIndex(index === selectedItemIndex ? null : index);
  };

  const handleContextMenu = (e, index) => {
    e.preventDefault();
    if (selectedItemIndex !== null) {
      setContextMenu({ visible: true, index, position: { x: e.clientX, y: e.clientY } });
    }
  };

  const handleContextMenuClose = () => {
    setContextMenu({ visible: false, index: null, position: { x: 0, y: 0 } });
  };

  const handleContextMenuItemClick = (action) => {
    if (action === 'A') {
      const updatedNames = [...listaPacientes];
      updatedNames[selectedItemIndex] = prompt('Editar nombre:', listaPacientes[selectedItemIndex]) || listaPacientes[selectedItemIndex];
      setListaPacientes(updatedNames);
  
      // Actualizar la base de datos con el nombre editado
      console.log(selectedItemIndex);
      axios.put(`http://localhost:5000/names/${selectedItemIndex+1}`, { name: updatedNames[selectedItemIndex] })
        .then(response => {
          console.log('Nombre editado en la base de datos');
        })
        .catch(error => {
          console.error('Error al editar el nombre en la base de datos:', error);
        });
    } else if (action === 'B') {
      // Eliminar el nombre de la base de datos
      axios.delete(`http://localhost:5000/names/${selectedItemIndex + 1}`)
        .then(response => {
          console.log('Nombre eliminado de la base de datos');
  
          // Actualizar la lista después de recibir la respuesta del servidor
          const updatedNames = listaPacientes.filter((_, index) => index !== selectedItemIndex);
          setListaPacientes(updatedNames);
          setSelectedItemIndex(null);
        })
        .catch(error => {
          console.error('Error al eliminar el nombre de la base de datos:', error);
        });
    }
    handleContextMenuClose();
  };

  return (
    <div ref={containerRef}>
      <div style={{ textAlign: 'center', margin: '20px' }}>
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && addName()}
          placeholder="Agregar nombre"
        />
        <button onClick={addName}>Agregar</button>
      
      </div>
   
      <DndProvider backend={HTML5Backend}>
        {listaPacientes.map((name, index) => (
          <Name
            key={index}
            name={name}
            index={index}
            moveName={moveName}
            onSelect={handleSelect}
            isSelected={index === selectedItemIndex}
            onContextMenu={handleContextMenu}
          />
        ))}
        <ContextMenu
          visible={contextMenu.visible}
          position={contextMenu.position}
          handleContextMenuClose={handleContextMenuClose}
          handleContextMenuItemClick={handleContextMenuItemClick}
        />
      </DndProvider>

      
    </div>

    
  );
  
};

export default DragAndDropList;
