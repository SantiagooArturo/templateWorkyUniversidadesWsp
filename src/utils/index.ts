import { MetaProvider } from "@builderbot/provider-meta";
import config from "~/config";

/**
 * Analiza un CV usando la API de Worki
 * @param userId - ID del usuario
 * @param fileId - ID del archivo PDF
 * @param puesto - Puesto de trabajo a analizar
 * @returns Respuesta de la API con los trabajos encontrados
 */
export const analyzeCvForJobs = async (
  userId: string,
  fileId: string,
  puesto: string,
  worki: any
) => {
  try {
    /* const res = await worki.analyzeCvEnhanced(
      `${config.URL_BASE_BOT}cv/${userId}-${fileId}.pdf`,
      puesto,
      userId
    ); */
    const res = await worki.saveAndUploadFTP(
      `${config.URL_BASE_BOT}cv/${userId}-${fileId}.pdf`,
      puesto
    );
    return res;
  } catch (error) {
    console.error("Error al analizar CV:", error);
    throw error;
  }
};

/**
 * Valida y filtra trabajos de la respuesta de la API
 * @param trabajos - Array de trabajos de la API
 * @returns Array de trabajos válidos
 */
export const validateAndFilterJobs = (trabajos: any[]) => {
  return trabajos.filter((trabajo) => {
    const hasTitle = trabajo.title || trabajo.description;
    const hasCompany = trabajo.company;
    const hasLocation = trabajo.location;
    return hasTitle && hasCompany && hasLocation;
  });
};

/**
 * Formatea un trabajo individual como texto
 * @param trabajo - Trabajo individual
 * @param index - Índice del trabajo
 * @returns String con el trabajo formateado
 */
export const formatSingleJob = (trabajo: any, index: number) => {
  const title = trabajo.title || trabajo.description || "Sin título";
  const company = trabajo.company || "Sin empresa";
  const location = trabajo.location || "Sin ubicación";
  const porcentaje = trabajo.porcentaje || "Sin porcentaje";

  return (
    `🔹 *Practica ${index + 1}*\n` +
    `📋 *Título:* ${title}\n` +
    `🏢 *Empresa:* ${company}\n` +
    `📍 *Ubicación:* ${location}\n` +
    `🎯 *Match:* ${porcentaje}\n` +
    `🔗 *Postula:* ${trabajo.link}`
  );
};

/**
 * Envía trabajos uno por uno con delay
 * @param trabajos - Array de trabajos válidos
 * @param flowDynamic - Función para enviar mensajes
 * @param delay - Delay entre mensajes en ms (default: 2000)
 */
export const sendJobsOneByOne = async (
  trabajos: any[],
  flowDynamic: any,
  delay: number = 2000
) => {
  for (let i = 0; i < trabajos.length; i++) {
    const jobText = formatSingleJob(trabajos[i], i);
    await flowDynamic(jobText);

    // Delay entre mensajes (excepto el último)
    if (i < trabajos.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  
  // Después de mostrar todos los trabajos, enviar mensaje con botón de regresar
  await flowDynamic({
    body: "✅ *Búsqueda completada*\n\nHas visto todas las oportunidades disponibles. ¿Te gustaría buscar más trabajos o regresar al menú principal?",
    buttons: [
      {
        body: "🔙 Regresar al menú",
      },
    ],
  });
};

/**
 * Formatea trabajos para la lista interactiva de WhatsApp (función legacy)
 * @param trabajos - Array de trabajos válidos
 * @returns Array formateado para sendListComplete
 */
export const formatJobsForWhatsApp = (trabajos: any[]) => {
  const cleanJobs = trabajos.map((trabajo, index) => {
    const cleanTitle = String(trabajo.title)
      .replace(/[\n\r]/g, " ")
      .trim();
    const cleanCompany = String(trabajo.company)
      .replace(/[\n\r]/g, " ")
      .trim();
    const cleanLocation = String(trabajo.location)
      .replace(/[\n\r]/g, " ")
      .trim();

    return {
      id: `trabajo_${index + 1}`,
      title: cleanCompany.substring(0, 24),
      description: `${cleanTitle.substring(0, 40)} | 📍 ${cleanLocation.substring(0, 30)}`,
    };
  });

  return {
    header: {
      type: "text",
      text: "Practicas que hicieron match contigo",
    },
    body: {
      text: `Encontré ${trabajos.length} oportunidades que coinciden con tu perfil. Selecciona una para ver más detalles:`,
    },
    footer: {
      text: "Selecciona una practica para ver mas detalles",
    },
    action: {
      button: "Practicas",
      sections: [
        {
          title: "Practicas",
          rows: cleanJobs,
        },
      ],
    },
  };
};


/**
 * Envía una lista interactiva de trabajos usando provider.sendList
 * @param provider - Instancia del provider
 * @param to - Número de WhatsApp destino
 * @param trabajos - Array de trabajos válidos
 */
export const sendInteractiveJobsList = async (provider: MetaProvider, to: string, trabajos: any[]) => {
  const cleanJobs = trabajos.map((trabajo, index) => {
    const cleanTitle = String(trabajo.title || trabajo.description || "Sin título").replace(/[\n\r]/g, " ").trim();
    const cleanCompany = String(trabajo.company || "Sin empresa").replace(/[\n\r]/g, " ").trim();
    const cleanLocation = String(trabajo.location || "Sin ubicación").replace(/[\n\r]/g, " ").trim();
    const porcentaje = trabajo.porcentaje ? ` | 🎯 ${trabajo.porcentaje}` : "";
    
    return {
      id: `trabajo_${index + 1}`,
      title: cleanCompany.substring(0, 24),
      description: `${cleanTitle.substring(0, 30)} | 📍 ${cleanLocation.substring(0, 20)}${porcentaje}`,
    };
  });

  const listButtons = {
    header: {
      type: "text",
      text: "🎯 Oportunidades encontradas",
    },
    body: {
      text: `He encontrado ${trabajos.length} trabajos que coinciden con tu perfil y CV. Selecciona uno para ver el enlace de postulación.`,
    },
    footer: {
      text: "Elige una opción para continuar",
    },
    action: {
      button: "Ver Trabajos",
      sections: [
        {
          title: "Trabajos Disponibles",
          rows: cleanJobs,
        },
      ],
    },
  };
  
  await provider.sendList(to, listButtons);
};
