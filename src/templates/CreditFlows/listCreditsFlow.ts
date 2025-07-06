import { addKeyword, EVENTS } from "@builderbot/bot";
import { MemoryDB as Database } from '@builderbot/bot'
import { MetaProvider as Provider } from '@builderbot/provider-meta'
import { payCreditsFlow } from "./payCreditsFlow";

const MESSAGES = {
  INITIAL_QUESTION: "¡Genial! Vamos a recargar tus créditos.\nLas revisiones incluyen:\n\n☑️ Análisis de gaps en el CV\n☑️ Fortalezas y debilidades\n☑️ Perfil profesional\n☑️ Experiencia de trabajo\n☑️ Verbos de acción\n☑️ Estructura del CV\n☑️ Relevancia\n☑️ Y más...",
  MESSAGE2: "Puedes adquirir paquetes de revisiones desde S/ 4.00\n\nLas revisiones las puedes usar para tu CV u otros CVs.",
};

export const listCreditsFlow = addKeyword<Provider, Database>(EVENTS.ACTION)
  .addAnswer(MESSAGES.INITIAL_QUESTION)
  .addAnswer(MESSAGES.MESSAGE2)
  .addAnswer(null, null, async (ctx, { provider }) => {
    const listButtons = {
      "header": {
        "type": "text",
        "text": "Planes de Créditos",
      },
      "body": {
        "text": "Selecciona un plan de créditos para continuar con tu recarga. Cada plan te ofrece diferentes cantidades de créditos a precios accesibles."
      },
      "footer": {
        "text": "Selecciona un paquete para continuar."
      },
      "action": {
        "button": "Paquetes",
        "sections": [
          {
            "title": "Planes",
            "rows": [
              {
                "id": "001",
                "title": "S/4 - 1 crédito",
              },
              {
                "id": "002",
                "title": "S/7 - 3 créditos",
              },
              {
                "id": "003",
                "title": "S/10 - 6 créditos",
              }
            ]
          }
        ]
      }
    };
    await provider.sendList(ctx.from, listButtons);
  })
  .addAction({ capture: true }, async (ctx, { gotoFlow, fallBack, state, flowDynamic }) => {

    const userResponse = ctx.body.toString().trim().toLowerCase();
    
    // ✅ SOLUCIÓN 2: Múltiples formas de validar cada plan
    if (userResponse.includes("s/4") || userResponse.includes("4") || userResponse.includes("001")) {
      await state.update({
        planSelected: {
          price: 4,
          credits: 1,
          description: "1 crédito por S/4",
        }
      });
      return gotoFlow(payCreditsFlow);
      
    } else if (userResponse.includes("s/7") || userResponse.includes("7") || userResponse.includes("002")) {
      await state.update({
        planSelected: {
          price: 7,
          credits: 3,
          description: "3 créditos por S/7",
        }
      });
      return gotoFlow(payCreditsFlow);
      
    } else if (userResponse.includes("s/10") || userResponse.includes("10") || userResponse.includes("003")) {
      await state.update({
        planSelected: {
          price: 10,
          credits: 6,
          description: "6 créditos por S/10",
        }
      });
      await flowDynamic("🔄 *Procesando tu pago...*");
      return gotoFlow(payCreditsFlow);
      
    } else {
      return fallBack(
        `❌ *Plan no válido*\n\nRecibí: "${ctx.body}"\n\nPor favor, selecciona una opción de la lista anterior.`
      );
    }
  });