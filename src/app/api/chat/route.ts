import { createGroq } from "@ai-sdk/groq";
import { streamText, tool, convertToModelMessages, isStepCount } from 'ai';
import { personas, PersonaId } from '@/lib/personas';
import { z } from 'zod';
// Initialize the official Groq provider
const groq = createGroq({
    apiKey: process.env.GROQ_API_KEY,
});

// Set the runtime ot edge for the best performance
export const runtime = 'edge';

export async function POST(req: Request) {
    // Extract messages and personaID from the request body
    const { messages, personaId } = await req.json();
    console.log("RECEIVED MESSAGES:", JSON.stringify(messages, null, 2));

    // Find the selected persona from our configuration
    const persona = personas[personaId as PersonaId];
    
    if(!persona) {
        return new Response('Persona not found', { status: 404 });
    }

    // ak LLm o stream a response using the selected persona's system prompt

    // Convert frontend UIMessages to core ModelMessages format
    const coreMessages = await convertToModelMessages(messages);

    const systemPrompt = `${persona.systemPrompt}\n\nCRITICAL INSTRUCTION: You are currently active as ${persona.name}. You MUST adopt this persona entirely. If there are previous messages in the history where you acted as a different mentor, IGNORE THEM. You are now ${persona.name}.`;

    try {
        const result = await streamText({
            model: groq('llama-3.1-8b-instant'),
            system: systemPrompt,
            messages: coreMessages,
            stopWhen: isStepCount(5),
            tools : {
                switchPersona: tool({
                    description : `Change the current active persona/mentor. If the user asks to switch personas, or asks you to act as the other persona, you MUST call this tool. Do NOT just roleplay the switch.`,
                    inputSchema: z.object({
                        personaId: z.enum(["hitesh", "piyush"]).describe("The ID of the persona to switch to")
                    }),
                    execute: async ({ personaId }) => {
                        return `Successfully switched persona to ${personaId}`;
                    }
                })
            }
        });

        return result.toUIMessageStreamResponse();
    } catch (e: any) {
        console.error("STREAM ERROR:", e);
        return new Response(e.message, { status: 500 });
    }
}
