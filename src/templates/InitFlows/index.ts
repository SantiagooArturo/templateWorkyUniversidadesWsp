import { addKeyword, EVENTS } from "@builderbot/bot";
import { ServicesFireBase } from "../../services";
import { TerminosFlows } from "../TerminosFlows";

export const InitFlows = addKeyword([EVENTS.WELCOME]).addAction(
  async (ctx, { extensions, gotoFlow }) => {
    const db = extensions.db as ServicesFireBase;
    const data = db.getFromMemory(ctx.from);
    if (!data?.terminos) {
      return gotoFlow(TerminosFlows);
    }
  }
).addAnswer(`¡Hola! 👋 Soy tu asistente virtual de MyWorkIn 🤖

Estoy aquí para ayudarte a destacar en tu búsqueda de empleo:

🔍 Análisis de CV personalizado
💼 Simulación de entrevistas
👨‍💼 Asesoría laboral con psicólogos por videollamada

¿Cómo te gustaría que te ayude hoy?`);
