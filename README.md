# UTEQ Smart Parking — Panel de Administración

Panel administrativo desarrollado con **React + Vite + CoreUI** para el sistema de parqueadero inteligente de la UTEQ. Permite consultar y visualizar los vehículos autorizados almacenados en **Supabase** y monitorear el ingreso vehicular mediante **reconocimiento automático de placas (OCR)**.

El proyecto se encuentra desplegado en producción mediante **Vercel**, con acceso público mediante un dominio `vercel.app`.

<img width="813" height="417" alt="image" src="https://github.com/user-attachments/assets/d8c596de-3530-4486-bbb1-0225e951728f" />

<img width="372" height="509" alt="image" src="https://github.com/user-attachments/assets/dc3334bb-2aeb-4547-a11f-a025cb0035e7" />
<img width="542" height="643" alt="image" src="https://github.com/user-attachments/assets/cf5420a6-94c7-4cd0-82a5-9699db894ac4" />

---

## Contenido

* [Funcionalidades](#funcionalidades)

  * [1. Vehículos y propietarios](#1-vehículos-y-propietarios)
  * [2. Monitoreo de entrada](#2-monitoreo-de-entrada)
* [Tecnologías utilizadas](#tecnologías-utilizadas)
* [Configuración](#configuración)
* [Instalación y ejecución](#instalación-y-ejecución)
* [Estructura del proyecto](#estructura-del-proyecto)
* [Rutas de la aplicación](#rutas-de-la-aplicación)
* [Despliegue en Vercel](#despliegue-en-vercel)
* [Seguridad y buenas prácticas](#seguridad-y-buenas-prácticas)
* [Estado de verificación](#estado-de-verificación)
* [Autor](#autor)

---

## Funcionalidades

### 1. Vehículos y propietarios

Vista administrativa accesible en `/parqueadero/vehiculos` que consulta directamente la tabla `vehiculos` de Supabase.

* Fotografía del vehículo con enlace a la fuente original.
* Fotografía circular del propietario.
* Matrícula, marca, modelo, año y color.
* Nombre del propietario, cédula enmascarada y correo institucional.
* Estado de autorización del vehículo.
* Búsqueda por placa, marca, modelo, color, propietario o correo.
* Paginación de 10 registros por página.
* Indicador de carga.
* Mensajes de error.
* Botón **Actualizar** para recargar la información.

<img width="813" height="417" alt="image" src="https://github.com/user-attachments/assets/17d592f9-41d8-466c-8f1e-04a0b50b224c" />


La vista está orientada a la consulta y administración de la información de vehículos y propietarios disponible en Supabase.

---

### 2. Monitoreo de entrada

Vista accesible en `/parqueadero/monitoreo-entrada` que permite capturar la imagen de un vehículo y reconocer su placa automáticamente mediante un servicio REST de OCR, verificando posteriormente si el vehículo está registrado y autorizado.

#### Captura

* Vista previa de cámara en tiempo real mediante `navigator.mediaDevices.getUserMedia`.
* Preferencia por la cámara posterior en dispositivos móviles mediante `facingMode: environment`.
* Activación y detención de la cámara.
* Liberación automática de los recursos de la cámara al salir de la vista.
* Captura de fotografías mediante `<canvas>` y conversión a `Blob` JPEG.
* Selección alternativa de imágenes JPG o PNG desde el dispositivo.
* Validación del formato y tamaño de la imagen.
* Tamaño máximo permitido de 4 MiB.

<img width="767" height="366" alt="image" src="https://github.com/user-attachments/assets/64d2b6e5-3dfa-41a6-8b45-acfc97aee68d" />


#### Resultado del reconocimiento

* Envío de la imagen mediante `POST` al servicio OCR.
* Envío de la imagen como datos binarios, evitando JSON/Base64 para la solicitud.
* Estado del reconocimiento.
* Placa detectada.
* Nivel de confianza del reconocimiento.
* Visualización de la imagen procesada por la API.
* Representación de la placa detectada mediante un rectángulo.
* Consulta de los datos del vehículo asociados a la placa.
* Visualización de marca, modelo, año, color, fotografías, propietario y autorización cuando la información está disponible.
* Alerta **VEHÍCULO NO REGISTRADO** cuando la placa no corresponde a un vehículo registrado.
* Manejo de los estados `sin_placa`, `baja_confianza` y `multiples_placas`.
* Manejo de errores HTTP `400`, `413`, `415`, `502` y `504`.
* Opción para reintentar el procesamiento o seleccionar una nueva imagen.

<img width="724" height="350" alt="image" src="https://github.com/user-attachments/assets/5141c0d5-adf1-447e-9e02-1d9557ff420c" />
<img width="798" height="387" alt="image" src="https://github.com/user-attachments/assets/6f70dea7-11bb-4d26-b229-c42146ba5568" />
<img width="791" height="353" alt="image" src="https://github.com/user-attachments/assets/90a69e36-2b34-4b3e-83d7-7c549d11ce76" />
<img width="940" height="454" alt="image" src="https://github.com/user-attachments/assets/80f4ddd4-9121-459a-bdbe-62f1e8d120d2" />
<img width="940" height="450" alt="image" src="https://github.com/user-attachments/assets/24d3e167-64ea-4d91-8b48-fcdbe5b5845f" />


> La identificación de la placa y la consulta de los datos asociados se realizan mediante el servicio OCR proporcionado para el proyecto. El frontend consume la respuesta del servicio y presenta la información obtenida.

---

## Tecnologías utilizadas

| Tecnología         | Uso en el proyecto                                                      |
| ------------------ | ----------------------------------------------------------------------- |
| React 19           | Interfaz de usuario basada en componentes y hooks                       |
| Vite               | Servidor de desarrollo y compilación del proyecto                       |
| CoreUI React       | Componentes y diseño del panel administrativo                           |
| Supabase JS Client | Consulta de la información almacenada en Supabase                       |
| API REST OCR       | Reconocimiento automático de placas y consulta de información vehicular |
| `getUserMedia`     | Acceso a la cámara del dispositivo                                      |
| Canvas             | Captura y procesamiento de imágenes                                     |
| Sass               | Estilos utilizados por el template                                      |
| Git                | Control de versiones                                                    |
| GitHub             | Repositorio del código fuente                                           |
| Vercel             | Hospedaje y despliegue de producción                                    |

---

## Configuración

El proyecto utiliza variables de entorno para evitar almacenar directamente credenciales y configuraciones sensibles dentro del código fuente.

Crear un archivo `.env` o `.env.local` en la raíz del proyecto:

```dotenv
VITE_SUPABASE_URL=https://SU_PROYECTO.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=SU_CLAVE_PUBLICABLE
VITE_OCR_ENDPOINT=https://SU_ENDPOINT_OCR
```

### Variables utilizadas

| Variable                        | Descripción                                                       |
| ------------------------------- | ----------------------------------------------------------------- |
| `VITE_SUPABASE_URL`             | URL del proyecto de Supabase                                      |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Clave publicable utilizada por el cliente de Supabase             |
| `VITE_OCR_ENDPOINT`             | Endpoint del servicio REST encargado del reconocimiento de placas |

### Importante

Los archivos `.env`, `.env.local` y sus variantes **no deben subirse al repositorio de GitHub**.

Tampoco se debe colocar directamente en el código fuente ninguna clave privada, token o código de acceso del servicio.

La configuración de producción se realiza mediante las **Environment Variables de Vercel**.

---

## Instalación y ejecución

Clonar el repositorio:

```bash
git clone https://github.com/Jplazap/PLAZA_JORGE_SMART_PARKING_CRUD.git
```

Ingresar al proyecto:

```bash
cd PLAZA_JORGE_SMART_PARKING_CRUD
```

Instalar las dependencias:

```bash
npm install
```

Ejecutar el proyecto en modo desarrollo:

```bash
npm start
```

El proyecto estará disponible localmente en:

```text
http://localhost:3000
```

Las principales vistas pueden accederse mediante:

```text
http://localhost:3000/#/parqueadero/vehiculos
http://localhost:3000/#/parqueadero/monitoreo-entrada
```

> La aplicación utiliza `HashRouter`, por lo que las rutas incluyen el carácter `#`.

---

## Compilación para producción

Para generar la versión optimizada del proyecto:

```bash
npm run build
```

El proceso de compilación genera los archivos de producción en:

```text
build/
```

Para revisar el código mediante ESLint:

```bash
npm run lint
```

---

## Estructura del proyecto

```text
src/
├── _nav.jsx
├── routes.js
├── App.jsx
├── hooks/
│   ├── useVehiculos.js
│   └── useCamara.js
├── lib/
│   ├── supabase.js
│   └── ocrService.js
└── views/
    └── parqueadero/
        ├── ListaVehiculos.jsx
        └── monitoreo-entrada/
            ├── MonitoreoEntrada.jsx
            └── PanelResultado.jsx

.github/
└── workflows/
```

### Principales archivos

| Archivo                                                        | Función                                               |
| -------------------------------------------------------------- | ----------------------------------------------------- |
| `src/_nav.jsx`                                                 | Configuración del menú lateral                        |
| `src/routes.js`                                                | Registro de las rutas de la aplicación                |
| `src/App.jsx`                                                  | Componente principal y configuración del enrutamiento |
| `src/hooks/useVehiculos.js`                                    | Consulta y actualización de datos de vehículos        |
| `src/hooks/useCamara.js`                                       | Gestión de la cámara y captura de imágenes            |
| `src/lib/supabase.js`                                          | Configuración del cliente Supabase                    |
| `src/lib/ocrService.js`                                        | Comunicación con el servicio OCR                      |
| `src/views/parqueadero/ListaVehiculos.jsx`                     | Tabla de vehículos y propietarios                     |
| `src/views/parqueadero/monitoreo-entrada/MonitoreoEntrada.jsx` | Vista principal del monitoreo                         |
| `src/views/parqueadero/monitoreo-entrada/PanelResultado.jsx`   | Presentación del resultado del reconocimiento         |

---

## Rutas de la aplicación

| Ruta                             | Vista                    | Descripción                                                                       |
| -------------------------------- | ------------------------ | --------------------------------------------------------------------------------- |
| `/parqueadero/vehiculos`         | Vehículos y propietarios | Consulta, búsqueda y paginación de vehículos desde Supabase                       |
| `/parqueadero/monitoreo-entrada` | Monitoreo de entrada     | Captura de imágenes, reconocimiento de placas y consulta de información vehicular |

---

## Despliegue en Vercel

El proyecto se encuentra desplegado en producción mediante **Vercel**.

La integración se realiza directamente con el repositorio de GitHub:

```text
Jplazap/PLAZA_JORGE_SMART_PARKING_CRUD
```

### Configuración utilizada

| Parámetro          | Valor           |
| ------------------ | --------------- |
| Plataforma         | Vercel          |
| Framework          | Vite            |
| Root Directory     | `./`            |
| Install Command    | `npm install`   |
| Build Command      | `npm run build` |
| Output Directory   | `build`         |
| Rama de producción | `main`          |

### Variables de entorno

En Vercel se configuraron las siguientes variables:

```text
VITE_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY
VITE_OCR_ENDPOINT
```

Estas variables son utilizadas durante la compilación de producción para conectar la aplicación con Supabase y con el servicio OCR.

### Proceso de despliegue

1. El código fuente se almacena en GitHub.
2. El repositorio se conecta con Vercel.
3. Vercel obtiene el código de la rama `main`.
4. Se instalan las dependencias mediante `npm install`.
5. Se ejecuta `npm run build`.
6. Vite genera la versión de producción dentro de `build/`.
7. Vercel publica automáticamente el contenido generado.
8. La aplicación queda disponible mediante un dominio HTTPS `vercel.app`.

El despliegue permite acceder al sistema desde computadores y dispositivos móviles mediante Internet.

### URL de producción

La aplicación está disponible mediante el dominio público proporcionado por Vercel:

```text
PEGAR_AQUI_LA_URL_DE_VERCEL
```

> Se recomienda utilizar siempre la URL de producción proporcionada por Vercel para las demostraciones y la entrega académica.

---

## Seguridad y buenas prácticas

* Los archivos `.env` y `.env.local` están excluidos mediante `.gitignore`.
* No se almacenan credenciales privadas directamente en el código fuente.
* Las variables de entorno de producción se administran desde Vercel.
* No se utiliza una clave `service_role` en el frontend.
* El endpoint OCR se obtiene mediante `import.meta.env.VITE_OCR_ENDPOINT`.
* La información obtenida de la API se presenta sin inventar datos que no estén disponibles.
* El proyecto utiliza HTTPS en producción mediante Vercel, lo cual permite utilizar las funciones de cámara del navegador en dispositivos compatibles.
* El repositorio de GitHub contiene el código fuente necesario para reproducir y mantener el proyecto.

---

## Estado de verificación

El proyecto fue compilado correctamente mediante:

```bash
npm run build
```

Además, se verificó el funcionamiento del despliegue de producción mediante Vercel.

### Pruebas realizadas

* [x] Compilación de producción mediante Vite.
* [x] Repositorio GitHub configurado.
* [x] Integración GitHub → Vercel.
* [x] Deployment de producción creado.
* [x] URL pública de Vercel generada.
* [x] Aplicación accesible desde navegador de escritorio.
* [x] Aplicación accesible desde dispositivo móvil.
* [x] Conexión con Supabase verificada.
* [x] Consulta de vehículos y propietarios.
* [x] Consulta de información vehicular mediante placa.
* [x] Funcionamiento del monitoreo de entrada.
* [x] Configuración de variables de entorno en producción.

### Resultado

El sistema se encuentra **desplegado y disponible públicamente mediante Vercel**, permitiendo acceder al panel administrativo desde un navegador web sin necesidad de ejecutar el proyecto localmente.

---

## Autor

**Jorge Enrique Plaza Pisanan**

UTEQ — Facultad de Ciencias de la Computación y Diseño Digital
Carrera de Telemática — Quevedo, Los Ríos, Ecuador

**Asignatura:** Aplicaciones Telemáticas Basadas en Web
