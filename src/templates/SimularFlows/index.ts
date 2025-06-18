import { processResponseAndGenerateQuestion } from "./utils";
import { MESSAGES, QUESTION_PROMPTS } from "./constants";
import { addKeyword, EVENTS } from "@builderbot/bot";
import { ServicesWorki } from "~/services";

export const SimularFlows = addKeyword(EVENTS.ACTION)
  .addAnswer(
    MESSAGES.INITIAL_QUESTION,
    { 
      capture: true,
      buttons: [
        {
          body: "❌ Cancelar",
        },
      ],
    },
    async (ctx, { state, flowDynamic, endFlow }) => {
      if (ctx.body.includes("❌ Cancelar")) {
        return endFlow(
          `❌ *Simulación cancelada*\n\nHas cancelado la simulación de entrevista. Si cambias de opinión, puedes volver a intentarlo desde el menú principal.\n\n¡Estoy aquí cuando me necesites! 👋`
        );
      }
      
      await state.update({ puesto: ctx.body });

      return await flowDynamic([
        {
          body: MESSAGES.INTERVIEW_START(ctx.body),
          buttons: [{ body: "Sí" }, { body: "No" }],
        },
      ]);
    }
  )
  .addAction(
    { capture: true },
    async (ctx, { fallBack, endFlow, extensions, state, flowDynamic }) => {
      const worki = extensions.worki as ServicesWorki;

      // Validación de respuesta
      if (ctx.body !== "No" && ctx.body !== "Sí") {
        return fallBack(MESSAGES.VALIDATION_ERROR);
      }
      if (ctx.body === "No") {
        return endFlow(MESSAGES.CANCELLED);
      }

      // Generar primera pregunta
      const puesto = await state.get("puesto");
      const response = await worki.generateInterviewQuestion(
        puesto,
        QUESTION_PROMPTS.EXPERIENCE(puesto)
      );

      await state.update({ question1: response.question });

      return await flowDynamic([
        {
          body:
            MESSAGES.QUESTION_HEADER(1) +
            response.question +
            MESSAGES.AUDIO_INSTRUCTION,
        },
      ]);
    }
  )
  .addAction(
    { capture: true },
    async (ctx, { state, flowDynamic, extensions }) => {
      const worki = extensions.worki as ServicesWorki;
      const puesto = await state.get("puesto");

      return await processResponseAndGenerateQuestion(
        ctx,
        state,
        flowDynamic,
        worki,
        1,
        "response1",
        "question1",
        "question2",
        QUESTION_PROMPTS.SKILLS(puesto),
        false,
        extensions
      );
    }
  )
  .addAction(
    { capture: true },
    async (ctx, { state, flowDynamic, extensions }) => {
      const worki = extensions.worki as ServicesWorki;
      const puesto = await state.get("puesto");

      return await processResponseAndGenerateQuestion(
        ctx,
        state,
        flowDynamic,
        worki,
        2,
        "response2",
        "question2",
        "question3",
        QUESTION_PROMPTS.TEAMWORK(puesto),
        false,
        extensions
      );
    }
  )
  .addAction(
    { capture: true },
    async (ctx, { state, flowDynamic, extensions }) => {
      const worki = extensions.worki as ServicesWorki;
      const puesto = await state.get("puesto");

      return await processResponseAndGenerateQuestion(
        ctx,
        state,
        flowDynamic,
        worki,
        3,
        "response3",
        "question3",
        "question4",
        QUESTION_PROMPTS.PROBLEM_SOLVING(puesto),
        false,
        extensions
      );
    }
  )
  .addAction(
    { capture: true },
    async (ctx, { state, flowDynamic, extensions }) => {
      const worki = extensions.worki as ServicesWorki;

      return await processResponseAndGenerateQuestion(
        ctx,
        state,
        flowDynamic,
        worki,
        4,
        "response4",
        "question4",
        "",
        "",
        true,
        extensions
      );
    }
  );
