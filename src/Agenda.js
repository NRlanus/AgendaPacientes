import React, { useState, useEffect, useCallback, useRef } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import axios from "axios";
import "./CustomCalendar.css";
import "./App.css"; // Importa el archivo de estilos CSS
import "./Modal.css";

//========================================================
const Agenda = () => {
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState("");
  const [patientName, setPatientName] = useState("");
  const [appointments, setAppointments] = useState([]);
  const [timeSlots, setTimeSlots] = useState([]);
  const [selectedName, setSelectedName] = useState("");
  const [contextMenuVisible, setContextMenuVisible] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({
    x: 0,
    y: 0,
  });
  const contextMenuRef = useRef(null);
  const [isEditing, setIsEditing] = useState(false);
  const [patientCounts, setPatientCounts] = useState({
    "Union Personal": 0,
    OSDE: 0,
    Particular: 0,
  }); // Estado para almacenar la cantidad de nombres y tipos de pacientes
  const [patientType, setPatientType] = useState("");
  const [selectedPatientType, setSelectedPatientType] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false); // Estado para controlar la ventana modal
  const [editedTime, setEditedTime] = useState("");
  const [editedName, setEditedName] = useState(""); // Estado para el nombre editado en la ventana modal
  const [editedPatientType, setEditedPatientType] = useState(""); // Estado para el tipo de paciente editado en la ventana modal
  const [namesCount, setNamesCount] = useState(0);
  const [nameStrikethrough, setNameStrikethrough] = useState({}); // Estado para mantener un registro de nombres tachados
