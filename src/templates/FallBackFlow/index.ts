import { addKeyword, EVENTS } from "@builderbot/bot";
import { InitFlows } from "../InitFlows";

export const FallBackFlow = addKeyword([EVENTS.ACTION])
    .addAnswer(
        `Lo siento, ocurrió un problema en nuestro servidor. Vuelva a intentarlo más tarde o contacte a soporte si el problema persiste.`,
        {
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
        }
    );