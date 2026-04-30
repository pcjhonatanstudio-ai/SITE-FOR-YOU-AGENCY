/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MessageCircle, 
  ArrowRight, 
  Monitor, 
  MessageSquare, 
  Zap, 
  BarChart3, 
  CheckCircle2, 
  Star, 
  Instagram, 
  Linkedin, 
  Facebook, 
  Youtube, 
  Play, 
  ChevronLeft, 
  ChevronRight,
  X,
  Menu,
  MousePointer2,
  ShieldCheck,
  Users,
  DollarSign,
  Activity,
  Volume2,
  VolumeX
} from 'lucide-react';

// --- Types ---
interface Service {
  id: string;
  num: string;
  title: string;
  desc: string;
  icon: React.JSX.Element;
}

interface PortfolioItem {
  id: string;
  tag: string;
  name: string;
  color: string;
  url?: string;
  image?: string;
}

interface Video {
  id: string;
  cat: string;
  title: string;
  meta: string;
  bg: string;
}

interface Testimonial {
  id: string;
  text: string;
  author: string;
  role: string;
  avatar: string;
  avatarColor: string;
}

interface Differential {
  id: string;
  title: string;
  text: string;
  icon: React.JSX.Element;
}

// --- Data ---
const SERVICES: Service[] = [
  {
    id: 's1',
    num: '01',
    title: 'Produção Audiovisual',
    desc: 'Captação de imagem e áudio de alta qualidade para comerciais, cursos e redes sociais. Transformamos ideias em narrativas visuais poderosas.',
    icon: <Play className="w-6 h-6" />,
  },
  {
    id: 's2',
    num: '02',
    title: 'Roteirização Estratégica',
    desc: 'Desenvolvimento de roteiros profissionais focados em persuasão e engajamento, garantindo que sua mensagem seja clara e memorável.',
    icon: <Activity className="w-6 h-6" />,
  },
  {
    id: 's3',
    num: '03',
    title: 'Fotografia Profissional',
    desc: 'Ensaios corporativos, de eventos e lifestyle com olhar artístico e técnico para elevar a percepção de valor da sua marca pessoal ou empresa.',
    icon: <Users className="w-6 h-6" />,
  },
  {
    id: 's4',
    num: '04',
    title: 'Posicionamento e Social Media',
    desc: 'Gestão estratégica de redes sociais e construção de autoridade digital. Esteja no topo do mundo digital com um posicionamento de elite.',
    icon: <ShieldCheck className="w-6 h-6" />,
  },
  {
    id: 's5',
    num: '05',
    title: 'Sites e SEO (Google Top)',
    desc: 'Criação de ecossistemas digitais de alta performance. Colocamos sua empresa no topo das buscas do Google para atrair clientes qualificados.',
    icon: <Monitor className="w-6 h-6" />,
  },
  {
    id: 's6',
    num: '06',
    title: 'Vendas Automáticas c/ IA',
    desc: 'O sistema definitivo para Médicos e Clínicas. Nossa tecnologia capta, categoriza e agenda pacientes via IA de forma 100% automatizada.',
    icon: <Zap className="w-6 h-6" />,
  },
];

const PORTFOLIO: PortfolioItem[] = [];

interface MediaItem {
  id: string;
  type: 'video' | 'image';
  src: string;
  thumb?: string;
  title?: string;
}

const WORK_VIDEOS: MediaItem[] = [
  { id: 'wv1', type: 'video', src: 'meZvz_y8hLE', title: 'Trabalho 1' },
  { id: 'wv2', type: 'video', src: 'SfQAn5zdXEA', title: 'Trabalho 2' },
  { id: 'wv3', type: 'video', src: 'ViccFmQvDJM', title: 'Trabalho 3' },
  { id: 'wv4', type: 'video', src: 'P7X2SdM8wnw', title: 'Trabalho 4' },
  { id: 'wv5', type: 'video', src: 'Hq_NDDBamcE', title: 'Trabalho 5' },
];

const CAPTURES_VIDEOS: MediaItem[] = [
  { id: 'cv1', type: 'video', src: 'ws-KiUkqdaU', title: 'Captação 1' },
  { id: 'cv2', type: 'video', src: 'Kb4DDJUSqTc', title: 'Captação 2' },
  { id: 'cv3', type: 'video', src: '1nufIhTsOHQ', title: 'Captação 3' },
];

const TESTIMONIAL_VIDEOS: MediaItem[] = [
  { id: 'tv1', type: 'video', src: 'Cb7Bl_GKeF0', title: 'Depoimento 1' },
  { id: 'tv2', type: 'video', src: 'LTs37utql-s', title: 'Depoimento 2' },
];

const ENGAGEMENT_PHOTOS: MediaItem[] = [
  { id: 'ep1', type: 'image', src: '13K_OorsON-Z-DAp3WcEs07JFl2f5bofQ' },
  { id: 'ep2', type: 'image', src: '10pyvMcCFDn9aLkO22sETy0HvU-393r77' },
  { id: 'ep3', type: 'image', src: '1lanrVfu85TUd-Rx0TuI5cYxRyRG5jLiI' },
  { id: 'ep4', type: 'image', src: '1kWe9qI5vaZF98Z6_oWEVIciYTaWIixbi' },
  { id: 'ep5', type: 'image', src: '1dMyoET2Jw1wAfkYGYvslmEG1BU_aE1Q7' },
];

const FIFTEEN_PHOTOS: MediaItem[] = [
  { id: 'ff1', type: 'image', src: '1x61-Elre5aHT-1Wzu1TIRa1re9Pi2zLD' },
  { id: 'ff2', type: 'image', src: '1VUiWJ-rkBmmIwOK3hy9tgffQNaYtnnkQ' },
  { id: 'ff3', type: 'image', src: '1_36LXO-20a13ezaISOJYm4TVkeXSk1U_' },
  { id: 'ff4', type: 'image', src: '1dlRaNaMgzB4U4Xp76oPb3h1hWAhG8UXk' },
];

