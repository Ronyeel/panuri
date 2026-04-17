import { useState, useEffect } from 'react';
import './MascotBubble.css';

export default function MascotBubble({ mode }) {
  const [greeting, setGreeting] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchGreeting() {
      try {
        const apiKey = import.meta.env.VITE_GROQ_API_KEY;
        if (!apiKey) {
          throw new Error('No API key');
        }

        const hour = new Date().getHours();
        let timeGreeting = 'Magandang Araw';
        if (hour < 12) timeGreeting = 'Magandang Umaga';
        else if (hour < 18) timeGreeting = 'Magandang Hapon';
        else timeGreeting = 'Magandang Gabi';

        const prompt = `You are PANURI, the wise and friendly owl mascot for an interactive Philippine literature analysis web application. 
        Your goal is to greet the user and randomly say something interesting about the website or literature analysis.
        The current time is ${timeGreeting}. You must use this appropriate greeting to start your sentence.
        The website features tools like "Talahanungan" (Questionnaires), "Pagsusuri" (Analysis), and "Mas Pinaunlad na Pamantayan" (Improved Standardized Criteria) for literature.
        The current page the user is on is the "${mode === 'login' ? 'Login' : 'Registration'}" page.
        
        Write exactly ONE short, conversational sentence in Tagalog. Make it random and engaging. Do not use quotes.`;

        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: 'llama3-8b-8192',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.7,
            max_tokens: 50
          })
        });
        
        const data = await res.json();
        if (data.choices && data.choices.length > 0) {
          setGreeting(data.choices[0].message.content.replace(/"/g, ''));
        } else {
          throw new Error('Invalid response');
        }
      } catch (e) {
        console.error('Groq API error:', e);
        // Fallback greetings if API fails or key is missing
        const hour = new Date().getHours();
        let timeGreeting = 'Magandang Araw';
        if (hour < 12) timeGreeting = 'Magandang Umaga';
        else if (hour < 18) timeGreeting = 'Magandang Hapon';
        else timeGreeting = 'Magandang Gabi';

        setGreeting(mode === 'login' 
          ? `${timeGreeting}! Mag-login upang magpatuloy sa iyong pagsusuri.` 
          : `${timeGreeting}! Halika at tayo ay magsuri.`
        );
      } finally {
        setLoading(false);
      }
    }

    fetchGreeting();
  }, [mode]);

  return (
    <div className="mascot-bubble-container">
      <img src="/mascot.png" alt="Panuri Mascot" className="auth-hero-mascot" />
      <div className="mascot-speech-bubble">
        <h4 className="mascot-bubble-name">Panuri</h4>
        <p className="mascot-bubble-text">
          {loading ? (
            <span className="mascot-typing">Nag-iisip<span>.</span><span>.</span><span>.</span></span>
          ) : (
            greeting
          )}
        </p>
      </div>
    </div>
  );
}
