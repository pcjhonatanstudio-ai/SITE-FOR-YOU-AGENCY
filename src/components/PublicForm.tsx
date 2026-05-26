import React, { useState, useEffect } from 'react';
import { 
  Bot, 
  Sparkles, 
  Send, 
  CheckCircle2, 
  ArrowLeft, 
  AlertCircle,
  Clock,
  HelpCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface FormQuestion {
  id: string;
  type: 'text' | 'textarea' | 'radio' | 'checkbox' | 'select';
  label: string;
  required: boolean;
  options?: string[];
  section?: string;
  placeholder?: string;
}

interface DBForm {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  questions: FormQuestion[];
}

interface PublicFormProps {
  formId: string;
  navigate: (path: string) => void;
}

export default function PublicForm({ formId, navigate }: PublicFormProps) {
  const [form, setForm] = useState<DBForm | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form answering states
  const [respondentName, setRespondentName] = useState('');
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    fetchFormDetails();
  }, [formId]);

  const fetchFormDetails = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/forms/${formId}`);
      if (res.ok) {
        const data = await res.json();
        setForm(data);
        
        // Initialize checkboxes with empty arrays for safety
        const initialAnswers: Record<string, any> = {};
        data.questions.forEach((q: FormQuestion) => {
          if (q.type === 'checkbox') {
            initialAnswers[q.id] = [];
          }
        });
        setAnswers(initialAnswers);
      } else {
        const errData = await res.json();
        setError(errData.error || 'Formulário não encontrado ou inativo.');
      }
    } catch (err) {
      setError('Erro de conexão ao carregar as questões. Verifique seu link.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTextChange = (questionId: string, val: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: val }));
    if (validationError) setValidationError(null);
  };

  const handleSingleSelect = (questionId: string, val: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: val }));
    if (validationError) setValidationError(null);
  };

  const handleCheckboxToggle = (questionId: string, option: string) => {
    const currentList = answers[questionId] || [];
    let updatedList: string[];
    if (currentList.includes(option)) {
      updatedList = currentList.filter((item: string) => item !== option);
    } else {
      updatedList = [...currentList, option];
    }
    setAnswers(prev => ({ ...prev, [questionId]: updatedList }));
    if (validationError) setValidationError(null);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    // Validate respondent name
    if (!respondentName.trim()) {
      setValidationError('Por favor, informe seu Nome Completo antes de prosseguir.');
      window.scrollTo({ top: 120, behavior: 'smooth' });
      return;
    }

    // Validate required questions
    if (form) {
      for (const q of form.questions) {
        if (q.required) {
          const val = answers[q.id];
          if (q.type === 'checkbox') {
            if (!val || val.length === 0) {
              setValidationError(`A pergunta "${q.label}" é obrigatória.`);
              const el = document.getElementById(`field-${q.id}`);
              if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
              return;
            }
          } else {
            if (!val || String(val).trim() === '') {
              setValidationError(`A pergunta "${q.label}" é obrigatória.`);
              const el = document.getElementById(`field-${q.id}`);
              if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
              return;
            }
          }
        }
      }
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/forms/${formId}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          respondentName,
          answers
        })
      });

      if (res.ok) {
        setIsSubmitted(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        const errData = await res.json();
        setValidationError(errData.error || 'Falha ao registrar respostas no arquivo.');
      }
    } catch (err) {
      setValidationError('Erro de comunicação ao enviar respostas.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper to calculate form completions percentage progress
  const getProgressPercentage = () => {
    if (!form) return 0;
    
    // Add 1 for the respondent name field
    let totalFields = form.questions.length + 1;
    let filledFields = 0;

    if (respondentName.trim().length > 0) filledFields++;

    form.questions.forEach(q => {
      const value = answers[q.id];
      if (q.type === 'checkbox') {
        if (value && value.length > 0) filledFields++;
      } else {
        if (value && String(value).trim().length > 0) filledFields++;
      }
    });

    return Math.round((filledFields / totalFields) * 100);
  };

  if (isLoading) {
    return (
      <div className="min-h-svh bg-bg flex flex-col items-center justify-center p-10 select-none">
        <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin mb-4" />
        <p className="font-ui text-sm text-muted animate-pulse">Carregando briefing estratégico seguro...</p>
      </div>
    );
  }

  if (error || !form) {
    return (
      <div className="min-h-svh bg-bg flex items-center justify-center px-[5%] py-[120px]">
        <div className="text-center max-w-sm w-full bg-surface/30 border border-border rounded-3xl p-8 backdrop-blur-md">
          <div className="w-14 h-14 bg-red-500/10 border border-red-500/30 text-red-400 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="font-display text-lg mb-2 text-white">Formulário Indisponível</h3>
          <p className="text-xs text-muted leading-relaxed mb-6">
            {error || 'Link quebrado ou formulário inativo na nossa base de dados. Confirme com nossos analistas.'}
          </p>
          <button
            onClick={() => navigate('/')}
            className="w-full inline-flex items-center justify-center gap-2 bg-accent text-bg font-ui font-bold py-3 px-5 rounded-xl transition-all hover:opacity-90 hover:scale-[1.02]"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar ao Início
          </button>
        </div>
      </div>
    );
  }

  // --- Render Celebration View upon successful send ---
  if (isSubmitted) {
    return (
      <div className="min-h-svh bg-bg relative px-[5%] py-[100px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_50%_40%,rgba(125,249,194,0.06)_0%,transparent_60%)] pointer-events-none" />
        <div className="absolute hero-grid-lines inset-0 pointer-events-none" />

        <div className="relative w-full max-w-xl bg-surface/35 border border-border p-8 sm:p-12 rounded-[40px] shadow-2xl text-center backdrop-blur-md">
          <div className="w-20 h-20 rounded-full bg-accent/15 border-2 border-accent/25 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-accent animate-bounce" />
          </div>

          <h2 className="font-display text-2xl sm:text-3.5xl font-light mb-4 text-white">
            Briefing <span className="font-semibold italic text-accent">Enviado!</span>
          </h2>
          
          <p className="text-sm text-muted leading-relaxed mb-8 font-light">
            Obrigado, <strong className="text-white font-medium">{respondentName}</strong>! Suas respostas foram criptografadas e registradas com sucesso na nossa agência. Nosso estrategista de marketing digital foi alertado e o planejamento do seu projeto já está em andamento.
          </p>

          <div className="border border-border/80 rounded-2.5xl p-4.5 bg-bg/50 flex items-center gap-3 justify-center mb-10 max-w-xs mx-auto">
            <Clock className="w-4 h-4 text-accent" />
            <span className="text-xs text-muted">Retorno estimado em até 24 Horas Úteis</span>
          </div>

          <button
            onClick={() => navigate('/')}
            className="bg-accent text-bg hover:bg-white font-ui font-bold text-xs uppercase px-10 py-4.5 rounded-full shadow-lg shadow-accent/10 transition-all active:scale-95"
          >
            Página de Serviços
          </button>
        </div>
      </div>
    );
  }

  // --- Render General Form Questionnaire View ---
  return (
    <div className="min-h-svh bg-bg relative px-[5%] pt-[100px] pb-24 overflow-x-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_65%_at_80%_40%,rgba(125,249,194,0.04)_0%,transparent_60%)] pointer-events-none" />
      <div className="absolute hero-grid-lines inset-0 pointer-events-none" />

      {/* Floating Status Indicator on Desktop */}
      <div className="fixed top-24 right-5 lg:right-10 z-40 bg-surface/90 border border-border shadow-xl rounded-full px-5 py-2 flex items-center gap-2.5 backdrop-blur-md text-[11px] font-mono select-none">
        <Sparkles className="w-3.5 h-3.5 text-accent animate-spin" />
        <span className="text-muted">Progresso:</span>
        <span className="text-accent font-bold font-mono">{getProgressPercentage()}%</span>
      </div>

      <div className="max-w-[700px] mx-auto relative z-10">
        
        {/* Back Link Header */}
        <button 
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-2 text-muted hover:text-white text-xs mb-8 font-ui transition-colors transition-transform cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-accent" />
          Voltar para Home da Agência
        </button>

        {/* Form Title & Banner */}
        <div className="bg-surface/30 border border-border rounded-[32px] p-6 sm:p-10 mb-8 backdrop-blur-md shadow-xl text-center sm:text-left">
          <div className="flex flex-col sm:flex-row items-center gap-5 justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2 justify-center sm:justify-start">
                <Bot className="w-4 h-4 text-accent" />
                <span className="text-[10px] tracking-widest text-[#2BDCAD] font-bold uppercase font-ui">Mapeamento Inteligente</span>
                <span className="w-1.5 h-1.5 bg-accent rounded-full animate-ping" />
              </div>

              <h1 className="font-display text-2xl sm:text-3.5xl font-semibold mb-3 leading-tight tracking-tight">
                {form.title}
              </h1>
              <p className="text-xs text-muted leading-relaxed font-light font-ui">
                {form.description}
              </p>
            </div>
            
            {/* Branding badge or visual logo */}
            <div className="w-16 h-16 flex-shrink-0 bg-accent/10 border-2 border-accent/20 rounded-2xl flex items-center justify-center p-3">
              <img 
                src="https://lh3.googleusercontent.com/d/1JT7Pc-SJOYcHQyNMtxyg7t17m4OX7DAt" 
                alt="For You Agency Logo" 
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>

          {/* Gamified progress bar wrapper */}
          <div className="mt-8 pt-6 border-t border-border/80">
            <div className="flex items-center justify-between text-[11px] font-mono text-muted mb-2">
              <span>Status do Briefing</span>
              <span className="text-accent font-bold">{getProgressPercentage()}% preenchido</span>
            </div>
            <div className="w-full h-2 bg-bg rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-gradient-to-r from-accent to-accent2"
                initial={{ width: 0 }}
                animate={{ width: `${getProgressPercentage()}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>
        </div>

        {/* Diagnostic alert box for validation failure */}
        {validationError && (
          <div className="fixed bottom-6 left-5 right-5 sm:left-auto sm:right-6 z-[600] max-w-sm bg-red-950/95 border border-red-500/35 text-red-200 py-3.5 px-5 rounded-2xl text-xs font-ui flex items-center gap-3 shadow-2xl animate-bounce">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-500" />
            <div>
              <div className="font-bold">Validação Pendente</div>
              <p className="opacity-80 font-light mt-0.5">{validationError}</p>
            </div>
          </div>
        )}

        {/* Main interactive Form Fields */}
        <form onSubmit={handleFormSubmit} className="space-y-6">
          
          {/* Default Fixed Field: Respondent Name */}
          <div id="field-respondentName" className="bg-surface/20 border border-border rounded-[22px] p-6 shadow-md hover:border-accent/15 transition-all">
            <div className="flex items-center gap-1.5 mb-2">
              <HelpCircle className="w-4 h-4 text-accent" />
              <label className="font-ui text-xs font-bold text-white uppercase tracking-wider">
                Como devemos chamar você? / Nome de sua Empresa <span className="text-accent">*</span>
              </label>
            </div>
            <p className="text-[11px] text-muted leading-relaxed font-light mb-3">
              Informe seu nome completo ou a razão social da sua marca para identificar seu briefing no sistema corporativo.
            </p>
            <input 
              type="text" 
              value={respondentName}
              onChange={(e) => {
                setRespondentName(e.target.value);
                if (validationError) setValidationError(null);
              }}
              placeholder="Ex: Carlos Augusto Silva | Advogado"
              required
              className="w-full bg-bg/50 border border-border focus:border-accent/40 rounded-xl px-4 py-3.5 text-sm font-ui placeholder-gray-600 outline-none text-white transition-all font-light"
            />
          </div>

          {/* AI-Generated Dynamic Fields */}
          {form.questions.map((q, idx) => {
            const prevQuestion = idx > 0 ? form.questions[idx - 1] : null;
            const showSectionHeader = q.section && (!prevQuestion || prevQuestion.section !== q.section);

            return (
              <React.Fragment key={q.id}>
                {showSectionHeader && (
                  <div className="pt-8 pb-3">
                    <div className="bg-surface/35 border border-border/80 rounded-[22px] px-6 py-4 backdrop-blur-sm">
                      <h3 className="font-display text-xs font-semibold text-accent tracking-wider uppercase flex items-center gap-2">
                        <span className="w-1.5 h-3.5 bg-accent rounded-full animate-pulse" />
                        {q.section}
                      </h3>
                    </div>
                  </div>
                )}

                <div 
                  id={`field-${q.id}`}
                  className="bg-surface/20 border border-border rounded-[22px] p-6 shadow-md hover:border-accent/15 transition-all"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-5 h-5 rounded-full bg-accent/10 border border-accent/20 text-accent font-mono text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                      {idx + 1}
                    </span>
                    <label className="font-ui text-xs font-bold text-white uppercase tracking-wider">
                      {q.label} {q.required && <span className="text-accent">*</span>}
                    </label>
                  </div>

                  {/* Placeholder Suggestion Helper */}
                  {q.placeholder && (
                    <div className="flex items-start justify-between gap-4 text-[11px] text-muted leading-relaxed font-light mb-3.5 bg-bg/30 border border-border/40 rounded-xl p-3.5">
                      <div className="flex-1">
                        <span className="block text-[10px] uppercase font-bold text-[#2BDCAD] tracking-wider mb-1">Sugestão de resposta editável:</span>
                        <p className="italic">"{q.placeholder}"</p>
                      </div>
                      {(q.type === 'text' || q.type === 'textarea') && (
                        <button
                          type="button"
                          onClick={() => handleTextChange(q.id, q.placeholder || '')}
                          className="text-accent hover:text-white transition-colors cursor-pointer text-[10px] font-mono flex-shrink-0 uppercase font-bold self-center border border-accent/30 hover:border-accent bg-accent/5 px-3 py-1.5 rounded-lg active:scale-95"
                        >
                          Usar Sugestão
                        </button>
                      )}
                    </div>
                  )}

                  {/* Text option */}
                  {q.type === 'text' && (
                    <input 
                      type="text" 
                      value={answers[q.id] || ''}
                      onChange={(e) => handleTextChange(q.id, e.target.value)}
                      placeholder={q.placeholder || "Escreva sua resposta..."}
                      required={q.required}
                      className="w-full bg-bg/50 border border-border focus:border-accent/40 rounded-xl px-4 py-3.5 text-sm font-ui placeholder-gray-600 outline-none text-white transition-all font-light"
                    />
                  )}

                  {/* Textarea option */}
                  {q.type === 'textarea' && (
                    <textarea 
                      value={answers[q.id] || ''}
                      onChange={(e) => handleTextChange(q.id, e.target.value)}
                      placeholder={q.placeholder || "Detalhe o máximo que puder para nosso time..."}
                      required={q.required}
                      className="w-full bg-bg/50 border border-border focus:border-accent/40 rounded-xl px-4 py-3.5 text-sm font-ui placeholder-gray-600 outline-none text-white h-32 transition-all font-light overflow-y-auto"
                    />
                  )}

                  {/* Select Option (Dropdown) */}
                  {q.type === 'select' && (
                    <div className="relative">
                      <select
                        value={answers[q.id] || ''}
                        onChange={(e) => handleSingleSelect(q.id, e.target.value)}
                        required={q.required}
                        className="w-full bg-bg/50 border border-border focus:border-accent/40 rounded-xl px-4 py-4 text-sm font-ui outline-none text-white transition-all font-light appearance-none"
                      >
                        <option value="" disabled className="bg-bg text-gray-400">Clique para selecionar uma opção</option>
                        {q.options?.map((opt, oIdx) => (
                          <option key={oIdx} value={opt} className="bg-surface text-white py-2">{opt}</option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-muted">
                        ▼
                      </div>
                    </div>
                  )}

                  {/* Radio options */}
                  {q.type === 'radio' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3 pt-1">
                      {q.options?.map((opt, oIdx) => {
                        const isSelected = answers[q.id] === opt;
                        return (
                          <button
                            type="button"
                            key={oIdx}
                            onClick={() => handleSingleSelect(q.id, opt)}
                            className={`p-3.5 rounded-xl border text-left font-ui text-[12.5px] transition-all flex items-center gap-3 ${isSelected ? 'bg-accent/10 border-accent text-white font-medium' : 'bg-bg/40 border-border hover:border-white/20 text-muted'}`}
                          >
                            <span className={`w-4 h-4 rounded-full border flex-shrink-0 flex items-center justify-center transition-all ${isSelected ? 'border-accent bg-accent' : 'border-border bg-bg'}`}>
                              {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-bg" />}
                            </span>
                            <span>{opt}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Checkbox option */}
                  {q.type === 'checkbox' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3 pt-1">
                      {q.options?.map((opt, oIdx) => {
                        const list = answers[q.id] || [];
                        const isSelected = list.includes(opt);
                        return (
                          <button
                            type="button"
                            key={oIdx}
                            onClick={() => handleCheckboxToggle(q.id, opt)}
                            className={`p-3.5 rounded-xl border text-left font-ui text-[12.5px] transition-all flex items-center gap-3 ${isSelected ? 'bg-accent/10 border-accent text-white font-medium' : 'bg-bg/40 border-border hover:border-white/20 text-muted'}`}
                          >
                            <span className={`w-4 h-4 rounded-md border flex-shrink-0 flex items-center justify-center transition-all ${isSelected ? 'border-accent bg-accent' : 'border-border bg-bg'}`}>
                              {isSelected && <CheckCircle2 className="w-3 h-3 text-bg fill-accent" />}
                            </span>
                            <span>{opt}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </React.Fragment>
            );
          })}

          {/* Submit Action */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-accent text-bg hover:bg-white font-ui font-bold text-sm uppercase py-4.5 rounded-2xl shadow-lg shadow-accent/10 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4.5 h-4.5 border-2 border-bg border-t-transparent rounded-full animate-spin" />
                  Salvando respostas no banco...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 text-bg" />
                  Enviar Briefing Respondido
                </>
              )}
            </button>
            <p className="text-center text-[10px] text-muted mt-3 font-ui font-light">
              Suas respostas são armazenadas de forma segura e protegidas conforme políticas da For You Agency.
            </p>
          </div>

        </form>

      </div>
    </div>
  );
}