const TESTIMONIALS: Testimonial[] = [
  { id: 't1', text: '"A For You Agency transformou completamente nosso processo de atendimento. Com o bot no WhatsApp, economizamos horas e triplicamos a taxa de conversão. Resultado excepcional."', author: 'Marcos Rodrigues', role: 'CEO · Rodrigues Imóveis', avatar: 'MR', avatarColor: 'from-accent to-accent2' },
  { id: 't2', text: '"O site que eles criaram para a minha loja superou todas as expectativas. O design é incrível, o carregamento é rápido e as vendas aumentaram 240% em dois meses."', author: 'Juliana Santos', role: 'Fundadora · Estilo Único Store', avatar: 'JS', avatarColor: 'from-[#5BE5FF] to-[#3bb5d0]' },
  { id: 't3', text: '"Profissionalismo impecável do início ao fim. O atendimento é rápido, a entrega foi no prazo e o resultado ficou muito acima do esperado. Recomendo sem hesitar."', author: 'Carlos Almeida', role: 'Diretor · Almeida Consultoria', avatar: 'CA', avatarColor: 'from-[#f7971e] to-[#ffd200]' },
  { id: 't4', text: '"A automação do nosso funil de vendas foi um divisor de águas. Hoje captamos leads 24h por dia sem precisar de uma equipe grande. A For You entregou exatamente o que prometeu."', author: 'Patricia Lima', role: 'CMO · Nexus Digital', avatar: 'PL', avatarColor: 'from-[#da22ff] to-[#9733ee]' },
  { id: 't5', text: '"Contratei a For You para criar meu site e bot e foi a melhor decisão do ano. Meu negócio cresceu 180% nos primeiros 3 meses após a implementação. Equipe incrível!"', author: 'Rafael Ferreira', role: 'Empreendedor · RF Cursos Online', avatar: 'RF', avatarColor: 'from-[#11998e] to-[#38ef7d]' },
];

const DIFFERENTIALS: Differential[] = [
  { id: 'd1', title: 'Atendimento Ultrarrápido', text: 'Respondemos em até 2 horas e resolvemos sem burocracia. Seu tempo é precioso para nós.', icon: <Zap className="w-5 h-5" /> },
  { id: 'd2', title: 'Foco em Resultados', text: 'Cada decisão tomada com base em dados e orientada ao retorno sobre o seu investimento.', icon: <CheckCircle2 className="w-5 h-5" /> },
  { id: 'd3', title: 'Design Exclusivo', text: 'Sem templates prontos. Cada projeto criado do zero, personalizado para a identidade da sua marca.', icon: <Monitor className="w-5 h-5" /> },
  { id: 'd4', title: 'Entrega no Prazo', text: 'Cronograma respeitado em 100% dos projetos. Planejamento sério, execução impecável.', icon: <Activity className="w-5 h-5" /> },
  { id: 'd5', title: 'Tecnologia de Ponta', text: 'Utilizamos as ferramentas mais modernas do mercado para automação, IA e desenvolvimento web.', icon: <ShieldCheck className="w-5 h-5" /> },
  { id: 'd6', title: 'Suporte Dedicado', text: 'Acompanhamos você após a entrega. Não somos fornecedores, somos parceiros de crescimento.', icon: <Users className="w-5 h-5" /> },
  { id: 'd7', title: 'Custo-Benefício Real', text: 'Qualidade premium com preço justo. Investimento que se paga rapidamente com os resultados gerados.', icon: <DollarSign className="w-5 h-5" /> },
  { id: 'd8', title: 'Análise de Métricas', text: 'Relatórios claros e objetivos. Você sempre sabe o que está acontecendo com seu investimento.', icon: <BarChart3 className="w-5 h-5" /> },
];

// --- Components ---

