import { addKeyword, EVENTS } from "@builderbot/bot";
import { MetaProvider } from "@builderbot/provider-meta";
import { ServicesWorki } from "../../services";
import {
  analyzeCvForJobs,
  validateAndFilterJobs,
  sendJobsOneByOne,
} from "../../utils";

export const BuscarTrabajosFlow = addKeyword<MetaProvider>(EVENTS.ACTION)
  .addAnswer(
    `💼 *Búsqueda de Oportunidades Laborales*\n\n¡Excelente elección! Voy a ayudarte a encontrar trabajos que se ajusten perfectamente a tu perfil.\n\n🎯 *¿A qué puesto aspiras?*\nDescribe el puesto y la industria donde te gustaría trabajar.\n\n📝 *Ejemplos:*\n• "Practicante de ventas en Coca Cola"\n• "Analista de marketing en banca"\n• "Desarrollador frontend en startup tecnológica"\n\n✍️ Escribe tu respuesta:`,
    {
      capture: true,
      buttons: [
        {
          body: "❌ Cancelar",
        },
      ],
    },
    async (ctx, { state, endFlow }) => {
      if (ctx.body.includes("❌ Cancelar")) {
        return endFlow(
          `❌ *Búsqueda cancelada*\n\nHas cancelado la búsqueda de trabajos. Si cambias de opinión, puedes volver a intentarlo desde el menú principal.\n\n¡Estoy aquí cuando me necesites! 👋`
        );
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
          body: "❌ Cancelar",
        },
      ],
    },
    async (ctx, { fallBack, flowDynamic, endFlow, extensions, state }) => {
      if (ctx.body.includes("❌ Cancelar")) {
        return endFlow(
          `❌ Has cancelado el proceso de revisión de tu CV. Si necesitas ayuda en algún momento, no dudes en contactarme.`
        );
      } else if (ctx?.fileData?.mime_type !== "application/pdf") {
        return fallBack(
          `⚠️ El archivo que enviaste no es compatible. Para poder analizar tu CV correctamente, necesito que lo envíes en formato PDF (.pdf). \n\nPor favor, convierte tu documento a PDF y vuelve a enviarlo. Si necesitas ayuda para convertir tu archivo a PDF, puedes usar herramientas gratuitas en línea.`
        );
      } else {
        const worki = extensions.worki as ServicesWorki;
        await flowDynamic(
          "📄 *¡Gracias por compartir tu CV!* 🙏\n\nEstoy analizándolo detalladamente para ofrecerte retroalimentación valiosa. Este proceso puede tomar entre 2-3 minutos... ⏳\n\nEl análisis se está realizando en un servidor externo, por favor ten paciencia."
        );

        await worki.saveMedia(ctx.url, `${ctx.from}-${ctx.fileData.id}.pdf`);
        await new Promise((resolve) => setTimeout(resolve, 5000));
        const puesto = await state.get("puesto");

        const res = await analyzeCvForJobs(
          ctx.from,
          ctx.fileData.id,
          puesto,
          worki
        );

        if (
          res?.trabajos &&
          Array.isArray(res.trabajos) &&
          res.trabajos.length > 0
        ) {
          const trabajosValidos = validateAndFilterJobs(res.trabajos).map(
            (trabajo) => ({
              ...trabajo,
              title: trabajo.title || trabajo.description || "Sin título",
              company: trabajo.company || "Sin empresa",
              location: trabajo.location || "Sin ubicación",
            })
          );

          if (trabajosValidos.length === 0) {
            await flowDynamic(
              `❌ Los trabajos encontrados no tienen el formato correcto para mostrar en lista.`
            );
            return;
          }

          await state.update({ trabajos: trabajosValidos });

          await flowDynamic(
            `✅ *Encontré ${trabajosValidos.length} oportunidades para "${puesto}"*\n\nTe enviaré cada trabajo por separado:`
          );

          await sendJobsOneByOne(trabajosValidos, flowDynamic);

          await flowDynamic(
            `📌 *Responde con el número del trabajo que te interesa para ver más detalles.*`
          );
        } else {
          await flowDynamic(
            `❌ *Análisis de CV completado.* 😔\n\nNo se encontraron oportunidades de trabajo que coincidan con tu CV y el puesto "${puesto}" especificado.`
          );
        }
      }
    }
  )
  .addAction(
    { capture: true },
    async (ctx, { state, flowDynamic, fallBack }) => {
      const trabajos = await state.get("trabajos");
      const seleccion = ctx.body.trim();

      // Verificar si el usuario seleccionó un número válido
      const numeroSeleccionado = parseInt(seleccion);

      if (
        isNaN(numeroSeleccionado) ||
        numeroSeleccionado < 1 ||
        numeroSeleccionado > trabajos?.length
      ) {
        return fallBack(
          `❌ *Selección inválida.* Por favor, responde con un número del 1 al ${
            trabajos?.length || 0
          }.`
        );
      }

      const trabajoSeleccionado = trabajos[numeroSeleccionado - 1];

      await state.update({ trabajoSeleccionado });

      // Mostrar confirmación al usuario
      await flowDynamic([
        {
          body:
            `✅ *Has seleccionado el Trabajo ${numeroSeleccionado}*\n\n` +
            `🏢 *${trabajoSeleccionado.company}*\n` +
            `📋 *${trabajoSeleccionado.title}*\n` +
            `📍 *${trabajoSeleccionado.location}*\n\n` +
            `¡Perfecto! He registrado tu interés en esta oportunidad laboral.`,
          buttons: [
            {
              body: "✅ Confirmar",
            },
            {
              body: "❌ Cancelar",
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
    async (ctx, { fallBack, flowDynamic, endFlow, state }) => {
      const trabajoSeleccionado = await state.get("trabajoSeleccionado");

      if (ctx.body.includes("❌ Cancelar")) {
        return endFlow(
          `❌ Has cancelado el proceso de registrar tu interés en el trabajo. Si necesitas ayuda en algún momento, no dudes en contactarme.`
        );
      } else if (ctx.body.includes("✅ Confirmar")) {
        await flowDynamic(
          "✅ Excelente! Para aplicar, entra en el siguiente link: " +
            trabajoSeleccionado.link +
            "\n\n" +
            "¡Muchas gracias por tu interés!"
        );
      }
      return fallBack(
        "❌ Opción no válida. Por favor, responde con ✅ Confirmar o ❌ Cancelar."
      );
    }
  );
