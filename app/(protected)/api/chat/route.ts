// app/api/chat/route.ts
import { createGroq } from "@ai-sdk/groq";
import { createUIMessageStream, createUIMessageStreamResponse, streamText } from "ai";

const groq = createGroq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: Request) {
  const { model, message } = await req.json();

  const response = createUIMessageStreamResponse({
    status: 200,
    statusText: "OK",
    headers: {
      "Custom-Header": "value",
    },
    stream: createUIMessageStream({
      execute({ writer }) {

        // Merge with LLM stream
        const result = streamText({
          model: groq(model),
          prompt: message,
        });

        writer.merge(result.toUIMessageStream());
      },
    }),
  });

  console.log(response);
  
  return response;

  // return result.toUIMessageStreamResponse();
}
