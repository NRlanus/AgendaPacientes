import React, { useState, useEffect, useCallback, useRef } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import axios from "axios";
import "./CustomCalendar.css";
import "./App.css"; // Importa el archivo de estilos CSS

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
  const [namesCount, setNamesCount] = useState(0); // Estado para almacenar la cantidad de nombres
  const [patientType, setPatientType] = useState("");
  const [selectedPatientType, setSelectedPatientType] = useState("");



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

  const handleNameUpdate = (selectedtime, newName, newPatientType) => {
    if (!selectedName || !selectedDate || !selectedTime || !newName ) {
      alert(
        "Por favor seleccione una cita para editar y complete los campos requeridos"
      );
      console.log(
        "SELECTEDNAME: ",
        selectedName,
        "SELECTEDTIME: ",
        selectedTime,
        "NEWNAME: ",
        newName,
        "SELECTEDDATE: ",
        selectedDate
      );
      return;
    }

    const data = {
      fecha: formatDate(selectedDate),
      hora: selectedTime,
      nuevoNombre: newName,
      nuevaOsocial: selectedPatientType,
    };
    console.log("datos a editar: ", data);
    axios
      .put("http://localhost:5000/actualizarNombre", data)
      .then((response) => {
        console.log(response.data);
        // Actualizar la lista de citas después de la actualización del nombre
        loadAppointments(formatDate(selectedDate));
        setPatientName("");
        setIsEditing(false); // Desactivar el modo de edición después de la actualización
      })
      .catch((error) => {
        console.error("Error al actualizar el nombre:", error);
        alert("Error al actualizar el nombre");
      });
  };
  const handleDateClick = (date) => {
    setSelectedDate(date);
    //setSelectedTime('');
    // setPatientName('');
    //generateTimeSlots(); // Regenerar los espacios horarios al cambiar la fecha
  };
  const handleInputChange = (event) => {
    setPatientName(event.target.value);
  };

  const handleContextMenu = (event, name) => {
    event.preventDefault();
    setSelectedName(name);
    setContextMenuPosition({ x: event.clientX, y: event.clientY });
    setContextMenuVisible(true);
  };

  const handleContextMenuOptionClick = (option) => {
    setContextMenuVisible(false);
    if (option === "A") {
      setIsEditing(true);
    } else if (option === "B") {
      deleteAppointment();
    } else if (option === "C") {
      // Copiar el nombre seleccionado al portapapeles
      navigator.clipboard
        .writeText(selectedName)
        .then(() => {
          console.log("Nombre copiado al portapapeles:", selectedName);
          deleteAppointment(selectedName);
        })
        .catch((error) => {
          console.error("Error al copiar al portapapeles:", error);
          alert("Error al copiar al portapapeles");
        });
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

    setTimeSlots(timeOptions);
  }, [selectedDate]);
  /////// USEEFECTS======================================================
  useEffect(() => {
    // Contar la cantidad de nombres en la lista de citas
    const count = appointments.length;
    // Actualizar el estado con la nueva cantidad
    setNamesCount(count);
  }, [appointments]);

  useEffect(() => {
    if (selectedDate) {
      generateTimeSlots();
      loadAppointments();
    }
  }, [selectedDate, generateTimeSlots]);

  useEffect(() => {
    generateTimeSlotsRef.current = generateTimeSlots;
  });
  const generateTimeSlotsRef = useRef(generateTimeSlots);

  //==================================================================
  const handleNameClick = (name, time, patientType) => {
    setSelectedName(name);
    setSelectedTime(time);
    setSelectedPatientType(patientType); // Establece el tipo de paciente seleccionado para edición
     
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
        setAppointments([...appointments, data]);
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
    if (!selectedName || !selectedTime || !selectedPatientType) {
      alert("Por favor selecciona un elemento para eliminar.");
      return;
    }
console.log("datos para eliminar: ", selectedName, selectedTime, selectedPatientType);
    const data = {
      fecha: formatDate(selectedDate),
      hora: selectedTime,
      nombre: selectedName,
      oSocial:selectedPatientType,

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
        <Calendar
          onClickDay={handleDateClick}
          className="custom-calendar"
          tileClassName="custom-tile"
        />
        <p>Pacientes agendados: {namesCount}</p>{" "}
        {/* Mostrar la cantidad de nombres */}
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
                  onChange={handleInputChange}
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
            <div
              className="name-list-container"
              onClick={() => setSelectedName("")}
            >
              <ul className="time-list">
                {timeSlots.map((timeSlot, index) => (
                  <li key={index}>
                    <span>{timeSlot}</span>
                    {appointments.map(
                      (appointment, appIndex) =>
                        formatTime(appointment.hora) === timeSlot && (
                          <span
                            key={appIndex}
                            onContextMenu={(e) =>
                              handleContextMenu(e, appointment.nombre)
                            }
                            onClick={(e) => {
                              e.stopPropagation(); // Evita que el clic se propague al contenedor y deseleccione el nombre
                              handleNameClick(
                                appointment.nombre,
                                appointment.hora,
                                appointment.oSocial
                              );
                              setIsEditing(false); // Desactivar modo de edición al hacer clic en un elemento
                            }}
                            style={{
                              fontWeight:
                                selectedName === appointment.nombre
                                  ? "bold"
                                  : "normal",
                              cursor: "pointer",
                            }}
                          >
                            {/* Renderizar el campo de entrada si se está editando el elemento */}
                            {isEditing &&
                            selectedName === appointment.nombre ? (
                              <input
                                type="text"
                                value={patientName || appointment.nombre} // Utiliza patientName si está definido, de lo contrario, utiliza el nombre actual del appointment
                                onChange={(e) => setPatientName(e.target.value)}
                                onBlur={() =>
                                  handleNameUpdate(
                                    appointment.hora,
                                    patientName,
                                    selectedPatientType
                                  )
                                }
                                onKeyUp={(e) => {
                                  if (e.key === "Enter") {
                                    handleNameUpdate(
                                      appointment.hora,
                                      patientName,
                                      selectedPatientType
                                    );
                                  }
                                }}
                                autoFocus // Enfoca automáticamente el campo de entrada al activar el modo de edición
                              />
                            ) : (
                              <>
                                <span>{appointment.nombre}</span>
                                <span>({appointment.oSocial})</span>{" "}
                                {/* Mostrar el tipo de paciente */}
                              </>
                            )}
                          </span>
                        )
                    )}
                  </li>
                ))}
              </ul>
            </div>
            {contextMenuVisible && (
              <div
                ref={contextMenuRef}
                className="context-menu"
                style={{
                  top: contextMenuPosition.y,
                  left: contextMenuPosition.x,
                }}
                onClick={(e) => e.stopPropagation()} // Prevent closing when clicked inside
              >
                <div onClick={() => handleContextMenuOptionClick("A")}>
                  editar
                </div>
                <div onClick={() => handleContextMenuOptionClick("B")}>
                  eliminar
                </div>
                <div onClick={() => handleContextMenuOptionClick("C")}>
                  Option C
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Agenda;
