async function callGroq(messages, temperature = 0.3) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 seconds timeout

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama3-70b-8192',
        messages: messages,
        temperature: temperature,
        max_tokens: 512
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      if (response.status === 401) throw new Error('Authentication error');
      if (response.status === 429) {
        const err = new Error('Rate limit reached, retry shortly');
        err.status = 429;
        throw err;
      }
      if (response.status === 500 || response.status === 503) {
        const err = new Error('AI service temporarily unavailable');
        err.status = 503;
        throw err;
      }
      const responseData = await response.text();
      throw new Error(`Groq API error: ${response.status} - ${responseData}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (err) {
    if (err.name === 'AbortError') {
      const e = new Error('Request timed out');
      e.status = 504;
      throw e;
    }
    if (!err.status) err.status = 500;
    throw err;
  }
}

module.exports = {
  callGroq
};
