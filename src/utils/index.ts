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
    const res = await worki.analyzeCvEnhanced(
      `${config.URL_BASE_BOT}/cv/${userId}-${fileId}.pdf`,
      puesto,
      userId
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
    `🔹 *Trabajo ${index + 1}*\n` +
    `📋 *Título:* ${title}\n` +
    `🏢 *Empresa:* ${company}\n` +
    `📍 *Ubicación:* ${location}\n` +
    `🎯 *Match:* ${porcentaje}`
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
};

/**
 * Formatea trabajos para la lista interactiva de WhatsApp (función legacy)
 * @param trabajos - Array de trabajos válidos
 * @returns Array formateado para sendListComplete
 */
export const formatJobsForWhatsApp = (trabajos: any[]) => {
  return trabajos.map((trabajo, index) => {
    const cleanCompany = String(trabajo.company)
      .replace(/[\n\r]/g, " ")
      .trim();
    const cleanLocation = String(trabajo.location)
      .replace(/[\n\r]/g, " ")
      .trim();

    return {
      id: `trabajo_${index + 1}`.substring(0, 200),
      title: cleanCompany.substring(0, 24),
      description: `📍 ${cleanLocation}`.substring(0, 72),
    };
  });
};
