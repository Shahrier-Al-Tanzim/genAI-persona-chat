import { OpenAI } from 'openai';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import axios from 'axios';
import { exec } from 'child_process';
import fs from 'fs/promises';
const __dirname = dirname(fileURLToPath(import.meta.url));
process.loadEnvFile(join(__dirname, '../.env'));

const client = new OpenAI({
    // // give the geminie apik key one
    // apiKey: process.env.GEMINI_API_KEY,
    // baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/"

    // // groq api key 
    apiKey: process.env.GROQ_API_KEY,
    baseURL: "https://api.groq.com/openai/v1"
});

async function getWeatherData(cityName) {
    try {
        // wttr.in is a fantastic free API that takes city names directly and returns simple text!
        const url = `https://wttr.in/${encodeURIComponent(cityName)}?format=3`;
        const response = await axios.get(url);
        return response.data; // Returns a simple string like "Rangpur: ⛅️ +26°C"

        return `the weather of ${cityName} is sunny with 30 degree`;
    } catch (e) {
        return `Failed to get weather for ${cityName}`;
    }
}

async function executeCommandOnCli(cmd) {
    return new Promise((resolve, reject) => {
        exec(cmd, (error, stdout, stderr) => {
            if(error) {
                return resolve(`There was an Error ${error}`)
            } else {
                return resolve(stdout || "Command executed successfully.");
            }
        });
    });
}

async function createFile(filename, content) {
    try {
        // Automatically create any necessary parent folders!
        await fs.mkdir(dirname(filename), { recursive: true });
        await fs.writeFile(filename, content);
        return `Successfully created ${filename}`;
    } catch(e) {
        return `Error creating file: ${e.message}`;
    }
}

const SYSTEM_PROMPT = `
    You are an expert AI engineer. You have to analyze the user's input carefully and then you need to
    breakdown the pron;em into multiple sub problems before comming on to the fina; result. Always breakdown
    the user's intention and how to solve that problem and then step by step solve it

    Persona : You are a senior software developer
    Persona Traits:
    - You always sound technical and use jargons
    - You never answer back on personal things and you don't have a personal life
    - All you know is code, software engineering, and weather.
    - If the user asks a philosophical question  or anything unrelated, you MUST refuse to answer and state it is outside your persona.

    WE are lgoin to follow a pipeline of "INITIAL", "THINK", "TOOL_REQUEST", "ANALYZE and "OUTPUT" pipeline.

    The Pipeline:
    - "INITIAL" when user gives first input, we will have an inital thought provess on what ithsi use is trying to do..
    - "THINK" this is where we are going to think about how to siolve this an then start to breakdown the problem
    - "ANALYZE" this is where we will analyze the soluition and verify if the ouput is correct
    - "THINK" we can go back to the think mode where we now see if any sub problem remains and think
    - "ANALYZE" again analyze the problem and get onto a solution
    - "TOOL_REQUEST" : use this for calling or requesting a tool, the format of output would be 
        {"step", "TOOL_REQUEST", "functionName": "getWeatherData, "input": "Rangpur"}
    - "OUTPUT" this is where we can end and give the final output to the user.
    
    Available Tools:
     - "getWeatherData" : getWeatherData(cityName : string) : Returns the realtime weather of the city passed as parameter
     - "executeCommandOnCli" : executeCommandOnCli(cmd : string) : Execute the command on cli and returns the output on stdout. For windows, use 'start filename.html' to open a file in browser.
     - "createFile" : createFile(filename : string, content : string) : Creates a file with the given content. Use this to write HTML, CSS, or any code to a file instead of using CLI commands.
     
    Rules : 
    - Always output one step at a time and wait for the other step before proceeding.
    - If the user asks you to build a website, app, or write code, you MUST use the createFile tool to generate the code. "Building a website" counts as explicitly asking to create a file!
    - If the user asks you to build a website about a philosophical topic, you should act as a programmer: write the HTML/CSS code for it and use some creative placeholder text.
    - Always maintain the sequence of the pipeline as given in the example.
    - Always follow the JSON format strictly. Every single response MUST include the "step" property!
    - If you need to use a tool for multiple items (e.g., multiple cities), you MUST use the tool one by one. Output a TOOL_REQUEST for the first city, wait for the TOOL_OUTPUT, then output another TOOL_REQUEST for the second city. 
    - Do NOT pass arrays to tools. The input parameter must ALWAYS be a single string.
    - To create a file, DO NOT use executeCommandOnCli with echo. You MUST use the createFile tool.
    - IMPORTANT CODING RULE: When writing an application, you MUST write all HTML, CSS, and Javascript inside a SINGLE file using <style> and <script> tags. Do not create separate .js or .css files.
    
    Examples:
    - "USER" : What is 2 + 2 - 5 * 10 / 3 ?
   
    OUTPUT:
    - "INITIAL" : "The user wants me to solve a maths ewuation"
    - "THINK": "I will use the BODMAS formula nad based on that I should first multiply 5 * 10 which is 50"
    - "ANALYZE" : "Yes the bodmas is actualy right and now equation is 2 + 2 - 50 / 3
    - "THINK" : "Now as per rule I should perform divide which is dividing 50 / 3 which is 16.666667"
    - "ANALYZE" : "Now the new equations remains 2 + 2 - 16.666667"
    - "THINK" : "Now it is simple we can just do 2 + 2 = 4 and new equation is 4 - 16.666667"
    - "ANALYZE" : "Great lets just do the final step as simple substraction"
    - "THINK" : "After the final subtraction the ans reamins - 12.666667"
    - "OUTPUT" : "The final output is -12.666667"

    Example:
    - "USER" what is the weather of Rangpur?
    OUTPUT:
    - "INITIAL" : "The user wants to know the weather of Rangpur"
    - "THINK" : "from the tools I can see I have a tool getWeatherData which can be called"
    - "ANALYZE" : "We are going to call the tool getWeatherData with the input Rangpur"
    - "TOOL_REQUEST" : {
                        "functionName" : "getWeatherData",
                        "input": "Rangpur"
                        }
    - "TOOL_OUTPUT" : "The weather is sunny with some 30 degree celsius"
    - "THINK" : "We got the weather info and I have to tell the feeling of the weather if user will feel hot or cold"
    - "OUTPUT" : "The weather of Rangpur is sunny with 30 degrees. And it feel hot"

    Output Format:
    { 
        "step" : "INITIAL" | "THINK" | "TOOL_REQUEST" | "ANALYZE" | "OUTPUT", 
        "text": "<The actual Text>",
        "functionName": "<NAME OF FUNCTION>",
        "input": "<INPUT PARAMETER FOR getWeatherData or executeCommandOnCli>",
        "filename": "<FILENAME FOR createFile tool>",
        "content": "<FILE CONTENT FOR createFile tool>"
    }

`;


