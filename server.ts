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
  section?: string;
  placeholder?: string;
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

function tryParseStructuredPrompt(prompt: string): DBForm | null {
  const lines = prompt.split('\n');
  
  // Identify potential section headers
  const sectionHeaders: { index: number; title: string }[] = [];
  
  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    // Match headers like: "### 1. Title", "## 12. Title", "1. Title", "**1. Title**", etc.
    const match = trimmed.match(/^(?:#+\s*)?(?:\*\*)?(\d+)\.\s*(.*?)(?:\*\*)?:?$/);
    if (match) {
      const num = parseInt(match[1], 10);
      const name = match[2].trim().replace(/\*\*|#|_/g, '').trim();
      if (name.length > 2) {
        sectionHeaders.push({
          index: idx,
          title: `${num}. ${name}`
        });
      }
    }
  });

  // If we couldn't find at least 3 sections, return null to fallback to Gemini
  if (sectionHeaders.length < 3) {
    return null;
  }

  // Slice lines into sections
  const sections: { title: string; text: string }[] = [];
  for (let i = 0; i < sectionHeaders.length; i++) {
    const startIdx = sectionHeaders[i].index;
    const endIdx = (i + 1 < sectionHeaders.length) ? sectionHeaders[i + 1].index : lines.length;
    const secLines = lines.slice(startIdx + 1, endIdx);
    sections.push({
      title: sectionHeaders[i].title,
      text: secLines.join('\n')
    });
  }

  // Extract Title from before the first section
  let title = "QUESTIONÁRIO DE CONFIGURAÇÃO DE IA";
  const titleBeforeFirstSecLines = lines.slice(0, sectionHeaders[0].index);
  
  for (const line of titleBeforeFirstSecLines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('#')) {
      const cleanH = trimmed.replace(/^#+\s*/, '').replace(/\*\*|_/g, '').trim();
      if (cleanH.length > 10) {
        title = cleanH;
        break;
      }
    } else if (trimmed.toUpperCase() === trimmed && trimmed.length > 12 && !trimmed.includes('---')) {
      title = trimmed.replace(/\*\*|_/g, '').trim();
      break;
    }
  }

  if (title === "QUESTIONÁRIO DE CONFIGURAÇÃO DE IA") {
    for (const line of titleBeforeFirstSecLines) {
      const trimmed = line.trim();
      if (trimmed.toLowerCase().includes('questionário') || trimmed.toLowerCase().includes('briefing')) {
        title = trimmed.replace(/\*\*|#|---/g, '').trim();
        break;
      }
    }
  }

  // Description is whatever text is before the first section and not the title
  let descriptionParts: string[] = [];
  for (const line of titleBeforeFirstSecLines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed !== title && !trimmed.startsWith('---') && !trimmed.toLowerCase().includes('questionário')) {
      descriptionParts.push(trimmed);
    }
  }
  const description = descriptionParts.join('\n\n') || "Por favor, complete as perguntas de briefing com o máximo de detalhes possível.";

  const parsedQuestions: FormQuestion[] = [];

  sections.forEach((sec, sIdx) => {
    // We split by "Resposta:" or "Resposta :" or "Respostas:" with case-insensitivity
    const blocksText = sec.text.split(/Resposta\s*:/gi);
    
    blocksText.forEach((block, bIdx) => {
      let trimmedBlock = block.trim();
      if (!trimmedBlock) return;
      
      // If it's the last block and it's tiny, skip it (usually trailing lines or HR lines)
      if (bIdx === blocksText.length - 1 && trimmedBlock.length < 5) {
        return;
      }

      // Clean up markdown horizontal lines and other list symbols from start and end
      trimmedBlock = trimmedBlock.replace(/^[\s\-*_#]+|[\s\-*_#]+$/g, '').trim();
      if (!trimmedBlock) return;

      // Skip lines that are just raw header delimiters
      if (trimmedBlock === '---' || trimmedBlock.startsWith('###') || trimmedBlock.startsWith('##')) {
        return;
      }

      // We have a question block!
      const blockLines = trimmedBlock.split('\n').map(l => l.trim()).filter(l => l.length > 0);
      if (blockLines.length === 0) return;

      // Parse bullet options
      const options: string[] = [];
      const bullets = blockLines.filter(l => l.match(/^[*•-]\s+(.+)/) || l.match(/^\d+\.\s+(.+)/));
      
      const hasOptionsKeyword = trimmedBlock.toLowerCase().includes('opções:') || trimmedBlock.toLowerCase().includes('opções disponíveis:');
      const isSelectableTypeList = trimmedBlock.toLowerCase().includes('quais regiões') || trimmedBlock.toLowerCase().includes('tom de voz') || trimmedBlock.toLowerCase().includes('opções:');
      const containsConfirmExamples = trimmedBlock.toLowerCase().includes('exemplos para confirmar') || trimmedBlock.toLowerCase().includes('exemplos:');

      if (bullets.length > 0 && (hasOptionsKeyword || isSelectableTypeList || containsConfirmExamples)) {
        bullets.forEach(bullet => {
          const match = bullet.match(/^[*•-]\s+(.+)$/) || bullet.match(/^\d+\.\s+(.+)$/);
          if (match && match[1]) {
            const cleanOpt = match[1].replace(/\*\*|_/g, '').trim();
            if (cleanOpt.length > 1) {
              options.push(cleanOpt);
            }
          }
        });
      }

      // Find placeholder/suggestion
      let placeholder: string | undefined = undefined;
      const quoteMatch = trimmedBlock.match(/[“"']([^”"'\n\r]{8,})[”"']/);
      if (quoteMatch) {
         placeholder = quoteMatch[1].trim();
      } else {
        const sugIdx = blockLines.findIndex(l => l.toLowerCase().includes('sugestão') || l.toLowerCase().includes('exemplo:'));
        if (sugIdx !== -1 && sugIdx + 1 < blockLines.length) {
          const nextLines = blockLines.slice(sugIdx + 1);
          const cleanSug = nextLines[0].replace(/^[“"']|[”"']$/g, '').trim();
          if (cleanSug && !cleanSug.startsWith('*') && !cleanSug.startsWith('-') && cleanSug.length > 8) {
            placeholder = cleanSug;
          }
        }
      }

      // Build label logic
      // Find where question labels end (which is before bullet lists, options or suggestions)
      let labelLines: string[] = [];
      for (const line of blockLines) {
        const lowerLine = line.toLowerCase();
        if (
          lowerLine.startsWith('sugestão') || 
          lowerLine.startsWith('exemplo:') || 
          lowerLine.startsWith('exemplos') || 
          lowerLine.startsWith('opções:') || 
          line.startsWith('*') || 
          line.startsWith('-') || 
          line.match(/^\d+\.\s+/)
        ) {
          break;
        }
        labelLines.push(line);
      }

      let label = labelLines.join(' ').trim();
      if (!label) {
        label = blockLines[0];
      }

      // Clean label
      label = label.replace(/\*\*|_|#|^-/g, '').trim();
      if (label.endsWith(':')) {
        label = label.slice(0, -1).trim();
      }

      // Avoid creating empty or non-helpful question labels
      if (label.length < 4 || label.toLowerCase() === 'resposta' || label.toLowerCase() === 'respostas') {
        return;
      }

      // Determine type
      let type: 'text' | 'textarea' | 'radio' | 'checkbox' | 'select' = 'text';
      const labelLower = label.toLowerCase();
      
      if (options.length > 0) {
        const isCheckbox = labelLower.includes('quais') || 
                           labelLower.includes('quais são') || 
                           labelLower.includes('selecione') || 
                           labelLower.includes('marcar mais') || 
                           labelLower.includes('caixas de seleção') || 
                           labelLower.includes('pacientes mais') || 
                           labelLower.includes('quais perguntas') || 
                           labelLower.includes('cuidados a paciente') || 
                           labelLower.includes('quais regiões') || 
                           labelLower.includes('contraindicações') || 
                           labelLower.includes('com quais dias') || 
                           labelLower.includes('formas de pagamento') || 
                           labelLower.includes('exemplos para confirmar') || 
                           labelLower.includes('deseja que a ia faça');
        type = isCheckbox ? 'checkbox' : 'radio';
      } else {
        const isTextarea = labelLower.includes('explique') || 
                           labelLower.includes('descreva') || 
                           labelLower.includes('como a ia deve') || 
                           labelLower.includes('como você gostaria') || 
                           labelLower.includes('como você explica') || 
                           labelLower.includes('como funciona') || 
                           labelLower.includes('qual a política') || 
                           labelLower.includes('valores do tratamento') || 
                           labelLower.includes('observações finais') || 
                           labelLower.includes('observações importantes') || 
                           labelLower.includes('escreva as respostas') || 
                           labelLower.includes('alguma orientação') || 
                           labelLower.includes('qual o valor') || 
                           labelLower.includes('casos específicos') || 
                           labelLower.includes('diferencial do seu protocolo') || 
                           labelLower.includes('alguma frase específica') || 
                           label.length > 50;
        type = isTextarea ? 'textarea' : 'text';
      }

      const id = `q_sec${sIdx + 1}_` + Math.random().toString(36).substring(2, 8);
      
      const isSec1 = sec.title.startsWith("1.") || sec.title.toLowerCase().includes("informações");
      const containsOptional = labelLower.includes('se houver') || labelLower.includes('caso possua') || labelLower.includes('opcional');
      const required = isSec1 ? !containsOptional : (!containsOptional && (
        labelLower.includes('nome') || 
        labelLower.includes('telefone') || 
        labelLower.includes('oficial') || 
        labelLower.includes('objetivo') || 
        labelLower.includes('qual será') || 
        labelLower.includes('precisa passar por avaliação') || 
        labelLower.includes('contraindicações') || 
        labelLower.includes('quais dias') || 
        labelLower.includes('tom de voz') || 
        labelLower.includes('atendimento humano') || 
        labelLower.includes('como você explica') || 
        labelLower.includes('possui valor fixo') || 
        labelLower.includes('formas de pagamento')
      ));

      parsedQuestions.push({
        id,
        type,
        label,
        required,
        options: options.length > 0 ? options : undefined,
        section: sec.title,
        placeholder
      });
    });
  });

  const finalQuestions = parsedQuestions.filter(q => q.label.length > 3);
  if (finalQuestions.length < 5) return null;

  return {
    id: 'form_' + Math.random().toString(36).substring(2, 11),
    title,
    description,
    createdAt: new Date().toISOString(),
    questions: finalQuestions,
    responses: []
  };
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

    // If Gemini API Key is available, prioritize high-fidelity parsing with the AI Model.
    // Otherwise, fallback to the offline programmatic parser first, or the mock generator.
    if (!process.env.GEMINI_API_KEY) {
      console.warn("GEMINI_API_KEY is not defined. Falling back to structured programmatic parser or mock generator.");
      const structuredForm = tryParseStructuredPrompt(prompt);
      if (structuredForm) {
        console.log("Structured prompt detected. Processing programmatically with 100% fidelity.");
        const db = readDB();
        db.unshift(structuredForm);
        writeDB(db);
        return res.json(structuredForm);
      }

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

    try {

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
        "Você é um engenheiro de formulários estratégico e especialista em marketing e automação por IA com extrema atenção ao tom de voz, detalhes e exigências de conformidade. " +
        "Sua tarefa é analisar o prompt do usuário e gerar a estrutura completa do formulário em formato JSON. " +
        "Se o usuário enviou um roteiro estruturado detalhado (por exemplo, com seções de 1 a N, perguntas e opções de resposta exatas, observações e sugestões de caixa de texto ou área de texto), você DEVE " +
        "reproduzir, estruturar e redigir esse roteiro de forma extremamente fiel, inteligente, profissional e COMPLETA, sem resumir, cortar ou omitir perguntas ou seções. " +
        "Mantenha uma linguagem acolhedora, discreta e elegante se o tema for sensível. " +
        "As perguntas devem seguir exatamente as diretrizes de tipo do usuário. Se omitido, use inteligência baseada no contexto para definir: " +
        "- 'text': para respostas curtas, nomes, valores, contatos. " +
        "- 'textarea': para parágrafos, explicações ricas, relatos de experiências ou sugestões de modelos a serem editados pelo usuário. " +
        "- 'radio': para múltipla escolha com opções predefinidas (escolha única visível). " +
        "- 'checkbox': para caixas de seleção com opções predefinidas (escolha de um ou mais itens). " +
        "- 'select': para dropdown de escolha simples. " +
        "Configure no campo 'section' o título completo da seção de agrupamento para cada pergunta (por exemplo: '1. Informações da profissional ou clínica', '2. Objetivo da IA de atendimento', '3. Sobre o procedimento de clareamento íntimo', etc.). " +
        "No campo 'placeholder', inclua sempre textos de apoio, exemplos práticos de redação sugerida ou sugestões de respostas editáveis solicitadas pelo usuário para guiar quem está respondendo.";

      const userPrompt = 
        `Seja extremamente preciso e reproduza tudo com fidelidade absoluta. Se o texto a seguir for um roteiro ou rascunho de perguntas estruturadas comercial, transcreva ele integralmente sem resumir nenhuma pergunta ou seção. ` +
        `Caso seja apenas um pedido genérico ou um conceito simples (Ex: 'briefing comercial imobiliário'), elabore um briefing de marketing completo correspondente com 10 a 15 perguntas estrategicamente divididas em seções úteis.\n\n` +
        `Texto do Usuário:\n"${prompt}"`;

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
                description: "O título exato, completo e elegante para o formulário conforme solicitado ou extraído do prompt. Ex: QUESTIONÁRIO PARA CONFIGURAÇÃO DA IA DE ATENDIMENTO — CLAREAMENTO ÍNTIMO" 
              },
              description: { 
                type: Type.STRING, 
                description: "Texto de introdução e objetivo do formulário focado no negócio do cliente, explicando acolhedoramente por que estas respostas são cruciais." 
              },
              questions: {
                type: Type.ARRAY,
                description: "A lista de perguntas ordenada de forma a mapear fielmente TODAS as seções e perguntas especificadas pelo usuário sem qualquer corte ou simplificação.",
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING, description: "ID único em minúsculo com prefixo correspondente à seção (ex: q_sec1_nome, q_sec2_objetivo, q_sec3_regiao_tratar)" },
                    type: { 
                      type: Type.STRING, 
                      description: "Deve ser exatamente uma destas strings: 'text', 'textarea', 'radio', 'checkbox', 'select'" 
                    },
                    label: { type: Type.STRING, description: "A pergunta a ser feita de forma clara, acolhedora e instigante." },
                    required: { type: Type.BOOLEAN, description: "Indica se o campo é obrigatório (especialmente para dados cruciais como identificação, telefone e informações essenciais da operação)." },
                    options: {
                      type: Type.ARRAY,
                      description: "Lista de opções de strings ricas para responder se o tipo for select, radio ou checkbox.",
                      items: { type: Type.STRING }
                    },
                    section: {
                      type: Type.STRING,
                      description: "O título completo da seção do formulário em que esta pergunta está inserida (ex: '3. Sobre o procedimento de clareamento íntimo'). Isso é obrigatório para todas as perguntas agrupadas."
                    },
                    placeholder: {
                      type: Type.STRING,
                      description: "Indicação de resposta sugerida, orientação do que responder ou exemplo editável fornecido pelo usuário."
                    }
                  },
                  required: ["id", "type", "label", "required", "section"]
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
