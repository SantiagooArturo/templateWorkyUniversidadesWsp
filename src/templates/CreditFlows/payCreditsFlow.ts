import { addKeyword, EVENTS } from "@builderbot/bot";
import { ServicesFireBase } from "~/services";
import { validateYapeImage, creditUser } from "~/services/credits/PaymentService";
import { InitFlows } from "../InitFlows";
import { CreditFlow } from "./index";

export const payCreditsFlow = addKeyword(EVENTS.ACTION)
  // 📋 PASO 1: Mostrar instrucciones de pago
  .addAction(async (ctx, { state, fallBack, flowDynamic }) => {
    const planSelected = await state.get("planSelected");

    if (!planSelected) {
      return fallBack("No se ha seleccionado un plan de créditos. Por favor, vuelve a intentarlo.");
    }

    await flowDynamic([
      {
        buttons: [
          {
            body: "🔙 Regresar",
          }
        ],
        body: `💳 *Proceso de Pago*\n\n💰 *Monto a pagar:* S/${planSelected.price}\n🎯 *Créditos a recibir:* ${planSelected.credits}\n\n📱 *Pasos para el pago:*\n1. Abre tu app de Yape o Plin\n2. Transfiere S/${planSelected.price} a:\n   📞 *Número:* ${process.env.YAPE_RECIPIENT_PHONE || "987654321"}\n   👤 *Nombre:* ${process.env.YAPE_RECIPIENT_NAME || "Francesco Lucchesi"}\n3. Toma captura del voucher de pago\n4. Envía la imagen aquí\n\n⚠️ *Importante:* La imagen debe ser clara y mostrar el monto, la fecha y destinatario correctos.`,
      }
    ]);
  })

  // 📸 PASO 2: Capturar imagen del voucher
  .addAction(
    { 
      capture: true,
      delay: 2000 
    },
    async (ctx, { state, flowDynamic, fallBack, gotoFlow, extensions, endFlow }) => {
      // Verificar cancelación explícita
      if (ctx.body && ctx.body.toLowerCase().includes("regresar")) {
        return gotoFlow(CreditFlow);
      }

      // Verificar que sea una imagen
      if (!ctx?.fileData?.mime_type?.includes("image")) {
        return fallBack(
          "⚠️ *Archivo no válido*\n\nPor favor, envía una imagen (captura de pantalla) del voucher de Yape.\n\n📱 *Formatos aceptados:* JPG, PNG, JPEG\n\n💡 *Tip:* Asegúrate de que la imagen sea clara y muestre el monto y destinatario."
        );
      }

      const planSelected = await state.get("planSelected");
      const db = extensions.db as ServicesFireBase;

      try {
        // 🔄 Mostrar mensaje de procesamiento
        await flowDynamic("🔄 *Validando tu comprobante...*\n\nEstoy verificando los datos del pago. Por favor espera unos segundos.");

        // 🤖 Validar imagen con OpenAI Vision
        const validationResult = await validateYapeImage(ctx.url, planSelected.price);

        if (validationResult.isValid) {
          // ✅ PAGO VÁLIDO - Acreditar créditos
          await creditUser(ctx.from, planSelected.credits , db);

          // Obtener usuario actualizado para mostrar nuevo saldo
          const updatedUser = await db.getUserById(ctx.from);
          
          await flowDynamic([
            {
              body: `✅ *¡Recarga exitosa!* 🎉\n\n💳 *Pago validado correctamente*\n🎯 *Créditos acreditados:* +${planSelected.credits}\n💰 *Saldo actual:* ${updatedUser?.credits || 0} créditos\n\n🚀 *¡Ya puedes usar nuestros servicios premium!*\n• 📄 Revisión de CV (1 crédito)\n• 💼 Búsqueda de trabajos (1 crédito)\n\n¡Gracias por confiar en Worky! 🙌`,
              buttons: [
                {
                  body: "🔙 Volver",
                }
              ],
            }
          ]);

          // Guardar estado de pago exitoso y regresar al menú principal
          await state.update({ paymentSuccess: true });
          // return gotoFlow(InitFlows);

        } else {
          // ❌ PAGO NO VÁLIDO - Mostrar detalles del error
          await state.update({ 
            validationAttempts: (await state.get("validationAttempts") || 0) + 1 
          });

          await flowDynamic([
            {
              body: `❌ *Comprobante no válido* 😔\n\n🔍 *Detalles detectados:*\n💰 Monto: S/${validationResult.detectedAmount}\n👤 Destinatario: ${validationResult.detectedRecipient}\n\n⚠️ *Problema:* ${validationResult.errorMessage || "Los datos no coinciden con el pago esperado"}\n\n💡 *Verifica que:*\n• El monto sea exactamente S/${planSelected.price}\n• El destinatario sea "Francesco Lucchesi"\n• La imagen sea clara y legible\n\n¿Qué deseas hacer?`,
              buttons: [
                {
                  body: "🔄 Reintentar",
                },
                {
                  body: "❌ Cancelar",
                },
              ],
            }
          ]);

          // Continuar al siguiente paso para manejar la respuesta
          return;
        }

      } catch (error) {
        console.error("Error validating payment:", error);
        
        await flowDynamic([
          {
            body: `⚠️ *Error técnico*\n\nOcurrió un problema al validar tu comprobante. Esto puede deberse a:\n• Problema temporal del servidor\n• Imagen muy pesada o borrosa\n• Conexión inestable\n\n¿Qué deseas hacer?`,
            buttons: [
              {
                body: "🔄 Reintentar",
              },
              {
                body: "❌ Cancelar",
              },
            ],
          }
        ]);

        return;
      }
    }
  )

  // 🔄 PASO 3: Manejar respuesta después de validación fallida
  .addAction(
    { 
      capture: true,
      delay: 1000 
    },
    async (ctx, { gotoFlow, endFlow, state, flowDynamic }) => {
      const validationAttempts = await state.get("validationAttempts") || 0;

      if (ctx.body.includes("🔄 Reintentar") || ctx.body.toLowerCase().includes("reintentar")) {
        // Limitar intentos para evitar bucles infinitos
        if (validationAttempts >= 3) {
          return endFlow("⚠️ *Demasiados intentos*\n\nHas alcanzado el límite de intentos de validación. Por favor, verifica que tu comprobante sea correcto y vuelve a intentarlo más tarde.\n\nSi necesitas ayuda, contacta a nuestro soporte.\n\n🔄 *Proceso finalizado*\n\n¡Hasta pronto!");
        }

        // Volver al paso de captura de imagen (paso 2) sin flowDynamic
        return gotoFlow(payCreditsFlow, 1);
      }
      
      if (ctx.body.includes("❌ Cancelar") || ctx.body.toLowerCase().includes("cancelar")) {
        return endFlow(
          "❌ *Recarga cancelada*\n\nHas cancelado el proceso de recarga. Si necesitas ayuda o tienes problemas con el pago, no dudes en contactarnos.\n\n¡Hasta pronto! 👋"
        );
      }

      // Si la respuesta no es válida, regresar al menú principal
      return gotoFlow(InitFlows);
    }
  );