const VideoItem = ({ src, title }: { src: string; title?: string }) => {
  const [isMuted, setIsMuted] = useState(true);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const toggleMute = () => {
    const nextMuteState = !isMuted;
    setIsMuted(nextMuteState);
    
    if (iframeRef.current?.contentWindow) {
      const command = nextMuteState ? 'mute' : 'unMute';
      iframeRef.current.contentWindow.postMessage(
        JSON.stringify({ event: 'command', func: command, args: '' }),
        '*'
      );
      // Garantir que o vídeo continue tocando após o comando
      iframeRef.current.contentWindow.postMessage(
        JSON.stringify({ event: 'command', func: 'playVideo', args: '' }),
        '*'
      );
    }
  };

  return (
    <div 
      className="w-full h-full relative cursor-pointer group overflow-hidden bg-black" 
      onClick={toggleMute}
    >
      <iframe 
        ref={iframeRef}
        src={`https://www.youtube.com/embed/${src}?controls=0&modestbranding=1&rel=0&loop=1&playlist=${src}&autoplay=1&mute=1&playsinline=1&enablejsapi=1&iv_load_policy=3&showinfo=0&disablekb=1&fs=0`}
        className="w-[120%] h-[120%] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none object-cover"
        title={title}
        allow="autoplay; encrypted-media; picture-in-picture"
        allowFullScreen
      />
      
      {/* Indicador de Som */}
      <div className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white transition-all hover:scale-110 active:scale-95 shadow-lg">
        {isMuted ? (
          <VolumeX className="w-5 h-5 opacity-80" />
        ) : (
          <Volume2 className="w-5 h-5 text-accent animate-pulse" />
        )}
      </div>

      {/* Camada de Toque */}
      <div className="absolute inset-0 z-10" />
      
      {/* Label Informativa em Hover */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 px-4 py-2 rounded-xl bg-black/70 backdrop-blur-md text-[0.65rem] font-ui font-bold uppercase tracking-[0.15em] text-white opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0 whitespace-nowrap pointer-events-none border border-white/5 shadow-2xl">
        Toque para {isMuted ? 'OUVIR' : 'MUTAR'}
      </div>
    </div>
  );
};

const SectionTag = ({ children, size = 'default' }: { children: React.ReactNode, size?: 'default' | 'large' }) => (
  <div className={`inline-flex items-center gap-2.5 font-ui font-bold tracking-[0.14em] uppercase text-accent mb-5 ${size === 'large' ? 'text-[0.9rem]' : 'text-[0.72rem]'}`}>
    <div className={`bg-accent ${size === 'large' ? 'w-8 h-[2px]' : 'w-6 h-[1.5px]'}`} />
    {children}
  </div>
);

const SectionTitle = ({ title, em }: { title: string; em?: string }) => (
  <h2 className="font-display text-[clamp(1.85rem,5vw,3.5rem)] font-normal leading-[1.18] tracking-tight mb-5 px-1 sm:px-0">
    {title} {em && <em className="italic font-light text-muted break-words sm:break-normal">{em}</em>}
  </h2>
);

const MediaCarousel = ({ title, items, tag }: { title?: string; items: MediaItem[]; tag: string }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    if (scrollRef.current) {
      setCanScrollLeft(scrollRef.current.scrollLeft > 10);
      setCanScrollRight(
        scrollRef.current.scrollLeft < scrollRef.current.scrollWidth - scrollRef.current.clientWidth - 10
      );
    }
  };

  const scroll = (dir: 'left' | 'right') => {
    if (scrollRef.current) {
      const amount = scrollRef.current.clientWidth * 0.8;
      scrollRef.current.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' });
    }
  };

  return (
    <div className="mb-20 last:mb-0">
      <div className="flex justify-between items-end mb-8">
        <div>
          <SectionTag size={tag === 'Showcase' ? 'large' : 'default'}>{tag}</SectionTag>
          {title && <h3 className="font-display text-2xl sm:text-3xl tracking-tight">{title}</h3>}
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => scroll('left')}
            disabled={!canScrollLeft}
            className="w-10 h-10 rounded-full border border-border bg-surface flex items-center justify-center hover:border-accent hover:bg-accent/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button 
            onClick={() => scroll('right')}
            disabled={!canScrollRight}
            className="w-10 h-10 rounded-full border border-border bg-surface flex items-center justify-center hover:border-accent hover:bg-accent/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div 
        ref={scrollRef}
        onScroll={checkScroll}
        className="flex gap-4 sm:gap-6 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-4 px-[5%] sm:px-0"
      >
        {items.map((item) => (
          <div 
            key={item.id} 
            className={`flex-shrink-0 snap-center bg-surface border border-border rounded-2xl overflow-hidden relative group ${item.type === 'video' ? 'w-[240px] sm:w-[280px] aspect-[9/16]' : 'w-[280px] sm:w-[320px] aspect-[3/4]'}`}
          >
            {item.type === 'video' ? (
              <VideoItem src={item.src} title={item.title} />
            ) : (
              <img 
                src={`https://lh3.googleusercontent.com/d/${item.src}`}
                alt="Fotos"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                referrerPolicy="no-referrer"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-bg/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        ))}
      </div>
    </div>
  );
};

export default function App() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [ringPos, setRingPos] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  
  const videoSliderRef = useRef<HTMLDivElement>(null);
  const testimonialsTrackRef = useRef<HTMLDivElement>(null);

  // Custom Cursor
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    const followMouse = () => {
      setRingPos(prev => ({
        x: prev.x + (mousePos.x - prev.x) * 0.12,
        y: prev.y + (mousePos.y - prev.y) * 0.12,
      }));
      requestAnimationFrame(followMouse);
    };
    const raf = requestAnimationFrame(followMouse);
    return () => cancelAnimationFrame(raf);
  }, [mousePos]);

  // Scroll effect
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Testimonials auto-scroll
  useEffect(() => {
    const interval = setInterval(() => {
      if (testimonialsTrackRef.current) {
        const track = testimonialsTrackRef.current;
        const cardWidth = track.firstElementChild ? (track.firstElementChild as HTMLElement).offsetWidth + 16 : 0;
        const maxScroll = track.scrollWidth - track.clientWidth;
        
        if (track.scrollLeft + cardWidth >= maxScroll - 5) {
          track.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          track.scrollBy({ left: cardWidth, behavior: 'smooth' });
        }
      }
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const scrollVideo = (direction: 'left' | 'right') => {
    if (videoSliderRef.current) {
      const cardWidth = videoSliderRef.current.firstElementChild ? (videoSliderRef.current.firstElementChild as HTMLElement).offsetWidth + 24 : 0;
      videoSliderRef.current.scrollBy({ left: direction === 'left' ? -cardWidth : cardWidth, behavior: 'smooth' });
    }
  };

  const handleLinkClick = () => setMobileMenuOpen(false);

  return (
    <div className="relative min-h-screen selection:bg-accent selection:text-bg overflow-x-hidden">
      {/* Custom Cursor */}
      <div 
        className="fixed w-2.5 h-2.5 bg-accent rounded-full pointer-events-none z-[9999] -translate-x-1/2 -translate-y-1/2 mix-blend-screen transition-transform duration-100 hidden md:block"
        style={{ left: mousePos.x, top: mousePos.y }}
      />
      <div 
        className="fixed border-[1.5px] border-accent rounded-full pointer-events-none z-[9998] -translate-x-1/2 -translate-y-1/2 opacity-50 transition-[width,height,opacity] duration-300 hidden md:block"
        style={{ 
          left: ringPos.x, 
          top: ringPos.y,
          width: isHovering ? 60 : 36,
          height: isHovering ? 60 : 36,
          opacity: isHovering ? 0.8 : 0.5
        }}
      />

      {/* Noise Overlay */}
      <div className="fixed inset-0 pointer-events-none z-[1000] opacity-[0.025] bg-[url('data:image/svg+xml,%3Csvg_viewBox=%270_0_200_200%27_xmlns=%27http://www.w3.org/2000/svg%27%3E%3Cfilter_id=%27n%27%3E%3CfeTurbulence_type=%27fractalNoise%27_baseFrequency=%270.9%27_numOctaves=%274%27_stitchTiles=%27stitch%27/%3E%3C/filter%3E%3Crect_width=%27100%25%27_height=%27100%25%27_filter=%27url(%23n)%27_opacity=%271%27/%3E%3C/svg%3E')]" />

      {/* WhatsApp Float */}
      <a 
        href="https://wa.me/5522988356209?text=Olá! Vim pelo site e gostaria de solicitar um orçamento." 
        target="_blank" 
        rel="noreferrer"
        className="fixed bottom-7 right-7 z-[400] w-14 h-14 rounded-full bg-gradient-to-br from-[#25D366] to-[#128C7E] flex items-center justify-center shadow-[0_8px_30px_rgba(37,211,102,0.4)] transition-all hover:scale-110 hover:shadow-[0_12px_40px_rgba(37,211,102,0.55)] group animate-pulse"
      >
        <span className="absolute right-[68px] bg-surface border border-border px-3.5 py-2 rounded-xl font-ui text-[0.78rem] font-semibold whitespace-nowrap opacity-0 translate-x-2 pointer-events-none transition-all group-hover:opacity-100 group-hover:translate-x-0 shadow-xl">
          Falar no WhatsApp
        </span>
        <svg className="text-white w-7 h-7 fill-current" viewBox="0 0 24 24">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
        </svg>
      </a>

      {/* Video Modal */}
      <AnimatePresence>
        {videoModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[800] bg-black/85 backdrop-blur-md flex items-center justify-center p-5"
            onClick={() => setVideoModalOpen(false)}
          >
            <motion.div 
              initial={{ scale: 0.92 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.92 }}
              className="bg-surface border border-border rounded-[24px] w-full max-w-3xl overflow-hidden relative"
              onClick={e => e.stopPropagation()}
            >
              <button 
                className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                onClick={() => setVideoModalOpen(false)}
              >
                <X className="w-5 h-5" />
              </button>
              <div className="aspect-video bg-black flex items-center justify-center">
                <div className="flex flex-col gap-4 items-center text-muted font-ui text-sm text-center p-10">
                  <div className="w-20 h-20 rounded-full bg-accent/15 border-2 border-accent/30 flex items-center justify-center">
                    <Play className="text-accent fill-accent w-8 h-8" />
                  </div>
                  <p>Adicione aqui a URL do seu vídeo do YouTube ou Vimeo.<br />Substitua esta seção pelo embed desejado.</p>
                  <code className="text-[0.75rem] text-accent bg-accent/10 px-3.5 py-2 rounded-lg">
                    &lt;iframe src="URL_DO_VIDEO"&gt;&lt;/iframe&gt;
                  </code>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navbar */}
      <nav className={`fixed top-0 left-0 right-0 z-[500] px-[5%] transition-all duration-500 flex items-center justify-between ${scrolled ? 'bg-bg/85 backdrop-blur-xl py-3.5 border-b border-border' : 'py-5'}`}>
        <a href="#hero" className="flex items-center gap-3 transition-opacity hover:opacity-80" onMouseEnter={() => setIsHovering(true)} onMouseLeave={() => setIsHovering(false)}>
          <img 
            src="https://lh3.googleusercontent.com/d/1JT7Pc-SJOYcHQyNMtxyg7t17m4OX7DAt" 
            alt="For You Agency" 
            className="h-14 w-auto md:h-20 object-contain"
            referrerPolicy="no-referrer"
          />
        </a>
        
        <ul className="hidden md:flex items-center gap-9 font-ui text-[0.85rem] font-medium tracking-widest uppercase">
          {[
            { name: 'Início', href: '#hero' },
            { name: 'Sobre Nós', href: '#sobre' },
            { name: 'Serviços', href: '#servicos' },
            { name: 'Contato', href: '#cta' }
          ].map((item) => (
            <li key={item.name}>
              <a 
                href={item.href} 
                className="text-muted hover:text-white transition-colors relative group"
                onMouseEnter={() => setIsHovering(true)}
                onMouseLeave={() => setIsHovering(false)}
              >
                {item.name}
                <span className="absolute -bottom-1 left-0 right-0 h-[1px] bg-accent scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
              </a>
            </li>
          ))}
          <li>
            <a 
              href="https://wa.me/5522988356209?text=Olá! Vim pelo site e gostaria de solicitar um orçamento." 
              target="_blank" 
              rel="noreferrer"
              className="bg-accent text-bg px-5.5 py-2.5 rounded-full font-bold text-[0.82rem] hover:bg-white hover:shadow-[0_0_30px_rgba(125,249,194,0.4)] hover:-translate-y-0.5 transition-all flex items-center gap-2 animate-pulse"
              onMouseEnter={() => setIsHovering(true)}
              onMouseLeave={() => setIsHovering(false)}
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
              </svg>
              Solicitar Orçamento
            </a>
          </li>
        </ul>

        <button 
          className="md:hidden flex flex-col gap-1.5 p-1"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <span className={`block w-6 h-0.5 bg-white transition-all ${mobileMenuOpen ? 'translate-y-2 rotate-45' : ''}`} />
          <span className={`block w-6 h-0.5 bg-white transition-all ${mobileMenuOpen ? 'opacity-0' : ''}`} />
          <span className={`block w-6 h-0.5 bg-white transition-all ${mobileMenuOpen ? '-translate-y-2 -rotate-45' : ''}`} />
        </button>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
            animate={{ opacity: 1, backdropFilter: 'blur(20px)' }}
            exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
            className="fixed inset-0 z-[490] bg-bg/95 flex flex-col items-center justify-center gap-8 font-ui text-xl sm:text-2xl font-bold uppercase tracking-widest p-10 text-center"
          >
            {[
              { name: 'Início', href: '#hero' },
              { name: 'Sobre Nós', href: '#sobre' },
              { name: 'Serviços', href: '#servicos' },
              { name: 'Contato', href: '#cta' }
            ].map((item) => (
              <a key={item.name} href={item.href} onClick={handleLinkClick} className="text-muted hover:text-accent transition-colors">
                {item.name}
              </a>
            ))}
            <a 
              href="https://wa.me/5522988356209?text=Olá! Vim pelo site e gostaria de solicitar um orçamento." 
              target="_blank" 
              rel="noreferrer" 
              className="bg-gradient-to-br from-[#25D366] to-[#128C7E] flex items-center gap-3 px-6 py-4 rounded-full text-white font-bold shadow-lg shadow-[#25D366]/20 transition-all hover:scale-105 text-lg sm:text-xl"
            >
              <MessageCircle className="w-6 h-6" />
              Solicitar Orçamento
            </a>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Section */}
      <section id="hero" className="relative min-h-svh grid place-items-center px-[5%] pt-[120px] pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_60%_40%,rgba(125,249,194,0.07)_0%,transparent_60%),radial-gradient(ellipse_60%_50%_at_20%_70%,rgba(91,229,255,0.05)_0%,transparent_50%)] bg-bg" />
        <div className="absolute inset-0 hero-grid-lines" />
        
        <motion.div 
          animate={{ y: [0, -30, 0], scale: [1, 1.05, 1] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-[100px] -right-[100px] w-[600px] h-[600px] rounded-full blur-[80px] pointer-events-none bg-radial-gradient from-accent/10 to-transparent"
        />
        <motion.div 
          animate={{ y: [0, 30, 0], scale: [1, 1.05, 1] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -bottom-[50px] -left-[80px] w-[400px] h-[400px] rounded-full blur-[80px] pointer-events-none bg-radial-gradient from-accent2/10 to-transparent"
        />

        <div className="relative z-10 max-w-[900px] text-center">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-9 h-10"
          >
            {/* Espaçador para manter o layout */}
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="relative font-display text-[clamp(2.5rem,7vw,5.5rem)] font-light leading-[1.08] tracking-tight mb-7"
          >

            Transforme Seguidores em <br />
            <motion.strong 
              className="relative font-semibold italic inline-block bg-gradient-to-br from-accent to-accent2 bg-clip-text text-transparent"
              animate={{ 
                scale: [1, 1.05, 1],
                filter: ["brightness(1)", "brightness(1.5)", "brightness(1)"],
              }}
              transition={{ 
                duration: 2, 
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              Autoridade e Lucro
            </motion.strong>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-[clamp(1rem,2vw,1.15rem)] text-muted max-w-[750px] mx-auto mb-10 font-light"
          >
            Sua marca não precisa apenas aparecer; ela precisa liderar o mercado. Posicionamento estratégico e engajamento que transformam audiência em uma potência digital.
          </motion.p>


          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 px-4"
          >
            <a 
              href="https://wa.me/5522988356209?text=Olá! Vim pelo site e gostaria de solicitar um orçamento." 
              target="_blank" 
              rel="noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 bg-accent text-bg font-ui font-bold text-[1rem] tracking-tight px-10 py-5 rounded-full hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(125,249,194,0.3)] transition-all active:scale-95 animate-pulse"
              onMouseEnter={() => setIsHovering(true)}
              onMouseLeave={() => setIsHovering(false)}
            >
              <svg className="w-5.5 h-5.5 fill-current" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
              </svg>
              Solicitar Orçamento
            </a>
            <a 
              href="#servicos" 
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 text-white font-ui font-semibold text-[1rem] tracking-tight px-9 py-5 rounded-full border border-border hover:border-white/20 hover:bg-white/5 transition-all active:scale-95"
              onMouseEnter={() => setIsHovering(true)}
              onMouseLeave={() => setIsHovering(false)}
            >
              Ver serviços
              <ArrowRight className="w-4 h-4" />
            </a>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex justify-center gap-x-10 gap-y-10 mt-20 pt-15 border-t border-border flex-wrap"
          >
            {[
              { num: '120', label: 'Projetos Entregues', accent: true },
              { num: '98', label: 'Satisfação dos Clientes', suffix: '%' },
              { num: '3x', label: 'ROI Médio Gerado', accent: true },
              { num: '24', label: 'Suporte Disponível', suffix: 'h' },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="font-display text-[clamp(2rem,4vw,3rem)] font-semibold leading-none bg-gradient-to-br from-white to-muted bg-clip-text text-transparent">
                  {stat.accent && <span className="text-accent">+</span>}
                  <span className={stat.accent ? 'text-accent' : ''}>{stat.num}</span>
                  {stat.suffix && <span className={stat.accent ? 'text-accent' : ''}>{stat.suffix}</span>}
                </div>
                <div className="text-[0.8rem] text-muted uppercase tracking-widest mt-1.5 font-ui font-medium">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Showcase Premium Section */}
      <section id="showcase" className="py-[clamp(60px,10vw,120px)] px-[5%]">
        <div className="max-w-[1200px] mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <SectionTag>Premium Showcase</SectionTag>
            <SectionTitle title="Mergulhe em nossa" em="excelência visual" />
            <p className="text-muted text-[1.05rem] max-w-[600px] mx-auto font-light">
              Conteúdos captados com máxima qualidade, otimizados para uma imersão completa em cada detalhe.
            </p>
          </motion.div>

          <MediaCarousel items={WORK_VIDEOS} tag="Showcase" />
          <MediaCarousel title="Por Trás das Câmeras" items={CAPTURES_VIDEOS} tag="Produção" />
          <MediaCarousel title="Ensaios de Noivado" items={ENGAGEMENT_PHOTOS} tag="Fotografia" />
          <MediaCarousel title="Ensaios 15 Anos" items={FIFTEEN_PHOTOS} tag="Fotografia" />
          <MediaCarousel title="Depoimentos e Resultados" items={TESTIMONIAL_VIDEOS} tag="Prova Social" />
        </div>
      </section>

      {/* Tecnologia Section */}
      <section className="py-[clamp(60px,10vw,120px)] px-[5%] border-b border-border">
        <div className="max-w-[900px] mx-auto text-center">
          <h2 className="font-display text-[clamp(2.5rem,7vw,5.5rem)] font-light leading-[1.08] tracking-tight mb-7">
            Líder em Tecnologia: <br />
            <strong className="font-semibold italic bg-gradient-to-br from-accent to-accent2 bg-clip-text text-transparent">Vendas Automáticas<br />para Médicos e Clínicas</strong>
          </h2>
          <p className="text-[clamp(1rem,2vw,1.15rem)] text-muted max-w-[750px] mx-auto font-light">
            Investimos em tecnologia de ponta para criar o ecossistema definitivo. Nosso sistema recebe, categoriza, responde com IA e entrega o paciente agendado de forma 100% automatizada. A melhor estratégia do mercado para converter anúncios em lucro real.
          </p>
        </div>
      </section>

      {/* Sobre Section */}
      <section id="sobre" className="bg-bg2 py-[clamp(60px,10vw,120px)] px-[5%]">
        <div className="max-w-[1200px] mx-auto grid md:grid-cols-2 gap-20 items-center">
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative aspect-[4/5] max-h-[560px] rounded-[24px] overflow-hidden bg-surface border border-border"
          >
            <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(125,249,194,0.06)_0%,transparent_50%),radial-gradient(circle_at_30%_80%,rgba(91,229,255,0.08),transparent_60%)]" />
            <div className="absolute top-0 left-0 right-0 h-1/2 bg-[repeating-linear-gradient(0deg,transparent,transparent_30px,rgba(255,255,255,0.03)_30px,rgba(255,255,255,0.03)_31px)]" />
            
            <div className="absolute top-7.5 right-7.5 w-[120px] h-[120px] border border-accent/20 rounded-full flex items-center justify-center">
              <div className="w-20 h-20 border border-accent/10 rounded-full" />
              <Star className="w-8 h-8 text-accent/50 absolute" strokeWidth={1.5} />
            </div>

            <svg className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-15 w-[70%] h-auto" viewBox="0 0 200 120" fill="none">
              <polyline points="0,100 30,80 60,60 90,40 120,55 150,20 200,10" stroke="url(#g1)" strokeWidth="2" fill="none" />
              <defs>
                <linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#7DF9C2" />
                  <stop offset="100%" stopColor="#5BE5FF" />
                </linearGradient>
              </defs>
              <circle cx="150" cy="20" r="5" fill="rgba(125,249,194,0.8)" />
            </svg>

            <div className="absolute inset-0 flex flex-col justify-end p-9">
              <div className="bg-accent/5 border border-accent/15 rounded-2xl p-6 backdrop-blur-md relative z-10">
                <div className="font-display text-5xl font-semibold leading-none bg-gradient-to-br from-accent to-accent2 bg-clip-text text-transparent">+120</div>
                <div className="text-[0.8rem] text-muted font-ui font-medium mt-1">Projetos realizados com sucesso</div>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.15 }}
          >
            <SectionTag>Sobre a Agência</SectionTag>
            <SectionTitle title="Tecnologia a serviço" em="do seu crescimento" />
            <p className="text-muted text-[1.05rem] leading-[1.75] max-w-[560px] font-light mb-4">
              A <strong className="text-white">For You Agency</strong> nasceu da convicção de que toda empresa merece uma presença digital à altura do seu potencial. Combinamos design sofisticado, automação inteligente e estratégia de marketing para entregar resultados reais e mensuráveis.
            </p>
            <p className="text-muted text-[1.05rem] leading-[1.75] max-w-[560px] font-light">
              Somos especialistas em transformar processos complexos em soluções simples, eficientes e escaláveis — do primeiro contato ao pós-venda automatizado.
            </p>

            <div className="grid grid-cols-2 gap-4 mt-10">
              {[
                { icon: <CheckCircle2 className="w-5 h-5 text-accent" />, title: 'Foco em Resultados', text: 'Cada projeto entregue com métricas claras de ROI' },
                { icon: <Zap className="w-5 h-5 text-accent" />, title: 'Entrega Ágil', text: 'Prazos cumpridos sem abrir mão da qualidade' },
                { icon: <Activity className="w-5 h-5 text-accent" />, title: 'Tecnologia Moderna', text: 'Ferramentas de ponta para automação e IA' },
                { icon: <Users className="w-5 h-5 text-accent" />, title: 'Parceria Real', text: 'Suporte dedicado e relacionamento de longo prazo' },
              ].map((item, i) => (
                <div key={i} className="bg-surface border border-border rounded-xl p-5 transition-all hover:border-accent/30 hover:-translate-y-0.5 group">
                  <div className="mb-2.5">{item.icon}</div>
                  <div className="font-ui font-bold text-[0.85rem] mb-1 group-hover:text-accent transition-colors">{item.title}</div>
                  <div className="text-[0.8rem] text-muted leading-relaxed">{item.text}</div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>
      {/* Serviços Section */}
      <section id="servicos" className="pt-[clamp(60px,10vw,120px)] pb-2.5 px-[5%]">
        <div className="max-w-[1200px] mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
            <motion.div 
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <SectionTag>O que fazemos</SectionTag>
              <SectionTitle title="Soluções completas" em="para o seu negócio" />
            </motion.div>
            <motion.p 
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-muted text-[1.05rem] leading-[1.75] max-w-[320px] md:text-right font-light"
            >
              Da criação do site ao atendimento automatizado — tudo integrado para maximizar seus resultados.
            </motion.p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {SERVICES.map((service, i) => (
              <motion.div 
                key={service.id}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="bg-surface border border-border rounded-xl p-9 relative overflow-hidden transition-all hover:border-accent/30 hover:-translate-y-1.5 hover:shadow-[0_30px_60px_rgba(0,0,0,0.4)] group"
                onMouseEnter={() => setIsHovering(true)}
                onMouseLeave={() => setIsHovering(false)}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <span className="font-display text-[4rem] font-light text-white/5 leading-none absolute top-6 right-7">{service.num}</span>
                <div className="w-[52px] h-[52px] bg-accent/10 border border-accent/15 rounded-xl flex items-center justify-center mb-7 group-hover:bg-accent/20 group-hover:border-accent/35 transition-colors">
                  <div className="text-accent">{service.icon}</div>
                </div>
                <h3 className="font-ui font-bold text-[1.1rem] mb-3.5 tracking-tight">{service.title}</h3>
                <p className="text-[0.9rem] text-muted leading-[1.65] font-light">{service.desc}</p>
                <div className="inline-flex items-center gap-1.5 text-accent font-ui text-[0.8rem] font-semibold mt-6 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all">
                  Saiba mais
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Portfólio Section */}
      <section id="portfolio" className="bg-bg2 py-2.5 px-[5%]">
        <div className="max-w-[1200px] mx-auto">
          <div className="grid grid-cols-12 gap-5">
            {PORTFOLIO.map((item, i) => (
              <motion.div 
                key={item.id}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className={`relative rounded-[20px] overflow-hidden bg-surface border border-border aspect-[4/3] transition-all duration-500 hover:scale-[0.98] hover:shadow-[0_40px_80px_rgba(0,0,0,0.6)] group cursor-pointer ${
                  i === 0 ? 'col-span-12 md:col-span-7' : 
                  i === 1 ? 'col-span-12 md:col-span-5' : 
                  'col-span-12 md:col-span-4'
                }`}
                onMouseEnter={() => setIsHovering(true)}
                onMouseLeave={() => setIsHovering(false)}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${item.color} transition-transform duration-700 group-hover:scale-[1.06]`}>
                  {item.image && (
                    <img 
                      src={item.image} 
                      alt={item.name} 
                      className="w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity"
                      referrerPolicy="no-referrer"
                    />
                  )}
                </div>

                <div className="absolute inset-0 bg-bg/80 flex flex-col items-center justify-center gap-4 text-center p-6 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="font-ui text-[0.7rem] font-semibold tracking-widest uppercase text-accent bg-accent/10 border border-accent/20 px-3.5 py-1 rounded-full">{item.tag}</span>
                  <span className="font-ui font-bold text-[1.1rem]">{item.name}</span>
                  <a 
                    href={item.url || "#"} 
                    target={item.url ? "_blank" : "_self"}
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 bg-accent text-bg font-ui font-bold text-[0.8rem] px-5 py-2.5 rounded-full hover:scale-105 transition-transform"
                    onClick={(e) => !item.url && e.preventDefault()}
                  >
                    Ver Projeto
                    <ArrowRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Depoimentos Section */}
      <section id="depoimentos" className="bg-bg2 py-[clamp(60px,10vw,120px)] px-[5%]">
        <div className="max-w-[1200px] mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <SectionTag>Prova Social</SectionTag>
            <SectionTitle title="O que nossos clientes" em="dizem sobre nós" />
          </motion.div>

          <div 
            ref={testimonialsTrackRef}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-14 overflow-hidden"
          >
            {TESTIMONIALS.map((t) => (
              <div 
                key={t.id}
                className="bg-surface border border-border rounded-2xl p-5 relative overflow-hidden transition-all hover:border-accent/20 hover:-translate-y-1 group"
              >
                <div className="absolute -top-2.5 right-4 font-serif text-8xl leading-none text-accent/5 pointer-events-none">❝</div>
                <div className="flex gap-0.5 mb-2.5 text-accent text-[0.8rem]">
                  {[...Array(5)].map((_, i) => <Star key={i} className="w-3.5 h-3.5 fill-current" />)}
                </div>
                <p className="text-[0.82rem] text-muted leading-[1.6] font-light italic mb-4">{t.text}</p>
                <div className="flex items-center gap-2.5">
                  <div className={`w-8.5 h-8.5 rounded-full bg-gradient-to-br ${t.avatarColor} flex items-center justify-center font-ui font-extrabold text-[0.72rem] text-bg flex-shrink-0`}>
                    {t.avatar}
                  </div>
                  <div>
                    <div className="font-ui font-bold text-[0.8rem]">{t.author}</div>
                    <div className="text-[0.7rem] text-muted mt-0.5">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Diferenciais Section */}
      <section id="diferenciais" className="py-[clamp(60px,10vw,120px)] px-[5%]">
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center max-w-[560px] mx-auto mb-16">
            <motion.div 
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <div className="flex justify-center"><SectionTag>Por que nos escolher</SectionTag></div>
              <SectionTitle title="Diferenciais que" em="fazem a diferença" />
            </motion.div>
          </div>

          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border border-border rounded-[24px] overflow-hidden"
          >
            {DIFFERENTIALS.map((diff, i) => (
              <div 
                key={diff.id}
                className="p-10 bg-surface border-r border-b border-border transition-colors hover:bg-accent/5 relative group"
              >
                <div className="w-12 h-12 bg-accent/5 border border-accent/10 rounded-xl flex items-center justify-center mb-5 group-hover:bg-accent/12 transition-colors">
                  <div className="text-accent">{diff.icon}</div>
                </div>
                <div className="font-ui font-bold text-[1rem] mb-2.5">{diff.title}</div>
                <div className="text-[0.85rem] text-muted leading-[1.6] font-light">{diff.text}</div>
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-accent to-accent2 scale-x-0 origin-left group-hover:scale-x-100 transition-transform duration-500" />
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="cta" className="py-[clamp(60px,10vw,120px)] px-[5%]">
        <div className="max-w-[1200px] mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-surface border border-border rounded-[32px] py-[clamp(50px,8vw,100px)] px-[clamp(30px,6vw,80px)] relative overflow-hidden text-center"
          >
            <div className="absolute -top-[200px] -left-[100px] w-[500px] h-[500px] rounded-full blur-[100px] bg-accent/10 pointer-events-none" />
            <div className="absolute -bottom-[150px] -right-[100px] w-[400px] h-[400px] rounded-full blur-[100px] bg-accent2/5 pointer-events-none" />

            <div className="flex justify-center relative z-10"><SectionTag>Próximo passo</SectionTag></div>
            <h2 className="font-display text-[clamp(2rem,5vw,4.5rem)] font-normal leading-[1.1] tracking-tight mb-5 relative z-10">
              Pronto para levar<br />
              seu negócio ao<br />
              <strong className="font-semibold italic">próximo nível?</strong>
            </h2>
            <p className="text-muted text-[1.05rem] max-w-[480px] mx-auto mb-10 relative z-10 font-light">
              Fale conosco agora e descubra como podemos transformar sua presença digital em uma máquina de resultados.
            </p>

            <a 
              href="https://wa.me/5522988356209?text=Olá! Vim pelo site e gostaria de solicitar um orçamento." 
              target="_blank" 
              rel="noreferrer"
              className="inline-flex items-center gap-3 bg-gradient-to-br from-[#25D366] to-[#128C7E] text-white font-ui font-bold text-[1rem] px-9 py-4.5 rounded-full hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(37,211,102,0.3)] transition-all relative z-10 animate-pulse"
              onMouseEnter={() => setIsHovering(true)}
              onMouseLeave={() => setIsHovering(false)}
            >
              <svg className="w-5.5 h-5.5 fill-current" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
              </svg>
              Solicitar Orçamento Gratuito
            </a>

            <p className="text-muted text-[0.8rem] mt-5 relative z-10">
              Resposta garantida em até 2 horas · Sem compromisso
            </p>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-bg2 border-t border-border pt-15 px-[5%] pb-10">
        <div className="max-w-[1200px] mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr] gap-10 mb-15">
            <div className="col-span-2 lg:col-span-1">
              <img 
                src="https://lh3.googleusercontent.com/d/1JT7Pc-SJOYcHQyNMtxyg7t17m4OX7DAt" 
                alt="For You Agency" 
                className="h-10 w-auto mb-6 grayscale hover:grayscale-0 transition-all opacity-80 hover:opacity-100"
                referrerPolicy="no-referrer"
              />
              <p className="text-muted text-[0.875rem] leading-[1.65] max-w-[280px] font-light">Transformamos marcas em máquinas de resultados com design, tecnologia e estratégia de marketing digital.</p>
              <div className="flex gap-4 mt-8 flex-wrap">
                {[
                  { icon: <Instagram className="w-5 h-5" />, label: 'IG', href: 'https://www.instagram.com/for.youagency_?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==' },
                  { icon: <Linkedin className="w-5 h-5" />, label: 'LI', href: '#' },
                  { icon: <Facebook className="w-5 h-5" />, label: 'FB', href: '#' },
                  { icon: <Youtube className="w-5 h-5" />, label: 'YT', href: '#' },
                ].map((social, i) => (
                  <a 
                    key={i} 
                    href={social.href} 
                    target="_blank"
                    rel="noreferrer"
                    className="w-11 h-11 rounded-xl border border-border bg-surface flex items-center justify-center text-muted hover:border-accent hover:text-accent hover:bg-accent/5 transition-all active:scale-90"
                    onMouseEnter={() => setIsHovering(true)}
                    onMouseLeave={() => setIsHovering(false)}
                  >
                    {social.icon}
                  </a>
                ))}
              </div>
            </div>

            <div>
              <div className="font-ui font-bold text-[0.8rem] tracking-widest uppercase text-white mb-5">Serviços</div>
              <div className="flex flex-col gap-2.5">
                {['Sites Profissionais', 'Bots para WhatsApp', 'Automação', 'Marketing Digital', 'Landing Pages'].map((link) => (
                  <a key={link} href="#servicos" className="text-muted text-[0.875rem] hover:text-white transition-colors">{link}</a>
                ))}
              </div>
            </div>

            <div>
              <div className="font-ui font-bold text-[0.8rem] tracking-widest uppercase text-white mb-5">Empresa</div>
              <div className="flex flex-col gap-2.5">
                {['Sobre Nós', 'Portfólio', 'Clientes', 'Diferenciais', 'Contato'].map((link) => (
                  <a key={link} href={`#${link.toLowerCase().replace(' ', '-')}`} className="text-muted text-[0.875rem] hover:text-white transition-colors">{link}</a>
                ))}
              </div>
            </div>

            <div className="col-span-2 lg:col-span-1">
              <div className="font-ui font-bold text-[0.8rem] tracking-widest uppercase text-white mb-5">Contato</div>
              <div className="flex flex-col gap-2.5">
                <a href="https://wa.me/5522988356209?text=Olá! Gostaria de falar com um consultor." target="_blank" rel="noreferrer" className="text-muted text-[0.875rem] hover:text-white transition-colors">WhatsApp</a>
                <a href="mailto:contato@foryouagency.com" className="text-muted text-[0.875rem] hover:text-white transition-colors">E-mail</a>
                <a href="https://www.instagram.com/for.youagency_?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==" target="_blank" rel="noreferrer" className="text-muted text-[0.875rem] hover:text-white transition-colors">Instagram</a>
                <a href="#" className="text-muted text-[0.875rem] hover:text-white transition-colors">LinkedIn</a>
              </div>
              <div className="mt-6">
                <a 
                  href="https://wa.me/5522988356209?text=Olá! Vim pelo site e gostaria de falar com vocês." 
                  target="_blank" 
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 bg-[#25D366]/10 border border-[#25D366]/25 text-[#25D366] font-ui text-[0.78rem] font-bold px-4.5 py-2.5 rounded-full hover:bg-[#25D366]/20 transition-all animate-pulse"
                  onMouseEnter={() => setIsHovering(true)}
                  onMouseLeave={() => setIsHovering(false)}
                >
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
                  </svg>
                  Fale Conosco
                </a>
              </div>
            </div>
          </div>

          <div className="border-t border-border pt-8 flex flex-col sm:flex-row justify-between items-center gap-3">
            <p className="text-[0.8rem] text-muted">© 2025 <span className="text-accent">For You Agency</span>. Todos os direitos reservados.</p>
            <p className="text-[0.8rem] text-muted">Feito com ♥ e muita <span className="text-accent">tecnologia</span></p>
          </div>
        </div>
      </footer>
    </div>
  );
}

