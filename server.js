const express = require('express');
// Use global fetch if available (Node 18+), otherwise lazy-load node-fetch (ESM default)
const fetch = globalThis.fetch || ((...args) => import('node-fetch').then(({ default: f }) => f(...args)));

const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-1.5-flash';

const extractFirstJsonObject = (input) => {
  if (!input) return null;
  let text = String(input).trim();

  // Remove markdown code fences if present
  text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();

  const firstBrace = text.indexOf('{');
  if (firstBrace === -1) return null;

  let depth = 0;
  let inString = false;
  let escape = false;
  for (let i = firstBrace; i < text.length; i++) {
    const ch = text[i];
    if (inString) {
      if (escape) {
        escape = false;
      } else if (ch === '\\') {
        escape = true;
      } else if (ch === '"') {
        inString = false;
      }
      continue;
    }

    if (ch === '"') {
      inString = true;
      continue;
    }
    if (ch === '{') depth += 1;
    if (ch === '}') depth -= 1;
    if (depth === 0) {
      return text.slice(firstBrace, i + 1);
    }
  }

  return null;
};

const parseAiJson = (rawText, providerName) => {
  const jsonText = extractFirstJsonObject(rawText);
  if (!jsonText) {
    throw new Error(`${providerName} returned no JSON object`);
  }
  try {
    return JSON.parse(jsonText);
  } catch (e) {
    throw new Error(`${providerName} JSON parse failed: ${String(e?.message || e)}`);
  }
};

// Middleware
app.use(cors());
app.use(express.json());

// Arduino connection
let arduinoPort = null;
let parser = null;

const connectArduino = async () => {
  try {
    const port = process.env.ARDUINO_PORT;
    if (!port) {
      console.log('ARDUINO_PORT not set. Skipping Arduino serial connection (expected for Android Bluetooth mode).');
      return;
    }
    arduinoPort = new SerialPort({
      path: port,
      baudRate: parseInt(process.env.BAUD_RATE) || 9600,
    });
    
    parser = arduinoPort.pipe(new ReadlineParser({ delimiter: '\n' }));
    
    parser.on('data', (data) => {
      console.log('Arduino:', data);
    });
    
    arduinoPort.on('error', (err) => {
      console.error('Arduino Error:', err.message);
    });
    
    console.log('Connected to Arduino on', port);
  } catch (error) {
    console.error('Failed to connect to Arduino:', error.message);
  }
};

// Initialize Arduino connection
connectArduino();

// AI Service Integration (prefers Gemini if configured, otherwise OpenAI)
const analyzeGraphQuestion = async (question) => {
  const prompt = `
    Analyze this graph question and provide detailed plotting information:
    
    Question: "${question}"
    
    Provide the following in JSON format:
    {
      "graphType": "linear/quadratic/cubic/trigonometric/etc",
      "equation": "the mathematical equation",
      "xRange": {"min": value, "max": value},
      "yRange": {"min": value, "max": value},
      "scale": {"x": value, "y": value},
      "plottingPoints": [{"x": value, "y": value}],
      "shadingRegions": [{"type": "above/below/between", "bounds": [...]}],
      "a4Scale": {"xScale": value, "yScale": value, "origin": {"x": value, "y": value}},
      "workings": "MULTI-LINE explanation with headings and bullet points. Use newlines. Prefer format like: 'Interpretation:' then '- ...' lines; 'Ranges:' then '- ...'; 'A4 scale choice:' then '1. ...'",
      "tables": [
        {
          "title": "Table of values (optional)",
          "columns": ["x", "y"],
          "rows": [[-2, 1], [-1, 3], [0, 5]]
        }
      ]
    }
    
    Consider A4 paper dimensions (210mm x 297mm) and provide appropriate scaling.
    If the question involves simultaneous equations or multiple lines/curves, include a separate table for each equation or each line as needed.
    Return only valid JSON.
  `;

  // Prefer Gemini if configured
  if (GEMINI_API_KEY) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(GEMINI_MODEL)}:generateContent?key=${GEMINI_API_KEY}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: prompt }]
            }
          ]
        })
      });
      const data = await response.json();
      if (!response.ok) {
        console.error('Gemini API error:', data);
        const message = data?.error?.message || `Gemini API error (status ${response.status})`;
        throw new Error(message);
      }
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || data?.candidates?.[0]?.output || '';
      if (!text) throw new Error('Empty response from Gemini');
      return parseAiJson(text, 'Gemini');
    } catch (err) {
      console.error('Gemini Analysis Error:', err);
      throw err;
    }
  }

  // Fallback to OpenAI
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('AI API key not configured');
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 1000,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('OpenAI API error:', data);
      const message = data?.error?.message || `OpenAI API error (status ${response.status})`;
      throw new Error(message);
    }

    const aiResponse = data?.choices?.[0]?.message?.content;
    if (!aiResponse) {
      throw new Error('Empty response from AI');
    }

    return parseAiJson(aiResponse, 'OpenAI');
  } catch (error) {
    console.error('AI Analysis Error:', error);
    throw error;
  }
};

