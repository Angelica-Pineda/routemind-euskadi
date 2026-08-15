# RouteMind Euskadi

Aplicacion React + Vite preparada para desplegar en Vercel con backend interno en `api/`, consulta a MongoDB y generacion de itinerarios con Gemini.

## Estructura

- `src/` contiene la interfaz de usuario.
- `api/` expone `GET /api/health` y `POST /api/itinerary`.
- `shared/catalog.js` centraliza el catalogo base para frontend y backend.

## Variables de entorno

Crea un archivo `.env` a partir de `.env.example` y completa los valores de MongoDB y Gemini.

## Desarrollo

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Notas

- El frontend envia el formulario a `/api/itinerary`.
- Si no hay `MONGODB_URI` o `GEMINI_API_KEY`, la API usa el catalogo de reserva para mantener el flujo funcional.
