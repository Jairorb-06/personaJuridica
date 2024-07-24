window.addEventListener("message", function (event) {
  if (event.data.allDatosPropietario) {
    const datosPropietario = event.data.allDatosPropietario;
   // let currentIndex = 0;
   let currentIndex = event.data.indiceUbicabilidad;
   let indiceConsulta = 0;

    const startButton = document.getElementById("startAutomation");
    if (startButton) {
      // Remover event listener previo si existe
      startButton.removeEventListener("click", startAutomation);

      // Añadir el nuevo event listener
      startButton.addEventListener("click", startAutomation);
    }

    function startAutomation() {
      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        chrome.scripting.executeScript({
          target: { tabId: tabs[0].id },
          function: (datosPropietario, currentIndex, indiceConsulta) => {
            const propietarios = datosPropietario;

            const tipoDocumentoSelect = document.querySelector('#consultarPersonaJuridica\\:personaTipoDocumentos');
            const numeroDocumentoInput = document.querySelector('#consultarPersonaJuridica\\:personaNumeroDocumentos');

            if (currentIndex >= 0 && indiceConsulta>=0 && indiceConsulta < propietarios.length) {
              //const tipoDocumento = propietarios[indiceConsulta]['Tipo documento'];
              //const numeroDocumento = propietarios[indiceConsulta]['Nro. documento'];
              //const placa = propietarios[currentIndex]['placa'];

              const tipoDocumento = propietarios[indiceConsulta]["Tipo documento"] || propietarios[indiceConsulta]["tipoDocumentoPropietario"];
              const numeroDocumento = propietarios[indiceConsulta]["Nro. documento"] || propietarios[indiceConsulta]["nroDocumentoPropietario"];
              const placa = propietarios[indiceConsulta]["placa"];

              seleccionarOpcionSelect(tipoDocumentoSelect, tipoDocumento);
              simularEvento(tipoDocumentoSelect, 'change');

              numeroDocumentoInput.value = numeroDocumento.replace(/\./g, '');
              simularEvento(numeroDocumentoInput, 'input');
              currentIndex++;
              indiceConsulta++;

              const botonBuscar = document.querySelector('#consultarPersonaJuridica\\:btnconsultarPersonaJuridica');
              if (botonBuscar) {
                botonBuscar.click();

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
                console.log( currentIndex)
                if (Object.keys(datosPersonaJuridica).length > 0 && Object.keys(datosDireccion).length > 0) {
                  chrome.runtime.sendMessage({
                    datosPersonaJuridica: datosPersonaJuridica,
                    datosDireccion: datosDireccion,
                    datosRepresentante: datosRepresentante,
                    placa: placa,
                    currentIndex: currentIndex,
                    indiceConsulta: indiceConsulta,
                  });
                }
              }
            } else {
              console.log("consulta finalizada!");
              chrome.runtime.sendMessage({ finalizado: "consulta finalizada" });
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
          args: [datosPropietario, currentIndex, indiceConsulta],
        });
      });
    }

    chrome.runtime.onMessage.addListener(function (message) {
      const datosUbicabilidad = {
        datosPersonaJuridica: message.datosPersonaJuridica,
        datosDireccion: message.datosDireccion,
        datosRepresentante: message.datosRepresentante,
        placa: message.placa,
        currentIndex: message.currentIndex,
        indiceConsulta: message.indiceConsulta
      };
      if(message.finalizado){
        alert("Automatización completada!")
      }
      window.frames[0].postMessage(JSON.stringify(datosUbicabilidad), "*");
    });

    chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
      if (message.currentIndex !== undefined) {
        currentIndex = message.currentIndex;
        indiceConsulta= message.indiceConsulta;
        console.log("currentIndex inc", currentIndex);
        const startAutomationButton = document.getElementById("startAutomation");

        if (startAutomationButton) {
          setTimeout(() => {
            startAutomationButton.click();
          },700);
        }
      }
    });

  }
});
