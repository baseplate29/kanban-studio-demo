import { chatCompletion } from "../lib/ai";

async function main() {
  const reply = await chatCompletion([
    { role: "user", content: "What is 2+2? Answer with just the number." },
  ]);
  console.log("AI reply:", reply);
  if (!reply.includes("4")) {
    console.error("Connectivity check failed: reply does not contain 4");
    process.exit(1);
  }
  console.log("Connectivity check passed.");
}

main();
