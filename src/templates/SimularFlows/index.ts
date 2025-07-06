import { processResponseAndGenerateQuestion } from "./utils";
import { MESSAGES, QUESTION_PROMPTS } from "./constants";
import { addKeyword, EVENTS } from "@builderbot/bot";
import { ServicesWorki } from "~/services";
import { InitFlows } from "../InitFlows";

export const SimularFlows = addKeyword(EVENTS.ACTION)
  .addAnswer(
    MESSAGES.INITIAL_QUESTION,
    { 
      capture: true,
      buttons: [
        {
          body: "🔙 Regresar",
        },
      ],
    },
    async (ctx, { state, flowDynamic, endFlow, gotoFlow }) => {
      if (ctx.body.includes("🔙 Regresar")) {
        return gotoFlow(InitFlows);
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
  // ✅ PREGUNTA 1
  .addAction(
    { capture: true },
    async (ctx, { state, flowDynamic, extensions, fallBack, gotoFlow }) => {
      const worki = extensions.worki as ServicesWorki;
      const puesto = await state.get("puesto");

      return await processResponseAndGenerateQuestion(
        ctx,
        state,
        flowDynamic,
        gotoFlow,
        worki,
        1,
        "response1",
        "question1",
        "question2",
        QUESTION_PROMPTS.SKILLS(puesto),
        false,
        extensions,
        fallBack
      );
    }
  )
  // ✅ CONFIRMACIÓN PREGUNTA 1 → 2
  .addAction(
    { capture: true },
    async (ctx, { state, flowDynamic, extensions, fallBack }) => {
      if (ctx.body.includes("⏹️ Detener")) {
        return await flowDynamic(
          [{ body: MESSAGES.STOPPED_BY_USER, buttons: [{ body: "🔙 Ir a menù" }] }]
        );
      }
      
      if (!ctx.body.includes("✅ Sí, continuar")) {
        return fallBack("❌ *Respuesta no válida*\n\nPor favor, selecciona una de las opciones: ✅ Sí, continuar o ⏹️ Detener");
      }

      // Generar pregunta 2
      const worki = extensions.worki as ServicesWorki;
      const puesto = await state.get("puesto");
      const response = await worki.generateInterviewQuestion(
        puesto,
        QUESTION_PROMPTS.SKILLS(puesto)
      );

      await state.update({ question2: response.question });

      return await flowDynamic([
        {
          body:
            MESSAGES.QUESTION_HEADER(2) +
            response.question +
            MESSAGES.AUDIO_INSTRUCTION,
        },
      ]);
    }
  )
  // ✅ PREGUNTA 2
  .addAction(
    { capture: true },
    async (ctx, { state, flowDynamic, extensions, fallBack, gotoFlow }) => {
      const worki = extensions.worki as ServicesWorki;
      const puesto = await state.get("puesto");

      return await processResponseAndGenerateQuestion(
        ctx,
        state,
        flowDynamic,
        gotoFlow,
        worki,
        2,
        "response2",
        "question2",
        "question3",
        QUESTION_PROMPTS.TEAMWORK(puesto),
        false,
        extensions,
        fallBack
      );
    }
  )
  // ✅ CONFIRMACIÓN PREGUNTA 2 → 3
  .addAction(
    { capture: true },
    async (ctx, { state, flowDynamic, extensions, endFlow, fallBack }) => {
      if (ctx.body.includes("⏹️ Detener")) {
        return await flowDynamic(
          [{ body: MESSAGES.STOPPED_BY_USER, buttons: [{ body: "🔙 Ir a menù" }] }]
        );
      }
      
      if (!ctx.body.includes("✅ Sí, continuar")) {
        return fallBack("❌ *Respuesta no válida*\n\nPor favor, selecciona una de las opciones: ✅ Sí, continuar o ⏹️ Detener");
      }

      // Generar pregunta 3
      const worki = extensions.worki as ServicesWorki;
      const puesto = await state.get("puesto");
      const response = await worki.generateInterviewQuestion(
        puesto,
        QUESTION_PROMPTS.TEAMWORK(puesto)
      );

      await state.update({ question3: response.question });

      return await flowDynamic([
        {
          body:
            MESSAGES.QUESTION_HEADER(3) +
            response.question +
            MESSAGES.AUDIO_INSTRUCTION,
        },
      ]);
    }
  )
  // ✅ PREGUNTA 3
  .addAction(
    { capture: true },
    async (ctx, { state, flowDynamic, extensions, fallBack, gotoFlow }) => {
      const worki = extensions.worki as ServicesWorki;
      const puesto = await state.get("puesto");

      return await processResponseAndGenerateQuestion(
        ctx,
        state,
        flowDynamic,
        gotoFlow,
        worki,
        3,
        "response3",
        "question3",
        "question4",
        QUESTION_PROMPTS.PROBLEM_SOLVING(puesto),
        false,
        extensions,
        fallBack
      );
    }
  )
  // ✅ CONFIRMACIÓN PREGUNTA 3 → 4
  .addAction(
    { capture: true },
    async (ctx, { state, flowDynamic, extensions, fallBack }) => {
      if (ctx.body.includes("⏹️ Detener")) {
        return await flowDynamic(
          [{ body: MESSAGES.STOPPED_BY_USER, buttons: [{ body: "🔙 Ir a menù" }] }]
        );
      }
      
      if (!ctx.body.includes("✅ Sí, continuar")) {
        return fallBack("❌ *Respuesta no válida*\n\nPor favor, selecciona una de las opciones: ✅ Sí, continuar o ⏹️ Detener");
      }

      // Generar pregunta 4 (última)
      const worki = extensions.worki as ServicesWorki;
      const puesto = await state.get("puesto");
      const response = await worki.generateInterviewQuestion(
        puesto,
        QUESTION_PROMPTS.PROBLEM_SOLVING(puesto)
      );

      await state.update({ question4: response.question });

      return await flowDynamic([
        {
          body:
            MESSAGES.QUESTION_HEADER(4) +
            response.question +
            MESSAGES.AUDIO_INSTRUCTION,
        },
      ]);
    }
  )
  // ✅ PREGUNTA 4 (ÚLTIMA)
  .addAction(
    { capture: true },
    async (ctx, { state, flowDynamic, extensions, fallBack, gotoFlow }) => {
      const worki = extensions.worki as ServicesWorki;

      return await processResponseAndGenerateQuestion(
        ctx,
        state,
        flowDynamic,
        gotoFlow,
        worki,
        4,
        "response4",
        "question4",
        "",
        "",
        true, // ✅ Es la última pregunta
        extensions,
        fallBack
      );
    }
  );
