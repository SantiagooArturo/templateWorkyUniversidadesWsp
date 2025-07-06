import { addKeyword, EVENTS } from "@builderbot/bot";
import { MetaProvider } from "@builderbot/provider-meta";
import { ServicesFireBase, ServicesWorki } from "../../services";
import {
  analyzeCvForJobs,
  validateAndFilterJobs,
  sendJobsOneByOne,
  sendInteractiveJobsList,
} from "../../utils";
import { consumeCredit } from "~/services/credits/PaymentService";
import { InitFlows } from "../InitFlows";
import { FallBackFlow } from "../FallBackFlow";

export const BuscarTrabajosFlow = addKeyword<MetaProvider>(EVENTS.ACTION)
  .addAnswer(
    `💼 *Búsqueda de Oportunidades Laborales*\n\n¡Excelente elección! Voy a ayudarte a encontrar trabajos que se ajusten perfectamente a tu perfil.\n\n🎯 *¿A qué puesto aspiras?*\nDescribe el puesto y la industria donde te gustaría trabajar.\n\n📝 *Ejemplos:*\n• "Practicante de ventas en Coca Cola"\n• "Analista de marketing en banca"\n• "Desarrollador frontend en startup tecnológica"\n\n✍️ Escribe tu respuesta:`,
    {
      capture: true,
      buttons: [
        {
          body: "🔙 Regresar",
        },
      ],
    },
    async (ctx, { state, gotoFlow }) => {
      if (ctx.body.includes("🔙 Regresar")) {
        return gotoFlow(InitFlows);
      }
      await state.update({ puesto: ctx.body });
    }
  )
  .addAnswer(
    `✅ *¡Perfecto!* He registrado tu interés en ese puesto.\n\n📄 *Análisis de CV requerido*\nPara encontrar las mejores oportunidades que coincidan con tu perfil, necesito analizar tu currículum.\n\n📎 *Por favor, envía tu CV en formato PDF*\n\n💡 *¿Por qué necesito tu CV?*\n• Analizar tus habilidades y experiencia\n• Encontrar trabajos que se ajusten a tu perfil\n• Calcular tu compatibilidad con cada oportunidad\n\n⚡ El proceso es rápido y seguro`,
    {
      capture: true,
      buttons: [
        {
          body: "🔙 Regresar",
        },
      ],
    },
    async (ctx, { fallBack, flowDynamic, gotoFlow, extensions, state, provider }) => {
      if (ctx.body.includes("🔙 Regresar")) {
        return gotoFlow(InitFlows);
      } else if (ctx?.fileData?.mime_type !== "application/pdf") {
        return fallBack(
          `⚠️ El archivo que enviaste no es compatible. Para poder analizar tu CV correctamente, necesito que lo envíes en formato PDF (.pdf). \n\nPor favor, convierte tu documento a PDF y vuelve a enviarlo. Si necesitas ayuda para convertir tu archivo a PDF, puedes usar herramientas gratuitas en línea.`
        );
      } else {
        const worki = extensions.worki as ServicesWorki;
        await flowDynamic(
          "📄 *¡Gracias por compartir tu CV!* 🙏\n\nEstoy analizándolo detalladamente para ofrecerte retroalimentación valiosa. Este proceso puede tomar entre 2-3 minutos... ⏳\n\nEl análisis se está realizando en un servidor externo, por favor ten paciencia."
        );

        /* await worki.saveMedia(ctx.url, `${ctx.from}-${ctx.fileData.id}.pdf`);
        await new Promise((resolve) => setTimeout(resolve, 5000));
        const puesto = await state.get("puesto");

        const res = await analyzeCvForJobs(
          ctx.from,
          ctx.fileData.id,
          puesto,
          worki
        ); */
        try {
          const puesto = await state.get("puesto");
          const res = await worki.saveAndUploadFTP(ctx.url, puesto);

          // Usar analyzeCvEnhanced para obtener trabajos del endpoint correcto
          const trabajosRes = await worki.analyzeCvEnhanced(
            res.extractedData.cvOriginalFileUrl || res.extractedData.analysisResults.pdf_url,
            puesto,
            ctx.from
          );

          if (
            trabajosRes?.trabajos &&
            Array.isArray(trabajosRes.trabajos) &&
            trabajosRes.trabajos.length > 0
          ) {
            const db = extensions.db as ServicesFireBase;
            // await consumeCredit(ctx.from, db);
            const trabajosValidos = validateAndFilterJobs(trabajosRes.trabajos).map(
              (trabajo, index) => ({
                ...trabajo,
                title: trabajo.title || trabajo.description || "Sin título",
                company: trabajo.company || "Sin empresa",
                location: trabajo.location || "Sin ubicación",
                link: trabajo.link || "Sin link",
                porcentaje: trabajo.porcentaje || "N/A",
                id: `trabajo_${index + 1}`,
              })
            );

            if (trabajosValidos.length === 0) {
              await flowDynamic(
                `❌ Los trabajos encontrados no tienen el formato correcto para mostrar en lista.`
              );
              return gotoFlow(InitFlows);
            }

            await state.update({ trabajos: trabajosValidos });

            await flowDynamic(
              `✅ *Encontré ${trabajosValidos.length} oportunidades para "${puesto}"*\n\nSelecciona una de la lista para ver el enlace de postulación:`
            );

            // Enviar lista interactiva usando provider
            await sendInteractiveJobsList(provider, ctx.from, trabajosValidos);
            return;
          } else {
            await flowDynamic(
              `❌ *Análisis de CV completado.* 😔\n\nNo se encontraron oportunidades de trabajo que coincidan con tu CV y el puesto "${puesto}" especificado.`
            );
            return gotoFlow(InitFlows);
          }
        } catch (error) {
          console.error("Error en búsqueda de trabajos:", error);
          await flowDynamic(
            `⚠️ *Ocurrió un problema al procesar tu solicitud.*\n\nNuestro servidor está experimentando dificultades. Por favor, inténtalo más tarde.`
          );
          return gotoFlow(FallBackFlow);
        }
      }
    }
  )
  .addAction(
    { capture: true },
    async (ctx, { state, flowDynamic, fallBack, gotoFlow }) => {
      const trabajos = await state.get("trabajos");
      const userResponse = ctx.body.toString().trim();

      // Verificar si es botón de regresar
      if (userResponse.includes("🔙") || userResponse.toLowerCase().includes("menu")) {
        return gotoFlow(InitFlows);
      }

      // Buscar trabajo por diferentes métodos de identificación
      let trabajoSeleccionado = null;

      // Método 1: Buscar por ID exacto (trabajo_1, trabajo_2, etc.)
      trabajoSeleccionado = trabajos.find((t) => t.id === userResponse);

      // Método 2: Si no encuentra por ID, buscar por número (1, 2, 3, etc.)
      if (!trabajoSeleccionado) {
        const numeroSeleccionado = parseInt(userResponse);
        if (!isNaN(numeroSeleccionado) && numeroSeleccionado > 0 && numeroSeleccionado <= trabajos.length) {
          trabajoSeleccionado = trabajos[numeroSeleccionado - 1];
        }
      }

      // Método 3: Buscar por ID con formato alternativo
      if (!trabajoSeleccionado && userResponse.includes("trabajo_")) {
        trabajoSeleccionado = trabajos.find((t) => t.id === userResponse);
      }

      if (!trabajoSeleccionado) {
        return fallBack(
          `❌ *Selección inválida*\n\nRecibí: "${userResponse}"\n\nPor favor, selecciona una opción de la lista anterior.`
        );
      }

      await state.update({ trabajoSeleccionado });

      // Mostrar detalles del trabajo seleccionado y enlace directamente
      await flowDynamic([
        {
          body:
            `✅ *Trabajo seleccionado*\n\n` +
            `🏢 *Empresa:* ${trabajoSeleccionado.company}\n` +
            `📋 *Título:* ${trabajoSeleccionado.title}\n` +
            `📍 *Ubicación:* ${trabajoSeleccionado.location}\n` +
            `🎯 *Match:* ${trabajoSeleccionado.porcentaje || 'N/A'}\n\n` +
            `🔗 *Link de postulación:*\n${trabajoSeleccionado.link}\n\n` +
            `¡Buena suerte con tu postulación! 🍀`,
          buttons: [
            {
              body: "🔙 Volver",
            },
          ],
        },
      ]);
    }
  )
  .addAction(
    {
      capture: true,
    },
    async (ctx, { gotoFlow, endFlow }) => {
      const userResponse = ctx.body.toString().trim();

      if (userResponse.includes("🔍 Ver más trabajos")) {
        return gotoFlow(BuscarTrabajosFlow);
      } else if (userResponse.includes("🔙 Volver")) {
        return gotoFlow(InitFlows);
      } else {
        return endFlow(
          `¡Gracias por usar nuestro servicio! Si necesitas más ayuda, no dudes en contactarnos. 😊`
        );
      }
    }
  );
