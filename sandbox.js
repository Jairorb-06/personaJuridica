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

  } catch (error) {
    console.error("Error al analizar el mensaje JSON:", error);
  }
});



async function fetchData() {
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
}


fetchData();
