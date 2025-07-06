import { addKeyword } from "@builderbot/bot";
import { InitFlows } from "../InitFlows";

export const CommandsFlows = addKeyword(["!start", "!reset"])
  .addAction(async (ctx, { gotoFlow, flowDynamic }) => {
    return gotoFlow(InitFlows);
  });