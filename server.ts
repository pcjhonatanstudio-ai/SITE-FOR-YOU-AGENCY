import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import os from 'os';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OLD_DB_PATH = path.join(os.tmpdir(), 'foryouagency_forms_db.json');
const DB_PATH = path.join(process.cwd(), 'foryouagency_forms_db.json');

interface FormQuestion {
  id: string;
  type: 'text' | 'textarea' | 'radio' | 'checkbox' | 'select';
  label: string;
  required: boolean;
  options?: string[];
  section?: string;
  placeholder?: string;
  description?: string;
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
    // Migration: if persistent DB doesn't exist but the old temp one does, migrate it
    if (!fs.existsSync(DB_PATH) && fs.existsSync(OLD_DB_PATH)) {
      try {
        const oldData = fs.readFileSync(OLD_DB_PATH, 'utf-8');
        fs.writeFileSync(DB_PATH, oldData, 'utf-8');
        console.log('Successfully migrated database from ephemeral tmp folder to persistent workspace folder.');
      } catch (migrateErr) {
        console.error('Migration failed:', migrateErr);
      }
    }

    if (!fs.existsSync(DB_PATH)) {
      const defaultForms: DBForm[] = []; // No demo forms!
      fs.writeFileSync(DB_PATH, JSON.stringify(defaultForms, null, 2), 'utf-8');
      return defaultForms;
    }
    const data = fs.readFileSync(DB_PATH, 'utf-8');
    let forms = JSON.parse(data) as DBForm[];
    
    // Completely remove old briefing-social-media demo form to respect: 'não quero que tenha formularios demo'
    const filteredForms = forms.filter(f => f.id !== 'briefing-social-media');
    if (filteredForms.length !== forms.length) {
      fs.writeFileSync(DB_PATH, JSON.stringify(filteredForms, null, 2), 'utf-8');
    }
    return filteredForms;
  } catch (error) {
    console.error('Error reading DB:', error);
    return [];
  }
}

