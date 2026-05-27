import "dotenv/config";
import { FormService } from "./form";

const service = new FormService();

service
  .seedDemo()
  .then((result) => {
    console.log("Seed complete", result);
    process.exit(0);
  })
  .catch((error) => {
    console.error("Seed failed", error);
    process.exit(1);
  });
