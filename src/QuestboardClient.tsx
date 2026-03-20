"use client";

import { StrictMode } from "react";
import App from "./App";
// import { setupTestData } from "./dev/devSetup";

if (process.env.NODE_ENV === "development") {
  // setupTestData();
}

export default function QuestboardClient(){
  return (
    <StrictMode>
      <App />
    </StrictMode>
  );
}
