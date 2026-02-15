import { createLogEngine } from "../log/logEngine.js";
import { engineeringSchema } from "../log/schemas/engineeringSchema.js";

console.log("TEST FILE LOADED");

const engine = createLogEngine(engineeringSchema);

function simulate(text) {
  const result = engine.applyUserText(text);
  console.log("User:", text);
  console.log("Clarification:", result.clarification);
  console.log("Progress:", engine.getProgress());
  console.log("Current Log:", engine.getLog());
  console.log("Complete:", engine.isComplete());
  console.log("----");
}

// Simulate conversation
simulate("MV Horizon");
simulate("08:00-12:00");
simulate("Chief Engineer Smith");
simulate("RPM was 1200");
simulate("Load 65%");
simulate("Fuel 22");
simulate("none");
simulate("Replaced fuel filter");