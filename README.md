<div align="center">
  <img src="src/assets/logo_av.png" alt="Alternativa Verde" width="180" />
</div>

# Alternativa Verde - Sistema de Tickets
Portal de Gestion Operativo de Alternativa Verde para el control de entradas, salidas y seguimiento de materiales por centro de acopio.

**Responsable de la codificacion:** Denny Javier Rosaes, 2026, v0.0.0

## Instalacion

**Requisitos:** Node.js, pnpm, PostgreSQL.

1. Instala dependencias:
   `pnpm install`
2. Crea el archivo `.env` a partir de `.env.example` y completa los datos de conexion a la base de datos.
3. Crea la base de datos `tickets` en PostgreSQL.
4. Carga el esquema consolidado (incluye todas las migraciones):
   `psql -U postgres -d tickets -f db/schema.sql`
5. Carga datos iniciales:
   `pnpm db:seed`
6. Inicia la aplicacion y el servidor API:
   `pnpm dev:all`

## Configuracion inicial

1. Ingresa al modulo de Configuracion.
2. Crea o selecciona el centro de acopio activo.
3. Registra el equipo del centro (miembros y roles).
4. Verifica que el centro activo quede aplicado en la configuracion.

## Llenado de datos por centro de acopio

1. Registra los generadores (clientes) con su modo de recoleccion.
2. Registra los vehiculos del centro y marca el principal si aplica.
3. Crea tickets de entrada indicando generador, material, cantidad, estado y recolector.
4. Registra salidas (despachos) cuando se trasladen materiales.
5. Revisa el historial para validar movimientos y correcciones.
