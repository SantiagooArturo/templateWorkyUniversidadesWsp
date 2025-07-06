import { ServicesWorki, ServicesFireBase } from "~/services";
import { MESSAGES } from "../constants";
import { Timestamp } from "@firebase/firestore";
import { InitFlows } from "~/templates/InitFlows";

// Función para crear mensaje de retroalimentación
const createFeedbackMessage = (
  questionNum: number,
  analysis: any,
  isLast = false
) => {
  const nextMessage = isLast
    ? "\n🎉 *¡Última pregunta completada!*"
    : "\n🚀 *¡Continuemos con la siguiente pregunta!*";

  return `📊 *RETROALIMENTACIÓN - PREGUNTA ${questionNum}*

🎯 *Puntuación:* ${analysis.score}/10

📝 *Resumen:*
${analysis.summary}

✅ *Fortalezas:*
${analysis.strengths
  .map((strength, index) => `${index + 1}. ${strength}`)
  .join("\n")}

⚠️ *Áreas de mejora:*
${analysis.weaknesses
  .map((weakness, index) => `${index + 1}. ${weakness}`)
  .join("\n")}

💡 *Sugerencias:*   
${analysis.suggestions
  .map((suggestion, index) => `${index + 1}. ${suggestion}`)
  .join("\n")}

---${nextMessage}`;
};

