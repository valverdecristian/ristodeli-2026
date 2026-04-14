# RISTODELI - Trabajo Final Integrador 2026

<br>

<p align="center">
  <img src="assets/icon.png" alt="Logo de la App" width="200">
</p>

Este proyecto consiste en el desarrollo de una aplicación móvil para la gestión integral de un restaurante, enfocada en la experiencia del usuario (clientes y empleados).

<br>

## 👥 Integrantes

* **Valverde, Cristian Jorge** (Alfa): rama `dev-alfa`
* **Chavez, Alejo** (Beta): rama `dev-beta`
* **Trkmic Torres, Ignacio** (Gamma): rama `dev-gamma`

<br>

## 🚀 Tareas Asignadas

De acuerdo a los requerimientos de la cátedra, se detallan las tareas asignadas a cada integrante:

| Apellidos y Nombres | Módulos (Objetivos) | Fecha Inicio | Fecha Fin |
| :--- | :--- | :--- | :--- |
| **Valverde, Cristian Jorge** | Creación del ícono de la aplicación. | 01/04/2026 | 01/04/2026 |
| **Chavez, Alejo** | Desarrollo de la interfaz de Login. | 01/04/2026 | 03/04/2026 |
| **Chavez, Alejo** | Splash Screen animada/estática. | 07/04/2026 | 07/04/2026 |
| **Valverde, Cristian Jorge** | Configuración de Supabase (Auth, DB y Storage) | 05/04/2026 | 05/04/2026 |
| **Valverde, Cristian Jorge** | Servicio de Cámara | 05/04/2026 | 05/04/2026 |
| **Valverde, Cristian Jorge** | Toast Service y Sppiner. | 07/04/2026 | 07/04/2026 |
| **Trkmic Torres, Ignacio** | Sonidos y Vibraciones. | 08/04/2026 | 09/04/2026 |
| **Chavez, Alejo** | Accesos Rápidos en Login para Testing. | 07/04/2026 | 07/04/2026 |
| **Chavez, Alejo** | Vista del Menú del Administrador. | 07/04/2026 | pendiente |
| **Valverde, Cristian Jorge** | Formulario de Cliente y Empleado. | 07/04/2026 | 08/04/2026 |
| **Trkmic Torres, Ignacio** | Formulario y Vistas: Platos y Bebidas. | 09/04/2026 | 09/04/2026 |
| **Valverde, Cristian Jorge** | Configuración de comunicaciones: Email y Push Notifications. | 12/04/2026 | pendiente |
| **Trkmic Torres, Ignacio** | Carga de activos y datos iniciales en Supabase. | 09/04/2026 | 09/04/2026 |
| **Trkmic Torres, Ignacio** | Gestión de Mesas: Creación y Generación de QR. | 09/04/2026 | 09/04/2026 |
| **Trkmic Torres, Ignacio** | Dashboards Operativos: Cocinero, Cantinero y Metre. | 09/04/2026 | 10/04/2026 |
| **Valverde, Cristian Jorge** | Experiencia del Cliente: Menú y Estado de Cuenta. | 12/04/2026 | 12/04/2026 |
|  | Servicio de Notificaciones: Email Automático. |  |  |
| **Chavez, Alejo** | Escaneo de DNI: Lector de código para carga automática de datos. | 09/04/2026 | 09/04/2026 |
| **Trkmic Torres, Ignacio** | Dashboard: Vista del Menú del Supervisor. | 10/04/2026 | 12/04/2026 |

<br>

## 🎨 Diseño y Prototipado (UI/UX)

[Ver Prototipo Interactivo en Canva](https://canva.link/2kf3z7wq2apab4s)

<br>

## 📂 Arquitectura del proyecto

```jsx
src/
└── app/
    ├── core/                 <-- (Lo que se carga una vez: Servicios globales)
    │   ├── services/
    │   ├── models/
    │   └── guards/
    │
    ├── shared/               <-- (Componentes reutilizables en toda la app)
    │   ├── components/
    │   └── pipes/
    │
    ├── features/             <-- (Módulos lógicos del negocio / Entregas)
assets/
docs/
environments/
theme/
```

**core/**: Aquí van los servicios que manejan datos globales. <br>
**shared/**: Componentes que se usan en más de una pantalla. <br>
**features/**: Aquí va la lógica de cada punto funcional. <br>

<br>

## 🌿 Estrategia de Ramas (Gitflow)

Se utiliza una rama intermedia para asegurar la estabilidad antes de las entregas finales:

* **`main`**: Rama de producción para entregas de los sábados.
* **`develop`**: Rama de integración y generación de APKs de prueba.
* **`dev-alfa` / `dev-beta` / `dev-gamma`**: Ramas de desarrollo individual.

<br>

## ⚙️ Stack Tecnológico

* Frontend Framework: Angular v20 utilizando la arquitectura de Standalone Components para optimizar el rendimiento y la carga del bundle.
* Mobile UI Framework: Ionic v8, permitiendo una experiencia de usuario fluida y consistente con los estándares de diseño móvil actuales.
* Backend & Infraestructura (BaaS): Supabase integrado vía @supabase/supabase-js para la gestión de:
  - Autenticación: Manejo seguro de sesiones y perfiles de usuario.
  - Base de Datos: PostgreSQL para la persistencia de la lógica de negocio (usuarios, pedidos, mesas).
  - Storage: Gestión de archivos multimedia (avatares y fotos de productos) mediante Buckets.
* Capacitor & Hardware Integration (v8):
  - Escaneo de DNI: @capacitor-mlkit/barcode-scanning para la carga automatizada de datos desde el documento nacional de identidad.
  - Cámara: @capacitor/camera para la captura de fotos obligatoria en registros.
  - Feedback Háptico: @capacitor/haptics para notificar errores mediante vibraciones.
* Utilidades Específicas:
  - QR Generation: angularx-qrcode para la generación dinámica de códigos identificadores de mesas.
  - Iconografía: ionicons v7 para una interfaz visual intuitiva.
