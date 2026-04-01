# RISTODELI - Trabajo Final Integrador 2026

Este proyecto consiste en el desarrollo de una aplicación móvil para la gestión integral de un restaurante, enfocada en la experiencia del usuario (clientes y empleados).

---

## 🛠️ Entorno y Reglas de Desarrollo

Ionic versión `7.2.1`.
Node.js versión `24.14.1`.
Angular versión `21.2.5`.

---

## 👥 Integrantes y Responsabilidades

De acuerdo a los requerimientos de la cátedra, se detallan las tareas asignadas y el seguimiento de cada integrante:

| Apellidos y Nombres | Módulos (Objetivos) | Fecha Inicio | Fecha Fin | Branch |
| :--- | :--- | :--- | :--- | :--- |
| **Valverde, Cristian Jorge (Alfa)** | Liderazgo de proyecto y creación del ícono de la aplicación. | 01/04/2026 | 07/04/2026 | `dev-alfa` |
| **Chavez, Alejo (Beta)** | Desarrollo de la vista de Login. | 01/04/2026 | 07/04/2026 | `dev-beta` |
| **Pozo, Mariano (Gamma)** | Splash Screen animada/estática con logo, nombres y división del grupo. | 01/04/2026 | 07/04/2026 | `dev-gamma` |

---

## 📂 Arquitectura del proyecto

```jsx
src/
└── app/
    ├── core/                 <-- (Lo que se carga una vez: Servicios globales)
    │   ├── services/
    │   └── guards/
    │
    ├── shared/               <-- (Componentes reutilizables en toda la app)
    │   ├── components/
    │   └── pipes/
    │
    ├── features/             <-- (Módulos lógicos del negocio / Entregas)
assets/
environments/
theme/
```

**core/**: Aquí van los servicios que manejan datos globales.
**shared/**: Componentes que se usan en más de una pantalla.
**features/**: Aquí va la lógica de cada punto funcional.

---

## 🌿 Estrategia de Ramas (Gitflow)

Se utiliza una rama intermedia para asegurar la estabilidad antes de las entregas finales:

* **`main`**: Rama de producción para entregas de los sábados.
* **`develop`**: Rama de integración y generación de APKs de prueba.
* **`dev-alfa` / `dev-beta` / `dev-gamma`**: Ramas de desarrollo individual.