require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });
const { callGroq } = require('./server/services/groq');
const { buildChatPrompt } = require('./server/services/promptBuilder');

async function test() {
  try {
    const messages = buildChatPrompt("Hello!", "Weight loss", []);
    const reply = await callGroq(messages);
    console.log("Success:", reply);
  } catch (err) {
    console.error("Failed:", err.message);
  }
}
test();
