import { addKeyword, EVENTS } from "@builderbot/bot";
import { MetaProvider } from "@builderbot/provider-meta";
import { InitFlows } from "../InitFlows";

export const ThanksFlow = addKeyword<MetaProvider>(EVENTS.ACTION)
    .addAnswer(`¡Gracias por utilizar nuestro servicio! Si tienes más preguntas o necesitas ayuda adicional, no dudes en contactarnos.`, {
        buttons: [
            {
                body: "Volver al inicio",
            },
        ],
        capture: true,
    },
    async (ctx, { gotoFlow }) => {
        if (ctx.body.includes("Volver al inicio")) {
            return gotoFlow(InitFlows);
        }
    });