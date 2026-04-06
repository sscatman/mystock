import React, { useState, useEffect } from 'react';
import { 
  Search, 
  TrendingUp, 
  CheckCircle, 
  Loader2, 
  Copy, 
  Terminal, 
  Cpu, 
  ChevronRight, 
  Info, 
  ExternalLink,
  Menu,
  X,
  FileSearch,
  Globe, 
  Star,
  Zap,
  ChevronDown,
  MousePointer2,
  FileText,
  History,
  Database,
  ShieldAlert,
  AlertTriangle,
  BarChart3,
  Globe2,
  Newspaper
} from 'lucide-react';

/**
 * AI Hyper-Analyst GLOBAL V1.15 ULTRA-STRICT
 * 업데이트 내역 (1.14 -> 1.15):
 * 1. 거시경제 / 지정학 분석 옵션 추가 (이미지 1 내용 반영)
 * 2. SEC 공시 전문 분석 엔진 탑재: 연간(10-K), 분기(10-Q), 수시(8-K) (이미지 2, 3, 4 내용 반영)
 * 3. 분석 모드 스위칭 시스템: 일반 종합 분석 vs 공시 심층 분석
 */

const publicDataApiKey = "885853dbc6a25a93e403ee31fa9e124778e4943b8911869ea2f254ec5d75f99b";

const availableItems = [
  '현금건전성 지표 (FCF, 유동비율, 부채비율)',
  '핵심 재무제표 분석 (손익, 대차대조, 현금흐름)',
  '투자기관 목표주가 및 컨센서스',
  '호재/악재 뉴스 판단',
  '기술적 지표 (RSI/이평선)',
  '거래량, 수급 분석',
  '외국인/기관 수급 분석',
  '경쟁사 비교 및 업황',
  'P/E Ratio (P/E TTM, Forward P/E)',
  'Intrinsic Value, DCF Value',
  '베타(β), WACC (가중평균자본비용) 분석',
  '투자성향별 포트폴리오 적정보유비중',
  '단기/중기 매매 전략'
];

