import "dotenv/config";
import { createApp } from "./app.js";

const port = Number(process.env.PORT) || 8089;
createApp().listen(port, () => {
  console.log(`Kiosk server running on http://localhost:${port}`);
});
