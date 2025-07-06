import { TerminosFlows } from "./TerminosFlows";
import { createFlow } from "@builderbot/bot";
import { InitFlows } from "./InitFlows";
import { RevisarCvFlow } from "./RevisarCvFlows";
import { SimularFlows } from "./SimularFlows";
import { BuscarTrabajosFlow } from "./BuscarTrabajosFlows";
import { CreditFlow } from "./CreditFlows";
import { listCreditsFlow } from "./CreditFlows/listCreditsFlow";
import { payCreditsFlow } from "./CreditFlows/payCreditsFlow";
import { EmailUniversitarioFlow } from "./EmaiFlows";
import { CommandsFlows } from "./Commands";
import { FallBackFlow } from "./FallBackFlow";
import { ThanksFlow } from "./ThanksFlow";


export default createFlow([
  InitFlows,
  TerminosFlows,
  RevisarCvFlow,
  SimularFlows,
  EmailUniversitarioFlow,
  BuscarTrabajosFlow,
  CreditFlow,
  listCreditsFlow,
  payCreditsFlow,
  CommandsFlows,
  FallBackFlow,
  ThanksFlow
]);
