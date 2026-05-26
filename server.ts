import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import os from 'os';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(os.tmpdir(), 'foryouagency_forms_db.json');

interface FormQuestion {
  id: string;
  type: 'text' | 'textarea' | 'radio' | 'checkbox' | 'select';
  label: string;
  required: boolean;
  options?: string[];
}

interface FormResponse {
  id: string;
  submittedAt: string;
  respondentName: string;
  answers: Record<string, any>;
}

interface DBForm {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  questions: FormQuestion[];
  responses: FormResponse[];
}

function readDB(): DBForm[] {
  try {
    if (!fs.existsSync(DB_PATH)) {
      const defaultForms: DBForm[] = [
        {
          id: 'briefing-social-media',
          title: 'Briefing para Criação de Conteúdo (Social Media)',
          description: 'Responda este briefing para podermos estruturar a estratégia de conteúdo do seu perfil profissional.',
          createdAt: new Date().toISOString(),
          questions: [
            { id: 'q_nome', type: 'text', label: 'Nome Completo', required: true },
            { id: 'q_marca', type: 'text', label: 'Nome da sua Marca ou Empresa', required: true },
            { id: 'q_publico', type: 'textarea', label: 'Quem é o seu público-alvo principal?', required: true },
            { id: 'q_objetivo', type: 'select', label: 'Qual o seu maior objetivo no Instagram hoje?', required: true, options: ['Vender mais produtos ou serviços', 'Ganhar mais seguidores', 'Aumentar autoridade e engajamento', 'Institucional e posicionamento'] },
            { id: 'q_cores', type: 'text', label: 'Quais as cores predominantes da sua marca?', required: false },
            { id: 'q_frequencia', type: 'radio', label: 'Quantas vezes você deseja publicar por semana?', required: true, options: ['3 vezes por semana', '5 vezes por semana', 'Publicações diárias (7 vezes)'] }
          ],
          responses: [
            {
              id: 'resp_1',
              submittedAt: new Date().toISOString(),
              respondentName: 'Carlos Silva (Exemplo)',
              answers: {
                'q_nome': 'Carlos Silva',
                'q_marca': 'Silva Blindagem Patrimonial',
                'q_publico': 'Empresários e donos de posses buscando proteção cambial e sucessória jurídica.',
                'q_objetivo': 'Aumentar autoridade e engajamento',
                'q_cores': 'Azul Marinho, Dourado Gold, Branco Gelo',
                'q_frequencia': '5 vezes por semana'
              }
            }
          ]
        }
      ];
      fs.writeFileSync(DB_PATH, JSON.stringify(defaultForms, null, 2), 'utf-8');
      return defaultForms;
    }
    const data = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading DB:', error);
    return [];
  }
}