function writeDB(data: DBForm[]) {
  try {
    const filtered = data.filter(f => f.id !== 'briefing-social-media');
    fs.writeFileSync(DB_PATH, JSON.stringify(filtered, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error writing DB:', error);
  }
}

function tryParseStructuredPrompt(prompt: string): DBForm | null {
  const lines = prompt.split('\n');
  const isPureWrittenQuestionnaire = (prompt.match(/resposta/gi) || []).length > 5;
  
  // Extract Section Headers
  const sectionHeaders: { index: number; title: string }[] = [];
  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    // Match headers like "### 1. Title", "1. Title", "**1. Title**", "14. Pagamentos e sinal" etc.
    const match = trimmed.match(/^(?:#+\s*)?(?:\*\*)?(\d+)\.\s*(.*?)(?:\*\*)?:?$/);
    if (match) {
      const num = parseInt(match[1], 10);
      const name = match[2].trim().replace(/\*\*|#|_/g, '').trim();
      
      const containsQuestionIndicator = trimmed.includes('?') || 
                                        name.toLowerCase().includes('qual') || 
                                        name.toLowerCase().includes('quais') || 
                                        name.toLowerCase().includes('como') || 
                                        name.toLowerCase().includes('existe') || 
                                        name.toLowerCase().includes('onde') || 
                                        name.toLowerCase().includes('você') || 
                                        name.toLowerCase().includes('se ') ||
                                        name.toLowerCase().includes('a ia');
      
      // If pure written questionnaire is active, section headers MUST start with a markdown header '#'
      const hasHeaderPrefix = trimmed.startsWith('#');
      
      if (name.length > 2) {
        if (isPureWrittenQuestionnaire) {
          if (hasHeaderPrefix && !containsQuestionIndicator) {
            sectionHeaders.push({
              index: idx,
              title: `${num}. ${name}`
            });
          }
        } else {
          if (!containsQuestionIndicator) {
            sectionHeaders.push({
              index: idx,
              title: `${num}. ${name}`
            });
          }
        }
      }
    }
  });

  // Fallback to Gemini if there are not enough sections
  if (sectionHeaders.length < 2) {
    return null;
  }

  // Slice lines into sections
  const sections: { title: string; lines: string[] }[] = [];
  for (let i = 0; i < sectionHeaders.length; i++) {
    const startIdx = sectionHeaders[i].index;
    const endIdx = (i + 1 < sectionHeaders.length) ? sectionHeaders[i + 1].index : lines.length;
    const secLines = lines.slice(startIdx + 1, endIdx).map(l => l.trim()).filter(l => l.length > 0);
    sections.push({
      title: sectionHeaders[i].title,
      lines: secLines
    });
  }

  // Extract Title and Description from headers before first section
  let title = "QUESTIONÁRIO DE CONFIGURAÇÃO DE IA";
  const titleBeforeFirstSecLines = lines.slice(0, sectionHeaders[0].index).map(l => l.trim()).filter(l => l.length > 0);
  
  for (const line of titleBeforeFirstSecLines) {
    if (line.startsWith('#')) {
      const cleanH = line.replace(/^#+\s*/, '').replace(/\*\*|_/g, '').trim();
      if (cleanH.length > 10) {
        title = cleanH;
        break;
      }
    } else if (line.toUpperCase() === line && line.length > 12 && !line.includes('---')) {
      title = line.replace(/\*\*|_/g, '').trim();
      break;
    }
  }

  if (title === "QUESTIONÁRIO DE CONFIGURAÇÃO DE IA") {
    for (const line of titleBeforeFirstSecLines) {
      if (line.toLowerCase().includes('questionário') || line.toLowerCase().includes('briefing')) {
        title = line.replace(/\*\*|#|---/g, '').trim();
        break;
      }
    }
  }

  const descriptionParts: string[] = [];
  for (const line of titleBeforeFirstSecLines) {
    if (line && !line.startsWith('#') && line !== title && !line.startsWith('---') && !line.toLowerCase().includes('questionário')) {
      descriptionParts.push(line);
    }
  }
  const description = descriptionParts.join('\n\n') || "Por favor, complete as perguntas de briefing com o máximo de detalhes possível.";

  const parsedQuestions: FormQuestion[] = [];
  sections.forEach((sec, sIdx) => {
    let currentQuestionLabel = "";
    let currentQuestionType: 'text' | 'textarea' | 'radio' | 'checkbox' | 'select' = 'text';
    let currentQuestionOptions: string[] = [];
    let currentQuestionPlaceholder = "";
    let currentQuestionDescriptionLines: string[] = [];
    let inOptionMode = false;
    let inExemplosMode = false;

    const commitCurrentQuestion = () => {
      if (!currentQuestionLabel) return;

      let cleanLabel = currentQuestionLabel.replace(/^[-\s*_#•:]+|[-\s*_#•:]+$/g, '').trim();
      const labelLower = cleanLabel.toLowerCase();

      // Skip noise labels & headers
      if (
        labelLower === 'perguntas' || 
        labelLower === 'perguntas:' || 
        labelLower === 'opções' || 
        labelLower === 'opções:' || 
        labelLower === 'resposta' || 
        labelLower === 'resposta:' || 
        labelLower === 'estilo desejado' ||
        labelLower === 'estilo desejado:' ||
        labelLower === 'lista de procedimentos' ||
        labelLower === 'lista de procedimentos:' ||
        labelLower === 'contraindicações por procedimento' ||
        labelLower === 'contraindicações por procedimento:' ||
        cleanLabel.length <= 2
      ) {
        // Reset and discard
        currentQuestionLabel = "";
        currentQuestionOptions = [];
        currentQuestionPlaceholder = "";
        currentQuestionDescriptionLines = [];
        inOptionMode = false;
        inExemplosMode = false;
        currentQuestionType = 'text';
        return;
      }

      // Strip leading digits and period e.g. "1. " or "1) " or "20 - " if they are questions
      cleanLabel = cleanLabel.replace(/^(?:\*\*)?\d+\s*[\.\)-]\s*/, '').trim();
      // Strip trailing asterisks or underscores often used for bolding
      cleanLabel = cleanLabel.replace(/[\*_]+$/g, '').trim();

      // Automatically determine the type if we have options
      let type = currentQuestionType;
      if (isPureWrittenQuestionnaire) {
        const isTextarea = 
          labelLower.includes('explique') || 
          labelLower.includes('descreva') || 
          labelLower.includes('como a ia deve') || 
          labelLower.includes('como você gostaria') || 
          labelLower.includes('como você explica') || 
          labelLower.includes('como funciona') || 
          labelLower.includes('diretrizes') ||
          labelLower.includes('orientações') || 
          labelLower.includes('situações') || 
          labelLower.includes('principais dúvidas') || 
          labelLower.includes('detalhe') || 
          labelLower.includes('quais benefícios') || 
          labelLower.includes('quais procedimentos') || 
          labelLower.includes('quais informações') || 
          labelLower.includes('qual é o endereço completo') || 
          labelLower.includes('tabela de preços') || 
          labelLower.includes('regra específica') || 
          cleanLabel.length > 50;
        type = isTextarea ? 'textarea' : 'text';
        currentQuestionOptions = [];
      } else if (currentQuestionOptions.length > 0) {
        const isCheckbox = 
          labelLower.includes('quais') || 
          labelLower.includes('marcar mais de uma') || 
          labelLower.includes('marque as opções') ||
          labelLower.includes('selecione todas') ||
          labelLower.includes('quais são') || 
          labelLower.includes('caixas de seleção') || 
          labelLower.includes('quais perguntas') || 
          labelLower.includes('cuidados a paciente') || 
          labelLower.includes('quais regiões') || 
          labelLower.includes('contraindicações') || 
          labelLower.includes('formas de pagamento') || 
          labelLower.includes('situações') || 
          labelLower.includes('exemplos para confirmar') ||
          labelLower.includes('pergunta de triagem');
        type = isCheckbox ? 'checkbox' : 'radio';
      } else {
        const isTextarea = 
          labelLower.includes('explique') || 
          labelLower.includes('descreva') || 
          labelLower.includes('como a ia deve') || 
          labelLower.includes('como você gostaria') || 
          labelLower.includes('como você explica') || 
          labelLower.includes('como funciona') || 
          labelLower.includes('qual a política') || 
          labelLower.includes('valores do tratamento') || 
          labelLower.includes('observações') || 
          labelLower.includes('escreva as respostas') || 
          labelLower.includes('alguma orientação') || 
          labelLower.includes('diferencial do seu protocolo') || 
          labelLower.includes('alguma frase específica') || 
          cleanLabel.length > 60;
        type = isTextarea ? 'textarea' : 'text';
      }

      const id = `q_sec${sIdx + 1}_` + Math.random().toString(36).substring(2, 8);
      const isSec1 = sec.title.startsWith("1.") || sec.title.toLowerCase().includes("informações");
      const containsOptional = labelLower.includes('se houver') || labelLower.includes('caso possua') || labelLower.includes('opcional');
      
      let required = false;
      if (!isPureWrittenQuestionnaire) {
        required = isSec1 ? !containsOptional : (!containsOptional && (
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
      }

      parsedQuestions.push({
        id,
        type,
        label: cleanLabel,
        required,
        options: currentQuestionOptions.length > 0 ? currentQuestionOptions : undefined,
        section: sec.title,
        placeholder: currentQuestionPlaceholder ? currentQuestionPlaceholder : undefined,
        description: currentQuestionDescriptionLines.length > 0 ? currentQuestionDescriptionLines.join('\n') : undefined
      });

      // Reset state for next question
      currentQuestionLabel = "";
      currentQuestionOptions = [];
      currentQuestionPlaceholder = "";
      currentQuestionDescriptionLines = [];
      inOptionMode = false;
      inExemplosMode = false;
      currentQuestionType = 'text';
    };

    // Iterate lines
    for (let idx = 0; idx < sec.lines.length; idx++) {
      const line = sec.lines[idx].trim();
      if (!line) continue;

      const lineLower = line.toLowerCase();

      // Check for Resposta/Exemplo/Answer Triggers that finalize questions
      const isAnswer = lineLower === 'resposta' || lineLower.startsWith('resposta:') || 
                       lineLower.startsWith('respostas:') || lineLower.startsWith('lista de procedimentos:') ||
                       lineLower.startsWith('procedimento principal a ser destacado:') || lineLower.startsWith('caso tenha valores fixos:') ||
                       lineLower.startsWith('política de cancelamento/remarcação:') || lineLower.startsWith('informações obrigatórias para agendamento:') ||
                       lineLower.startsWith('contraindicações por procedimento:') || lineLower.startsWith('principais dúvidas e respostas:') ||
                       lineLower.startsWith('situações que devem ser encaminhadas para humano:') || lineLower.startsWith('procedimento incluído:') ||
                       lineLower.startsWith('valor promocional:') || lineLower.startsWith('validade da promoção:') ||
                       lineLower.startsWith('regras ou condições:') || lineLower.startsWith('orientações antes do procedimento:') ||
                       lineLower.startsWith('orientações após o procedimento:') || lineLower.startsWith('perguntas obrigatórias de triagem:') ||
                       lineLower.startsWith('estilo desejado:') || lineLower.startsWith('valor ou percentual do sinal:') ||
                       lineLower.startsWith('chave pix ou informações de pagamento:') || lineLower.startsWith('horários disponíveis para atendimento:');

      if (isAnswer) {
        commitCurrentQuestion();
        continue;
      }

      // Check for instruction triggers: "Marque uma opção", etc.
      const isInstruction = lineLower.includes('marque uma opção') || lineLower.includes('marque o estilo desejado') ||
                            lineLower.includes('selecione:') || lineLower.startsWith('exemplo:') || 
                            lineLower.startsWith('exemplos:') || lineLower.startsWith('sugestão:') || 
                            lineLower.startsWith('sugestão');

      if (isInstruction) {
        if (!isPureWrittenQuestionnaire) {
          if (lineLower.includes('marque uma opção') || lineLower.includes('marque o estilo')) {
            currentQuestionType = 'radio';
            inOptionMode = true;
          } else if (lineLower.includes('selecione:')) {
            currentQuestionType = 'checkbox';
            inOptionMode = true;
          }
        }

        if (!isPureWrittenQuestionnaire && (lineLower.startsWith('exemplo:') || lineLower.startsWith('sugestão:') || lineLower.startsWith('exemplos:'))) {
          inExemplosMode = true;
          // Set as placeholder if a single quote is present
          let quoteMatch = line.match(/[“"']([^”"'\n\r]{6,})[”"']/);
          if (quoteMatch) {
            currentQuestionPlaceholder = quoteMatch[1];
          } else if (idx + 1 < sec.lines.length) {
            const nextL = sec.lines[idx + 1].trim();
            if (nextL && !nextL.startsWith('-') && !nextL.startsWith('*') && nextL.length < 80) {
              currentQuestionPlaceholder = nextL.replace(/^[“"']|[”"']$/g, '');
            }
          }
        }

        currentQuestionDescriptionLines.push(line);
        continue;
      }

      // Identify if the line is a new question trigger
      const isNumberedQuestionPattern = !line.startsWith('#') && /^(?:\*\*|\*\s*)?\d+\s*[\.\)-]\s*(.+)$/.test(line);
      const isBullet = !isNumberedQuestionPattern && (
        line.match(/^[-*•]\s+(.+)$/) || 
        line.match(/^\d+\s*[-•]\s*(.+)$/) || 
        (!isPureWrittenQuestionnaire && line.match(/^\d+\.\s+(.+)$/))
      );

      const endsWithQuestionMark = line.endsWith('?') || line.endsWith('?**') || line.endsWith('?**_') || line.endsWith('?_**');
      const isQuestionColonPrompt = line.endsWith(':') && !isAnswer && !isInstruction;
      
      const startsWithQuestionWord = 
        line.startsWith('Qual') || 
        line.startsWith('Quais') || 
        line.startsWith('Como') || 
        line.startsWith('Existe') || 
        line.startsWith('Onde') || 
        line.startsWith('Você') || 
        line.startsWith('Se ') ||
        line.startsWith('A IA') ||
        line.startsWith('Nome ') ||
        line.startsWith('Cidade ') ||
        line.startsWith('Instagram') ||
        line.startsWith('Telefone') ||
        line.startsWith('Formas de pagamento') ||
        line.startsWith('Chave Pix');

      const isNewQuestionTrigger = (
        isNumberedQuestionPattern || 
        ((endsWithQuestionMark || isQuestionColonPrompt || (startsWithQuestionWord && line.length > 15)) && !isBullet && !inOptionMode)
      );

      if (isNewQuestionTrigger) {
        commitCurrentQuestion();
        currentQuestionLabel = line;
        currentQuestionType = 'text'; // Default, will change as we read options
        continue;
      }

      // If it's a bullet and we are in Option mode OR it's a bullet option list
      if (isBullet) {
        const bulletMatch = line.match(/^[-*•]\s+(.+)$/) || line.match(/^\d+\s*[-•]\s*(.+)$/) || line.match(/^\d+\.\s+(.+)$/);
        if (bulletMatch) {
          const optText = bulletMatch[1].replace(/\*\*|_/g, '').trim();
          if (inOptionMode) {
            if (optText.length > 1) {
              currentQuestionOptions.push(optText);
            }
          } else {
            // If not in option mode, bullets are treated as description examples (e.g. Tirar dúvidas), so we keep the bullet representation
            currentQuestionDescriptionLines.push("• " + optText);
          }
        }
        continue;
      }

      // Check if the line is a plain list option (short, specific context)
      const isShort = line.length < 85;
      const lowerLine = line.toLowerCase();
      const currentLabelLower = currentQuestionLabel ? currentQuestionLabel.toLowerCase() : '';

      const isLikelyOption = !isPureWrittenQuestionnaire && isShort && (
        inOptionMode ||
        currentQuestionOptions.length > 0 ||
        line === 'Sim' || 
        line === 'Não' || 
        line.startsWith('Depende') ||
        lowerLine.includes('segunda-feira') ||
        lowerLine.includes('terça-feira') ||
        lowerLine.includes('quarta-feira') ||
        lowerLine.includes('quinta-feira') ||
        lowerLine.includes('sexta-feira') ||
        lowerLine.includes('sábado') ||
        lowerLine.includes('domingo') ||
        currentLabelLower.includes('marque') ||
        currentLabelLower.includes('quais dias') ||
        currentLabelLower.includes('formas de pagamento')
      ) && !endsWithQuestionMark && !line.endsWith(':');

      if (isLikelyOption) {
        const cleanOpt = line.replace(/\*\*|_/g, '').trim();
        if (cleanOpt.length > 1) {
          currentQuestionOptions.push(cleanOpt);
        }
        continue;
      }

      // If we don't have a label yet, treat this as the start of a question label
      if (!currentQuestionLabel) {
        currentQuestionLabel = line;
        currentQuestionType = 'text';
      } else {
        // Line is helper text / description. If inExemplosMode is true, we prepend bullet styles dynamically so it looks perfect
        if (inExemplosMode) {
          const cleanLine = line.replace(/^[-*•]\s+/, '').trim();
          currentQuestionDescriptionLines.push("• " + cleanLine);
        } else {
          currentQuestionDescriptionLines.push(line);
        }
      }
    }
    commitCurrentQuestion();
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

  // Delete individual response
  app.delete('/api/forms/:formId/responses/:responseId', (req, res) => {
    const { formId, responseId } = req.params;
    const db = readDB();
    const form = db.find(f => f.id === formId);
    if (!form) {
      return res.status(404).json({ error: 'Formulário não encontrado.' });
    }
    const rIdx = form.responses.findIndex(r => r.id === responseId);
    if (rIdx === -1) {
      return res.status(404).json({ error: 'Resposta não encontrada.' });
    }
    form.responses.splice(rIdx, 1);
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

    // 1. Try to parse programmatically first.
    // Highly structured prompts (like pasted questionnaires) are parsed instantly with 100% fidelity.
    const structuredForm = tryParseStructuredPrompt(prompt);
    if (structuredForm) {
      console.log("Structured prompt detected. Processing programmatically with 100% fidelity.");
      const db = readDB();
      db.unshift(structuredForm);
      writeDB(db);
      return res.json(structuredForm);
    }

    // 2. If not structured and GMINI_API_KEY is missing, use the mock generator fallback.
    if (!process.env.GEMINI_API_KEY) {
      console.warn("GEMINI_API_KEY is not defined. Falling back to mock generator.");
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
