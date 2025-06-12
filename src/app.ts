import { MemoryDB as Database, createBot } from "@builderbot/bot";
import { ServicesFireBase } from "./services";
import templates from "./templates";
import provider from "./provider";
import config from "./config";

const main = async () => {
  const { httpServer } = await createBot(
    {
      flow: templates,
      provider: provider,
      database: new Database(),
    },
    {
      extensions: {
        db: new ServicesFireBase(),
      },
    }
  );

  httpServer(+config.PORT);
};

main();
