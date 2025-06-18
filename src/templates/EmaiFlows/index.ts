import { addKeyword, EVENTS } from "@builderbot/bot";
import { ServicesFireBase } from "~/services";
import { InitFlows } from "../InitFlows";

export const EmailUniversitarioFlow = addKeyword(EVENTS.ACTION).addAnswer(
  `📧 *Registro de correo electrónico*

Para brindarte una experiencia personalizada, necesito tu correo electrónico universitario.

✉️ Por favor, ingresa tu correo electrónico:`,
  {
    capture: true,
    buttons: [
      {
        body: "❌ Cancelar",
      },
    ],
  },
  async (ctx, { gotoFlow, fallBack, extensions, endFlow }) => {
    if (ctx.body.includes("❌ Cancelar")) {
      return endFlow(
        `❌ *Registro cancelado*\n\nHas cancelado el proceso de registro. Si cambias de opinión, puedes volver a iniciar el proceso en cualquier momento.\n\n¡Hasta pronto! 👋`
      );
    }
    const db = extensions.db as ServicesFireBase;

    const email = ctx.body.trim();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      return fallBack("Por favor, ingresa un correo electrónico válido.");
    }

    await db.saveUser({
      phoneNumber: ctx.from,
      name: ctx.name,
      terminos: true,
      email,
    });
    return gotoFlow(InitFlows);
  }
);
