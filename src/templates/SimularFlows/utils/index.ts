import { ServicesWorki, ServicesFireBase } from "~/services";
import { MESSAGES } from "../constants";
import { serverTimestamp } from "@firebase/firestore";
import config from "~/config";

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
  worki: ServicesWorki,
  questionNum: number,
  responseKey: string,
  questionKey: string,
  nextQuestionKey: string,
  prompt: string,
  isLast = false,
  extensions?: any
) => {
  if (ctx.type === "audio" || ctx.type === "video") {
    await worki.saveMedia(ctx.url, `${ctx.from}-${ctx.fileData.id}.ogg`, true);
    await new Promise((resolve) => setTimeout(resolve, 5000));

    const url = `${config.URL_BASE_BOT}/audios/${ctx.from}-${ctx.fileData.id}.ogg`;

    const transcribed = await worki.transcribeAudio(url);
    ctx.body = transcribed;

    await state.update({ [`url${questionNum}`]: url });
  }

  await state.update({ [responseKey]: ctx.body });

  await flowDynamic([{ body: MESSAGES.PROCESSING }]);

  const analysis = await worki.analyzeInterviewResponse(
    await state.get(responseKey),
    await state.get(questionKey)
  );

  // Guardar el análisis en el state para uso posterior
  await state.update({ [`analysis${questionNum}`]: analysis });

  if (analysis) {
    await flowDynamic([
      {
        body: createFeedbackMessage(questionNum, analysis, isLast),
      },
    ]);
  }

  if (!isLast) {
    const response = await worki.generateInterviewQuestion(
      await state.get("puesto"),
      prompt
    );

    await state.update({ [nextQuestionKey]: response.question });

    return await flowDynamic([
      {
        body:
          MESSAGES.QUESTION_HEADER(questionNum + 1) +
          response.question +
          MESSAGES.AUDIO_INSTRUCTION,
      },
    ]);
  }

  // Actualizar Firebase al final del flujo
  if (isLast && extensions) {
    try {
      const db = extensions.db as ServicesFireBase;
      const userId = ctx.from;
      const puesto = await state.get("puesto");

      // Recopilar todas las respuestas y análisis
      const questionsAndAnswers = [];

      for (let i = 1; i <= 4; i++) {
        const response = await state.get(`response${i}`);
        const question = await state.get(`question${i}`);
        const analysis = await state.get(`analysis${i}`);
        const url = await state.get(`url${i}`);

        if (response && question) {
          questionsAndAnswers.push({
            questionNumber: i,
            transcription: response,
            answerTimestamp: {
              seconds: Math.floor(Date.now() / 1000),
              nanoseconds: Math.floor(Date.now() / 1000),
            },
            questionText: question,
            mediaUrl: url || "",
            analysis: analysis || {
              score: 0,
              strengths: [],
              weaknesses: [],
              suggestions: [],
              summary: "Análisis no disponible",
            },
          });
        }
      }

      // Crear el objeto de entrevista
      const currentTimestamp = {
        seconds: Math.floor(Date.now() / 1000),
        nanoseconds: Math.floor(Date.now() / 1000),
      };
      const interviewData: any = {
        jobPosition: puesto,
        startedAt: currentTimestamp,
        completedAt: currentTimestamp,
        candidateInfo: {
          estado: "Completado",
          fechaEntrevista: serverTimestamp(),
          candidato: userId?.name || "Desconocido",
        },
        interviewId: `interview_${Date.now()}`,
        questionsAndAnswers,
      };

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
          lastInterviewActivity: serverTimestamp(),
        });

        await flowDynamic([
          {
            body:
              "✅ *Entrevista completada y guardada exitosamente.*\n\n" +
              MESSAGES.FINAL_MESSAGE,
          },
        ]);
      } else {
        await flowDynamic([{ body: MESSAGES.FINAL_MESSAGE }]);
      }
    } catch (error) {
      console.error("Error al guardar la entrevista en Firebase:", error);
      await flowDynamic([{ body: MESSAGES.FINAL_MESSAGE }]);
    }
  } else {
    return await flowDynamic([{ body: MESSAGES.FINAL_MESSAGE }]);
  }
};

export { createFeedbackMessage, processResponseAndGenerateQuestion };