const [selectedPkID, setSelectedPkID] = useState("");
  /*===============================================*/
  // Formatear la hora recibida del backend (hora en formato HH:MM:SS) a HH:MM
  const formatTime = (timeString) => {
    const [hour, minute] = timeString.split(":");
    return `${hour}:${minute}`;
  };

  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${year}-${month < 10 ? "0" : ""}${month}-${
      day < 10 ? "0" : ""
    }${day}`;
  };

  const handleEditButtonClick = () => {
    if (!editedName || !editedPatientType || (!selectedTime && !editedTime)) {
      alert("Por favor completa todos los campos");
      return;
    }
    console.log(
      "handleEditButtonClick: selectedTime ",
      selectedTime,
      "editedTime: ",
      editedTime
    );
    const horaSeleccionada = editedTime || selectedTime;
    const data = {
      pkID: selectedPkID,
      fecha: formatDate(selectedDate),
      hora: selectedTime,
      nuevoNombre: editedName,
      nuevaOsocial: editedPatientType,
      nuevaHora: horaSeleccionada,
    };

    console.log(data);
    axios
      .put("http://localhost:5000/actualizarNombre", data)
      .then((response) => {
        console.log(response.data);
        // Actualizar la lista de citas después de la actualización del nombre
        loadAppointments(formatDate(selectedDate));
        setEditedTime("");
        setSelectedTime("");
        setSelectedPkID("");
        setIsModalOpen(false); // Cierra la ventana modal después de la actualización
      })
      .catch((error) => {
        console.error("Error al actualizar el nombre:", error);
        alert("Error al actualizar el nombre");
      });
  };

  const loadAppointments = useCallback(
    (fecha) => {
      if (!selectedDate) return; // Salir si no hay fecha seleccionada

      const formattedDate = formatDate(selectedDate);

      axios
        .get(`http://localhost:5000/getCitas/${formattedDate}`)
        .then((response) => {
          // Verificar si las citas son diferentes antes de actualizar el estado
          if (JSON.stringify(response.data) !== JSON.stringify(appointments)) {
            setAppointments(response.data);
            console.log("Citas cargadas:", response.data);

            console.log(
              "lista de nombres en appointments: ",
              appointments.nombre
            );
          }
        })
        .catch((error) => {
          const { status, data } = error.response;

          // Manejar el error 404
          if (status === 404) {
            // Mostrar un mensaje al usuario indicando que no hay citas para la fecha seleccionada
            console.log("No hay citas para la fecha:", data.message);
            // Limpiar la lista de citas
            setAppointments([]);
          } else {
            // Manejar otros errores
            console.error("Error al cargar las citas:", error);
            alert("Error al cargar las citas");
          }
        });
    },
    [appointments, selectedDate]
  );

  const handleDateClick = (date) => {
    setSelectedDate(date);
  };

  const handleContextMenu = (event, name, pkID) => {
    event.preventDefault();
    setSelectedPkID(pkID);
    setSelectedName(name);
    setContextMenuPosition({ x: event.clientX, y: event.clientY });
    setContextMenuVisible(true);
    console.log("PKID EN HANDLECONTEXTMENU: ", pkID);
  };

  const handleContextMenuOptionClick = (option) => {
    setContextMenuVisible(false);
    if (option === "C") {
      setIsEditing(true);
    } else if (option === "B") {
      const isConfirmed = window.confirm(
        "¿Estás seguro de que deseas eliminar esta cita?"
      );
      if (isConfirmed) {
        deleteAppointment();
      }
    } else if (option === "E") {
      // Tachar o destachar el nombre seleccionado
      const isStruckThrough = nameStrikethrough[selectedName];
      setNameStrikethrough({
        ...nameStrikethrough,
        [selectedName]: !isStruckThrough,
      });
    } else if (option === "D") {
      // Abre la ventana modal
      setIsModalOpen(true);
    }
  };

  const closeContextMenu = useCallback(() => {
    setContextMenuVisible(false);
  }, []);

  const generateTimeSlots = useCallback(() => {
    if (!selectedDate) return;

    const startTime = new Date(selectedDate);
    startTime.setHours(15, 30, 0, 0);

    const endTime = new Date(selectedDate);
    endTime.setHours(20, 0, 0, 0);

    const timeOptions = [];
    let currentTime = new Date(startTime);

    while (currentTime <= endTime) {
      const hour = currentTime.getHours().toString().padStart(2, "0");
      const minute = currentTime.getMinutes().toString().padStart(2, "0");

      if (currentTime.getMinutes() === 50) {
        timeOptions.push(`${hour}:${minute}`);
        currentTime.setMinutes(currentTime.getMinutes() + 10); // Agrega 10 minutos para los intervalos de 50
      } else if (
        currentTime.getMinutes() === 30 ||
        currentTime.getMinutes() === 0 ||
        currentTime.getMinutes() === 20
      ) {
        timeOptions.push(`${hour}:${minute}`);
        currentTime.setMinutes(currentTime.getMinutes() + 10); // Agrega 10 minutos para los intervalos de 30, 00 o 20
      } else {
        timeOptions.push(`${hour}:${minute}`);
        currentTime.setMinutes(currentTime.getMinutes() + 5); // Agrega 5 minutos para otros intervalos
      }
    }
    console.log(timeOptions);
    setTimeSlots(timeOptions);
  }, [selectedDate]);
  /////// USEEFECTS======================================================

  useEffect(() => {
    // Si la modal está abierta y hay un nombre seleccionado, establece los valores iniciales
    if (isModalOpen && selectedName) {
      setContextMenuVisible(false);

      setEditedName(selectedName);
      setEditedPatientType(selectedPatientType);
    }
  }, [isModalOpen, selectedName, selectedPatientType]);

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setIsModalOpen(false);
      }
    };

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  useEffect(() => {
    // Contar la cantidad de nombres totales y la cantidad de cada tipo de paciente
    let totalCount = 0;
    const counts = {
      "Union Personal": 0,
      OSDE: 0,
      Particular: 0,
    };

    appointments.forEach((appointment) => {
      totalCount++;
      counts[appointment.oSocial]++;
    });

    // Actualizar el estado con los nuevos conteos
    setNamesCount(totalCount);
    setPatientCounts(counts);
  }, [appointments]);

  useEffect(() => {
    if (selectedDate) {
      generateTimeSlots();
      loadAppointments(formatDate(selectedDate));
    }
  }, [selectedDate, generateTimeSlots]);

  useEffect(() => {
    generateTimeSlotsRef.current = generateTimeSlots;
  });
  const generateTimeSlotsRef = useRef(generateTimeSlots);

  useEffect(() => {
    // Registro de consola para verificar el valor inicial de selectedTime

    console.log("Valor actualizado de selectedTime:", selectedTime);
  }, [selectedTime]);

  //==================================================================
  const handleNameClick = (pkID, name, time, patientType, editedTime) => {
    console.log("Valor de time en handleNameClick:", time);
    console.log("PKID EN HANLDENAMECLICK: ", pkID);
    setSelectedPkID(pkID);
    setSelectedName(name);
    setSelectedTime(time);
    setSelectedPatientType(patientType); // Establece el tipo de paciente seleccionado para edición

    console.log(
      "Hora despues del handleNameClick  selectedTime: ",
      selectedTime,
      selectedName,
      selectedPatientType
    );
  };

  const handleFormSubmit = (event) => {
    event.preventDefault();

    if (!selectedDate || !selectedTime || !patientName) {
      alert("Por favor seleccione una fecha, hora y nombre");
      return;
    }

    const isTimeSlotAvailable = appointments.every(
      (appointment) => appointment.hora !== selectedTime
    );

    if (!isTimeSlotAvailable) {
      alert(
        "El horario seleccionado ya está ocupado, por favor seleccione otro."
      );
      return;
    }

    ingresarPaciente();
  };

  const ingresarPaciente = () => {
    if (!selectedDate || !selectedTime || !patientName || !patientType) {
      alert("Por favor seleccione una fecha, hora y nombre");
      return;
    }

    const data = {
      fecha: formatDate(selectedDate),
      hora: selectedTime,
      nombre: patientName,
      oSocial: patientType, // Agregar el tipo de paciente al objeto de datos
    };
    console.log(data);
    axios
      .post("http://localhost:5000/guardarPaciente", data)
      .then((response) => {
        console.log(response.data);
        setAppointments([...appointments, {pkID:response.data.pkID, ...data}]);
        //setAppointments(response.data);
        setSelectedPkID("");
        setSelectedTime("");
        setPatientName("");
        setPatientType(""); // Limpiar el tipo de paciente después de ingresar
      })
      .catch((error) => {
        console.error("Error al enviar los datos al backend:", error);
        alert("Error al enviar los datos al backend");
      });
  };

  ///eliminar un paciente de la agenda ===================
  const deleteAppointment = () => {
    //if (!selectedPkID) {
    if (!selectedName || !selectedTime || !selectedPatientType) {
      alert("Por favor selecciona un elemento para eliminar.");
      return;
    }
    console.log(
      "datos para eliminar: ",
      selectedPkID,
      selectedName,
      selectedTime,
      selectedPatientType
    );
    const data = {
    fecha: formatDate(selectedDate),
    hora: selectedTime  
  };
    console.log("datos para eliminar: ", data);
    axios
      .delete("http://localhost:5000/eliminarCita", { data })
      .then((response) => {
        console.log(response.data);
        // Actualiza la lista de citas después de eliminar el elemento
        loadAppointments(formatDate(selectedDate));
      })
      .catch((error) => {
        console.error("Error al eliminar la cita:", error);
        alert("Error al eliminar la cita");
      });
  };

  return (
    <div className="app-container" onClick={closeContextMenu}>
      <div className="calendar-container">
        {/* Componente del calendario */}
        <Calendar
          onClickDay={handleDateClick}
          className="custom-calendar"
          tileClassName="custom-tile"
        />
        <div>
          <p>Pacientes agendados: {namesCount}</p>
          <p>Obras sociales:</p>
          <ul>
            {Object.entries(patientCounts).map(([type, count]) => (
              <li key={type}>
                {type}: {count}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="detail-container" style={{ marginLeft: "40px" }}>
        {selectedDate && (
          <div>
            <p>
              Día:{" "}
              {selectedDate.toLocaleDateString("es-ES", {
                weekday: "long",
                day: "numeric",
              })}
            </p>
            {/* Formulario de ingreso de datos */}
            <div>
              <select
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
              >
                <option value="">Horarios</option>
                {timeSlots.map((timeOption, index) => {
                  const isTimeSlotAvailable = appointments.every(
                    (appointment) => formatTime(appointment.hora) !== timeOption
                  );
                  return (
                    isTimeSlotAvailable && (
                      <option key={index} value={timeOption}>
                        {timeOption}
                      </option>
                    )
                  );
                })}
              </select>
              <form onSubmit={handleFormSubmit}>
                <input
                  type="text"
                  placeholder="Nombre del paciente"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                />
                <select
                  value={patientType}
                  onChange={(e) => setPatientType(e.target.value)}
                >
                  <option value="">Obra Social</option>
                  <option value="Union Personal">Union Personal</option>
                  <option value="OSDE">OSDE</option>
                  <option value="Particular">Particular</option>
                </select>
                <button type="submit">Ingresar</button>
              </form>
            </div>
            {/* Lista de nombres con opciones de edición y eliminación */}
            <div
              className="name-list-container"
              onClick={() => setSelectedName("")}
            >
              <ul className="time-list">
                {timeSlots.map((timeSlot, index) => (
                  <ul key={index} className="agendados">
                    <span className = "time">{timeSlot}</span>
                    {appointments.map(
                      (appointment, appIndex) =>
                        formatTime(appointment.hora) === timeSlot && (
                          <span
                            key={appIndex}
                            onContextMenu={(e) =>
                              selectedName === appointment.nombre &&
                              handleContextMenu(e, appointment.nombre)
                            }
                            onClick={(e) => {
                              e.stopPropagation();
                              handleNameClick(
                                appointment.pkID,
                                appointment.nombre,
                                formatTime(appointment.hora),
                                appointment.oSocial
                              );
                            }}
                            onMouseEnter={(e) => {
                              // Abre el menú contextual si hay un nombre seleccionado y el mouse está sobre ese nombre solamente
                              if (selectedName === appointment.nombre) {
                                handleContextMenu(e, appointment.nombre, appointment.pkID);
                              }
                            }}
                            style={{
                              fontWeight:
                                selectedName === appointment.nombre &&
                                selectedTime === formatTime(appointment.hora)
                                  ? "bold"
                                  : "normal",
                              cursor: "pointer",
                              textDecoration: nameStrikethrough[
                                appointment.nombre
                              ]
                                ? "line-through"
                                : "none",
                            }}
                          >
                            {isEditing &&
                            selectedName === appointment.nombre &&
                            selectedTime === appointment.hora ? (
                              <input
                                type="text"
                                value={editedName}
                                onChange={(e) => setEditedName(e.target.value)}
                                autoFocus
                              />
                            ) : (
                              <>
                                <span>{appointment.nombre}</span>
                                <span>({appointment.oSocial})</span>
                              </>
                            )}
                          </span>
                        )
                    )}
                  </ul>
                ))}
              </ul>
            </div>
            {/* Menú contextual */}
            {contextMenuVisible && selectedName && (
              <div
                ref={contextMenuRef}
                className="context-menu"
                style={{
                  top: contextMenuPosition.y,
                  left: contextMenuPosition.x,
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div onClick={() => setIsModalOpen(true)}>Editar</div>
                <div onClick={() => handleContextMenuOptionClick("E")}>
                  Tachar
                </div>
                <div onClick={() => handleContextMenuOptionClick("B")}>
                  Eliminar
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      {/* Ventana modal para editar nombres */}
      {isModalOpen && (
        <div className="modal">
          <div className="modal-content">
            <span className="close" onClick={() => setIsModalOpen(false)}>
              &times;
            </span>
            <h2>Editar Nombre</h2>
            <form>
              <select
                value={editedTime || selectedTime}
                onChange={(e) => setEditedTime(e.target.value)}
              >
                <option value="">{selectedTime}</option>
                {timeSlots.map((timeOption, index) => {
                  const isTimeSlotAvailable = appointments.every(
                    (appointment) => formatTime(appointment.hora) !== timeOption
                  );
                  return (
                    isTimeSlotAvailable && (
                      <option key={index} value={timeOption}>
                        {timeOption}
                      </option>
                    )
                  );
                })}
              </select>
              <label>
                Nombre:
                <input
                  type="text"
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                />
              </label>
              <label>
                Tipo de Paciente:
                <select
                  value={editedPatientType}
                  onChange={(e) => setEditedPatientType(e.target.value)}
                >
                  <option value="">Seleccionar</option>
                  <option value="Union Personal">Union Personal</option>
                  <option value="OSDE">OSDE</option>
                  <option value="Particular">Particular</option>
                </select>
              </label>
              <button type="button" onClick={handleEditButtonClick}>
                Editar
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Agenda;
