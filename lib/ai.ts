export const AI_MODEL = "openai/gpt-oss-120b";

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export async function chatCompletion(
  messages: ChatMessage[],
  responseFormat?: object,
): Promise<string> {
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: AI_MODEL,
      messages,
      // Only route to providers that actually enforce response_format;
      // others silently ignore it and return free-form JSON.
      ...(responseFormat && {
        response_format: responseFormat,
        provider: { require_parameters: true },
      }),
    }),
  });
  if (!res.ok) {
    throw new Error(`OpenRouter error ${res.status}: ${await res.text()}`);
  }
  const data = await res.json();
  return data.choices[0].message.content;
}
