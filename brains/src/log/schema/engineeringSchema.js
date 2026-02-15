// Engineering Operations Log Schema (8 fields)

function extractNumber(text) {
  const match = text.match(/(\d+(\.\d+)?)/);
  return match ? Number(match[1]) : null;
}

export const engineeringSchema = [

  {
    key: "vesselName",
    required: true,
    question: "What is the vessel name?",
    parse: (text) => text.trim(),
    validate: (v) => v.length > 0
  },

  {
    key: "watchPeriod",
    required: true,
    question: "What was the watch period?",
    parse: (text) => text.trim(),
    validate: (v) => v.length > 0
  },

  {
    key: "officerOnWatch",
    required: true,
    question: "Who was the officer on watch?",
    parse: (text) => text.trim(),
    validate: (v) => v.length > 0
  },

  {
    key: "mainEngineRPM",
    required: true,
    question: "What was the main engine RPM?",
    parse: extractNumber,
    validate: (v) => v >= 0 && v <= 3000
  },

  {
    key: "mainEngineLoadPercent",
    required: true,
    question: "What was the main engine load percentage?",
    parse: extractNumber,
    validate: (v) => v >= 0 && v <= 100
  },

  {
    key: "fuelConsumptionMTPerDay",
    required: true,
    question: "What was the fuel consumption (MT/day)?",
    parse: extractNumber,
    validate: (v) => v >= 0
  },

  {
    key: "alarmsFaults",
    required: true,
    question: "Were any alarms or faults triggered? (Say 'none' if not)",
    parse: (text) => text.trim(),
    validate: (v) => v.length > 0
  },

  {
    key: "correctiveActions",
    required: true,
    question: "What corrective actions were taken?",
    parse: (text) => text.trim(),
    validate: (v) => v.length > 0
  }

];