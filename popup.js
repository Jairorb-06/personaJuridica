window.addEventListener("message", function (event) {
  if (event.data.allDatosPropietario) {
    const datosPropietario = event.data.allDatosPropietario;
    console.log("propietarios ", datosPropietario);
    let currentIndex = 0;
    document
      .getElementById("startAutomation")
      .addEventListener("click", function () {
        chrome.tabs.query(
          { active: true, currentWindow: true },
          function (tabs) {
            chrome.scripting.executeScript({
              target: { tabId: tabs[0].id },
              function: (datosPropietario, currentIndex) => {
                const propietarios = datosPropietario;
                console.log("propietarios", propietarios);
                console.log(currentIndex)
                
                const tipoDocumentoSelect = document.querySelector('#consultarPersonaJuridica\\:personaTipoDocumentos');
                const numeroDocumentoInput = document.querySelector('#consultarPersonaJuridica\\:personaNumeroDocumentos');
                
                if (currentIndex >= 0 && currentIndex < propietarios.length) {
                  const tipoDocumento = propietarios[currentIndex]['Tipo documento'];
                  const numeroDocumento = propietarios[currentIndex]['Nro. documento'];
                  const placa = propietarios[currentIndex]['placa'];
                  console.log(placa)
                  console.log(tipoDocumento)
                  console.log(numeroDocumento)
                  seleccionarOpcionSelect(tipoDocumentoSelect, tipoDocumento);
                  simularEvento(tipoDocumentoSelect, 'change');

                  numeroDocumentoInput.value = numeroDocumento.replace(/\./g, '');
                  simularEvento(numeroDocumentoInput, 'input');
                  currentIndex++;

                  const botonBuscar = document.querySelector('#consultarPersonaJuridica\\:btnconsultarPersonaJuridica');
                  if (botonBuscar) {
                    botonBuscar.click();
                    //console.log("boton buscar presionado")
                   setTimeout(() => {
                    var datosPersonaJuridica = {};
                    var tablaDatosPersonaJuridica = document.querySelector('#consultarPersonaJuridica\\:pGridContentInputColumns');
                    if (tablaDatosPersonaJuridica) {
                        var filasPersonaJuridica = tablaDatosPersonaJuridica.querySelectorAll('tbody tr');
                        filasPersonaJuridica.forEach(function (fila) {
                            var columnas = fila.querySelectorAll('td');
                            if (columnas.length >= 4) {
                                var etiqueta1 = columnas[0].textContent.trim().replace(':', '');
                                var valor1 = columnas[1].textContent.trim();
                                var etiqueta2 = columnas[2].textContent.trim().replace(':', '');
                                var valor2 = columnas[3].textContent.trim();
                                datosPersonaJuridica[etiqueta1] = valor1;
                                datosPersonaJuridica[etiqueta2] = valor2;
                            }
                        });
                    }
                    console.log('Datos Persona Jurídica:', datosPersonaJuridica);
                    

                    var datosDireccion = {};
                    var tablaDatosDireccion = document.querySelector('#consultarPersonaJuridica\\:pGridContentInputColumns2');
                    if (tablaDatosDireccion) {
                        var filasDireccion = tablaDatosDireccion.querySelectorAll('tbody tr');
                        filasDireccion.forEach(function (fila) {
                            var columnas = fila.querySelectorAll('td');
                            if (columnas.length >= 4) {
                                var etiqueta1 = columnas[0].textContent.trim().replace(':', '');
                                var valor1 = columnas[1].textContent.trim();
                                var etiqueta2 = columnas[2].textContent.trim().replace(':', '');
                                var valor2 = columnas[3].textContent.trim();
                                datosDireccion[etiqueta1] = valor1;
                                datosDireccion[etiqueta2] = valor2;
                            }
                        });
                    }
                    console.log('Datos Dirección:', datosDireccion);
                    

                    var datosRepresentante = [];
                    var tablaRepresentante = document.querySelector('#consultarPersonaJuridica\\:pagedTableRepresentantes');
                    if (tablaRepresentante) {
                        var filasRepresentante = tablaRepresentante.querySelectorAll('tbody tr');
                        filasRepresentante.forEach(function (fila) {
                            var columnas = fila.querySelectorAll('td');
                            if (columnas.length >= 3) {
                                var tipoDocumento = columnas[0].textContent.trim();
                                var numeroDocumento = columnas[1].textContent.trim();
                                var fechaInicioRepresentacion = columnas[2].textContent.trim();
                                
                                var representante = {
                                    'Tipo documento': tipoDocumento,
                                    'Nro. documento': numeroDocumento,
                                    'Fecha inicio representación': fechaInicioRepresentacion
                                };
                                
                                datosRepresentante.push(representante);
                            }
                        });
                    }
                    console.log('Datos Representante:', datosRepresentante);




                      if (Object.keys(datosPersonaJuridica).length > 0 && datosDireccion.length > 0) {
                        chrome.runtime.sendMessage({
                          datosPersonaJuridica: datosPersonaJuridica,
                          datosDirecciones: datosDireccion,
                          datosRepresentante: datosRepresentante,
                          placa: placa,
                          currentIndex: currentIndex
                        });
                      }
                    }, 3000)

                    //chrome.runtime.sendMessage({ currentIndex: currentIndex });
                  };

                } else {
                  console.log("consulta finalizada!");
                }

                function seleccionarOpcionSelect(select, tipoDocumento) {
                  if (tipoDocumento === "C.C." || tipoDocumento === "NIT") {
                    select.value = obtenerValorSelect(select, tipoDocumento === "C.C." ? "C - Cédula Ciudadanía" : "NIT");
                  } else {
                    select.value = obtenerValorSelect(select, tipoDocumento);
                  }
                }

                function obtenerValorSelect(select, value) {
                  for (let i = 0; i < select.options.length; i++) {
                    if (select.options[i].text.includes(value)) {
                      return select.options[i].value;
                    }
                  }
                  return '';
                }

                function simularEvento(elemento, tipoEvento) {
                  const evento = new Event(tipoEvento, {
                    bubbles: true,
                    cancelable: true,
                  });
                  elemento.dispatchEvent(evento);
                }

              },
              args: [datosPropietario, currentIndex],
            });

            chrome.runtime.onMessage.addListener(function (message) {
              const datosUbicabilidad = {
                //informacionPersona: message.informacionPersona,
                //datosDirecciones: message.datosDirecciones,
                //placa: message.placa
                datosPersonaJuridica: message.datosPersonaJuridica,
                datosDirecciones: message.datosDireccion,
                datosRepresentante: message.datosRepresentante,
                placa: message.placa,
                currentIndex: message.currentIndex
              };
              window.frames[0].postMessage(JSON.stringify(datosUbicabilidad), "*");
            });

            /* chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
              if (message.currentIndex !== undefined) {
                currentIndex = message.currentIndex;
                console.log("currentIndex inc", currentIndex)
                const startAutomationButton = document.getElementById("startAutomation");

                if (startAutomationButton) {
                  setTimeout(() => {
                    startAutomationButton.click();
                  }, 700);
                }

              }
            }); */

          }
        );
      });

  }
});
