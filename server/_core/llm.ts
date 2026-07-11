import { ENV } from "./env";

type Message = {
  role: "system" | "user" | "assistant";
  content: string;
};

type InvokeParams = {
  messages: Message[];
  response_format?: { type: "json_object" };
};

type InvokeResult = {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
};

export async function invokeLLM(params: InvokeParams): Promise<InvokeResult> {
  if (!ENV.openAiApiKey) {
    throw new Error("OPENAI_API_KEY is required for AI suggestions");
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      authorization: `Bearer ${ENV.openAiApiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: ENV.openAiModel,
      messages: params.messages,
      response_format: params.response_format,
      temperature: 0.8,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`OpenAI request failed (${response.status}): ${text}`);
  }

  return (await response.json()) as InvokeResult;
}