// Función para procesar respuesta y generar siguiente pregunta
const processResponseAndGenerateQuestion = async (
  ctx: any,
  state: any,
  flowDynamic: any,
  gotoFlow: any,
  worki: ServicesWorki,
  questionNum: number,
  responseKey: string,
  questionKey: string,
  nextQuestionKey: string,
  prompt: string,
  isLast = false,
  extensions?: any,
  fallBack?: any
) => {
  // ✅ VALIDACIÓN: Solo aceptar audio o video para entrevistas
  if (ctx.type !== "audio" && ctx.type !== "video") {
    console.log(`❌ Respuesta inválida para pregunta ${questionNum}: tipo ${ctx.type}`);
    return fallBack?.(MESSAGES.AUDIO_VIDEO_REQUIRED);
  }
  
  let mediaUrl = "";
  
  console.log(`🎤 Procesando ${ctx.type === "audio" ? "audio" : "video"} para entrevista - Pregunta ${questionNum}`);
  
  try {
    // ✅ USAR MÉTODO EXISTENTE QUE SUBE A STORAGE EXTERNO
    // 1. Guardar temporalmente
    const tempFileName = `interview_${ctx.from}_${ctx.fileData.id}_${Date.now()}.ogg`;
    const localPath = await worki.saveMedia(ctx.url, tempFileName, true);
    
    // 2. Subir a storage externo y obtener URL pública
    const publicUrl = await worki.uploadFileToFTP(localPath, tempFileName);
    
    console.log(`✅ Audio Q${questionNum} subido a storage externo: ${publicUrl}`);
    
    // 3. Guardar URL para esta pregunta específica
    mediaUrl = publicUrl;
    await state.update({ [`url${questionNum}`]: publicUrl });
    console.log(`📝 URL guardada para pregunta ${questionNum}: ${publicUrl}`);
    
    // 4. Transcribir usando la URL del storage externo
    console.log(`🎙️ Transcribiendo desde storage externo: ${publicUrl}`);
    const transcribed = await worki.transcribeAudio(publicUrl);
    
    if (transcribed) {
      ctx.body = transcribed;
      console.log(`✅ Transcripción exitosa Q${questionNum}: ${transcribed}`);
    } else {
      console.log(`⚠️ Transcripción falló para Q${questionNum}, usando texto por defecto`);
      ctx.body = "Audio recibido - transcripción no disponible";
    }
    
    // 5. Limpiar archivo temporal local (opcional)
    try {
      const fs = await import('fs');
      if (fs.existsSync(localPath)) {
        fs.unlinkSync(localPath);
        console.log(`🗑️ Archivo temporal eliminado: ${localPath}`);
      }
    } catch (cleanupError) {
      console.warn(`⚠️ No se pudo eliminar archivo temporal: ${cleanupError.message}`);
    }
    
  } catch (error) {
    console.error(`❌ Error procesando media Q${questionNum}:`, error);
    ctx.body = "Audio recibido - error en procesamiento";
  }

  // Guardar la respuesta transcrita
  await state.update({ [responseKey]: ctx.body });

  await flowDynamic([{ body: MESSAGES.PROCESSING }]);

  const analysis = await worki.analyzeInterviewResponse(
    await state.get(responseKey),
    await state.get(questionKey)
  );

  // Guardar el análisis en el state
  await state.update({ [`analysis${questionNum}`]: analysis });

  if (analysis) {
    await flowDynamic([
      {
        body: createFeedbackMessage(questionNum, analysis, isLast),
      },
    ]);
  }

  // ✅ NUEVA LÓGICA: Mostrar confirmación solo si NO es la última pregunta
  if (!isLast) {
    // Mostrar mensaje de confirmación con botones
    return await flowDynamic([
      {
        body: MESSAGES.CONFIRMATION_NEXT_QUESTION(questionNum),
        buttons: [
          { body: "✅ Sí, continuar" },
          { body: "⏹️ Detener" }
        ],
      },
    ]);
  }

  // Al final del flujo, guardar en Firebase
  if (isLast && extensions) {
    try {
      const db = extensions.db as ServicesFireBase;
      const userId = ctx.from;
      const puesto = await state.get("puesto");

      console.log(`💾 Guardando entrevista completa para usuario ${userId}`);

      // Recopilar todas las respuestas y análisis
      const questionsAndAnswers = [];

      for (let i = 1; i <= 4; i++) {
        const response = await state.get(`response${i}`);
        const question = await state.get(`question${i}`);
        const analysis = await state.get(`analysis${i}`);
        const url = await state.get(`url${i}`);

        console.log(`📋 Recopilando pregunta ${i}:`);
        console.log(`   - Pregunta: ${question ? 'SÍ' : 'NO'}`);
        console.log(`   - Respuesta: ${response ? 'SÍ' : 'NO'}`);
        console.log(`   - URL: ${url ? 'SÍ' : 'NO'} - ${url || 'N/A'}`);
        console.log(`   - Análisis: ${analysis ? 'SÍ' : 'NO'}`);

        if (response && question) {
          questionsAndAnswers.push({
            questionNumber: i,
            transcription: response,
            answerTimestamp: {
              seconds: Math.floor(Date.now() / 1000),
              nanoseconds: Math.floor(Date.now() / 1000),
            },
            questionText: question,
            mediaUrl: url || "", // Aquí se guardará la URL del storage externo o vacío si es texto
            analysis: analysis || {
              score: 0,
              strengths: [],
              weaknesses: [],
              suggestions: [],
              summary: "Análisis no disponible",
            },
          });
          
          console.log(`✅ Pregunta ${i} agregada al historial`);
        } else {
          console.log(`⚠️ Pregunta ${i} incompleta - no se agregará`);
        }
      }

      console.log(`📊 Total de preguntas recopiladas: ${questionsAndAnswers.length}/4`);

      // Crear el objeto de entrevista
      const currentTimestamp = new Date();
      const interviewData: any = {
        jobPosition: puesto,
        startedAt: currentTimestamp,
        completedAt: currentTimestamp,
        candidateInfo: {
          estado: "Completado",
          fechaEntrevista: currentTimestamp,
          candidato: userId?.name || "Desconocido",
        },
        interviewId: `interview_${Date.now()}`,
        questionsAndAnswers,
      };

      console.log(`💾 Datos de entrevista preparados:`, JSON.stringify(interviewData, null, 2));

      // Obtener el usuario actual
      const currentUser = await db.getUserById(userId);

      if (currentUser) {
        // Agregar la nueva entrevista al historial
        const updatedInterviewHistory = [
          ...(currentUser.interviewHistory || []),
          interviewData,
        ];

        // Actualizar el usuario con el nuevo historial
        await db.updateUser(userId, {
          interviewHistory: updatedInterviewHistory,
          lastInterviewActivity: Timestamp.now(),
        });

        console.log(`✅ Entrevista guardada exitosamente en Firebase`);

        await flowDynamic([
          {
            body:
              "✅ *Entrevista completada y guardada exitosamente.*\n\n" +
              `📊 Preguntas completadas: ${questionsAndAnswers.length}/4\n\n` +
              MESSAGES.FINAL_MESSAGE,
            buttons: [
              { body: "🔙 Volver al inicio" }
            ],
          },
        ]);
        return gotoFlow(InitFlows);
      } else {
        console.log(`⚠️ Usuario no encontrado, no se pudo guardar la entrevista`);
        await flowDynamic([{ body: MESSAGES.FINAL_MESSAGE, buttons: [{ body: "🔙 Volver al inicio" }] }]);
        return gotoFlow(InitFlows);
      }
    } catch (error) {
      console.error("Error al guardar la entrevista en Firebase:", error);
      await flowDynamic([{ 
        body: "⚠️ *Entrevista completada pero hubo un error al guardar.*\n\n" + MESSAGES.FINAL_MESSAGE 
      }]);
    }
  } else {
    return await flowDynamic([{ body: MESSAGES.FINAL_MESSAGE, buttons: [{ body: "🔙 Volver al inicio" }] }]);
  }
};

export { createFeedbackMessage, processResponseAndGenerateQuestion };