const MESSAGES_DB = [{
    role: 'system',
    content: SYSTEM_PROMPT,
}]

async function main(prompt = '') {
    MESSAGES_DB.push({
        role: 'user',
        content: prompt // Removed the quotes here so it passes the actual math equation
    })

    while (true) {
        console.log("... waiting for Gemini API ...");
        const result = await client.chat.completions.create({
            // model from groq
            model: 'llama-3.1-8b-instant',
            // model: 'llama-3.3-70b-versatile',
            // model: 'gemini-3.5-flash',

            messages: MESSAGES_DB,
            response_format: { type: "json_object" } // Force strict JSON mode
        });
        console.log("... got response from Gemini API ...");

        let rawResult = result.choices[0].message.content;

        // Strip markdown backticks if the AI accidentally adds them
        rawResult = rawResult.replace(/```json/g, "").replace(/```/g, "").trim();

        let parsedResult;

        try {
            parsedResult = JSON.parse(rawResult);
        } catch (e) {
            console.log("Failed to parse JSON. Raw output:", rawResult);
            break;
        }

        // Fixed the typo here: changed square brackets [] to parentheses ()
        MESSAGES_DB.push({ role: 'assistant', content: rawResult });

        // Safely get the step, or fallback to UNKNOWN if the AI forgot it
        const step = parsedResult.step || 'UNKNOWN';
        const text = parsedResult.text || JSON.stringify(parsedResult);

        console.log(`🤖 (${step}) : ${text}`);

        if (step.toLowerCase() === 'output' || step === 'UNKNOWN') {
            break;
        }

        if(step.toLowerCase() === 'tool_request'){
            const {functionName, input, filename, content} = parsedResult;
            switch (functionName) {
                case 'createFile' : {
                    const toolResult = await createFile(filename, content);
                    console.log(`📝 (${functionName}) : ${filename}`, toolResult);
                    MESSAGES_DB.push({
                        role: 'user',
                        content : JSON.stringify({
                            step: 'TOOL_OUTPUT',
                            output: toolResult,
                        }),
                    });
                } break;
                case 'executeCommandOnCli' : {
                    const toolResult = await executeCommandOnCli(input);
                    console.log(`⌨️ (${functionName}) : ${input}`, toolResult);
                    MESSAGES_DB.push({
                        role: 'user',
                        content : JSON.stringify({
                            step: 'TOOL_OUTPUT',
                            output: toolResult,
                        }),
                    });
                } break;
                case 'getWeatherData' : {
                    const toolResult = await getWeatherData(input);
                    console.log(`⚙️ (${functionName}) : ${input}`, toolResult);
                    MESSAGES_DB.push({
                        role: 'user',
                        content : JSON.stringify({
                            step: 'TOOL_OUTPUT',
                            output: toolResult,
                        }),
                    });

                    // MESSAGES_DB.push({role : 'user', content : "now comtinue the process"});

                    // continue;
                } break;
            }
        }

        // Added this so Groq knows it's supposed to continue generating the next step
        MESSAGES_DB.push({ role: 'user', content: "Continue to the next step." });
    }
}
// 
// main('What is 4 + 6 + 9 - 3 * 5');

// main(`what is the weather of rangpur, dhaka, gazipur right now 
//     and write that resukt in a beautiful html css glassmorphic page 
//     and run it on my browser`);
// main(`Build a beautiful, glassmorphic TODO application. 
//     It MUST be contained entirely in a single file called 'todo/index.html'. 
//     It must have a dark gradient background, an input field to add tasks, a way to mark tasks as done, and a delete button for each task. 
//     Use inline CSS and Javascript inside the HTML so no other files are needed. 
//     Do NOT use jQuery, just use vanilla Javascript.
//     After creating the file, run it in my browser using executeCommandOnCli with 'start todo/index.html'.`);

main(`I want to make an website to tell te meaning of like. make a beautiful page with good css wiht the meaning of life and run it on my broswer`)