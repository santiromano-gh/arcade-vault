# CLAUDE.md

Este archivo orienta a Claude Code (claude.ai/code) cuando trabaja con el código de este repositorio.

@AGENTS.md

## Idioma

Todo el trabajo en este repositorio debe hacerse en **español**: respuestas al usuario, specs, documentación, comentarios en el código, mensajes de commit y descripciones de PR. Los identificadores del código (variables, funciones, componentes, archivos) pueden seguir las convenciones existentes.

## Proyecto

Arcade Vault es una plataforma para jugar online y competir por la mayor cantidad de puntos. Se desarrolla con **Spec Driven Design**: las funcionalidades se especifican con `/spec` y se implementan con `/spec-impl`, siguiendo las buenas prácticas de https://github.com/Klerith/fernando-skills (instaladas con `npx skills@latest add Klerith/fernando-skills`).

Por ahora el repositorio es el esqueleto recién generado por `create-next-app`; `app/page.tsx` sigue siendo la página de plantilla.

## Comandos

```bash
npm run dev     # next dev (Turbopack) en http://localhost:3000
npm run build   # build de producción (también valida tipos)
npm run start   # sirve el build de producción
npm run lint    # eslint (config flat, next core-web-vitals + typescript)
```

Todavía no hay un runner de tests configurado.

## Stack y configuración

- **Next.js 16.4 (App Router) + React 19.3**, TypeScript en modo estricto. Esta versión de Next difiere de los datos de entrenamiento: lee la guía correspondiente en `node_modules/next/dist/docs/` (`01-app/`, `03-architecture/`, …) antes de escribir código específico de Next.
- `next.config.ts` activa `cacheComponents`, `partialPrefetching` y `experimental.agentFeedback`. Con Cache Components activo, la obtención y caché de datos sigue el modelo `"use cache"` / Suspense; consulta la documentación en lugar de asumir el comportamiento antiguo del caché de `fetch` o de la configuración de segmentos de ruta.
- **Tailwind CSS v4** se integra mediante una regla de loader de Turbopack (`@tailwindcss/turbopack` sobre `*.css`), no con PostCSS. Los tokens del tema viven en `app/globals.css` con `@import "tailwindcss"` y `@theme inline` (no hay `tailwind.config.*`).
- Los layouts y páginas usan los helpers de tipos globales `LayoutProps<"/">` / `PageProps` que genera Next (ver `app/layout.tsx`).
- El alias de ruta `@/*` apunta a la raíz del repositorio.
