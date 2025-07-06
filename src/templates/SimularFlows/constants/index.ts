// Mensajes constantes
const MESSAGES = {
  INITIAL_QUESTION: `🎭 *Simulación de Entrevista Profesional*\n\n¡Excelente elección! Voy a ayudarte a practicar y perfeccionar tus habilidades de entrevista.\n\n🎯 *¿Para qué puesto quieres practicar?*\nDescribe el puesto y la industria donde te gustaría trabajar.\n\n📝 *Ejemplos:*\n• "Practicante de ventas en Coca Cola"\n• "Analista de marketing en banca"\n• "Desarrollador junior en startup"\n\n✍️ Escribe el puesto que te interesa:`,

  INTERVIEW_START: (puesto: string) =>
    `✅ *¡Perfecto! Simulación configurada para: ${puesto}*\n\n🎤 *Proceso de la entrevista:*\n\n📋 *4 preguntas profesionales* específicas para tu puesto\n🎙️ *Responde con audio o video* (más realista)\n📊 *Retroalimentación detallada* después de cada respuesta\n💡 *Consejos personalizados* para mejorar\n\n🚀 *Beneficios:*\n• Practica en un ambiente seguro\n• Mejora tu confianza\n• Recibe feedback profesional\n• Prepárate para entrevistas reales\n\n¿Estás listo para comenzar tu simulación?`,

  PROCESSING:
    "🔄 *Analizando tu respuesta...*\n\n🤖 Procesando con IA avanzada para darte retroalimentación profesional. Por favor espera unos segundos.",

  QUESTION_HEADER: (num: number) => `🎯 *Pregunta ${num} de 4*\n\n`,

  AUDIO_INSTRUCTION:
    "\n\n🎙️ *Responde con un mensaje de audio o video para una experiencia más realista*",

  VALIDATION_ERROR:
    '❌ *Respuesta no válida*\n\nPor favor, selecciona una de las opciones disponibles: "Sí" o "No".',

  CONFIRMATION_NEXT_QUESTION: (questionNum: number) =>
    `🎯 *Progreso de entrevista - Pregunta ${questionNum} completada*\n\n¿Quieres continuar con la siguiente pregunta? 🤔`,

  AUDIO_VIDEO_REQUIRED:
    "❌ *Solo se aceptan respuestas de audio o video*\n\n🎙️ Para simular una entrevista real, necesito que respondas con:\n\n🎤 *Mensaje de audio* (grabando tu voz)\n📹 *Mensaje de video* (grabándote mientras respondes)\n\n💡 *Tip: Habla claro y con confianza, como si fuera una entrevista real.*\n\n🔄 *Por favor, envía tu respuesta nuevamente en audio o video.*",

  CANCELLED:
    "❌ *Simulación cancelada*\n\nHas decidido no continuar con la simulación. Recuerda que practicar entrevistas te ayuda a mejorar tus oportunidades laborales.\n\n¡Estoy aquí cuando quieras intentarlo de nuevo! 👋",

  STOPPED_BY_USER:
    "⏹️ *Entrevista detenida por el usuario*\n\n¡Gracias por practicar conmigo! Has completado las preguntas hasta este punto.\n\n💡 *Recuerda:* Puedes volver a iniciar una simulación completa cuando quieras seguir practicando.\n\n🚀 *¡Cada práctica te acerca más a conseguir ese trabajo que deseas!*",

  FINAL_MESSAGE:
    "🎉 *¡FELICIDADES!* \nHas completado todas las preguntas de la entrevista. ¡Excelente trabajo! 👏\n✨ Espero que el feedback te haya sido útil para mejorar tus habilidades en entrevistas.",
};

// Prompts para generar preguntas
const QUESTION_PROMPTS = {
  EXPERIENCE: (puesto: string) =>
    `Pregunta inicial específica para alguien que aspira a un puesto de ${puesto} sobre experiencia profesional y trayectoria relevante. Pregunta corta y directa como entrevistador profesional.`,

  SKILLS: (puesto: string) =>
    `Pregunta específica y desafiante para un puesto de ${puesto} sobre habilidades profesionales o conocimientos técnicos relevantes para este rol.`,

  TEAMWORK: (puesto: string) =>
    `Pregunta específica sobre trabajo en equipo, colaboración o gestión de proyectos para alguien en el puesto de ${puesto}.`,

  PROBLEM_SOLVING: (puesto: string) =>
    `Pregunta sobre manejo de situaciones complejas, resolución de problemas o toma de decisiones para un profesional en ${puesto}.`,
};

export { MESSAGES, QUESTION_PROMPTS };
