# RISTODELI - Trabajo Final Integrador 2026

<br>

<p align="center">
  <img src="assets/icon.png" alt="Logo de la App" width="200">
</p>

Este proyecto consiste en el desarrollo de una aplicación móvil para la gestión integral de un restaurante, enfocada en la experiencia del usuario (clientes y empleados).

<br>

## 🛠️ Entorno y Reglas de Desarrollo

Ionic versión `7.2.1`. <br>
Node.js versión `24.14.1`. <br>
Angular versión `21.2.5`. <br>

<br>

## 👥 Integrantes

* **Valverde, Cristian Jorge**: rama `dev-alfa`
* **Chavez, Alejo**: rama `dev-beta`
* **Pozo, Mariano**: rama `dev-gamma`

<br>

## 🚀 Tareas Asignadas

De acuerdo a los requerimientos de la cátedra, se detallan las tareas asignadas a cada integrante:

| Apellidos y Nombres | Módulos (Objetivos) | Fecha Inicio | Fecha Fin |
| :--- | :--- | :--- | :--- |
| **Valverde, Cristian Jorge** | Creación del ícono de la aplicación. | 01/04/2026 | 01/04/2026 |
| **Chavez, Alejo** | Desarrollo de la vista de Login. | 01/04/2026 | 03/04/2026 |
| **Pozo, Mariano** | Splash Screen animada/estática. | 01/04/2026 | pendiente |
| **Valverde, Cristian Jorge** | Configuración de Supabase (Auth, DB y Buckets) | 05/04/2026 | 05/04/2026 |
| **Valverde, Cristian Jorge** | Integración de Cámara | 05/04/2026 | 05/04/2026 |
| **Valverde, Cristian Jorge** | Servicio de Autenticación Reactivo | 05/04/2026 | 05/04/2026 |

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

**core/**: Aquí van los servicios que manejan datos globales.
**shared/**: Componentes que se usan en más de una pantalla.
**features/**: Aquí va la lógica de cada punto funcional.

<br>

## 🌿 Estrategia de Ramas (Gitflow)

Se utiliza una rama intermedia para asegurar la estabilidad antes de las entregas finales:

* **`main`**: Rama de producción para entregas de los sábados.
* **`develop`**: Rama de integración y generación de APKs de prueba.
* **`dev-alfa` / `dev-beta` / `dev-gamma`**: Ramas de desarrollo individual.