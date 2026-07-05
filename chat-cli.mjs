import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const askQuestion = (query) => new Promise((resolve) => rl.question(query, resolve));

const chatCLI = async () => {
  console.log("🚀 Starting Interactive Chat CLI");
  console.log("Type 'exit' to quit.\n");
  
  let personaId = await askQuestion("Choose persona (hitesh or piyush) [default: hitesh]: ");
  personaId = personaId.trim().toLowerCase() || "hitesh";
  
  if (personaId !== "hitesh" && personaId !== "piyush") {
    console.log("Invalid persona. Defaulting to hitesh.");
    personaId = "hitesh";
  }

  console.log(`\nChatting with ${personaId === 'hitesh' ? 'Hitesh Choudhary' : 'Piyush Garg'}!`);
  console.log("--------------------------------------------------\n");

  const messages = [];

  while (true) {
    const userInput = await askQuestion(`You: `);
    if (userInput.trim().toLowerCase() === 'exit') {
        console.log("Goodbye!");
        break;
    }
    
    messages.push({ role: "user", content: userInput });

    try {
      const response = await fetch("http://localhost:3000/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: messages,
          personaId: personaId,
          provider: "groq", // Change this if you switch to OpenAI/Google later
        }),
      });

      if (!response.ok) {
        console.error("❌ API Error:", response.status, await response.text());
        continue;
      }

      process.stdout.write(`\n${personaId === 'hitesh' ? 'Hitesh' : 'Piyush'}: `);
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let done = false;
      let assistantMessage = "";

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          const chunk = decoder.decode(value, { stream: true });
          process.stdout.write(chunk);
          assistantMessage += chunk;
        }
      }
      
      messages.push({ role: "assistant", content: assistantMessage });
      console.log("\n\n--------------------------------------------------");

    } catch (error) {
      console.error("❌ Failed to connect:", error.message);
    }
  }

  rl.close();
};

chatCLI();
