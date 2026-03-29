import { useState } from 'react';

const STEPS = [
  { emoji: '🎬', title: '영상 업로드',   desc: 'MP4, MOV, AVI 형식의 유튜브 영상을 업로드하세요.' },
  { emoji: '⚙️', title: 'AI 분석 대기', desc: 'AI가 영상을 분석해 최적의 썸네일 후보를 생성합니다.' },
  { emoji: '🏆', title: '결과 확인',     desc: '순위별 썸네일을 확인하고 PNG로 다운로드하세요.' },
];

const FAQS = [
  {
    q: '지원하는 영상 파일 형식은 무엇인가요?',
    a: 'MP4, MOV, AVI 형식을 지원하며 최대 500MB까지 업로드 가능합니다.',
  },
  {
    q: '썸네일 생성에 얼마나 걸리나요?',
    a: '영상 길이에 따라 다르지만 평균 30~60초 소요됩니다.',
  },
  {
    q: '생성된 썸네일은 어떻게 다운로드하나요?',
    a: "결과 페이지에서 썸네일 카드의 '다운로드' 버튼을 클릭하면 PNG 파일로 저장됩니다.",
  },
  {
    q: '분석 결과는 얼마나 저장되나요?',
    a: '현재는 세션 동안 유지됩니다. 영구 저장 기능은 추후 업데이트 예정입니다.',
  },
];

// ── 공통 섹션 래퍼 ─────────────────────────────────────────
function Section({ title, children }) {
  return (
    <div className="bg-[#2a2720]/50 rounded-2xl p-6 mb-4">
      <h2 className="text-sm font-semibold text-[#a89880] uppercase tracking-wider mb-4">
        {title}
      </h2>
      {children}
    </div>
  );
}

// ── FAQ 아코디언 항목 ──────────────────────────────────────
function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-left text-sm text-[#e8e0cc] hover:bg-[#35312a] transition-colors rounded-xl"
      >
        <span>{q}</span>
        <span className={`text-[#7a6e5e] transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>
          ▾
        </span>
      </button>
      <div
        className={[
          'overflow-hidden transition-all duration-300',
          open ? 'max-h-40' : 'max-h-0',
        ].join(' ')}
      >
        <p className="px-4 py-3 text-sm text-[#a89880] bg-[#2a2720]/50 rounded-b-xl">
          {a}
        </p>
      </div>
    </div>
  );
}

// ── HelpPage ───────────────────────────────────────────────
export default function HelpPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-xl font-bold text-[#f0ead8] mb-6">도움말</h1>

      {/* 섹션 1 — 사용 방법 */}
      <Section title="TnT 사용 방법">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {STEPS.map((step, i) => (
            <div
              key={i}
              className="bg-[#211f1a] rounded-xl p-4 flex flex-col gap-3"
            >
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-[#b5832a] text-[#f0ead8] text-xs font-bold flex items-center justify-center shrink-0">
                  {i + 1}
                </span>
                <span className="text-sm font-semibold text-[#f0ead8]">{step.title}</span>
              </div>
              <span className="text-2xl">{step.emoji}</span>
              <p className="text-xs text-[#a89880] leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* 섹션 2 — FAQ */}
      <Section title="자주 묻는 질문">
        <div className="flex flex-col gap-1">
          {FAQS.map((faq, i) => (
            <FaqItem key={i} q={faq.q} a={faq.a} />
          ))}
        </div>
      </Section>

      {/* 섹션 3 — 문의 */}
      <Section title="문의">
        <p className="text-sm text-[#a89880] mb-3">
          추가 문의사항은 팀에게 연락주세요.
        </p>
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-[#7a6e5e] w-16">이메일</span>
            <a
              href="mailto:team@tnt.dev"
              className="text-[#d4a843] hover:text-[#e0bc6a] transition-colors"
            >
              team@tnt.dev
            </a>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-[#7a6e5e] w-16">GitHub</span>
            <a
              href="#"
              className="text-[#d4a843] hover:text-[#e0bc6a] transition-colors"
            >
              github.com/tnt-project
            </a>
          </div>
        </div>
      </Section>
    </div>
  );
}
