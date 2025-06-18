import { ServicesFireBase, ServicesWorki } from "../../services";
import { MetaProvider } from "@builderbot/provider-meta";
import { addKeyword, EVENTS } from "@builderbot/bot";
import config from "../../config";

export const RevisarCvFlow = addKeyword<MetaProvider>(EVENTS.ACTION)
  .addAnswer(
    `📄 *Análisis Profesional de CV*\n\n¡Excelente decisión! Voy a revisar tu currículum y darte retroalimentación detallada para optimizarlo.\n\n🎯 *¿Para qué puesto quieres optimizar tu CV?*\nEsto me ayudará a darte consejos específicos para esa industria.\n\n📝 *Ejemplos:*\n• "Practicante de ventas en Coca Cola"\n• "Analista de marketing en banca"\n• "Ingeniero de software en tecnología"\n\n✍️ Describe el puesto que te interesa:`,
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
          `❌ *Análisis cancelado*\n\nHas cancelado el análisis de CV. Si cambias de opinión, puedes volver a intentarlo desde el menú principal.\n\n¡Estoy aquí cuando me necesites! 👋`
        );
      }
      await state.update({ puesto: ctx.body });
    }
  )
  .addAnswer(
    `✅ *¡Perfecto!* He registrado el puesto de interés.\n\n📄 *Envío de CV*\nAhora necesito que envíes tu currículum para realizar un análisis profesional completo.\n\n📎 *Por favor, envía tu CV en formato PDF*\n\n🔍 *¿Qué analizaré?*\n• Estructura y formato del CV\n• Compatibilidad con sistemas ATS\n• Palabras clave relevantes para tu industria\n• Fortalezas y áreas de mejora\n• Recomendaciones específicas\n\n⏱️ El análisis toma 2-3 minutos`,
    {
      capture: true,
      buttons: [
        {
          body: "❌ Cancelar",
        },
      ],
    },
    async (ctx, { flowDynamic, gotoFlow, endFlow, extensions, state }) => {
      if (ctx.body.includes("❌ Cancelar")) {
        return endFlow(
          `❌ Has cancelado el proceso de revisión de tu CV. Si necesitas ayuda en algún momento, no dudes en contactarme.`
        );
      } else if (
        !ctx?.fileData?.mime_type &&
        ctx?.fileData?.mime_type !== "application/pdf"
      ) {
        await flowDynamic([
          {
            body: `⚠️ El archivo que enviaste no es compatible. Para poder analizar tu CV correctamente, necesito que lo envíes en formato PDF (.pdf). 

Por favor, convierte tu documento a PDF y vuelve a enviarlo. Si necesitas ayuda para convertir tu archivo a PDF, puedes usar herramientas gratuitas en línea.`,
            buttons: [
              {
                body: "❌ Cancelar",
              },
            ],
          },
        ]);

        return gotoFlow(RevisarCvFlow, 2);
      } else {
        const worki = extensions.worki as ServicesWorki;
        const db = extensions.db as ServicesFireBase;
        const puesto = await state.get("puesto");

        await flowDynamic(
          "📄 *¡Gracias por compartir tu CV!* 🙏\n\nEstoy analizándolo detalladamente para ofrecerte retroalimentación valiosa. Este proceso puede tomar entre 2-3 minutos... ⏳\n\nEl análisis se está realizando en un servidor externo, por favor ten paciencia."
        );

        await worki.saveMedia(ctx.url, `${ctx.from}-${ctx.fileData.id}.pdf`);

        await new Promise((resolve) => setTimeout(resolve, 5000));

        const res = await worki.analyzeCv(
          `${config.URL_BASE_BOT}/cv/${ctx.from}-${ctx.fileData.id}.pdf`,
          puesto
        );

        const startTime = Date.now();
        const now = new Date();

        const analysisItem = {
          analyzedAt: {
            seconds: Math.floor(now.getTime() / 1000),
            nanoseconds: (now.getTime() % 1000) * 1e6,
          },
          jobPosition: puesto,
          analysisData: {
            analysisId: res.analysis_id,
            pdf_report_url: res.extractedData.analysisResults.pdf_url,
            cvUrl: res.extractedData.cvOriginalFileUrl,
            candidateInfo: {
              workExperience: res.extractedData.extractedData.workExperience,
              contactInfo: res.extractedData.extractedData.contactInfo,
              candidateName: res.extractedData.extractedData.candidateName,
              professionalSummary:
                res.extractedData.extractedData.professionalSummary,
              education: res.extractedData.extractedData.education,
              rawText: res.extractedData.extractedData.rawText,
              skills: res.extractedData.extractedData.skills,
            },
            apiResponseReceivedAt: {
              seconds: Math.floor(startTime / 1000),
              nanoseconds: (startTime % 1000) * 1e6,
            },
            analysisResults: {
              areasForImprovement:
                res.extractedData.analysisResults.areasForImprovement,
              formattingAndLanguage:
                res.extractedData.analysisResults.formattingAndLanguage,
              feedbackSummary:
                res.extractedData.analysisResults.feedbackSummary,
              keywordAnalysis:
                res.extractedData.analysisResults.keywordAnalysis,
              atsCompliance: res.extractedData.analysisResults.atsCompliance,
              overallScore: res.extractedData.analysisResults.overallScore,
              strengths: res.extractedData.analysisResults.strengths,
              pdf_url: res.extractedData.analysisResults.pdf_url,
            },
          },
        };

        const existingAnalysis = await db.getCVAnalysisDetailed(ctx.from);
        const historial = existingAnalysis?.cvAnalysisHistorial || [];

        historial.push(analysisItem);

        await db.saveCVAnalysisDetailed(ctx.from, {
          id: ctx.from,
          cvAnalysisHistorial: historial,
        });
        await db.updateUser(ctx.from, {
          totalCVAnalyzed: historial.length,
        });

        await db.saveCVAnalysis({
          analysis: {
            url: res.extractedData.analysisResults.pdf_url,
          },
          userId: ctx.from,
          jobPosition: puesto,
          id: res.analysis_id,
        });

        return await flowDynamic([
          {
            body: "✅ *¡Análisis completado!* 🎉\n\nHe revisado tu CV y he preparado un informe detallado con todas mis observaciones.",
            media: res.extractedData.analysisResults.pdf_url,
          },
        ]);
      }
    }
  );
