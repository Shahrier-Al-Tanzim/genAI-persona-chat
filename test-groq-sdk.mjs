import { createOpenAI } from "@ai-sdk/openai";
import { streamText } from 'ai';

process.loadEnvFile('.env.local');

const groq = createOpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: 'https://api.groq.com/openai/v1',
});

const test = async () => {
  try {
    const result = await streamText({
      model: groq('llama-3.1-8b-instant'),
      system: "You are a helpful assistant.",
      messages: [
        { role: "user", content: "hello" },
        { role: "assistant", content: "Haanji!" },
        { role: "user", content: "i dont understand react" }
      ],
    });

    for await (const textPart of result.textStream) {
      process.stdout.write(textPart);
    }
  } catch (error) {
    console.error("SDK ERROR:", error);
  }
};

test();
