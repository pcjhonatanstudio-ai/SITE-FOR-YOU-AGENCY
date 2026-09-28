import React, { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import { 
  Sparkles, 
  Share2, 
  Trash2, 
  ChevronRight, 
  ArrowLeft, 
  Download, 
  Lock, 
  Calendar, 
  FileText, 
  Users, 
  MessageSquare,
  Clipboard,
  Check,
  Eye,
  LogOut,
  AlertCircle
} from 'lucide-react';

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

interface FormSummary {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  responsesCount: number;
}

interface FormsPortalProps {
  authToken: string | null;
  onLogin: (token: string) => void;
  onLogout: () => void;
  navigate: (path: string) => void;
}

export default function FormsPortal({ authToken, onLogin, onLogout, navigate }: FormsPortalProps) {
  // Authentication states
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Forms Dashboard States
  const [forms, setForms] = useState<FormSummary[]>([]);
  const [isLoadingForms, setIsLoadingForms] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedForm, setSelectedForm] = useState<DBForm | null>(null);
  const [activeView, setActiveView] = useState<'list' | 'detail'>('list');
  
  // Modals & temporary notices
  const [previewQuestions, setPreviewQuestions] = useState<DBForm | null>(null);
  const [copiedFormId, setCopiedFormId] = useState<string | null>(null);
  const [activeResponse, setActiveResponse] = useState<FormResponse | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);

  // Preset prompts for agency owners
  const PROMPT_PRESETS = [
    { label: 'Briefing Social Media', text: 'Briefing completo para novos clientes de gestão de redes sociais, perguntando sobre nicho, público-alvo, cores, frequência de postagens e referências visuais.' },
    { label: 'Branding & Logotipo', text: 'Briefing de design para desenvolvimento de logotipo e identidade de marca corporativa, cobrindo história, valores da marca, cores preferidas e concorrentes.' },
    { label: 'Aceleração de Vendas', text: 'Pesquisa estratégica de vendas e diagnóstico comercial para empresas interessadas em escalar faturamento com tráfego pago e funil de alta conversão.' },
    { label: 'Feedback de Projetos', text: 'Formulário pós-venda para novos depoimentos e feedback sincero de satisfação após entrega de sites ou campanhas de tráfego.' }
  ];

  // Fetch all forms on load if logged in
  useEffect(() => {
    if (authToken) {
      fetchForms();
    }
  }, [authToken]);

  const fetchForms = async () => {
    setIsLoadingForms(true);
    try {
      const res = await fetch('/api/forms');
      if (res.ok) {
        const data = await res.json();
        setForms(data);
      }
    } catch (err) {
      console.error("Error loading forms:", err);
    } finally {
      setIsLoadingForms(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setIsLoggingIn(true);

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        onLogin(data.token);
      } else {
        setAuthError(data.error || 'Erro ao realizar login.');
      }
    } catch (err) {
      setAuthError('Erro de conexão com o servidor.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleCreateAIForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setIsGenerating(true);
    setGenerationError(null);
    try {
      const res = await fetch('/api/forms/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });

      const data = await res.json();
      if (res.ok) {
        setPrompt('');
        fetchForms(); // Reload list
        // Open the newly generated form questions preview to delight the user!
        setPreviewQuestions(data);
      } else {
        setGenerationError(data.error || 'Erro ao gerar o formulário.');
      }
    } catch (err) {
      setGenerationError('Erro de comunicação. Tente novamente mais tarde.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDeleteForm = async (id: string) => {
    if (!confirm('Deseja realmente excluir este formulário? Isso apagará todas as respostas coletadas.')) return;

    try {
      const res = await fetch(`/api/forms/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchForms();
        if (selectedForm && selectedForm.id === id) {
          setActiveView('list');
          setSelectedForm(null);
        }
      }
    } catch (err) {
      console.error("Error deleting form:", err);
    }
  };

  const handleDeleteResponse = async (responseId: string) => {
    if (!selectedForm) return;
    if (!confirm('Deseja realmente excluir esta resposta permanentemente?')) return;

    try {
      const res = await fetch(`/api/forms/${selectedForm.id}/responses/${responseId}`, { method: 'DELETE' });
      if (res.ok) {
        // Reload form details to update the active responses list
        const detailRes = await fetch(`/api/forms/${selectedForm.id}`);
        if (detailRes.ok) {
          const detailData = await detailRes.json();
          setSelectedForm(detailData);
          
          // If the currently selected active response was the deleted one, switch active response to the next available one, or null
          if (activeResponse?.id === responseId) {
            const nextResponses = detailData.responses || [];
            setActiveResponse(nextResponses.length > 0 ? nextResponses[0] : null);
          }
        }
        // Also refresh forms list summary for responses count
        fetchForms();
      }
    } catch (err) {
      console.error("Error deleting response:", err);
    }
  };

  const handleViewDetails = async (id: string) => {
    setIsLoadingForms(true);
    try {
      const res = await fetch(`/api/forms/${id}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedForm(data);
        setActiveView('detail');
        setActiveResponse(data.responses && data.responses.length > 0 ? data.responses[0] : null);
      }
    } catch (err) {
      console.error("Error fetching form details:", err);
    } finally {
      setIsLoadingForms(false);
    }
  };

  const handleCopyLink = (id: string) => {
    const publicUrl = `${window.location.origin}/form/${id}`;
    navigator.clipboard.writeText(publicUrl).then(() => {
      setCopiedFormId(id);
      setTimeout(() => setCopiedFormId(null), 3000);
    });
  };

  const generatePDFReport = (formTitle: string, r: FormResponse, questions: FormQuestion[]) => {
    const doc = new jsPDF({
      orientation: 'p',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    let y = 30;

    // --- Elegant Brand Header Bar ---
    doc.setFillColor(11, 23, 42); // Branded slate theme
    doc.rect(0, 0, pageWidth, 42, 'F');

    doc.setTextColor(125, 249, 194); // Mint accent color
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.text('FOR YOU AGENCY', margin, 18);

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10.5);
    doc.text('Plataforma Inteligente de Coleta de Insights & Briefing', margin, 25);
    doc.text(`Data de Envio: ${new Date(r.submittedAt).toLocaleDateString('pt-BR')} ${new Date(r.submittedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`, margin, 31);
    doc.text(`ID do Registro: ${r.id}`, margin, 36);

    y = 54;

    // --- Respondent Detail Headline Card ---
    doc.setFillColor(243, 244, 246); // clean grey backer
    doc.roundedRect(margin, y, pageWidth - (margin * 2), 18, 2, 2, 'F');
    
    doc.setTextColor(17, 24, 39);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('CLIENTE ASSOCIADO AO BRIEFING', margin + 6, y + 6);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(55, 65, 81);
    doc.text(`Nome Completo: ${r.respondentName}`, margin + 6, y + 13);

    y += 28;

    // --- Section Header ---
    doc.setTextColor(11, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(`RESPOSTAS DO BRIEFING: "${formTitle.toUpperCase()}"`, margin, y);
    y += 7;

    // Accent bar
    doc.setFillColor(125, 249, 194);
    doc.rect(margin, y, 32, 1.2, 'F');
    y += 9;

    // --- Render Answers Loop ---
    questions.forEach((q, index) => {
      const prevQuestion = index > 0 ? questions[index - 1] : null;
      const showSectionHeader = q.section && (!prevQuestion || prevQuestion.section !== q.section);

      if (showSectionHeader) {
        // Guarantee space or push to new page
        if (y > pageHeight - 40) {
          doc.addPage();
          y = 30;
          
          // Dynamic Mini Top Brand Header
          doc.setFillColor(11, 23, 42);
          doc.rect(0, 0, pageWidth, 16, 'F');
          doc.setTextColor(125, 249, 194);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(9.5);
          doc.text('FOR YOU AGENCY | BRIEFING COLETADO', margin, 10.5);
          
          y = 30;
        } else {
          y += 4;
        }

        // Section Background Band
        doc.setFillColor(243, 244, 246);
        doc.rect(margin, y - 5, pageWidth - (margin * 2), 7, 'F');
        
        doc.setTextColor(11, 23, 42);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.text(String(q.section).toUpperCase(), margin + 3, y - 0.5);
        y += 8;
      }

      if (y > pageHeight - 32) {
        doc.addPage();
        y = 30;
        
        // Dynamic Mini Top Brand Header
        doc.setFillColor(11, 23, 42);
        doc.rect(0, 0, pageWidth, 16, 'F');
        doc.setTextColor(125, 249, 194);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9.5);
        doc.text('FOR YOU AGENCY | BRIEFING COLETADO', margin, 10.5);
        
        y = 30;
      }

      // Question text in slate bold
      doc.setTextColor(107, 114, 128); // light slate gray
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.text(`${index + 1}. ${q.label.toUpperCase()}`, margin, y);
      y += 5.5;

      // Answer values
      doc.setTextColor(17, 24, 39); // deep black/dark charcoal
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);

      const val = r.answers[q.id];
      let displayString = '';
      if (val === undefined || val === null) {
        displayString = '(Sem Resposta)';
      } else if (Array.isArray(val)) {
        displayString = val.length > 0 ? val.join(', ') : '(Nenhuma opção selecionada)';
      } else {
        displayString = String(val);
      }

      const splitLines = doc.splitTextToSize(displayString, pageWidth - (margin * 2));
      splitLines.forEach((line: string) => {
        doc.text(line, margin, y);
        y += 5;
      });

      // Separation gap
      y += 6.5;
    });

    // Save and close
    doc.save(`Briefing_${r.respondentName.replace(/\s+/g, '_')}.pdf`);
  };

  // --- Render Login Form ---
  if (!authToken) {
    return (
      <div className="min-h-svh flex items-center justify-center bg-bg relative px-[5%] py-[100px]">
        {/* Ambient light drops */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_50%_40%,rgba(125,249,194,0.05)_0%,transparent_60%)] pointer-events-none" />
        <div className="absolute hero-grid-lines inset-0 pointer-events-none" />

        <div className="relative w-full max-w-md bg-surface/40 backdrop-blur-md rounded-[32px] border border-border p-8 sm:p-10 shadow-2xl">
          <div className="text-center mb-10">
            <div className="w-16 h-16 rounded-full bg-accent/10 border border-accent/25 flex items-center justify-center mx-auto mb-5">
              <Lock className="text-accent w-6 h-6 animate-pulse" />
            </div>
            <h2 className="font-display text-2xl font-semibold mb-2">Portal de Formulários</h2>
            <p className="text-muted text-sm leading-relaxed">
              Escreva ideias, crie formulários de alta captação com IA e faça o download dos relatórios respondidos.
            </p>
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-6">
            {authError && (
              <div className="flex items-center gap-2.5 bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-2xl text-xs font-ui">
                <AlertCircle className="w-4.5 h-4.5 flex-shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs uppercase tracking-wider font-semibold text-muted font-ui">Seu Usuário</label>
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Foryouagency"
                required
                className="w-full bg-bg border border-border rounded-xl px-4 py-3 text-sm focus:border-accent/40 focus:ring-1 focus:ring-accent/40 font-ui text-white placeholder-gray-600 outline-none transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs uppercase tracking-wider font-semibold text-muted font-ui">Sua Senha</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                className="w-full bg-bg border border-border rounded-xl px-4 py-3 text-sm focus:border-accent/40 focus:ring-1 focus:ring-accent/40 font-ui text-white placeholder-gray-600 outline-none transition-all"
              />
            </div>

            <button 
              type="submit"
              disabled={isLoggingIn}
              className="w-full bg-accent text-bg font-ui font-semibold py-4 rounded-xl hover:-translate-y-0.5 hover:shadow-[0_10px_25px_rgba(125,249,194,0.25)] active:scale-[0.98] transition-all disabled:opacity-55 flex items-center justify-center gap-2 text-sm"
            >
              {isLoggingIn ? 'Autenticando...' : 'Acessar Portal'}
              <ChevronRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    );
  }

  // --- Render Dashboard View ---
  return (
    <div className="relative min-h-svh bg-bg pt-[110px] pb-20 px-[5%]">
      <div className="max-w-[1200px] mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6 mb-10">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-2.5 h-2.5 bg-accent rounded-full animate-pulse" />
              <span className="text-[0.72rem] tracking-widest text-[#2BDCAD] font-bold uppercase font-ui">Administrador Logado</span>
            </div>
            <h1 className="font-display text-2xl sm:text-4xl">
              Foryou <span className="font-light italic text-muted">Forms Portal</span>
            </h1>
          </div>

          <button 
            onClick={onLogout}
            className="self-start sm:self-auto flex items-center gap-2 border border-border bg-surface/30 hover:bg-white/5 text-muted hover:text-white px-4.5 py-2.5 rounded-full text-xs font-semibold font-ui transition-all"
          >
            <LogOut className="w-3.5 h-3.5 text-accent" />
            Desconectar
          </button>
        </div>

        {activeView === 'list' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Form Creator Left Column (Generates with AI) */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-surface/35 border border-border rounded-[28px] p-6 shadow-xl relative overflow-hidden backdrop-blur-md">
                <div className="absolute top-0 right-0 w-24 h-24 bg-accent/5 rounded-full blur-2xl pointer-events-none" />
                
                <h3 className="font-display text-lg font-medium mb-1.5 flex items-center gap-2">
                  <Sparkles className="text-accent w-5 h-5" /> 
                  Gerador Automático de IA
                </h3>
                <p className="text-xs text-muted leading-relaxed mb-6">
                  Escreva qual objetivo você deseja atingir e deixe que nossa IA formule perguntas que convertem e filtram os melhores leads.
                </p>

                <form onSubmit={handleCreateAIForm} className="space-y-4">
                  {generationError && (
                    <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl text-xs flex items-center gap-2 font-ui">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      <span>{generationError}</span>
                    </div>
                  )}

                  <textarea 
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Ex: Novo cliente de tráfego pago para clínica estética. Quero identificar orçamento, prioridades, tempo de mercado e histórico de anúncios."
                    className="w-full bg-bg/50 border border-border rounded-2xl p-4 text-sm font-ui placeholder-gray-600 focus:border-accent/40 outline-none h-36 font-light transition-all text-white overflow-y-auto"
                    required
                  />

                  <button 
                    type="submit"
                    disabled={isGenerating || !prompt.trim()}
                    className="w-full bg-accent text-bg py-3.5 rounded-xl font-ui font-bold text-xs tracking-wide uppercase transition-all disabled:opacity-55 active:scale-[0.98] flex items-center justify-center gap-2 shadow-lg shadow-accent/10"
                  >
                    {isGenerating ? (
                      <>
                        <Sparkles className="w-4 h-4 animate-spin text-bg" />
                        Gerando Form Inteligente...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-bg" />
                        Criar com Inteligência Artificial
                      </>
                    )}
                  </button>
                </form>

                {/* Divider */}
                <div className="relative flex py-4 items-center">
                  <div className="flex-grow border-t border-border/80"></div>
                  <span className="flex-shrink mx-4 text-muted text-[0.62rem] tracking-widest font-bold uppercase">Ou comece sugerido</span>
                  <div className="flex-grow border-t border-border/80"></div>
                </div>

                {/* Fast presets */}
                <div className="grid grid-cols-2 gap-2 text-left">
                  {PROMPT_PRESETS.map((p, idx) => (
                    <button
                      key={idx}
                      onClick={() => setPrompt(p.text)}
                      className="bg-bg border border-border hover:border-accent/35 rounded-xl p-2.5 transition-all text-left group"
                    >
                      <div className="text-[10px] font-bold text-white group-hover:text-accent transition-colors mb-0.5">{p.label}</div>
                      <div className="text-[9px] text-muted line-clamp-2 leading-relaxed font-light">{p.text}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Forms Summary Right Column (List of created forms) */}
            <div className="lg:col-span-7 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="font-ui text-md font-bold text-white flex items-center gap-2">
                  <FileText className="text-accent w-4.5 h-4.5" />
                  Formulários Coletadores ({forms.length})
                </h3>
                <button 
                  onClick={fetchForms} 
                  className="text-xs text-accent font-semibold font-ui cursor-pointer hover:underline"
                >
                  Atualizar Lista
                </button>
              </div>

              {isLoadingForms ? (
                <div className="border border-border bg-surface/20 rounded-[28px] p-20 flex flex-col items-center justify-center gap-3">
                  <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs text-muted font-ui">Buscando formulários do banco...</span>
                </div>
              ) : forms.length === 0 ? (
                <div className="border border-dashed border-border bg-surface/10 rounded-[28px] p-12 text-center text-muted">
                  <FileText className="w-10 h-10 mx-auto mb-3 opacity-30 text-accent" />
                  <p className="text-sm font-ui mb-1">Nenhum formulário ativo no banco</p>
                  <p className="text-xs font-light">Utilize a caixa ao lado e peça para a IA criar o seu primeiro briefing estrategista.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {forms.map((f) => (
                    <div 
                      key={f.id}
                      className="bg-surface/30 border border-border rounded-2xl p-5 hover:border-accent/25 transition-all relative group flex flex-col justify-between gap-4"
                    >
                      <div>
                        {/* Tags */}
                        <div className="flex items-center justify-between gap-3 mb-2.5">
                          <span className="px-2.5 py-0.5 rounded-full bg-accent/10 border border-accent/20 text-accent font-ui text-[0.62rem] font-bold uppercase">
                            Ativo para Leads
                          </span>
                          <span className="text-[10px] text-muted flex items-center gap-1 font-mono">
                            <Calendar className="w-3 h-3 text-accent" />
                            {new Date(f.createdAt).toLocaleDateString('pt-BR')}
                          </span>
                        </div>

                        <h4 className="text-white font-ui font-bold text-[0.95rem] mb-1 leading-tight group-hover:text-accent transition-colors">
                          {f.title}
                        </h4>
                        <p className="text-xs text-muted line-clamp-2 leading-relaxed font-light">
                          {f.description}
                        </p>
                      </div>

                      {/* Responses and Actions */}
                      <div className="flex sm:items-center justify-between gap-3 border-t border-border/80 pt-4 flex-col sm:flex-row">
                        <div className="flex items-center gap-1.5 text-xs text-white/90">
                          <Users className="w-4 h-4 text-accent" />
                          <span className="font-ui text-xs font-semibold">Respostas coletadas:</span>
                          <span className="bg-accent/15 border border-accent/25 text-accent px-2 py-0.5 rounded-full text-[11px] font-bold font-mono">
                            {f.responsesCount}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-auto">
                          {/* Copiar Link */}
                          <button
                            onClick={() => handleCopyLink(f.id)}
                            className="bg-bg border border-border hover:border-accent/40 rounded-lg p-2.5 text-muted hover:text-accent transition-all flex items-center gap-1.5 tooltip relative text-xs"
                            title="Copiar link de compartilhamento"
                          >
                            {copiedFormId === f.id ? (
                              <Check className="w-3.5 h-3.5 text-green-400" />
                            ) : (
                              <Clipboard className="w-3.5 h-3.5" />
                            )}
                            <span>{copiedFormId === f.id ? 'Copiado!' : 'Compartilhar'}</span>
                          </button>

                          {/* Ver respostas */}
                          <button
                            onClick={() => handleViewDetails(f.id)}
                            className="bg-accent text-bg hover:bg-white rounded-lg px-3 py-2 text-xs font-semibold font-ui transition-all flex items-center gap-1"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Exibir Respostas
                          </button>

                          {/* Excluir */}
                          <button
                            onClick={() => handleDeleteForm(f.id)}
                            className="bg-red-500/10 border border-red-500/20 hover:bg-red-500 hover:text-white rounded-lg p-2.5 text-red-400 transition-all"
                            title="Excluir"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          // --- Form Detail and Submissions Panel ---
          <div className="space-y-6">
            <button 
              onClick={() => setActiveView('list')}
              className="inline-flex items-center gap-2 hover:text-accent font-ui text-xs font-medium bg-surface/40 hover:bg-white/5 border border-border rounded-full px-5 py-2.5 text-muted transition-all"
            >
              <ArrowLeft className="w-4 h-4 text-accent" />
              Voltar ao Painel Geral
            </button>

            {selectedForm && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* Responses Left List Column */}
                <div className="lg:col-span-4 space-y-4">
                  <div className="bg-surface/20 border border-border rounded-2xl p-4">
                    <h3 className="font-ui text-xs font-bold text-white uppercase tracking-wider mb-3">
                      Lista de Respostas ({selectedForm.responses.length})
                    </h3>

                    {selectedForm.responses.length === 0 ? (
                      <div className="py-10 text-center text-muted font-ui text-xs">
                        <MessageSquare className="w-8 h-8 rounded-full bg-accent/5 p-1.5 text-accent mx-auto mb-2 opacity-40 text-center" />
                        Nenhuma resposta coletada ainda.
                        <div className="mt-1 flex justify-center">
                          <button 
                            onClick={() => handleCopyLink(selectedForm.id)}
                            className="text-accent underline font-semibold text-[10px] mt-1 text-center"
                          >
                            Copiar link do form
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1 no-scrollbar">
                        {selectedForm.responses.map((resp) => (
                          <div
                            key={resp.id}
                            className={`w-full rounded-xl border transition-all flex items-center justify-between p-3.5 font-ui ${activeResponse?.id === resp.id ? 'bg-accent/10 border-accent text-white' : 'bg-surface/15 border-border hover:border-white/20 text-muted'}`}
                          >
                            <button
                              onClick={() => setActiveResponse(resp)}
                              className="flex-1 text-left outline-none cursor-pointer"
                            >
                              <div className="font-semibold text-xs leading-snug text-white line-clamp-1">
                                {resp.respondentName}
                              </div>
                              <div className="text-[9px] text-muted flex items-center gap-1 mt-1 font-mono">
                                <Calendar className="w-2.5 h-2.5 text-accent" />
                                {new Date(resp.submittedAt).toLocaleDateString('pt-BR')} - {new Date(resp.submittedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteResponse(resp.id);
                              }}
                              className="p-1.5 rounded-lg text-muted/60 hover:text-red-400 hover:bg-red-500/10 transition-colors ml-2 cursor-pointer"
                              title="Excluir resposta"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Selected Response Detail Answers Panel */}
                <div className="lg:col-span-8 bg-surface/30 border border-border rounded-[28px] p-6 sm:p-8 backdrop-blur-md">
                  {activeResponse ? (
                    <div className="space-y-6">
                      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-border/80 pb-4">
                        <div>
                          <div className="text-[10px] tracking-widest text-[#2BDCAD] font-bold font-ui uppercase mb-1">Resposta Consolidada</div>
                          <h3 className="font-display text-xl text-white font-semibold">
                            {activeResponse.respondentName}
                          </h3>
                        </div>

                        <button
                          onClick={() => generatePDFReport(selectedForm.title, activeResponse, selectedForm.questions)}
                          className="bg-accent text-bg hover:bg-white px-5 py-3 rounded-xl font-ui font-bold text-xs flex items-center justify-center gap-2 transform active:scale-95 transition-all self-start sm:self-auto shadow-md"
                        >
                          <Download className="w-4 h-4 text-bg" />
                          Baixar Resposta como PDF
                        </button>
                      </div>

                      <div className="space-y-6">
                        {selectedForm.questions.map((q, idx) => {
                          const prevQuestion = idx > 0 ? selectedForm.questions[idx - 1] : null;
                          const showSectionHeader = q.section && (!prevQuestion || prevQuestion.section !== q.section);

                          const answer = activeResponse.answers[q.id];
                          let answerDisplay = '';
                          
                          if (answer === undefined || answer === null || answer === '') {
                            answerDisplay = '(Sem resposta)';
                          } else if (Array.isArray(answer)) {
                            answerDisplay = answer.join(', ');
                          } else {
                            answerDisplay = String(answer);
                          }

                          return (
                            <React.Fragment key={q.id}>
                              {showSectionHeader && (
                                <div className="pt-6 pb-1">
                                  <div className="bg-surface/50 border border-border/60 rounded-2xl px-5 py-3.5 shadow-sm">
                                    <h4 className="text-xs font-bold text-accent tracking-wider uppercase flex items-center gap-2">
                                      <span className="w-1.5 h-3.5 bg-accent rounded-full animate-pulse" />
                                      {q.section}
                                    </h4>
                                  </div>
                                </div>
                              )}
                              <div className="bg-bg/40 border border-border rounded-xl p-4 relative hover:border-accent/11 transition-all">
                                <div className="text-[11px] text-muted font-bold tracking-wide font-ui mb-1.5">
                                  {idx + 1}. {q.label}
                                </div>
                                <div className="text-white text-sm leading-relaxed font-light font-ui break-words">
                                  {answerDisplay}
                                </div>
                              </div>
                            </React.Fragment>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="py-20 text-center text-muted font-ui">
                      <MessageSquare className="w-12 h-12 rounded-full bg-accent/5 p-2 text-accent mx-auto mb-4 opacity-30 text-center" />
                      <p className="text-sm font-semibold text-white">Nenhuma resposta selecionada</p>
                      <p className="text-xs font-light max-w-sm mx-auto mt-1">Este formulário possui respostas coletadas, mas você deve clicar em algum respondente na lista lateral para inspecionar e exportar o relatório.</p>
                    </div>
                  )}
                </div>

              </div>
            )}
          </div>
        )}
      </div>

      {/* Preview Questions Modal (Opens directly upon successful AI generation so creators can inspect) */}
      {previewQuestions && (
        <div className="fixed inset-0 z-[750] bg-black/85 backdrop-blur-sm flex items-center justify-center p-5">
          <div className="bg-surface border border-border rounded-[28px] w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2 text-accent">
                <Sparkles className="w-5 h-5" />
                <h3 className="font-ui font-bold text-white text-sm uppercase tracking-wide">Mágica da IA! Formulário Gerado</h3>
              </div>
              <button 
                onClick={() => setPreviewQuestions(null)}
                className="text-muted hover:text-white font-ui font-bold"
              >
                Fechar
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 no-scrollbar flex-grow">
              <div className="border border-accent/20 bg-accent/5 p-4 rounded-xl mb-4">
                <h4 className="text-accent font-bold text-sm mb-1">{previewQuestions.title}</h4>
                <p className="text-xs text-muted leading-relaxed">{previewQuestions.description}</p>
              </div>

              <div className="space-y-4 pt-1">
                <div className="text-[10px] uppercase font-bold tracking-wider text-muted font-ui mb-1">Perguntas Estruturadas por Seção:</div>
                {previewQuestions.questions.map((q, idx) => {
                  const prevQuestion = idx > 0 ? previewQuestions.questions[idx - 1] : null;
                  const showSectionHeader = q.section && (!prevQuestion || prevQuestion.section !== q.section);

                  return (
                    <React.Fragment key={idx}>
                      {showSectionHeader && (
                        <div className="pt-4 pb-1">
                          <div className="bg-bg/85 border border-border rounded-xl px-4 py-2.5">
                            <h4 className="text-[11px] font-bold text-accent tracking-wider uppercase flex items-center gap-2">
                              <span className="w-1.5 h-3 bg-accent rounded-full animate-pulse" />
                              {q.section}
                            </h4>
                          </div>
                        </div>
                      )}
                      <div className="bg-bg p-4 border border-border rounded-xl">
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <div className="text-xs font-bold text-white font-ui">{idx + 1}. {q.label}</div>
                          <div className="text-[9px] uppercase tracking-wider font-bold bg-[#2BDCAD]/10 text-accent px-2 py-0.5 rounded-full font-ui">{q.type}</div>
                        </div>
                        {q.options && q.options.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {q.options.map((opt, oIdx) => (
                              <span key={oIdx} className="bg-surface border border-border text-muted px-2.5 py-0.5 rounded-md text-[9px] font-ui">{opt}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    </React.Fragment>
                  );
                })}
              </div>
            </div>

            <div className="p-5 border-t border-border bg-bg/50 rounded-b-[28px] flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="text-[10px] text-muted font-ui">O formulário já está salvo na sua conta e pronto para captar respostas!</span>
              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                <button
                  onClick={() => {
                    handleCopyLink(previewQuestions.id);
                  }}
                  className="w-full sm:w-auto bg-surface border border-border text-muted hover:text-accent font-ui font-semibold text-xs px-5 py-3 rounded-xl transition-all flex items-center justify-center gap-2 pr-6"
                >
                  <Clipboard className="w-4 h-4" />
                  Copiar Link do Form
                </button>
                <button
                  onClick={() => {
                    setPreviewQuestions(null);
                    handleViewDetails(previewQuestions.id);
                  }}
                  className="w-full sm:w-auto bg-accent text-bg font-ui font-bold text-xs px-5 py-3 rounded-xl hover:-translate-y-0.5 transition-all outline-none"
                >
                  Visualizar Respostas
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
