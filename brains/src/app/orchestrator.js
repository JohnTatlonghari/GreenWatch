/*
Orchestrator controls assistant behavior based on context.

If a PDF has been uploaded, the assistant operates in Chat + Log mode.
If no PDF exists, the assistant behaves in Chat-only mode.

submitText(text) returns:
{
  assistantText: string,
  shouldAskLogQuestion: boolean,
  logProgress: number | null
}
*/

let hasLogContext = false;
let turnCount = 0;

/*
Called by the UI when a PDF is uploaded.
Enables structured logging behavior.
*/
export function enableLogContext() {
  hasLogContext = true;
  turnCount = 0;
}

/*
Optional reset function if user clears PDF or starts fresh.
*/
export function disableLogContext() {
  hasLogContext = false;
  turnCount = 0;
}

/*
Main entrypoint called whenever the user submits text.
This function decides whether to operate in:
- Chat-only mode
- Chat + Log mode
*/
export function submitText(text) {

  // -------------------------------
  // CHAT-ONLY MODE
  // -------------------------------
  if (!hasLogContext) {
    return {
      assistantText: "I’m here to listen. Tell me what’s on your mind.",
      shouldAskLogQuestion: false,
      logProgress: null
    };
  }

  // -------------------------------
  // CHAT + LOG MODE
  // -------------------------------
  turnCount++;

  /*
  Placeholder for A3 LogEngine. This will later be replaced with:
  applyUserText(text)
  getNextQuestion()
  getProgress()
  isComplete()
  */
  const logResult = {
    clarification: null,
    nextQuestion: "How many hours have you worked today?",
    progress: 0.25,
    isComplete: false
  };

  // If input needs clarification, always prioritize it
  if (logResult.clarification) {
    return {
      assistantText: logResult.clarification,
      shouldAskLogQuestion: true,
      logProgress: logResult.progress
    };
  }

  // Friendly conversational wrapper
  const assistantText = "Thanks for sharing that.";

  // Blend pacing: ask a structured question every 2 turns
  const shouldAsk =
    turnCount % 2 === 0 &&
    !logResult.isComplete;

  return {
    assistantText,
    shouldAskLogQuestion: shouldAsk,
    logProgress: logResult.progress
  };
}