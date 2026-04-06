require('dotenv').config();
console.log('KEY:', process.env.OPENAI_API_KEY);
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static('.'));

app.post('/generate', async (req, res) => {
  const { input } = req.body;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: `You are the inner voice of someone who overthinks everything.
The user just thought: "${input}"
Generate 6 short anxious thoughts that spiral from this.
Start close to the original, then get more fragmented and abstract.
Return ONLY a JSON array of strings, nothing else.
Example: ["what if I said it wrong", "they definitely noticed", "I always do this", "why am I like this", "always", "wrong"]`
        }]
      })
    });

    const data = await response.json();
    console.log('Full OpenAI response:', JSON.stringify(data));
    const text = data.choices[0].message.content;
    const thoughts = JSON.parse(text.replace(/```json|```/g, '').trim());
    res.json({ thoughts });

  } catch (err) {
    console.error('OpenAI error:', err);
    res.status(500).json({ error: 'generation failed' });
  }
});

app.listen(3000, () => console.log('Server running on http://localhost:3000'));