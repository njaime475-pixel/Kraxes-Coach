# Kraxes Coach · MVP

Panel independiente de `Nico-cut` para el entrenador. Abre `index.html` en un navegador moderno o sirve esta carpeta con `python3 -m http.server 8000` y visita `http://localhost:8000`.

## Funciones incluidas

- Fichas de alumnos: objetivo, nivel, disponibilidad, fecha de inicio, peso inicial y observaciones.
- Bloques de entrenamiento por alumno: varios días, ejercicios, series, repeticiones, descanso y RIR.
- Registro de sesiones realizadas: ejercicio, carga, repeticiones, series y RIR.
- Controles de peso, cintura, ombligo, cadera, grasa corporal y adherencia; gráfico de peso.
- Fotos de progreso, comprimidas antes de guardarse.
- Resumen de alumnos activos, rutinas y controles pendientes.
- Exportación e importación de respaldo JSON.

## Alcance y datos

Es una herramienta local de **un entrenador**: los datos quedan en el almacenamiento del navegador que la abre. No tiene cuentas, acceso de alumnos, chat, sincronización entre dispositivos, copias automáticas ni integración con `Nico-cut`. No subas datos reales a un navegador compartido. Exportá respaldos periódicamente; importar un archivo reemplaza la información local actual tras pedir confirmación. Las fotos están incluidas en el JSON y pueden agrandar mucho el archivo.

El repositorio es privado porque los futuros datos de alumnos y sus fotografías son personales. Publicar este código no equivale a ofrecer una plataforma segura para información sensible: antes de abrir acceso a alumnos se necesitan autenticación, permisos por rol, servidor, almacenamiento y política de protección de datos.

## Desarrollo

No se necesitan paquetes ni compilación. `node --check app.js` comprueba la sintaxis. Los cambios viven exclusivamente en este repositorio.
