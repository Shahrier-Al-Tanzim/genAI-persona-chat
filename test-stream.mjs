import { streamText, tool } from 'ai';
import { createGroq } from '@ai-sdk/groq';
import { z } from 'zod';
import fs from 'fs';
const envs = fs.readFileSync('.env.local', 'utf8').split('\n').filter(Boolean);
for (const env of envs) {
  const [key, ...value] = env.split('=');
  process.env[key] = value.join('=');
}

async function run() {
  const result = await streamText({
    model: createGroq({ apiKey: process.env.GROQ_API_KEY })('llama-3.1-8b-instant'),
    system: "You are a helpful assistant.",
    messages: [
      { role: "user", content: "Switch to piyush" }
    ],
    tools: {
      switchPersona: tool({
        description: "Change the current active persona/mentor.",
        inputSchema: z.object({
          personaId: z.enum(["hitesh", "piyush"])
        }),
        execute: async ({ personaId }) => {
          return `Successfully switched to ${personaId}`;
        }
      })
    }
  });

  const response = result.toUIMessageStreamResponse();
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  while(true) {
    const { done, value } = await reader.read();
    if(done) break;
    console.log(decoder.decode(value));
  }
}
run();
