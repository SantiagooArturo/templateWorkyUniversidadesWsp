import { addKeyword, EVENTS } from "@builderbot/bot";
import { InitFlows } from "../InitFlows";
import { listCreditsFlow } from "./listCreditsFlow";

const message = `*Sin créditos disponibles*\n\n⚠️ Se te acabaron las revisiones de CV\n\nActualmente no tienes créditos disponibles para analizar más CVs. ¿Quieres comprar más revisiones o volver al menú principal?`;
export const CreditFlow = addKeyword(EVENTS.ACTION)
  .addAnswer(message, {
    buttons: [
      {
        body: "💳 Comprar",
      },
      {
        body: "🔙 Regresar",
      },
    ],
  })
  .addAction({ capture: true }, async (ctx, { state, gotoFlow, fallBack }) => {
    if (ctx.body.includes("Comprar")) {
      return gotoFlow(listCreditsFlow);
    } else if (ctx.body.includes("Regresar")) {
      return gotoFlow(InitFlows);
    } else {
      return fallBack("Opción no válida. Por favor, selecciona una opción del menú.");
    }
  });


export default CreditFlow;