import { TerminosFlows } from "./TerminosFlows";
import { createFlow } from "@builderbot/bot";
import { InitFlows } from "./InitFlows";
import { RevisarCvFlow } from "./RevisarCvFlows";
import { SimularFlows } from "./SimularFlows";
import { EmailUniversitarioFlow } from "./EmaiFlows";
import { BuscarTrabajosFlow } from "./BuscarTrabajosFlows";

export default createFlow([
  InitFlows,
  TerminosFlows,
  EmailUniversitarioFlow,
  RevisarCvFlow,
  SimularFlows,
  BuscarTrabajosFlow,
]);
