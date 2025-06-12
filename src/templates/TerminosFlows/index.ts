import { addKeyword, EVENTS } from "@builderbot/bot";
import { ServicesFireBase } from "../../services";
import { InitFlows } from "../InitFlows";

export const TerminosFlows = addKeyword([EVENTS.ACTION]).addAnswer(
  `Bienvenido a Worky✨

Antes de continuar, revisa los siguientes enlaces:

Términos y condiciones: https://www.workin2.com/terminos

Privacidad: https://www.workin2.com/privacidad

Al continuar, aceptas nuestros términos, nuestra política de privacidad.`,
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
  async (ctx, { gotoFlow, fallBack, extensions }) => {
    const db = extensions.db as ServicesFireBase;

    if (ctx.body.includes("Acepto")) {
      await db.saveToMemory(ctx.from, {
        terminos: true,
      });
      return gotoFlow(InitFlows);
    }

    if (ctx.body.includes("No acepto")) {
      return fallBack();
    }

    return fallBack();
  }
);
