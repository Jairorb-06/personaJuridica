const config = {
  apiKey: "AIzaSyCrHSBkkDtgv5zmdQnaxtPp2ftehhPUkqU",
  authDomain: "proyectplateregistration.firebaseapp.com",
  databaseURL: "https://proyectplateregistration-default-rtdb.firebaseio.com",
  projectId: "proyectplateregistration",
  storageBucket: "proyectplateregistration.appspot.com",
  messagingSenderId: "1091378837166",
  appId: "1:1091378837166:web:79133e45a006015b485f3f",
  measurementId: "G-YLGDWC3H2P",
};
firebase.initializeApp(config);

let placaActual = '';
let docIdUsed = null; 

window.addEventListener("message", async function(event) {
  console.log("Respuesta recibida en sandbox.js:", event.data);
  try {
    // Parsear la cadena JSON
    const datos = JSON.parse(event.data);

    // Acceder a cada objeto por separado
    const datosPersonaJuridica = datos.datosPersonaJuridica || {};
    const datosDireccion = datos.datosDireccion || {};
    const datosRepresentante = datos.datosRepresentante || {};
    const placa = datos.placa;
    const currentIndex = datos.currentIndex;

    // Limpiar campos vacíos
    function limpiarCamposVacios(obj) {
      const resultado = {};
      for (const key in obj) {
        if (obj[key] !== "") {
          resultado[key] = obj[key];
        }
      }
      return resultado;
    }

    const datosPersonaJuridicaLimpios = limpiarCamposVacios(datosPersonaJuridica);
    const datosDireccionLimpios = limpiarCamposVacios(datosDireccion);
    const datosRepresentanteLimpios = limpiarCamposVacios(datosRepresentante);

    const firestore = firebase.firestore();
    const docRef = firestore.collection("juridicas").doc(placa);

    // Transacción para verificar existencia y actualizar o agregar documento
    await firestore.runTransaction(async (transaction) => {
      const doc = await transaction.get(docRef);

      if (!doc.exists) {
        // Si el documento no existe, agregar uno nuevo
        transaction.set(docRef, {
          datosPersonaJuridica: datosPersonaJuridicaLimpios,
          datosDireccion: datosDireccionLimpios,
          datosRepresentante: datosRepresentanteLimpios,
          placa: placa,
          currentIndex: currentIndex,
        });
        console.log("Documento nuevo guardado en Firestore con placa:", placa);
      } else {
        // Si el documento existe, actualizarlo
        transaction.update(docRef, {
          datosPersonaJuridica: datosPersonaJuridicaLimpios,
          datosDireccion: datosDireccionLimpios,
          datosRepresentante: datosRepresentanteLimpios,
          currentIndex: currentIndex,
        });
        console.log("Documento existente actualizado en Firestore con placa:", placa);
      }
    });

    console.log("currentIndex", currentIndex, docIdUsed)
    if (docIdUsed) {
      const docRef = firestore.collection("placas").doc(docIdUsed);
      if (!isNaN(currentIndex)) {
        docRef
          .update({
            indiceUbicabilidad: currentIndex,
          })
          .then(() => {
            //console.log("Documento actualizado exitosamente.");
          })
          .catch((error) => {
            console.error("Error al actualizar el documento:", error);
          });
      }
    }


  } catch (error) {
    console.error("Error al analizar el mensaje JSON:", error);
  }
});



/*async function fetchData() {
  const app = firebase.initializeApp(config);
  const firestore = firebase.firestore();

  try {
    const platesCollection = firestore.collection("Placas");
    const querySnapshot = await platesCollection.get();

    const allDatosPropietario = [];
    querySnapshot.forEach(async (doc) => {
      const columnData = doc.data().placasUbicabilidad;
      console.log(columnData);
      if (Array.isArray(columnData)) {
        for (const plate of columnData) {
          const informacionCollection = firestore.collection("test2");
          const informacionQuery = await informacionCollection
            .where("datosBasicos.Placa", "==", plate)
            .get();

          informacionQuery.forEach((informacionDoc) => {
            // Obtener y manejar los datosPropietario si se encuentra la placa
            const datosPropietario = informacionDoc.data().datosPropietario;
            console.log(`Datos Propietario para la placa ${plate}:`, datosPropietario);

            // Agregar la placa al objeto de datosPropietario
            datosPropietario.forEach((datos) => {
              datos.placa = plate;
              allDatosPropietario.push(datos);
            });
          });
        }

        // Enviar el array completo como mensaje
        window.parent.postMessage({ allDatosPropietario }, "*");
      } else {
        console.log("No se encontraron datos de placas.");
      }
    });
  } catch (error) {
    console.error("Error al consultar la colección 'plates':", error);
  }
}*/

