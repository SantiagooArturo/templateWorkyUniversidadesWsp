import { addKeyword, EVENTS } from "@builderbot/bot";
import { RevisarCvFlow } from "../RevisarCvFlows";
import { TerminosFlows } from "../TerminosFlows";
import { ServicesFireBase } from "../../services";
import { SimularFlows } from "../SimularFlows";
import { BuscarTrabajosFlow } from "../BuscarTrabajosFlows";

export const InitFlows = addKeyword([EVENTS.WELCOME])
  .addAction(async (ctx, { gotoFlow, extensions }) => {
    const db = extensions.db as ServicesFireBase;
    const terminos = await db.getUserById(ctx.from);

    if (!terminos) {
      return gotoFlow(TerminosFlows);
    }
  })
  .addAnswer(
    `🚀 *¡Hola! Soy tu asistente virtual de Worky* 🤖

¡Perfecto! Ya estás registrado y listo para impulsar tu carrera profesional. 

✨ *Servicios disponibles:*
🔍 *Análisis de CV personalizado* - Optimiza tu currículum
🎯 *Simulación de entrevistas* - Practica y mejora tus habilidades
💼 *Búsqueda de trabajos* - Encuentra oportunidades que se ajusten a tu perfil

💡 *Tip: Todos nuestros servicios están diseñados para maximizar tus oportunidades laborales*

¿Con qué servicio te gustaría comenzar?`,
    {
      buttons: [
        {
          body: "📄 Revisar mi CV",
        },
        {
          body: "🎯 Simulador",
        },
        {
          body: "💼 Trabajos",
        },
      ],
      capture: true,
    },
    async (ctx, { fallBack, gotoFlow }) => {
      if (ctx.body.includes("📄 Revisar mi CV")) {
        return gotoFlow(RevisarCvFlow);
      }

      if (ctx.body.includes("🎯 Simulador")) {
        return gotoFlow(SimularFlows);
      }

      if (ctx.body.includes("💼 Trabajos")) {
        return gotoFlow(BuscarTrabajosFlow);
      }

      return fallBack(
        `¡Ups! 😅 Parece que hubo un error al procesar tu respuesta. 

Por favor, usa uno de los botones disponibles para seleccionar la opción que deseas:

📄 Revisar mi CV
🎯 Simular entrevista
💼 Trabajos`
      );
    }
  );
