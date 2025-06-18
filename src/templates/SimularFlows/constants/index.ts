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

  CANCELLED:
    "❌ *Simulación cancelada*\n\nHas decidido no continuar con la simulación. Recuerda que practicar entrevistas te ayuda a mejorar tus oportunidades laborales.\n\n¡Estoy aquí cuando quieras intentarlo de nuevo! 👋",

  FINAL_MESSAGE:
    "🎉 *¡Felicitaciones! Simulación completada exitosamente*\n\n✅ *Has terminado las 4 preguntas*\n📊 *Revisa toda la retroalimentación* que recibiste\n💪 *Aplica los consejos* en tus próximas entrevistas\n\n🚀 *¡Estás más preparado para conseguir ese trabajo que deseas!*\n\n💡 *Tip: Puedes repetir la simulación cuando quieras para seguir mejorando.*",
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
