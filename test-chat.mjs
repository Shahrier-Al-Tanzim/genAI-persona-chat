const testChat = async () => {
  console.log("🚀 Testing Chat API with Hitesh Persona...");

  try {
    const response = await fetch("http://localhost:3000/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: [{ role: "user", content: "Hello" }],
        personaId: "hitesh",
        provider: "groq",
      }),
    });

    console.log("Status:", response.status);
    console.log("Headers:");
    for (let [key, value] of response.headers.entries()) {
      console.log(`  ${key}: ${value}`);
    }

    const text = await response.text();
    console.log("Response Text:");
    console.log(text);
  } catch (error) {
    console.error("❌ Failed to fetch:", error.message);
  }
};

testChat();
