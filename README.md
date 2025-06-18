# 🤖 Worky-bot

*Bot inteligente de WhatsApp para búsqueda de empleo y desarrollo profesional*

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4+-blue.svg)](https://www.typescriptlang.org/)
[![BuilderBot](https://img.shields.io/badge/BuilderBot-1.2.9-orange.svg)](https://builderbot.vercel.app/)
[![License](https://img.shields.io/badge/License-ISC-yellow.svg)](LICENSE)

## 📋 Descripción

Worky-bot es un asistente inteligente de WhatsApp diseñado para ayudar a profesionales en su búsqueda de empleo y desarrollo de carrera. Utiliza inteligencia artificial para ofrecer servicios personalizados de análisis de CV, simulación de entrevistas y búsqueda de oportunidades laborales.

## ✨ Características principales

### 🔍 **Análisis de CV personalizado**
- Revisión automática de currículums
- Sugerencias de mejora específicas
- Optimización para ATS (Applicant Tracking Systems)
- Retroalimentación profesional detallada

### 🎯 **Simulación de entrevistas**
- Preguntas específicas por puesto y sector
- Soporte para respuestas en audio y video
- Retroalimentación en tiempo real
- Consejos personalizados para mejorar

### 💼 **Búsqueda de trabajos**
- Búsqueda inteligente de oportunidades
- Filtrado por perfil profesional
- Envío individual de ofertas relevantes
- Integración con APIs de empleo

### 📧 **Registro universitario**
- Validación de correos institucionales
- Acceso a servicios premium para estudiantes
- Gestión de perfiles académicos

## 🚀 Instalación

### Prerrequisitos

- Node.js 18 o superior
- npm, yarn o pnpm
- Cuenta de Meta para WhatsApp Business API
- Cuenta de OpenAI para servicios de IA

### Pasos de instalación

1. **Clonar el repositorio**
   ```bash
   git clone https://github.com/tu-usuario/worky-bot.git
   cd worky-bot
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   # o
   pnpm install
   # o
   yarn install
   ```

3. **Configurar variables de entorno**
   ```bash
   cp .env.example .env
   ```
   
   Edita el archivo `.env` con tus credenciales:
    ```env
    # Server Configuration
    PORT=3008
    
    # Meta WhatsApp Business API
    META_JWT_TOKEN=tu_token_de_meta
    META_NUMBER_ID=tu_numero_id_de_meta
    META_VERIFY_TOKEN=tu_token_de_verificacion
    META_VERSION=v17.0
    
    # Worki API Configuration
    BASE_URL_WORKI=tu_url_base_de_worki
    
    # Firebase Configuration
    API_KEY_FIREBASE=tu_api_key_de_firebase
    AUTH_DOMAIN_FIREBASE=tu_proyecto.firebaseapp.com
    PROJECT_ID_FIREBASE=tu_id_de_proyecto_firebase
    STORAGE_BUCKET_FIREBASE=tu_proyecto.appspot.com
    MESSAGING_SENDER_ID_FIREBASE=tu_sender_id
    APP_ID_FIREBASE=tu_app_id_de_firebase
    
    # Bot URLs
    URL_BASE_BOT=tu_url_base_del_bot
    URL_JOBS=tu_url_de_api_de_trabajos
    
    # OpenAI API Configuration
    OPENAI_API_KEY=tu_api_key_de_openai
    OPENAI_MODEL=gpt-4o
    ```

4. **Compilar el proyecto**
   ```bash
   npm run build
   ```

5. **Iniciar el bot**
   ```bash
   npm start
   ```

## 🛠️ Desarrollo

### Modo desarrollo
```bash
npm run dev
```

### Linting
```bash
npm run lint
```

### Estructura del proyecto
```
src/
├── app.ts                 # Punto de entrada principal
├── config/               # Configuraciones
├── provider/             # Proveedores de WhatsApp
├── services/             # Servicios externos (APIs, DB)
│   ├── WorkinApi/        # API de trabajos
│   └── db/               # Base de datos
├── templates/            # Flujos de conversación
│   ├── BuscarTrabajosFlows/  # Búsqueda de empleos
│   ├── EmaiFlows/            # Registro de email
│   ├── InitFlows/            # Flujo inicial
│   ├── RevisarCvFlows/       # Análisis de CV
│   ├── SimularFlows/         # Simulación de entrevistas
│   └── TerminosFlows/        # Términos y condiciones
└── utils/                # Utilidades compartidas
```

## 🔧 Configuración

### Variables de entorno requeridas

| Variable | Descripción | Requerido |
|----------|-------------|:---------:|
| `PORT` | Puerto del servidor | ❌ |
| `META_JWT_TOKEN` | Token de autenticación de Meta | ✅ |
| `META_NUMBER_ID` | ID del número de WhatsApp Business | ✅ |
| `META_VERIFY_TOKEN` | Token de verificación de Meta | ✅ |
| `META_VERSION` | Versión de la API de Meta | ❌ |
| `BASE_URL_WORKI` | URL base de la API de Worki | ✅ |
| `API_KEY_FIREBASE` | Clave API de Firebase | ✅ |
| `AUTH_DOMAIN_FIREBASE` | Dominio de autenticación de Firebase | ✅ |
| `PROJECT_ID_FIREBASE` | ID del proyecto de Firebase | ✅ |
| `STORAGE_BUCKET_FIREBASE` | Bucket de almacenamiento de Firebase | ✅ |
| `MESSAGING_SENDER_ID_FIREBASE` | ID del remitente de mensajes de Firebase | ✅ |
| `APP_ID_FIREBASE` | ID de la aplicación de Firebase | ✅ |
| `URL_BASE_BOT` | URL base del bot | ✅ |
| `URL_JOBS` | URL de la API de trabajos | ✅ |
| `OPENAI_API_KEY` | Clave API de OpenAI | ✅ |
| `OPENAI_MODEL` | Modelo de OpenAI a utilizar | ❌ |

### Configuración de WhatsApp Business

1. Crear una aplicación en [Meta for Developers](https://developers.facebook.com/)
2. Configurar WhatsApp Business API
3. Obtener el token de acceso
4. Configurar webhooks

## 📱 Uso

### Comandos disponibles

- **Inicio**: Mensaje de bienvenida y menú principal
- **Buscar trabajos**: Inicia el flujo de búsqueda de empleos
- **Revisar CV**: Análisis y mejora de currículum
- **Simular entrevista**: Práctica de entrevistas laborales
- **Registro email**: Validación de correo universitario
- **Cancelar**: Cancela el flujo actual en cualquier momento

### Flujo típico de uso

1. El usuario envía un mensaje al bot
2. El bot responde con el menú principal
3. El usuario selecciona un servicio
4. El bot guía al usuario a través del flujo correspondiente
5. Se proporciona retroalimentación y resultados personalizados

## 🤝 Contribución

¡Las contribuciones son bienvenidas! Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

### Estándares de código

- Usar TypeScript para todo el código
- Seguir las reglas de ESLint configuradas
- Escribir comentarios descriptivos
- Mantener la estructura de carpetas existente

## 📄 Licencia

Este proyecto está bajo la Licencia ISC. Ver el archivo [LICENSE](LICENSE) para más detalles.

## 🆘 Soporte

Si tienes problemas o preguntas:

1. Revisa la [documentación](docs/)
2. Busca en [Issues existentes](https://github.com/tu-usuario/worky-bot/issues)
3. Crea un [nuevo Issue](https://github.com/tu-usuario/worky-bot/issues/new)

## 🙏 Agradecimientos

- [BuilderBot](https://builderbot.vercel.app/) - Framework base para bots de WhatsApp
- [OpenAI](https://openai.com/) - Servicios de inteligencia artificial
- [Firebase](https://firebase.google.com/) - Base de datos y almacenamiento

## 📊 Estado del proyecto

- ✅ Flujos básicos implementados
- ✅ Integración con OpenAI
- ✅ Análisis de CV funcional
- ✅ Simulación de entrevistas
- ✅ Búsqueda de trabajos
- 🔄 Mejoras de UX en progreso
- 📋 Métricas y analytics (próximamente)

---

*Desarrollado con ❤️ para ayudar a profesionales a encontrar mejores oportunidades laborales*