import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { initDatabase } from "./lib/database";
import "./index.css";
import { AuthProvider } from "./context/AuthContext.tsx";

async function main() {
  await initDatabase();
  createRoot(document.getElementById("root")!).render(
    <AuthProvider>
      <App />
    </AuthProvider>
  );
}

main();