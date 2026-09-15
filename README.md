<!-- # 🗺️ RouteMind Euskadi -->
<!-- # <img src="app/routemind-euskadi/public/Flag.svg" alt="Logo RouteMind" width="50" align="center" /> RouteMind Euskadi -->
<h1>
  <img src="app/routemind-euskadi/public/Flag.svg" alt="Logo" width="50" height="50" style="vertical-align: middle;">
  RouteMind Euskadi
</h1>
![Status](https://img.shields.io/badge/Status-Completado-success?style=plastic)
![TFM](https://img.shields.io/badge/TFM-UCM-blue?style=plastic)
![React](https://img.shields.io/badge/Frontend-React-61DAFB?style=plastic&logo=react)
![Node](https://img.shields.io/badge/Backend-Node.js-339933?style=plastic&logo=Node.js)
![Python](https://img.shields.io/badge/ETL-Python-3776AB?style=plastic&logo=python)
![Databricks](https://img.shields.io/badge/Databricks-181825?style=plastic&logo=databricks)
![MongoDB](https://img.shields.io/badge/Database-MongoDB-47A248?style=plastic&logo=mongodb)
![Google](https://img.shields.io/badge/Google-Gemini_IA-8E75B2?style=plastic&logo=google)
![License](https://img.shields.io/badge/License-MIT-green?style=plastic)

Este proyecto propone un sistema inteligente para la planificación y optimización de rutas en el País Vasco. Integrando fuentes de datos turísticos oficiales y métricas climaticas/medioambientales (como la calidad del aire y partículas en suspensión), RouteMind ofrece una experiencia de turismo sostenible, personalizada y basada en datos.

---

## 📌 Contenido del Repositorio

Este repo está estructurado para separar claramente el análisis de Datos, el Frontend y el Backend. Su función principal es ingestar, procesar y servir rutas inteligentes a través de una arquitectura moderna.

### Partes Principales:
* **`/data_architecture`**: Scripts de extracción y transformación de datos estadísticos, turísticos, de clima y ambientales.
* **`/app`**: Interfaz de usuario desarrollada en React. *(Nota: El frontend cuenta con su [propio README](./app/routemind-euskadi//README.md) con instrucciones detalladas de instalación y despliegue).*
* **`/files`**: Documentación adjunta, diagramas arquitectónicos y la memoria completa del TFM.

---

## 🏗️ Arquitectura del Sistema

La solución está construida sobre una arquitectura orientada a la escalabilidad y al procesamiento eficiente de datos geolocalizados. 

### 1. Visión General End-to-End
El flujo completo del sistema abarca desde la recolección de los datos en origen hasta su visualización en el dispositivo del usuario final.

![Diagrama End to End RouteMind Euskadi](files/Diagrama%20end%20to%20end%20RouteMind%20Euskadi.png)

### 2. Arquitectura de Datos
El núcleo de **RouteMind Euskadi** reside en su capacidad para unificar múltiples fuentes de información. El siguiente diagrama detalla cómo se orquestan los flujos de datos, la limpieza, el almacenamiento y la exposición hacia el frontend:

![Arquitectura Datos RouteMind](files/Arquitectura%20Datos%20RouteMind.png)

---

## 💻 Frontend React/Node.js

La aplicación cliente está construida con **React**. Se ha priorizado una experiencia de usuario (UX) fluida, moderna y responsive, permitiendo al turista visualizar sus rutas y la información contextual de forma intuitiva.

Para detalles técnicos, comandos de inicio, dependencias y estructura de componentes, ver **[README del proyecto React](./frontend/README.md)**.

---

## 👩‍💻 Sobre la autora

**Angelica Pineda** 👉 *Data Engineer & Creadora de RouteMind Euskadi*

Apasionada por transformar datos complejos en decisiones inteligentes. Cuento con experiencia práctica en la creación de pipelines, ETL robustas y soluciones analíticas utilizando herramientas como Python, SQL, Databricks y el ecosistema de Azure (Synapse Analytics, Data Factory).

---
*Si este proyecto te resulta útil o interesante, no dudes en dejar una ⭐ en el repositorio.*
