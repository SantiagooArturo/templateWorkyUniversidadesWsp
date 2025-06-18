import { EmailUniversitarioFlow } from "../EmaiFlows";
import { addKeyword, EVENTS } from "@builderbot/bot";

export const TerminosFlows = addKeyword([EVENTS.ACTION]).addAnswer(
  `🎉 *¡Bienvenido a Worky!* ✨

¡Nos alegra tenerte aquí! Antes de comenzar tu experiencia con nuestro asistente de búsqueda de empleo, necesitamos que revises y aceptes nuestros términos.

📋 *Documentos importantes:*
• Términos y condiciones: https://www.workin2.com/terminos
• Política de privacidad: https://www.workin2.com/privacidad

🔒 *Tu privacidad es importante para nosotros*
Al continuar, confirmas que has leído y aceptas nuestros términos y política de privacidad.

¿Estás de acuerdo en continuar?`,
  {
    buttons: [
      {
        body: "Acepto",
      },
      {
        body: "No acepto",
      },
    ],
    capture: true,
  },
  async (ctx, { gotoFlow, fallBack }) => {
    if (ctx.body.includes("Acepto")) {
      return gotoFlow(EmailUniversitarioFlow);
    }

    if (ctx.body.includes("No acepto")) {
      return fallBack();
    }

    return fallBack();
  }
);
