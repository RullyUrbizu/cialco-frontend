# Cialco Frontend

Frontend del sistema de gestión de stock para Cialco, desarrollado con React, TypeScript y Vite.

## Descripción

Aplicación web moderna para la gestión integral de stock, clientes, movimientos de inventario y colectas. Interfaz de usuario intuitiva y responsive con Tailwind CSS.

## Tecnologías

- **Framework**: React 18
- **Lenguaje**: TypeScript
- **Build Tool**: Vite
- **UI Framework**: Tailwind CSS
- **Routing**: React Router v6
- **HTTP Client**: Axios
- **Gestión de estado**: React Context API
- **Gráficos**: Recharts
- **Validación de formularios**: React Hook Form

## Requisitos previos

- Node.js (v16 o superior)
- npm o yarn
- Backend de Cialco ejecutándose

## Configuración del proyecto

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar variables de entorno

Crear un archivo `.env` en la raíz del proyecto basado en `.env.example`:

```env
VITE_API_URL=http://localhost:3000
VITE_APP_NAME=Cialco Stock
```

### 3. Verificar conexión con el backend

Asegúrate de que el backend esté ejecutándose en la URL especificada en `VITE_API_URL`.

## 🚀 Ejecución con Docker

Este repositorio incluye un archivo `docker-compose.yml` para probar la versión de producción (servida con Nginx) rápidamente:

1.  Asegúrate de tener **Docker Desktop** instalado.
2.  Desde la raíz de este repositorio, ejecuta:
    ```bash
    docker-compose up -d
    ```
3.  La aplicación estará disponible en `http://localhost`.

## Ejecutar la aplicación (Desarrollo Manual)

### Modo desarrollo

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`

### Compilar para producción

```bash
npm run build
```

Los archivos compilados se generarán en la carpeta `dist/`

### Vista previa de producción

```bash
npm run preview
```

## Scripts disponibles

```bash
# Desarrollo
npm run dev            # Inicia el servidor de desarrollo con hot-reload

# Producción
npm run build          # Compila el proyecto para producción
npm run preview        # Vista previa de la build de producción

# Linting
npm run lint           # Ejecuta ESLint para verificar el código
```

## Estructura del proyecto

```
src/
├── components/        # Componentes reutilizables
│   ├── Layout/       # Componentes de layout (Navbar, Sidebar, etc.)
│   ├── Forms/        # Formularios
│   └── UI/           # Componentes de UI genéricos
├── pages/            # Páginas de la aplicación
│   ├── Clientes/     # Gestión de clientes
│   ├── Movimientos/  # Gestión de movimientos
│   ├── Colectas/     # Gestión de colectas
│   ├── Dashboard/    # Panel principal
│   └── Auth/         # Autenticación
├── services/         # Servicios de API
├── context/          # Contextos de React
├── hooks/            # Custom hooks
├── types/            # Definiciones de TypeScript
├── utils/            # Utilidades y helpers
├── assets/           # Recursos estáticos
├── App.tsx           # Componente principal
└── main.tsx          # Punto de entrada
```

## Características principales

### Gestión de Clientes
- Listado completo de clientes con búsqueda y filtros
- Formulario de creación y edición con validación
- Validación de CUIT único
- Vista detallada de cada cliente

### Gestión de Movimientos
- Registro de movimientos de stock (entrada/salida)
- Filtros por tipo, fecha y cliente
- Historial completo de movimientos
- Exportación de reportes

### Gestión de Colectas
- Registro de colectas con selección de cliente y toro
- Campos de vigor y motilidad
- Selección de canastillos únicos
- Búsqueda de toros y clientes

### Dashboard
- Resumen de estadísticas principales
- Gráficos de movimientos recientes
- Indicadores clave de rendimiento
- Accesos rápidos a funcionalidades

## Configuración de ESLint

El proyecto incluye configuración de ESLint para mantener la calidad del código. Para aplicaciones en producción, se recomienda habilitar reglas type-aware:

```js
// eslint.config.js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      tseslint.configs.recommendedTypeChecked,
      // O para reglas más estrictas:
      tseslint.configs.strictTypeChecked,
      // Opcional, reglas de estilo:
      tseslint.configs.stylisticTypeChecked,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
])
```

## Temas y estilos

El proyecto utiliza Material-UI con un tema personalizado que incluye:

- Paleta de colores corporativa
- Componentes personalizados
- Modo claro/oscuro (opcional)
- Diseño responsive

## Solución de problemas

### Error de conexión con la API
- Verifica que el backend esté ejecutándose
- Confirma que `VITE_API_URL` en `.env` sea correcta
- Revisa la consola del navegador para errores de CORS

### Error de compilación
- Elimina `node_modules` y ejecuta `npm install` nuevamente
- Verifica que la versión de Node.js sea compatible
- Limpia la caché de Vite: `npm run dev -- --force`

### Problemas de renderizado
- Verifica que estés usando el estado correctamente
- Asegúrate de que los efectos tengan las dependencias correctas
- Revisa la consola para warnings de React

## Mejores prácticas

1. **Componentes**: Mantén los componentes pequeños y enfocados en una sola responsabilidad
2. **TypeScript**: Define tipos e interfaces para todos los datos
3. **Hooks**: Usa custom hooks para lógica reutilizable
4. **Formularios**: Implementa validación tanto en cliente como en servidor
5. **Errores**: Maneja errores de API de forma consistente
6. **Accesibilidad**: Usa etiquetas semánticas y atributos ARIA cuando sea necesario

## Contribuir

1. Crea una rama para tu feature: `git checkout -b feature/nueva-funcionalidad`
2. Realiza tus cambios y haz commit: `git commit -am 'Agrega nueva funcionalidad'`
3. Sube los cambios: `git push origin feature/nueva-funcionalidad`
4. Crea un Pull Request

## Licencia

Este proyecto es privado y confidencial.

## Contacto

Para consultas o soporte, contacta al equipo de desarrollo.