function writeDB(data: DBForm[]) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error writing DB:', error);
  }
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // Middleware to support JSON post payloads
  app.use(express.json());

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Login verification
  app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    if (username === 'Foryouagency' && password === 'Foryou@12345') {
      res.json({ success: true, token: 'foryou_session_token_123456789' });
    } else {
      res.status(401).json({ error: 'Login ou senha incorretos. Verifique suas credenciais.' });
    }
  });

  // Fetch summary of all forms (heavy responses field omitted)
  app.get('/api/forms', (req, res) => {
    const db = readDB();
    const summary = db.map(f => ({
      id: f.id,
      title: f.title,
      description: f.description,
      createdAt: f.createdAt,
      responsesCount: f.responses.length
    }));
    res.json(summary);
  });

  // Fetch detailed form (including responses)
  app.get('/api/forms/:id', (req, res) => {
    const db = readDB();
    const form = db.find(f => f.id === req.params.id);
    if (!form) {
      return res.status(404).json({ error: 'Formulário não encontrado.' });
    }
    res.json(form);
  });

  // Delete form
  app.delete('/api/forms/:id', (req, res) => {
    const db = readDB();
    const index = db.findIndex(f => f.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: 'Formulário não encontrado.' });
    }
    db.splice(index, 1);
    writeDB(db);
    res.json({ success: true });
  });

  // Submit client response
  app.post('/api/forms/:id/respond', (req, res) => {
    const { respondentName, answers } = req.body;
    if (!respondentName || !answers) {
      return res.status(400).json({ error: 'Nome do respondente e respostas são obrigatórios.' });
    }

    const db = readDB();
    const form = db.find(f => f.id === req.params.id);
    if (!form) {
      return res.status(404).json({ error: 'Formulário não encontrado.' });
    }

    const newResponse: FormResponse = {
      id: 'resp_' + Math.random().toString(36).substring(2, 11),
      submittedAt: new Date().toISOString(),
      respondentName,
      answers
    };

    form.responses.unshift(newResponse);
    writeDB(db);

    res.json({ success: true, response: newResponse });
  });

  // Create form using Gemini 3.5-flash
  app.post('/api/forms/generate', async (req, res) => {
    const { prompt } = req.body;
    if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
      return res.status(400).json({ error: 'O prompt do formulário é necessário.' });
    }

    try {
      if (!process.env.GEMINI_API_KEY) {
        console.warn("GEMINI_API_KEY is not defined. Falling back to default form builder.");
        const mockForm: DBForm = {
          id: 'form_' + Math.random().toString(36).substring(2, 11),
          title: `Formulário Gerado: ${prompt.length > 50 ? prompt.substring(0, 50) + '...' : prompt}`,
          description: `Formulário gerado de forma simulada para: "${prompt}". Configure a chave GEMINI_API_KEY em Secrets para gerar com IA real.`,
          createdAt: new Date().toISOString(),
          questions: [
            { id: 'q_nome', type: 'text', label: 'Nome Completo', required: true },
            { id: 'q_contato', type: 'text', label: 'WhatsApp / Contato', required: true },
            { id: 'q_desafio', type: 'textarea', label: `Qual o seu principal objetivo ou dúvida sobre: "${prompt}"?`, required: true },
            { id: 'q_prioridade', type: 'radio', label: 'Qual a sua prioridade imediata?', required: true, options: ['Aumentar faturamento rapidamente', 'Organizar processos internos', 'Fortalecer presença de marca', 'Outro de urgência máxima'] },
            { id: 'q_horario', type: 'select', label: 'Qual o melhor período do dia para nosso time agendar uma conversa com você?', required: true, options: ['Manhã (09h às 12h)', 'Tarde (13h às 18h)', 'Outro / Preferência por WhatsApp'] }
          ],
          responses: []
        };

        const db = readDB();
        db.unshift(mockForm);
        writeDB(db);
        return res.json(mockForm);
      }

      const { GoogleGenAI, Type } = await import('@google/genai');
      const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const systemInstruction = 
        "Você é um especialista em marketing, agência digital de posicionamento, marketing de influência e captação automática de clientes. " +
        "Sua tarefa é projetar um formulário focado e estratégico que a agência enviará para seus clientes coletarem briefing/respostas estruturadas de seu projeto. " +
        "As perguntas devem ser altamente profissionais e ajudar o proprietário da agência a extrair as melhores informações para desenhar a estratégia ideal. " +
        "Use estes tipos de perguntas: 'text' (texto curto), 'textarea' (parágrafo longo), 'select' (única escolha por dropdown), 'radio' (botão de escolha única visível) e 'checkbox' (múltiplas caixas de seleção). " +
        "Para os tipos select, radio e checkbox, forneça obrigatoriamente um array 'options' com opções de respostas muito bem elaboradas. " +
        "Sempre inclua Nome Completo, WhatsApp / Nome da Marca como campos obrigatórios logo no início.";

      const userPrompt = `Crie um formulário de briefing ou pesquisa estratégico em Português para o seguinte objetivo: "${prompt}"`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: userPrompt,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { 
                type: Type.STRING, 
                description: "Título curto, preciso e elegante para o formulário. Ex: Briefing de Gestão de Redes Sociais" 
              },
              description: { 
                type: Type.STRING, 
                description: "Pequeno texto de introdução do formulário explicando a importância dele para desenhar o projeto perfeito" 
              },
              questions: {
                type: Type.ARRAY,
                description: "Array com 5 a 8 perguntas de marketing de alto nível",
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING, description: "ID único em minúsculo (ex: q_nome, q_publico, q_investimento)" },
                    type: { 
                      type: Type.STRING, 
                      description: "Deve ser exatamente uma destas strings: 'text', 'textarea', 'radio', 'checkbox', 'select'" 
                    },
                    label: { type: Type.STRING, description: "A pergunta a ser feita de forma clara e instigante. Ex: Qual a sua expectativa de faturamento com este projeto?" },
                    required: { type: Type.BOOLEAN, description: "Indica se a pergunta é obrigatória" },
                    options: {
                      type: Type.ARRAY,
                      description: "Lista de strings elegantes para responder se o tipo for select, radio ou checkbox. Ex: ['Menos de R$2.000', 'R$2.000 a R$5.000', 'Mais de R$5.000']",
                      items: { type: Type.STRING }
                    }
                  },
                  required: ["id", "type", "label", "required"]
                }
              }
            },
            required: ["title", "description", "questions"]
          }
        }
      });

      const parsedData = JSON.parse(response.text || '{}');
      
      const newForm: DBForm = {
        id: 'form_' + Math.random().toString(36).substring(2, 11),
        title: parsedData.title || `Formulário sobre ${prompt}`,
        description: parsedData.description || `Por favor, complete as perguntas com calma para começarmos o planejamento estratégico.`,
        createdAt: new Date().toISOString(),
        questions: parsedData.questions || [],
        responses: []
      };

      const db = readDB();
      db.unshift(newForm);
      writeDB(db);

      res.json(newForm);
    } catch (err) {
      console.error("Gemini invocation failed, using smart fallback:", err);
      const genericForm: DBForm = {
        id: 'form_' + Math.random().toString(36).substring(2, 11),
        title: `Briefing Personalizado: ${prompt}`,
        description: `Formulário estratégico gerado dinamicamente para: "${prompt}".`,
        createdAt: new Date().toISOString(),
        questions: [
          { id: 'q_nome', type: 'text', label: 'Nome Completo', required: true },
          { id: 'q_whatsapp', type: 'text', label: 'WhatsApp com Código de Área', required: true },
          { id: 'q_sobre_empresa', type: 'textarea', label: 'Nos fale um pouco mais sobre o seu negócio, produto ou serviço.', required: true },
          { id: 'q_necessidade', type: 'textarea', label: `Qual a sua maior necessidade em relação a "${prompt}" no momento?`, required: true },
          { id: 'q_foco', type: 'radio', label: 'Como você mede o sucesso do seu perfil?', required: true, options: ['Mais mensagens de clientes no direct/whatsapp', 'Maior engajamento e visualizações', 'Estética e visual 100% profissional', 'Outro'] }
        ],
        responses: []
      };

      const db = readDB();
      db.unshift(genericForm);
      writeDB(db);
      res.json(genericForm);
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    // Development mode
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production mode
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    
    // Serve index.html for all other requests (SPA support)
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
