const testChat = async () => {
  const response = await fetch("http://localhost:3000/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages: [
        { role: "user", content: "hello" },
        { role: "assistant", content: "Haanji!" },
        { role: "user", content: "i dont understand react" }
      ],
      personaId: "hitesh",
    }),
  });

  console.log("Status:", response.status);
  const text = await response.text();
  console.log("Response:", text);
};
testChat();
