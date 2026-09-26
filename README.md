# Kraxes Coach · MVP

Panel independiente de `Nico-cut` para el entrenador. Abre `index.html` en un navegador moderno o sirve esta carpeta con `python3 -m http.server 8000` y visita `http://localhost:8000`.

## Funciones incluidas

- Fichas de alumnos: objetivo, nivel, disponibilidad, fecha de inicio, peso inicial y observaciones.
- Evaluación de entrenamiento: fecha de nacimiento, sexo, experiencia, limitaciones, tiempo por sesión, lugar, equipamiento y notas del entrenador.
- Bloques de entrenamiento por alumno: varios días, ejercicios, series, repeticiones, descanso y RIR.
- Ejercicios reordenables con carga objetivo, RPE o RIR y observaciones. El objetivo queda en `exercise.planned`; las sesiones realizadas guardan `session.performed` y los campos anteriores siguen disponibles.
- Controles con peso, cintura, ombligo, pecho, cadera, brazo, muslo, grasa corporal y masa muscular; cada control muestra variaciones respecto del anterior.
- Fotos anteriores visibles; nuevas referencias por fecha y control, preparadas para conectar imágenes persistentes.
- Resumen de alumnos activos, rutinas y controles pendientes.
- Exportación e importación de respaldo JSON.

## Alcance y datos

Es una herramienta local de **un entrenador**: los datos quedan en el almacenamiento del navegador que la abre. La clave `kraxes-coach-mvp-v1` y las colecciones `students`, `plans`, `checkins`, `sessions` y `photos` siguen intactas. Los campos nuevos son opcionales; las fichas y rutinas anteriores se leen directamente sin migración. No tiene cuentas, acceso de alumnos, chat, sincronización entre dispositivos, copias automáticas ni integración con `Nico-cut`. No subas datos reales a un navegador compartido. Exportá respaldos periódicamente; importar un archivo reemplaza la información local actual tras pedir confirmación.

**Fotos:** las imágenes que se guardaron con la primera versión permanecen en `photos[].data` y se muestran sin cambios. Para no llenar `localStorage`, la versión actual no permite adjuntar archivos nuevos: registra fecha, vista y `checkinId` opcional como referencia. Una versión futura requiere almacenamiento persistente de imágenes. El repositorio y GitHub Pages son públicos; los datos del navegador no se suben al repositorio.

## Desarrollo

No se necesitan paquetes ni compilación. `node --check app.js` comprueba la sintaxis. Los cambios viven exclusivamente en este repositorio.
