
import React from 'react';
import { BrowserRouter as Router, Route,Routes} from 'react-router-dom';
import Menu from './Menu';
import DragAndDropList from './Admin';
import Listado from './ListaPacientes';
import Agenda from './Agenda';

function App() {
  return (
    <Router>
      <header>
        <Menu />
        <Routes>
        <Route path="/" element={<DragAndDropList />} />
        <Route path="/ListaPacientes" element={<Listado />} />
        <Route path="/Agenda" element={<Agenda />} />
        </Routes>
      </header>
    </Router>
  );
}

export default App;