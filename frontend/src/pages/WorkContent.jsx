// 분석 결과 페이지 — jobId가 있으면 API 폴링, 없으면 목 분석 결과 표시
import { useState, useEffect } from "react";
import { Loader } from "lucide-react";
import { getJobStatusAPI, getJobResultAPI } from "../api/index";
import LoadingSkeleton from "../components/LoadingSkeleton";
import ImageSet from "../components/ImageSet";
import RealResultView from "../components/RealResultView";

// 무한 폴링 방지: 최대 60회(약 2분) 이후 타임아웃 처리
const MAX_POLL_COUNT = 60;

export default function WorkContent({ workTitle, jobId, onResult }) {
  // loading: 분석 중 / done: 완료 / failed: 실패
  const [status, setStatus] = useState("loading");
  // 현재 파이프라인 단계 (씬감지 / 임베딩 / 스코어링)
  const [pipelineStep, setPipelineStep] = useState(null);
  // 분석 완료 후 결과 데이터 (null이면 목 결과 표시)
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (!jobId) {
      // jobId가 없으면 비로그인 체험 모드 — 2.8초 후 목 결과 표시
      const t = setTimeout(() => setStatus("done"), 2800);
      return () => clearTimeout(t);
    }

    // 실제 분석 작업 폴링 시작
    let cancelled = false;
    let pollCount = 0;

    const poll = async () => {
      // cancelled 또는 최대 횟수 초과 시 폴링 종료
      while (!cancelled && pollCount < MAX_POLL_COUNT) {
        try {
          // GET /analysis/job/:jobId — 현재 상태 조회
          const res = await getJobStatusAPI(jobId);
          const { status: s, pipeline_step } = res.data;
          setPipelineStep(pipeline_step);

          if (s === "done") {
            // 완료 시 결과 데이터 별도 요청 후 렌더링
            const r = await getJobResultAPI(jobId);
            setResult(r.data);
            setStatus("done");
            onResult?.(r.data);
            return;
          }
          if (s === "failed") { setStatus("failed"); return; }

          pollCount++;
          // 2초 간격으로 재조회 (서버 부하 최소화)
          await new Promise((resolve) => setTimeout(resolve, 2000));
        } catch {
          if (!cancelled) setStatus("failed");
          return;
        }
      }
      // 최대 횟수 초과 시 타임아웃으로 failed 처리
      if (!cancelled && pollCount >= MAX_POLL_COUNT) setStatus("failed");
    };

    poll();
    // 컴포넌트 언마운트 또는 jobId 변경 시 폴링 중단
    return () => { cancelled = true; };
  }, [jobId]);

  // 파이프라인 단계별 사용자 친화적 레이블
  const stepLabel = {
    scene_detect: "영상의 핵심 장면을 찾고 있어요 🎬",
    embedding: "썸네일 후보를 분석하고 있어요 🖼",
    scoring: "어떤 썸네일이 가장 좋을지 고르고 있어요 ✨",
    done: "완료",
  };

  const pipelineSteps = ['scene_detect', 'embedding', 'scoring'];
  const currentStepIdx = pipelineSteps.indexOf(pipelineStep);

  return (
    <div className="flex flex-col gap-4">
      {/* 채팅 형태 UI: 상단은 유저 질문, 하단은 AI 응답 */}
      <div className="bg-[#201e19] rounded-2xl border border-[#2e2b24] overflow-hidden">
        {/* 유저 질문 영역 */}
        <div className="py-3.5 px-5 border-b border-[#2e2b24]">
          <div className="flex gap-2.5 items-center">
            <div className="w-[26px] h-[26px] rounded-full bg-[#b5832a] flex items-center justify-center text-[11px] font-bold shrink-0 text-[#1a1814]">U</div>
            <p className="text-[#d4cab4] text-sm">{workTitle} 분석 결과를 보여줘</p>
          </div>
        </div>

        {/* AI 응답 영역 */}
        <div className="py-3.5 px-5">
          <div className="flex gap-2.5 items-start">
            <div className="w-[26px] h-[26px] rounded-full bg-gradient-to-br from-[#b5832a] to-[#7a4f1a] flex items-center justify-center text-[11px] font-bold shrink-0 text-[#f0ead8]">G</div>

            <div className="flex-1">
              {/* 분석 중: 파이프라인 단계 표시 + 스켈레톤 */}
              {status === "loading" && (
                <div className="flex flex-col gap-3.5">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2.5">
                      <Loader size={16} className="text-[#b5832a] animate-spin shrink-0" />
                      <p className="text-[#a89880] text-[13px]">
                        {jobId && pipelineStep
                          ? stepLabel[pipelineStep] || "잠시만 기다려주세요..."
                          : "최적의 썸네일과 제목을 구상하고 있어요 💭"}
                      </p>
                    </div>
                    {jobId && (
                      <div className="flex gap-1.5 pl-7">
                        {pipelineSteps.map((step, stepIdx) => {
                          const isDone = stepIdx < currentStepIdx;
                          const isActive = stepIdx === currentStepIdx;
                          return (
                            <div
                              key={step}
                              className={[
                                'flex-1 h-1 rounded-full transition-all duration-500',
                                isDone ? 'bg-[#b5832a]' :
                                isActive ? 'bg-[#b5832a]/50 animate-pulse' :
                                'bg-[#2e2b24]',
                              ].join(' ')}
                            />
                          );
                        })}
                      </div>
                    )}
                  </div>
                  <LoadingSkeleton />
                </div>
              )}

              {status === "failed" && (
                <p className="text-red-400 text-[13px]">분석 중 오류가 발생했습니다.</p>
              )}

              {status === "done" && (
                result ? (
                  // 실제 분석 결과가 있으면 RealResultView로 렌더링
                  <div className="flex flex-col gap-3.5">
                    <p className="text-[#a89880] text-[13px] leading-relaxed">분석이 완료되었습니다.</p>
                    <RealResultView result={result} />
                  </div>
                ) : (
                  // jobId가 없는 목 모드 — ImageSet 5개로 플레이스홀더 표시
                  <div className="flex flex-col gap-3.5" style={{ animation: "fadeIn 0.4s ease" }}>
                    <p className="text-[#a89880] text-[13px] leading-relaxed">분석이 완료되었습니다. 이미지별로 차트와 제목을 설정할 수 있습니다.</p>
                    {[1, 2, 3, 4, 5].map((i) => (
                      <ImageSet key={i} index={i} workTitle={workTitle} />
                    ))}
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