async function fetchData() {
  const firestore = firebase.firestore();

  try {
    const platesCollection = firestore.collection("placas");
    const documentIds = ["fotomultas", "migracion", "registro inicial"]; // Conservar los IDs originales

    let allDatosPropietario = [];
    let columnData = [];
    let indiceUbicabilidad = 0;
    let docData = null;
    let docIdUsed = null;

    // Recorre los documentos en el orden especificado
    for (const docId of documentIds) {
      const docRef = platesCollection.doc(docId);
      const docSnapshot = await docRef.get();

      if (docSnapshot.exists) {
        docData = docSnapshot.data();
        columnData = docData.placas;
        indiceUbicabilidad = docData.indiceUbicabilidad;

        // Verificar si el indiceUbicabilidad es mayor que el tamaño del arreglo por más de tres números
        if (indiceUbicabilidad > columnData.length + 3) {
          indiceUbicabilidad = 0;
        }

        if (indiceUbicabilidad < columnData.length) {
          // Si el indiceUbicabilidad es menor que el tamaño del array, continúa
          docIdUsed = docId; // Establecer el ID del documento para actualizar

          // Procesar las placas del documento actual
          for (let i = indiceUbicabilidad; i < columnData.length; i++) {
            const plate = columnData[i];

            if (docId === "fotomultas") {
              // Usar la colección "fotomultasExistencia" para "fotomultas"
              const fotomultasExistenciaCollection = firestore.collection("fotomultasExistencia");
              const informacionQueryFotomultasExistencia = await fotomultasExistenciaCollection
                .where("placa", "==", plate)
                .get();

              // Procesar la consulta de "fotomultasExistencia"
              const processQueryFotomultasExistencia = (informacionQuery) => {
                informacionQuery.forEach((informacionDoc) => {
                  const comparendos = informacionDoc.data().comparendos;

                  // Filtrar los datos que no tienen "NIT" como Tipo documento
                  const filteredComparendos = comparendos.filter(
                    (datos) => datos["Tipo documento"] === "NIT"
                  );

                  // Agregar la placa al objeto de comparendos filtrado
                  filteredComparendos.forEach((datos) => {
                    datos.placa = plate;
                    allDatosPropietario.push(datos);
                  });
                });
              };

              // Procesar las consultas de "fotomultasExistencia"
              processQueryFotomultasExistencia(informacionQueryFotomultasExistencia);
            } else {
              // Usar las colecciones de "migracion" y "registro inicial"
              const migracionCollection = firestore.collection("migracion");
              const registroInicialCollection = firestore.collection("registro inicial");

              const informacionQueryMigracion = await migracionCollection
                .where("placa", "==", plate)
                .get();
              const informacionQueryRegistroInicial = await registroInicialCollection
                .where("placa", "==", plate)
                .get();

              // Función para procesar los resultados de una consulta
              const processQuery = (informacionQuery, campoDatosPropietario) => {
                informacionQuery.forEach((informacionDoc) => {
                  const datosPropietario = informacionDoc.data()[campoDatosPropietario];

                  // Filtrar los datos que no tienen "NIT" como Tipo documento
                  const filteredDatosPropietario = datosPropietario.filter(
                    (datos) => datos["Tipo documento"] === "NIT"
                  );

                  // Agregar la placa al objeto de datosPropietario filtrado
                  filteredDatosPropietario.forEach((datos) => {
                    datos.placa = plate;
                    allDatosPropietario.push(datos);
                  });
                });
              };

              // Procesar las consultas de "migracion" y "registro inicial"
              processQuery(informacionQueryMigracion, "datosPropietario");
              processQuery(informacionQueryRegistroInicial, "datosPropietario");
            }
          }

          // Si el arreglo allDatosPropietario no está vacío, salir del bucle de documentos
          if (allDatosPropietario.length > 0) {
            break;
          } else {
            // Si está vacío, restablecer variables y continuar con el siguiente documento
            columnData = [];
            indiceUbicabilidad = 0;
            docData = null;
            docIdUsed = null;
          }
        }
      } else {
        console.log(`Documento con ID '${docId}' no encontrado.`);
      }
    }

    if (allDatosPropietario.length > 0) {
      // Enviar el array completo como mensaje
      console.log(allDatosPropietario);
      console.log(docIdUsed, indiceUbicabilidad);
      window.parent.postMessage({ allDatosPropietario, indiceUbicabilidad }, "*");
    } else {
      console.log("No se encontraron datos de placas válidos.");
    }
  } catch (error) {
    console.error("Error al consultar la colección 'plates':", error);
  }
}


fetchData();
