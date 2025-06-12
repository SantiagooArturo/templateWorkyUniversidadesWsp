import { TerminosFlows } from "./TerminosFlows";
import { createFlow } from "@builderbot/bot";
import { InitFlows } from "./InitFlows";

export default createFlow([InitFlows, TerminosFlows]);