export default function App() {
  const [ticker, setTicker] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [activeStockData, setActiveStockData] = useState(null);
  
  const [term, setTerm] = useState('단기 (1주~1개월)');
  const [level, setLevel] = useState('5.시나리오');
  const [analysisItems, setAnalysisItems] = useState(availableItems);
  
  // V1.15 New States
  const [useNews, setUseNews] = useState(true);
  const [useMacro, setUseMacro] = useState(false);
  const [reportType, setReportType] = useState('MAIN'); // MAIN, 10-K, 10-Q, 8-K

  const [isFocusMenuOpen, setIsFocusMenuOpen] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // 자동 종목 검색
  useEffect(() => {
    const autoGenerate = setTimeout(async () => {
      const cleanInput = ticker.trim();
      if (cleanInput.length >= 2) {
        setIsSearching(true);
        try {
          const isNum = /^\d+$/.test(cleanInput);
          const queryParam = isNum ? `likeSrtnCd=${cleanInput}` : `itmsNm=${encodeURIComponent(cleanInput)}`;
          const url = `https://apis.data.go.kr/1160100/service/GetStockSecuritiesInfoService/getStockPriceInfo?serviceKey=${publicDataApiKey}&resultType=json&${queryParam}&numOfRows=1`;
          
          const response = await fetch(url);
          const data = await response.json();
          const item = data?.response?.body?.items?.item?.[0];
          
          if (item) {
            const stockInfo = {
              name: item.itmsNm,
              code: item.srtnCd,
              market: item.mrktCtg,
              price: item.clpr,
              change: item.vs,
              changeRate: item.fltRt
            };
            setActiveStockData(stockInfo);
            generatePromptContent(stockInfo, reportType);
          }
        } catch (error) {
          console.error("Auto-fetch error", error);
        } finally {
          setIsSearching(false);
        }
      }
    }, 1200); 

    return () => clearTimeout(autoGenerate);
  }, [ticker, useMacro, reportType]);

  const generatePromptContent = (stockInfo, type = 'MAIN') => {
    setIsGenerating(true);
    const stockName = stockInfo ? stockInfo.name : ticker;
    const stockCode = stockInfo ? stockInfo.code : ticker;
    const isKOR = /^\d+$/.test(stockCode);
    const currencySym = isKOR ? "₩" : "$";

    let fullPrompt = "";

    if (type === 'MAIN') {
      // --- V1.15 MAIN 분석 (기존 강화판 + 거시경제 추가) ---
      fullPrompt = `
[역할] 월스트리트 수석 애널리스트
[대상] ${stockName} (공식 기업명: ${stockName})
[모드] MAIN 종합 분석
[중점 분석] ${analysisItems.join(', ')}
${useMacro ? '[특이사항] 거시경제 및 지정학적 분석 필수 포함' : ''}
[투자 관점] ${term}
[분석 레벨] ${level}
**주의: '${stockCode}'는 '${stockName}'입니다. 다른 기업과 혼동하지 마십시오.**

[분석 지침]
0. **[기업 기본 정보]** 마크다운 표로 시작.
1. **[성장주/가치주 정의]** 규명.
2. **[사용자 선택 항목 상세 분석]**
${analysisItems.map(item => `## ${item} [분석 규격: 150단어 이상]`).join('\n')}

${useMacro ? `
## 🌐 [거시경제 및 지정학적 분석 - 필수 포함]
이 분석은 거시경제 및 지정학적 관점을 반드시 포함해야 합니다. 아래 항목을 심층 분석하십시오:
1. **통화정책 및 금리 영향**: 연준(Fed) 금리 정책이 해당 기업/섹터에 미치는 영향.
2. **지정학적 리스크**: 미중 무역분쟁, 전쟁, 공급망 리스크(반도체, 희토류 등).
3. **거시경제 사이클**: 현재 경기 사이클 위치 및 인플레이션 환경에서의 가격 전가력.
4. **글로벌 정책 변화**: ESG, AI 규제, 정부 보조금 변화.
5. **환율 및 국제 자금 흐름**: 원/달러 환율 변동 및 외국인 투자자 동향 연관성.
` : ''}

3. **[포트폴리오 비중]** 성향별 제시.
4. **[시나리오 분석]** Bull/Base/Bear 확률 및 근거.

[결론] 매수/매도/관망 의견 제시. 모든 답변은 한글로 작성.
`;
    } else if (type === '10-K') {
      fullPrompt = `
[역할] 월가 수석 애널리스트 (펀더멘탈 & 장기 투자 전문가)
[대상] ${stockName} (공식 기업명: ${stockName})
[자료] 최신 SEC 10-K 보고서 (Annual Report)

[지시사항]
당신은 월가 최고의 주식 애널리스트입니다. 위 종목의 **최신 SEC 10-K 보고서**를 기반으로 기업의 기초 체력과 장기 비전을 심층 분석해 주세요.
**주의: '${stockName}'은 '${stockName}'입니다. 다른 기업과 혼동하지 마십시오.** 필요하다면 Google Search 도구를 활용하여 최신 데이터를 교차 검증하세요.

**[출력 형식]**
- 마크다운(Markdown) 형식을 사용하여 깔끔하게 작성하세요.
- 섹션 헤더, 불렛 포인트, 볼드체를 적절히 활용하세요.

**[필수 분석 항목]**
1. **비즈니스 개요 (Overview)**: 산업 내 위치, 비즈니스 모델의 강점, Fiscal Year End 날짜.
2. **MD&A 및 미래 전망 (Outlook)**: (중요) 경영진이 제시하는 내년도 시장 전망 및 전략. 매출 및 수익성 성장에 대한 경영진의 자신감 톤(Tone) 분석.
3. **핵심 리스크 및 법적 이슈 (Risk & Legal)**: 사업에 치명적일 수 있는 Risk Factors. 진행 중인 중요한 소송이나 규제 이슈 여부.
4. **재무제표 정밀 분석 (Financials)**: 대차대조표, 손익계산서, 현금흐름표의 주요 변동 사항. **부채 만기 구조(Debt Maturity)** 및 유동성 위기 가능성 점검.
5. **주요 이벤트 (Key Events)**: 자사주 매입, M&A, 경영진 변동, 대규모 구조조정 등.

[결론] 기업의 장기적인 투자 가치와 해자(Moat)에 대한 종합 평가.
**모든 답변은 반드시 한글로 작성해 주십시오.**
`;
    } else if (type === '10-Q') {
      fullPrompt = `
[역할] 실적 모멘텀 및 트렌드 분석가
[대상] ${stockName} (공식 기업명: ${stockName})
[자료] 최신 SEC 10-Q 보고서 (Quarterly Report)

[지시사항]
위 종목의 **최신 SEC 10-Q 보고서**를 기반으로 **직전 분기 대비 변화(Trend)**에 집중하여 분석 보고서를 작성하세요.
**주의: '${stockName}'는 '${stockName}'입니다.** 단기적인 실적 흐름과 경영진의 가이던스 변화를 포착하는 것이 핵심입니다.

**[출력 형식]**
- 마크다운(Markdown) 형식 사용.

**[필수 분석 항목]**
1. **실적 요약 (Earnings Summary)**: 매출 및 EPS의 전년 동기(YoY) 및 전 분기(QoQ) 대비 성장률. 시장 예상치 상회/하회 여부 및 그 원인.
2. **가이던스 변화 (Guidance Update)**: (매우 중요) 경영진이 제시한 향후 실적 전망치가 상향되었는가, 하향되었는가? 전망 변경의 구체적인 근거(수요 증가, 비용 절감 등).
3. **부문별 성과 (Segment Performance)**: 주요 사업 부문별 매출 및 이익 증감 추이. 가장 빠르게 성장하는 부문과 둔화되는 부문 식별.
4. **현금흐름 및 비용 (Cash & Costs)**: 영업활동 현금흐름의 변화. R&D 및 마케팅 비용 지출 추이 (효율성 분석).

[결론] 이번 분기 실적이 일시적인지 구조적인 추세인지 판단하고, 단기/중기 투자 매력도 제시.
**모든 답변은 반드시 한글로 작성해 주십시오.**
`;
    } else if (type === '8-K') {
      fullPrompt = `
[역할] 속보 뉴스 데스크 / 이벤트 드리븐 트레이더
[대상] ${stockName} (공식 기업명: ${stockName})
[자료] 최신 SEC 8-K 보고서 (Current Report)

[지시사항]
위 종목의 **최신 SEC 8-K 보고서**를 분석하여, 발생한 **특정 사건(Event)**의 내용과 주가에 미칠 영향을 즉각적으로 분석하세요.
**주의: '${stockName}'는 '${stockName}'입니다.** 가장 최근에 공시된 중요한 사건 하나에 집중하십시오.

**[출력 형식]**
- 마크다운(Markdown) 형식 사용. 핵심 위주로 간결하고 명확하게 작성.

**[필수 분석 항목]**
1. **공시 사유 (Triggering Event)**: 8-K가 제출된 핵심 이유 (Item 번호 및 제목 확인). 예: 실적 발표, 주요 계약 체결, 경영진 사퇴, M&A, 유상증자 등.
2. **세부 내용 (Details)**: 계약 금액, 거래 조건, 변경된 인물의 프로필 등 구체적 팩트 정리. 재무적으로 즉각적인 영향이 있는가?
3. **호재/악재 판별 (Impact Analysis)**: 이 뉴스가 주가에 단기적으로 긍정적인지(Bullish) 부정적인지(Bearish) 명확한 판단. 시장의 예상 범위를 벗어난 서프라이즈 요소가 있는지.

[결론] 이 뉴스에 대해 투자자가 취해야 할 즉각적인 대응 전략 (매수 기회 vs 리스크 관리).
**모든 답변은 반드시 한글로 작성해 주십시오.**
`;
    }

    setTimeout(() => {
      setGeneratedPrompt(fullPrompt.trim());
      setIsGenerating(false);
    }, 600);
  };

  const copyToClipboard = () => {
    const textArea = document.createElement("textarea");
    textArea.value = generatedPrompt;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
    document.body.removeChild(textArea);
  };

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-[#070b14] font-sans text-slate-200 overflow-hidden text-left">
      
      {/* Sidebar */}
      <div className={`fixed inset-0 lg:relative lg:translate-x-0 transform transition-transform duration-300 ease-in-out z-20 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} w-full lg:w-80 bg-[#111827] border-r border-slate-800 flex flex-col h-full shadow-2xl`}>
        <div className="flex p-6 border-b border-slate-800 items-center space-x-3 bg-[#111827]">
          <div className="bg-rose-500/20 p-2 rounded-lg">
            <TrendingUp className="text-rose-500 w-6 h-6" />
          </div>
          <div className="flex flex-col text-left">
            <h1 className="text-lg font-black text-white italic leading-tight">Hyper-Analyst</h1>
            <span className="text-[10px] text-rose-500 font-mono tracking-widest uppercase font-bold">V1.15 ULTRA-STRICT</span>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6 text-left">
          {/* 분석 옵션 섹션 (이미지 1 반영) */}
          <div className="space-y-4">
            <h3 className="text-[10px] font-black text-rose-500 uppercase tracking-widest">분석 옵션</h3>
            
            <div className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-800/50 transition-colors">
               <div className="flex items-center space-x-3">
                <Newspaper className="w-4 h-4 text-slate-400" />
                <span className="text-xs font-bold text-slate-300">뉴스 데이터 반영</span>
              </div>
              <div className={`w-8 h-4 rounded-full relative transition-colors cursor-pointer ${useNews ? 'bg-rose-500' : 'bg-slate-700'}`} onClick={() => setUseNews(!useNews)}>
                <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${useNews ? 'left-[18px]' : 'left-[2px]'}`}></div>
              </div>
            </div>

            <div className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-800/50 transition-colors">
               <div className="flex items-center space-x-3">
                <Globe2 className="w-4 h-4 text-rose-500" />
                <span className="text-xs font-bold text-slate-300">거시경제/지정학 분석</span>
              </div>
              <div className={`w-8 h-4 rounded-full relative transition-colors cursor-pointer ${useMacro ? 'bg-rose-500' : 'bg-slate-700'}`} onClick={() => setUseMacro(!useMacro)}>
                <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${useMacro ? 'left-[18px]' : 'left-[2px]'}`}></div>
              </div>
            </div>
          </div>

          {/* SEC 공시 분석 (이미지 2, 3, 4 반영) */}
          <div className="space-y-3">
             <h3 className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">포트폴리오 공시 분석</h3>
             <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={() => {setReportType('10-K'); setTicker(ticker);}}
                  className={`p-2 rounded-lg border text-[11px] font-bold transition-all ${reportType === '10-K' ? 'bg-indigo-500/20 border-indigo-500 text-indigo-400' : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-600'}`}
                >
                  연간 실적 (10-K)
                </button>
                <button 
                  onClick={() => {setReportType('10-Q'); setTicker(ticker);}}
                  className={`p-2 rounded-lg border text-[11px] font-bold transition-all ${reportType === '10-Q' ? 'bg-indigo-500/20 border-indigo-500 text-indigo-400' : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-600'}`}
                >
                  분기 실적 (10-Q)
                </button>
                <button 
                  onClick={() => {setReportType('8-K'); setTicker(ticker);}}
                  className={`p-2 rounded-lg border text-[11px] font-bold transition-all ${reportType === '8-K' ? 'bg-indigo-500/20 border-indigo-500 text-indigo-400' : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-600'}`}
                >
                  수시 공시 (8-K)
                </button>
                <button 
                  onClick={() => {setReportType('MAIN');}}
                  className={`p-2 rounded-lg border text-[11px] font-bold transition-all ${reportType === 'MAIN' ? 'bg-rose-500/20 border-rose-500 text-rose-400' : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-600'}`}
                >
                  종합 분석 모드
                </button>
             </div>
          </div>

          <div className="border border-slate-700 rounded-xl overflow-hidden bg-slate-800/50">
            <button onClick={() => setIsFocusMenuOpen(!isFocusMenuOpen)} className="w-full p-3 flex items-center justify-between hover:bg-slate-800/50 transition-colors">
              <span className="text-xs font-black text-slate-400 uppercase tracking-wider">중점 분석 항목 (STRICT)</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${isFocusMenuOpen ? 'rotate-180' : ''}`} />
            </button>
            {isFocusMenuOpen && (
              <div className="p-3 pt-0 space-y-1.5 max-h-[25vh] overflow-y-auto custom-scrollbar bg-slate-900/20 text-left">
                {availableItems.map((item, idx) => (
                  <label key={idx} className="flex items-start space-x-3 p-1.5 rounded hover:bg-slate-800/50 cursor-pointer transition-colors">
                    <input type="checkbox" className="mt-0.5 w-3.5 h-3.5 rounded border-slate-600 text-indigo-500" checked={analysisItems.includes(item)} onChange={() => setAnalysisItems(prev => prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item])} />
                    <span className="text-[11px] text-slate-400 leading-snug">{item}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-4 pt-2">
            <div className="relative group">
              <Search className="w-4 h-4 absolute left-3 top-3.5 text-slate-500 group-focus-within:text-rose-500 transition-colors" />
              <input 
                type="text" 
                value={ticker} 
                onChange={(e) => setTicker(e.target.value)} 
                placeholder="기업명 입력 (예: 아이온큐)" 
                className="w-full pl-10 pr-4 py-3.5 bg-[#070b14] border border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-rose-500 outline-none text-left transition-all"
              />
            </div>
          </div>
        </div>

        <div className="p-6 bg-[#111827] border-t border-slate-800">
           <button onClick={() => ticker && generatePromptContent(activeStockData, reportType)} className="w-full py-4 rounded-2xl font-black text-xs uppercase text-white shadow-2xl flex justify-center items-center space-x-2 bg-gradient-to-r from-rose-600 to-rose-800 hover:from-rose-500 hover:to-rose-700 active:scale-95 transition-all">
            <Terminal className="w-4 h-4" />
            <span>프롬프트 생성 ({reportType})</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full relative overflow-hidden bg-[#0a0f1e]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,#f43f5e08,transparent_50%)]"></div>
        <div className="relative h-full flex flex-col p-4 lg:p-12 overflow-y-auto custom-scrollbar text-left">
          <div className="max-w-4xl mx-auto w-full pb-20 space-y-12">
            
            <div className="flex items-start space-x-6 text-left">
              <div className="bg-rose-500/10 p-5 rounded-3xl border border-rose-500/20 shadow-[0_0_30px_rgba(244,63,94,0.1)]">
                <Cpu className="text-rose-500 w-12 h-12" />
              </div>
              <div>
                <div className="flex items-center">
                  <h1 className="text-3xl lg:text-5xl font-black tracking-tighter text-white italic uppercase leading-none">
                    Hyper Analyst <span className="text-indigo-500 underline decoration-rose-500 decoration-8 underline-offset-[12px]">GLOBAL</span>
                  </h1>
                  <span className="text-xs font-black text-rose-500 ml-6 font-mono bg-rose-500/10 px-2 py-1 rounded border border-rose-500/20">V1.15</span>
                </div>
                <p className="text-slate-500 text-sm mt-5 font-bold uppercase tracking-[0.3em] flex items-center">
                  <Globe className="w-4 h-4 mr-2 text-indigo-500" /> MACRO & SEC FILING ENGINE ACTIVE
                </p>
              </div>
            </div>

            {isGenerating || isSearching ? (
              <div className="flex flex-col items-center justify-center py-32 space-y-8 animate-in fade-in duration-500">
                <Loader2 className="w-16 h-16 text-rose-500 animate-spin relative z-10" />
                <div className="text-center space-y-2">
                  <p className="text-white font-black uppercase tracking-widest text-lg">Processing Directives...</p>
                  <p className="text-slate-500 text-sm font-medium italic">{reportType} 분석 모델 동기화 중</p>
                </div>
              </div>
            ) : generatedPrompt ? (
              <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 space-y-10 text-left">
                <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-3xl p-6 flex items-start space-x-6 shadow-inner">
                  <CheckCircle className="text-emerald-400 w-7 h-7 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="text-white font-black text-sm uppercase tracking-wider">
                      {reportType} Prompt Ready: <span className="text-emerald-400">{activeStockData?.name || ticker}</span>
                    </h4>
                    <p className="text-emerald-100/60 text-xs lg:text-sm leading-relaxed mt-2">
                      이미지 지침 100% 반영 완료. {useMacro ? '거시경제 분석 섹션이 포함되었습니다.' : ''}
                    </p>
                  </div>
                </div>

                <div className="relative group text-left">
                  <div className="absolute -inset-1 bg-gradient-to-br from-rose-600 to-indigo-600 rounded-[2.5rem] blur opacity-20"></div>
                  <div className="relative bg-[#0d1326] border border-slate-800 rounded-[2rem] overflow-hidden">
                    <div className="flex items-center justify-between px-8 py-6 border-b border-slate-800 bg-slate-900/50">
                      <div className="flex items-center space-x-3">
                        <FileText className="w-4 h-4 text-rose-500" />
                        <span className="text-[11px] text-slate-400 font-mono font-black uppercase tracking-[0.3em]">{reportType} ENGINE OUTPUT</span>
                      </div>
                      <button onClick={copyToClipboard} className={`flex items-center space-x-2 px-6 py-2.5 rounded-xl text-[11px] font-black uppercase transition-all ${copySuccess ? 'bg-emerald-600 text-white' : 'bg-rose-600 hover:bg-rose-500 text-white'}`}>
                        {copySuccess ? <CheckCircle className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copySuccess ? 'Copied' : 'Copy Text'}</span>
                      </button>
                    </div>
                    <div className="p-8 lg:p-12 max-h-[60vh] overflow-y-auto custom-scrollbar font-mono text-[13px] lg:text-[15px] leading-[1.8] text-slate-300 whitespace-pre-wrap bg-[#080d1a]/80 text-left selection:bg-rose-500/40">
                      {generatedPrompt}
                    </div>
                    <div className="p-8 bg-[#0a1122] border-t border-slate-800">
                      <button onClick={() => { copyToClipboard(); window.open('https://gemini.google.com/app', '_blank'); }} className="w-full py-6 bg-gradient-to-r from-indigo-700 to-indigo-600 hover:from-indigo-600 hover:to-indigo-500 text-white rounded-2xl font-black text-sm lg:text-base shadow-2xl flex justify-center items-center space-x-4 transition-all transform hover:scale-[1.01]">
                        <ExternalLink className="w-6 h-6" />
                        <span>복사 후 제미나이(Gemini)로 이동하여 분석 시작</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-32 flex flex-col items-center justify-center text-center space-y-10">
                <div className="p-8 bg-slate-900/50 rounded-full border border-slate-800 relative">
                   <div className="absolute inset-0 bg-rose-500/5 blur-3xl rounded-full"></div>
                   <FileSearch className="text-slate-600 w-20 h-20 relative z-10" />
                </div>
                <div className="space-y-4">
                  <h3 className="text-2xl lg:text-3xl font-black text-slate-500 uppercase tracking-tighter italic">ULTRA-STRICT V1.15 ENGINE</h3>
                  <p className="text-slate-600 text-sm max-w-md mx-auto leading-relaxed font-medium">
                    1.15 업데이트: <span className="text-rose-500 font-bold">거시경제/지정학 분석</span> 및 <br/>
                    <span className="text-indigo-500 font-bold">SEC 공시(10-K, 10-Q, 8-K) 전문 엔진</span>이 탑재되었습니다.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
      `}</style>
    </div>
  );
}