// Routes
app.post('/api/analyze', async (req, res) => {
  try {
    const { question } = req.body;
    
    if (!question) {
      return res.status(400).json({ error: 'Question is required' });
    }
    
    const analysis = await analyzeGraphQuestion(question);
    res.json(analysis);
  } catch (error) {
    console.error('Analysis Error:', error);
    res.status(500).json({ error: 'Failed to analyze question', details: String(error?.message || error) });
  }
});

app.post('/api/send-to-arduino', (req, res) => {
  try {
    const { plottingData } = req.body;
    
    if (!arduinoPort || !arduinoPort.isOpen) {
      return res.status(500).json({ error: 'Arduino not connected' });
    }
    
    // Convert plotting data to Arduino commands
    const commands = generateArduinoCommands(plottingData);
    
    // Send commands to Arduino
    commands.forEach(cmd => {
      arduinoPort.write(cmd + '\n');
    });
    
    res.json({ success: true, commandsSent: commands.length });
  } catch (error) {
    console.error('Arduino Communication Error:', error);
    res.status(500).json({ error: 'Failed to send data to Arduino' });
  }
});

const generateArduinoCommands = (data) => {
  const commands = [];
  
  // Initialize plotter
  commands.push('INIT');
  
  // Set scale for A4 paper
  commands.push(`SCALE ${data.a4Scale.xScale},${data.a4Scale.yScale}`);
  
  // Calculate axis endpoints based on ranges
  const xMin = data.xRange?.min || -5;
  const xMax = data.xRange?.max || 5;
  const yMin = data.yRange?.min || -5;
  const yMax = data.yRange?.max || 5;
  
  const originX = data.a4Scale.origin.x;
  const originY = data.a4Scale.origin.y;
  
  // --- DRAW VERTICAL Y-AXIS ---
  // Move to top of Y-axis (pen up)
  commands.push(`MOVE ${originX},${yMax}`);
  // Draw down to origin
  commands.push('PEN_DOWN');
  commands.push(`MOVE ${originX},${originY}`);
  // Continue to bottom if needed
  if (yMin < 0) {
    commands.push(`MOVE ${originX},${yMin}`);
  }
  commands.push('PEN_UP');
  
  // --- DRAW HORIZONTAL X-AXIS ---
  // Move to left of X-axis (pen up)
  commands.push(`MOVE ${xMin},${originY}`);
  // Draw right to origin
  commands.push('PEN_DOWN');
  commands.push(`MOVE ${originX},${originY}`);
  // Continue to right end
  commands.push(`MOVE ${xMax},${originY}`);
  commands.push('PEN_UP');
  
  // --- PLOT THE GRAPH CURVE ---
  // Move to first point (pen up)
  if (data.plottingPoints && data.plottingPoints.length > 0) {
    commands.push(`MOVE ${data.plottingPoints[0].x},${data.plottingPoints[0].y}`);
    // Draw the curve
    commands.push('PEN_DOWN');
    data.plottingPoints.forEach((point) => {
      commands.push(`MOVE ${point.x},${point.y}`);
    });
  }
  
  // Handle shading if needed
  if (data.shadingRegions && data.shadingRegions.length > 0) {
    data.shadingRegions.forEach(region => {
      commands.push(`SHADE ${region.type},${region.bounds.join(',')}`);
    });
  }
  
  // Lift pen and return home
  commands.push('PEN_UP');
  commands.push('HOME');
  
  return commands;
};

// Root route for API status
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    service: 'moHFoS Plotter API',
    version: '2.0',
    endpoints: {
      analyze: 'POST /api/analyze',
      sendToArduino: 'POST /api/send-to-arduino'
    }
  });
});

app.listen(PORT, () => {
  console.log(`moHFoS Plotter API server running on port ${PORT}`);
});
