# 💡 Mapa de Oportunidades con IA

Aplicación web colaborativa y pública para publicar y explorar oportunidades de negocio detectadas en diferentes ciudades y resueltas con Inteligencia Artificial.

Todas las oportunidades se almacenan y leen directamente en tiempo real desde **Supabase**.

---

## 🚀 Características
- **100% Pública y Compartida:** Cualquier persona con acceso al enlace puede ver todas las oportunidades publicadas por cualquier usuario en todo el mundo.
- **Base de Datos en Supabase:** Nada se almacena solo en local; todos los registros viajan a la tabla `public.opportunities` en Postgres.
- **Filtros Dinámicos:** Filtra al instante por país, ciudad, categoría o búsqueda libre por texto.
- **Votación / Likes en Tiempo Real:** Da like a las mejores ideas y observa el contador actualizarse en Supabase.
- **Suscripción Realtime:** Escucha cambios en tiempo real vía WebSockets de Supabase; si otro usuario publica una oportunidad o vota, tu pantalla se actualiza automáticamente.

---

## 🛠️ Tecnologías
- **Frontend:** HTML5, CSS3 moderno (Glassmorphism & tema oscuro AI), Vanilla JavaScript.
- **Backend / Database:** [Supabase](https://supabase.com) (PostgreSQL con Row Level Security y Realtime activado).
- **Librería cliente:** `@supabase/supabase-js` v2 cargada vía CDN (sin necesidad de instalaciones complejas ni node_modules).

---

## 📂 Estructura del Proyecto
- [`index.html`](index.html): Estructura visual, modal de publicación, barra de estadísticas y filtros.
- [`style.css`](style.css): Diseño responsivo, estética futurista oscura y animaciones.
- [`app.js`](app.js): Lógica de conexión a Supabase, inserciones, lecturas, gestión de likes y escucha de eventos en tiempo real.

---

## 💻 Cómo ejecutar la aplicación localmente

Puedes abrir la app de dos formas muy sencillas:

### Opción 1: Directamente en tu navegador
Haz doble clic sobre el archivo `index.html` para abrirlo en Chrome, Edge o Firefox.

### Opción 2: Con un servidor local sencillo (Recomendado)
Abre la terminal en esta carpeta y ejecuta:
```bash
python -m http.server 8000
```
Luego abre tu navegador en `http://localhost:8000`.

---

## 🧪 Cómo probar que dos personas ven lo mismo
1. Abre la aplicación en una ventana normal de tu navegador.
2. Abre la misma URL en una ventana de incógnito (o en otro navegador como Edge o Chrome, o desde otro dispositivo).
3. En la primera ventana, haz clic en **"+ Publicar Oportunidad"**, rellena los datos y pulsa **"Guardar en Supabase"**.
4. ¡Verás que en la segunda ventana aparece la nueva oportunidad automáticamente sin necesidad de recargar la página!
