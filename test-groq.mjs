process.loadEnvFile('.env.local');

const testGroq = async () => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    console.error("No API key found in .env.local!");
    return;
  }

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "llama-3.1-8b-instant",
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: "hello" },
        { role: "assistant", content: "Hello! How can I help you?" },
        { role: "user", content: "i dont understand react" }
      ]
    })
  });

  const json = await response.json();
  console.log(JSON.stringify(json, null, 2));
};

testGroq();
