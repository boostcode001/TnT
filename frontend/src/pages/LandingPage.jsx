import { useNavigate } from 'react-router-dom';

function GlobalNavBar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#1a1814]/80 backdrop-blur-sm border-b border-[#2e2b24] flex items-center px-6 h-14">
      <span className="font-bold text-[#f0ead8] text-lg tracking-tight">TnT</span>
    </nav>
  );
}

const FEATURES = [
  { emoji: '🎬', title: '영상 분석', desc: '씬 단위로 영상을 분석해 핵심 프레임을 자동으로 추출합니다' },
  { emoji: '🖼', title: '썸네일 생성', desc: 'AI가 클릭률을 높이는 최적의 썸네일 후보를 순위별로 제안합니다' },
  { emoji: '✍️', title: '제목 추천', desc: '썸네일에 어울리는 매력적인 유튜브 제목을 자동으로 생성합니다' },
];

function FeatureSection() {
  return (
    <section className="py-20 px-6">
      <p className="text-center text-[#a89880] text-sm uppercase tracking-wider mb-8">✨ 주요 기능</p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
        {FEATURES.map((f) => (
          <div key={f.title} className="bg-[#211f1a] border border-[#2e2b24] rounded-2xl p-6 hover:scale-[1.02] hover:shadow-lg hover:border-[#b5832a]/40 transition-all duration-200">
            <span className="text-3xl mb-4 block">{f.emoji}</span>
            <h3 className="text-[#f0ead8] font-semibold text-base mb-2">{f.title}</h3>
            <p className="text-[#7a6e5e] text-sm leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="bg-[#211f1a] border-t border-[#2e2b24] py-4 text-center">
      <p className="text-[#5a5048] text-xs">© 2025 TnT Project · SmartIT Capstone · 문의: team@tnt.dev</p>
    </footer>
  );
}

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#1a1814] flex flex-col">
      <GlobalNavBar />

      <section className="min-h-screen flex flex-col items-center justify-center gap-6 px-4 text-center pt-14">
        <h1 className="text-3xl font-bold text-[#f0ead8]">AI가 찾아주는 최적의 썸네일</h1>
        <p className="text-[#a89880] text-base">TnT · Thumbnail &amp; Title Factory</p>

        <button onClick={() => navigate('/dashboard')} className="bg-[#b5832a] hover:bg-[#c99235] text-[#1a1814] font-bold px-8 py-3 rounded-xl transition-colors">
          지금 무료로 시작하기 →
        </button>
      </section>

      <FeatureSection />
      <Footer />
    </div>
  );
}
