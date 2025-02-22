require("dotenv").config();
const { Client } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Initialize Google Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Initialize WhatsApp Client
const client = new Client();

client.on("qr", (qr) => {
  qrcode.generate(qr, { small: true });
});

client.on("ready", () => {
  console.log("WhatsApp Bot is ready!");
});

// Custom Commands
const commands = {
  "hello": "Hey there! How’s your day going?",
  "help": "Available commands:\n1. *!hello* - Greetings\n2. *!help* - List commands\n3. *!quote* - Get inspiration\n4. *!status* - Check bot status\n5. *!mood* - Get a random mood message\n6. *!fact* - Get a cool fact",
  "quote": "“Success is not the key to happiness. Happiness is the key to success.” - Albert Schweitzer",
  "status": "I'm up and running! What do you need help with?",
  "mood": "Feeling awesome today! Hope you are too!",
  "fact": "Did you know? Honey never spoils! Archaeologists have found pots of honey in ancient Egyptian tombs that are over 3000 years old and still perfectly good to eat."
};

// Function to Get AI Response
async function getAIResponse(userMessage) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [{ text: userMessage }],
        },
      ],
    });

    const reply = result.response.candidates[0]?.content?.parts[0]?.text.trim();
    return reply + "\n\n(PS: Let me know if you need anything else!)";
  } catch (error) {
    console.error("Gemini AI Error:", error);
    return "Oops! Something went wrong on my end. Try again?";
  }
}

// Listen for Messages
client.on("message", async (msg) => {
  console.log("Message received:", msg.body);

  const chatId = msg.from;
  const message = msg.body.toLowerCase();
  let reply = "";

  // Check for predefined commands
  if (commands[message]) {
    reply = commands[message];
  } 
  // Check for AI command
  else if (message.startsWith("!ask ")) {
    const question = message.replace("!ask ", "").trim();
    if (question) {
      reply = await getAIResponse(question);
    } else {
      reply = "You forgot to ask something after !ask.";
    }
  } 
  // Default response (AI-generated)
  else {
    reply = await getAIResponse(message);
  }

  // Send message and log response
  client.sendMessage(chatId, reply);
  console.log(`Replied: ${reply}`);
});

client.initialize();
