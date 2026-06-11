# Piñatería - Sistema de Gestión

Sistema web para la gestión de ventas, inventario y pedidos personalizados de una piñatería familiar.

## Stack tecnológico

| Tecnología       | Propósito                    |
| ---------------- | ---------------------------- |
| React            | UI                           |
| TypeScript       | Tipado                       |
| Vite             | Build tool                   |
| Tailwind CSS     | Estilos                      |
| React Router DOM | Navegación                   |
| Supabase         | Backend, Auth, Base de datos |
| Framer Motion    | Animaciones                  |
| Lucide React     | Iconos                       |
| React Hot Toast  | Notificaciones               |

## Cómo ejecutar localmente

1. Clonar el repositorio:

```bash
git clone <url-del-repositorio>
cd pinateria-sistema-final
```

2. Instalar dependencias:

```bash
npm install
```

3. Crear archivo de variables de entorno:

```bash
cp .env.example .env
```

4. Configurar las variables en `.env`:

```
VITE_SUPABASE_URL=tu-url-de-supabase
VITE_SUPABASE_ANON_KEY=tu-anon-key-de-supabase
```

5. Iniciar servidor de desarrollo:

```bash
npm run dev
```

6. Compilar para producción:

```bash
npm run build
```

## Variables de entorno requeridas

| Variable                 | Descripción                  |
| ------------------------ | ---------------------------- |
| `VITE_SUPABASE_URL`      | URL del proyecto en Supabase |
| `VITE_SUPABASE_ANON_KEY` | Clave anónima de Supabase    |

## Módulos del sistema

1. **Registro** → Crear cuenta con nombre, teléfono, correo y contraseña
2. **Inicio de sesión** → Acceder con correo y contraseña
3. **Dashboard** → Resumen general del negocio
4. **Productos** → Catálogo de productos
5. **Inventario** → Control de existencias
6. **Clientes** → Registro de clientes
7. **Ventas** → Registro de transacciones
8. **Pedidos personalizados** → Pedidos especiales
9. **Reportes** → Estadísticas y reportes

## Despliegue

El proyecto está preparado para desplegarse en **Vercel**. Conectar el repositorio y definir las variables de entorno `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` en el panel de Vercel.

## Flujo GitFlow

- `main` — Versión estable en producción
- `develop` — Integración de características
- `feature/*` — Desarrollo de funcionalidades
- `release/*` — Estabilización previa a main

## Rama actual

`release/1.0.0`
