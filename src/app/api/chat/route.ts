import { createOpenAI } from "@ai-sdk/openai";
import { streamText} from 'ai'
import {personas, PersonaId} from '@/lib/personas'

// Initialize The OpenAi provider to use Groq's base URL and API key

const groq = createOpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL : 'https://api.groq.com/openai/v1',
});

// Set the runtime ot edge for the best performance
export const runtime = 'edge';

export async function POST(req: Request) {
    // Extract messages and personaID from the request body
    const { messages, personaId } = await req.json();

    // Find the selected persona from our configuration
    const persona = personas[personaId as PersonaId];
    
    if(!persona) {
        return new Response('Persona not found', { status: 404 });
    }

    // ak LLm o stream a response using the selected persona's system prompt

    const result = await streamText({
        model: groq('llama3-8b-8192'),
        system: persona.systemPrompt,
        messages,
    });

    return result.toTextStreamResponse();
}
