# Gold Legacy · Tradición familiar hecha joya

Gold Legacy es un ecommerce de **accesorios en oro** (cadenas, anillos, pulseras, aretes, dijes) con foco en **lujo accesible, elegancia y diseño minimalista**, nacido desde una **tradición familiar hecha joya**.

Proyecto construido con:

- **Next.js 14 (App Router)**
- **PostgreSQL** + **Prisma ORM**
- **API Routes en Next.js**
- **JWT** (cookie httpOnly)
- **Tailwind CSS**

La UI está inspirada en marcas de lujo minimalistas, con una paleta **negro / dorado / blanco**.

---

## Requisitos previos

- Node.js 18+
- PostgreSQL en local o remoto

---

## Instalación

```bash
npm install
```

### Variables de entorno

Copia el archivo de ejemplo y ajusta los valores:

```bash
cp .env.example .env
```

En `.env` configura:

- **DATABASE_URL**: cadena de conexión a PostgreSQL
- **JWT_SECRET**: clave secreta para firmar JWT

Ejemplo:

```bash
DATABASE_URL="postgresql://user:password@localhost:5432/goldlegacy?schema=public"
JWT_SECRET="cambia-esta-clave-super-secreta"
```

---

## Base de datos y Prisma

Generar cliente de Prisma:

```bash
npm run prisma:generate
```

Ejecutar migraciones (crea el schema en la base de datos):

```bash
npm run prisma:migrate
```

Popular datos de ejemplo (admin + categorías + productos):

```bash
npm run prisma:seed
```

Esto creará:

- Usuario admin:
  - **Email**: `admin@goldlegacy.com`
  - **Password**: `admin1234`
- Categorías básicas (cadenas, anillos, pulseras, aretes, dijes)
- Algunos productos de ejemplo destacados

---

## Ejecutar en desarrollo

```bash
npm run dev
```

La app quedará disponible en `http://localhost:3000`.

---

## Arquitectura y secciones principales

- **`app/`** (App Router)
  - `page.tsx`: Landing principal con hero, productos destacados y bloque "Sobre Gold Legacy".
  - `catalogo/page.tsx`: catálogo con productos desde BD, filtros por tipo y paginación.
  - `producto/[slug]/page.tsx`: detalle de producto (galería, descripción, precio, stock, botón “Agregar al carrito”).
  - `carrito/page.tsx`: vista del carrito (estado en cliente).
  - `checkout/page.tsx`: formulario de checkout que crea la orden en BD.
  - `sobre-nosotros/page.tsx`: página estática de marca.
  - `admin/page.tsx`: panel administrativo con login y dashboard de resumen.

- **`app/api/`** (API Routes):
  - `auth/login`: login admin/usuario con JWT en cookie httpOnly.
  - `auth/me`: devuelve el usuario actual (si está autenticado).
  - `products`:
    - `GET /api/products`: listado con filtros (tipo, material, precio, categoría, destacados, paginación).
    - `POST /api/products`: creación de productos (solo admin).
    - `GET /api/products/[slug]`: detalle de un producto.
    - `PATCH /api/products/[slug]`: actualización (solo admin).
    - `DELETE /api/products/[slug]`: borrado (solo admin).
  - `orders`:
    - `POST /api/orders`: crea orden con datos de cliente y reduce stock.
    - `GET /api/orders`: lista órdenes del usuario autenticado; si es admin, trae todas.
  - `admin/summary`:
    - `GET /api/admin/summary`: resumen para dashboard admin (productos, órdenes, usuarios, ingresos, últimas órdenes).

- **`prisma/schema.prisma`**:
  - Modelos: `User`, `Product`, `Category`, `Order`, `OrderItem`.
  - Enum de roles (`USER`, `ADMIN`), tipos de producto y estado de orden.

- **`prisma/seed.ts`**:
  - Crea usuario admin, categorías base y productos seed.

- **`lib/auth.ts`**:
  - Firma y verificación de JWT.
  - Utilidades para obtener usuario desde cookie y exigir rol admin.

- **`lib/prisma.ts`**:
  - Cliente Prisma con patrón singleton para evitar múltiples instancias en dev.

- **`components/`**:
  - Layout: `Header`, `Footer`.
  - UI: `SectionTitle`, estilos globales en `app/globals.css`.
  - Shop: `ProductCard`, `FiltersBar`, `AddToCartButton`.
  - Cart: `CartContext` con estado global del carrito (localStorage).

---

## Flujo de ecommerce

- El usuario navega:
  - **Landing** → call to action a `catalogo`.
  - **Catálogo** → explora productos y entra al detalle.
  - **Detalle de producto** → agrega al carrito (`CartContext` en cliente).
- **Carrito**:
  - Permite actualizar cantidades, eliminar ítems y ver el total.
  - Botón para ir a **checkout**.
- **Checkout**:
  - Formulario de datos del cliente (nombre, email, teléfono, dirección, ciudad).
  - Envía los datos + carrito a `POST /api/orders`.
  - En el backend se valida stock, se recalcula el total, se descuenta inventario y se guarda la orden.

---

## Panel administrativo

- Acceso en `/admin`.
- Login contra `POST /api/auth/login`:
  - Setea cookie `gl_token` con JWT httpOnly.
- Una vez autenticado como **ADMIN**:
  - Consulta `GET /api/admin/summary` para mostrar:
    - Total de productos.
    - Total de órdenes.
    - Total de usuarios.
    - Ingresos totales.
    - Últimas órdenes con detalle básico.

> Nota: El CRUD completo visual de productos/inventario se puede extender fácilmente reutilizando las rutas `/api/products` ya incluidas.

---

## Estilos y diseño

- **Tailwind CSS** configurado en `tailwind.config.ts` con:
  - Paleta `gold`, `background`, `surface`.
  - Tipografías pensadas para títulos de marca (display) y texto de sistema.
- Clases utilitarias:
  - `container-page`: ancho máximo centralizado.
  - `glass-surface`: paneles con efecto vidrio y borde sutil.
  - `btn`, `btn-primary`, `btn-outline`: botones reutilizables.
  - `heading-xl`, `heading-section`, `text-muted`: tipografía y jerarquía visual.

---

## Producción / Deploy

El proyecto está preparado para deploy en plataformas compatibles con Next.js 14 (por ejemplo, Vercel):

1. Configurar variables de entorno (`DATABASE_URL`, `JWT_SECRET`) en el proveedor.
2. Ejecutar migraciones en la base de datos (puede hacerse con `prisma migrate deploy` en un paso de build o manualmente).
3. Ejecutar la build:

```bash
npm run build
```

4. Arrancar en producción:

```bash
npm start
```

---

## Próximas extensiones sugeridas

- Pasarela de pago real (Stripe, MercadoPago, etc.).
- Gestión visual completa de CRUD de productos e inventario desde `/admin`.
- Wishlist y cuentas de usuario finales (registro/login de clientes).
- Internacionalización (ES/EN) y multimoneda.

