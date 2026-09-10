# UTEQ Smart Parking — Panel de Administración

Panel administrativo desarrollado con **React + Vite + CoreUI** para el sistema de parqueadero inteligente de la UTEQ. Consulta y visualiza los vehículos autorizados almacenados en **Supabase**, y permite monitorear el ingreso vehicular en tiempo real mediante **reconocimiento automático de placas (OCR)**.

<img width="813" height="417" alt="image" src="https://github.com/user-attachments/assets/4886e1fa-0ac9-4e33-9332-af37058d09df" />


## Contenido

- [Funcionalidades](#funcionalidades)
  - [1. Vehículos y propietarios](#1-vehículos-y-propietarios)
  - [2. Monitoreo de entrada](#2-monitoreo-de-entrada)
- [Tecnologías utilizadas](#tecnologías-utilizadas)
- [Configuración](#configuración)
- [Instalación y ejecución](#instalación-y-ejecución)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Rutas de la aplicación](#rutas-de-la-aplicación)
- [Despliegue (Azure Static Web Apps)](#despliegue-azure-static-web-apps)
- [Seguridad y buenas prácticas](#seguridad-y-buenas-prácticas)
- [Estado de verificación](#estado-de-verificación)
- [Autor](#autor)

---

## Funcionalidades

### 1. Vehículos y propietarios

Vista administrativa accesible en `/parqueadero/vehiculos` que consulta directamente la tabla `vehiculos` de Supabase.

- Fotografía del vehículo con enlace a la fuente original.
- Fotografía circular del propietario.
- Matrícula, marca, modelo, año y color.
- Nombre del propietario, cédula enmascarada y correo institucional.
- Estado de autorización del vehículo.
- Búsqueda por placa, marca, modelo, color, propietario o correo.
- Paginación de 10 registros por página.
- Indicador de carga, mensaje de error y botón **Actualizar**.
<img width="813" height="417" alt="image" src="https://github.com/user-attachments/assets/96e92d35-798f-49c4-a34f-52bf26228a4b" />

Es una vista de solo consulta: no incluye formularios CRUD, registro de entradas/salidas ni autenticación propia.

### 2. Monitoreo de entrada

Vista accesible en `/parqueadero/monitoreo-entrada` que permite capturar la imagen de un vehículo y reconocer su placa automáticamente mediante un servicio REST de OCR, verificando si está autorizado a ingresar.

**Captura (columna izquierda)**

- Vista previa de cámara en tiempo real (`navigator.mediaDevices.getUserMedia`), con preferencia por la cámara posterior en dispositivos móviles (`facingMode: environment`).
- Activar / detener cámara, con liberación automática de los tracks al salir de la vista.
- Captura de fotografía mediante `<canvas>` → `Blob` JPEG.
- Selección alternativa de una imagen JPG o PNG desde el dispositivo.
- Validación de formato y tamaño (máximo 4 MiB) antes de enviar.
<img width="724" height="350" alt="image" src="https://github.com/user-attachments/assets/4fe517e3-d0e7-4993-8e17-adac82f4750d" />

**Resultado (columna derecha)**

- Envío de la imagen por `POST` (cuerpo binario, no JSON/Base64) al endpoint OCR.
- Estado del reconocimiento, placa detectada y nivel de confianza del OCR.
- Imagen devuelta por la API con la placa marcada (rectángulo verde), reconstruida desde Base64.
- Si el vehículo está registrado: marca, modelo, año, color, tipo, fotografías, nombre del propietario, cédula enmascarada y autorización.
- Si no está registrado: alerta **VEHÍCULO NO REGISTRADO**, sin datos inventados.
- Manejo de los estados `sin_placa`, `baja_confianza` y `multiples_placas`, y de los errores HTTP `400`, `413`, `415`, `502` y `504`, con opción de reintentar o procesar otra imagen.
<img width="813" height="458" alt="image" src="https://github.com/user-attachments/assets/d08b18ab-d24c-4023-9e08-2b513f833b79" />

> La verificación del registro del vehículo (consulta a Supabase) la realiza el servicio OCR externo; el frontend no consulta Supabase directamente para esta funcionalidad — consume el resultado ya resuelto por la API.

---

## Tecnologías utilizadas

| Tecnología | Uso en el proyecto |
| --- | --- |
| React 19 | Interfaz de usuario basada en componentes y hooks |
| Vite | Servidor de desarrollo y compilación; inyecta variables `VITE_*` |
| CoreUI React | Sistema de componentes del panel administrativo |
| Supabase JS Client | Consulta de la tabla `vehiculos` (vista de Vehículos y propietarios) |
| API REST OCR | Servicio externo (Azure Functions) para reconocimiento de placas y verificación de registro |
| `getUserMedia` + `Canvas` | Acceso a la cámara y captura de fotogramas |
| Sass | Estilos del template |
| GitHub Actions | Build y despliegue automatizado |
| Azure Static Web Apps | Hospedaje con HTTPS habilitado |

---

## Configuración

Crea un archivo `.env` (o `.env.local`) en la raíz del proyecto — **nunca se sube al repositorio** — con:

```dotenv
VITE_SUPABASE_URL=https://SU_PROYECTO.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_SU_CLAVE
VITE_OCR_ENDPOINT=https://SU_ENDPOINT_OCR_PROPORCIONADO_POR_EL_DOCENTE
```

Reglas importantes:

- No se deben publicar `.env`, `.env.local` ni ninguna clave `service_role`.
- `VITE_OCR_ENDPOINT` (URL con el código de acceso del docente) **no se escribe en ningún componente**; se lee exclusivamente vía `import.meta.env.VITE_OCR_ENDPOINT`.
- En producción, las tres variables se configuran como **secretos de GitHub Actions** e inyectan durante el paso de build del workflow (ver [Despliegue](#despliegue-azure-static-web-apps)).

Puedes usar `.env.example` como plantilla de referencia (sin valores reales).

---

## Instalación y ejecución

```bash
npm install
npm start
```

Abrir en el navegador:

```text
http://localhost:3000/#/parqueadero/vehiculos
http://localhost:3000/#/parqueadero/monitoreo-entrada
```

> El proyecto usa `HashRouter`, por eso las rutas incluyen `#`. El puerto `3000` es el origen autorizado por el docente para consumir el endpoint OCR durante las pruebas.

Para generar la compilación de producción:

```bash
npm run build
```

Para revisar el estilo de código:

```bash
npm run lint
```

---

## Estructura del proyecto

```text
src/
├── _nav.jsx                                   # Menú lateral (Vehículos, Monitoreo de entrada)
├── routes.js                                  # Registro de rutas con carga diferida (lazy)
├── App.jsx                                     # HashRouter y layout raíz
├── hooks/
│   ├── useVehiculos.js                        # Consulta y recarga de Supabase
│   └── useCamara.js                            # Acceso, captura y liberación de la cámara
├── lib/
│   ├── supabase.js                             # Cliente de Supabase
│   └── ocrService.js                           # Validación y consumo del endpoint OCR
└── views/
    └── parqueadero/
        ├── ListaVehiculos.jsx                  # Tabla, búsqueda y paginación
        └── monitoreo-entrada/
            ├── MonitoreoEntrada.jsx            # Vista principal (captura, 2 columnas)
            └── PanelResultado.jsx              # Presentación del resultado por estado

.github/
└── workflows/
    └── azure-static-web-apps.yml               # Build + despliegue a Azure Static Web Apps
```

Documentación adicional: [`ARCHITECTURE.md`](./ARCHITECTURE.md) y [`DEVELOPMENT.md`](./DEVELOPMENT.md).

---

## Rutas de la aplicación

| Ruta | Vista | Descripción |
| --- | --- | --- |
| `/parqueadero/vehiculos` | Vehículos y propietarios | Listado, búsqueda y paginación desde Supabase |
| `/parqueadero/monitoreo-entrada` | Monitoreo de entrada | Captura, reconocimiento de placa y verificación de ingreso |

---

## Despliegue (Azure Static Web Apps)

El proyecto se despliega como sitio estático en **Azure Static Web Apps**, con HTTPS habilitado (requisito indispensable para el uso de la cámara del navegador).

1. Crear el recurso *Static Web App* en Azure (plan gratuito), eligiendo **Other** como origen de despliegue.
2. Copiar el *deployment token* del recurso y guardarlo como secreto `AZURE_STATIC_WEB_APPS_API_TOKEN` en GitHub.
3. Configurar en **Settings → Secrets and variables → Actions** los secretos:
   - `AZURE_STATIC_WEB_APPS_API_TOKEN`
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
   - `VITE_OCR_ENDPOINT`
4. Hacer push a `main`. El workflow (`.github/workflows/azure-static-web-apps.yml`) compila el proyecto inyectando los secretos y publica el contenido de `build/`:

   ```yaml
   env:
     VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
     VITE_SUPABASE_PUBLISHABLE_KEY: ${{ secrets.VITE_SUPABASE_PUBLISHABLE_KEY }}
     VITE_OCR_ENDPOINT: ${{ secrets.VITE_OCR_ENDPOINT }}
   ```

5. La URL pública queda disponible en el *Overview* del recurso en Azure una vez finalizado el despliegue.

---

## Seguridad y buenas prácticas

- `.env`, `.env.local` y variantes están excluidas en `.gitignore`.
- Ninguna clave, token ni código de acceso se escribe directamente en el código fuente.
- El endpoint OCR se consume solo a través de variables de entorno / secretos de CI.
- Los datos de vehículo y propietario que no existen en la respuesta de la API **no se inventan** ni se rellenan con valores de ejemplo.

---

## Estado de verificación

Este proyecto está implementado y compila correctamente (`npm run build`), pero antes de considerarlo validado en producción se debe confirmar:

- [ ] Prueba de cámara en un dispositivo físico.
- [ ] Verificación de los nombres de campo de la respuesta OCR (`placa`, `confianza`) contra una prueba real en Postman.
- [ ] Prueba de los cinco estados del servicio (`encontrado`, `no_registrado`, `sin_placa`, `baja_confianza`, `multiples_placas`).
- [ ] Prueba de los errores HTTP `400`, `413`, `415`, `502` y `504`.
- [ ] Despliegue confirmado en Azure con URL pública activa.

---

## Autor

**Jorge Enrique Plaza Pisanan**
UTEQ — Facultad de Ciencias de la Computación y Diseño Digital, Telemática, "Quevedo", Los Ríos
Aplicaciones Telemáticas Basadas en Web
