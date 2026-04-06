import React, { useState, useEffect, useRef } from 'react';
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
  ShieldAlert
} from 'lucide-react';

/**
 * AI Hyper-Analyst GLOBAL V1.13 IRON-CLAD (ZERO-TOLERANCE)
 * 업데이트 내역:
 * 1. 철갑 지침 엔진: 프롬프트 최상단에 '요약 금지' 및 '150단어 원칙'을 명령어로 고정
 * 2. 수식 강제화: Graham 공식, DCF 공식, 표 형식을 AI가 생략할 수 없는 구조로 박제
 * 3. 개별 항목 인젝션: 각 분석 항목마다 분석 가이드라인(150단어, 5포인트)을 개별 결합
 * 4. 2중 검증 시스템: 생성물 하단에 AI가 스스로 모든 지침 준수 여부를 확인하는 체크리스트 강제 포함
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
  
  const [useNews, setUseNews] = useState(true);
  const [isFocusMenuOpen, setIsFocusMenuOpen] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // 자동 종목 검색 및 즉시 생성 로직
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
            generatePromptContent(stockInfo);
          }
        } catch (error) {
          console.error("Auto-fetch error", error);
        } finally {
          setIsSearching(false);
        }
      }
    }, 1200); 

    return () => clearTimeout(autoGenerate);
  }, [ticker]);

  const generatePromptContent = (stockInfo) => {
    setIsGenerating(true);
    if (window.innerWidth < 1024) setIsSidebarOpen(false);

    const stockName = stockInfo ? stockInfo.name : ticker;
    const stockCode = stockInfo ? stockInfo.code : ticker;
    const isKOR = /^\d+$/.test(stockCode);
    const currencySym = isKOR ? "₩" : "$";

    // --- V1.13 IRON-CLAD ENGINE: NEVER OMIT, NEVER SUMMARIZE ---
    const fullPrompt = `
[SYSTEM PRIORITY INSTRUCTION: ZERO TOLERANCE FOR OMISSION]
당신은 월스트리트 수석 애널리스트입니다. 아래 요청하는 모든 분석은 '생략'이나 '요약'이 절대 금지됩니다. 
만약 지침(항목당 150단어 이상)을 어길 시 이 분석은 실패한 것으로 간주됩니다. 

[대상] ${stockName} (공식 기업명: ${stockName})
[티커] ${stockCode}
[분석 관점] ${term} | [분석 레벨] ${level} (시나리오 확률 기반 분석)

⚠️ [필수 준수 지침 - 위반 시 재작성 대상] ⚠️
1. 모든 분석 항목은 반드시 별도의 '## 헤더'로 구분하십시오.
2. 각 항목당 최소 150단어 이상의 정밀 분석을 제공하십시오. (단순 요약 절대 금지)
3. 각 항목당 최소 3-5개의 구체적인 정량적/정성적 포인트를 포함하십시오.
4. "지면 관계상 생략", "간략히 언급" 등의 표현 사용 시 답변을 즉시 중단하십시오.
5. Intrinsic Value와 DCF 계산 시 아래 명시된 수식을 반드시 사용하고 계산 과정을 표로 제시하십시오.

[데이터 요약 및 참조]
- 티커/코드: ${stockCode}
${stockInfo ? `- 현재가: ${Number(stockInfo.price).toLocaleString()} ${isKOR ? 'KRW' : 'USD'} / 전일대비: ${stockInfo.change} (${stockInfo.changeRate}%)` : '- 시세 정보: [분석 시 실시간 검색하여 최신 데이터 적용]'}

---

## 0. [기업 기본 정보 (Company Overview)]
반드시 다음 데이터를 사용하여 마크다운 표를 작성하십시오.
| 항목 | 내용 |
| :--- | :--- |
| 정식 기업명 | ${stockName} |
| 티커(심볼) | ${stockCode} |
| 섹터 (Sector) | N/A (검색 후 작성) |
| 산업 (Industry) | N/A (검색 후 작성) |
| 국가 | ${isKOR ? '대한민국' : 'N/A'} |
| 시가총액 | N/A (검색 후 작성) |

## 1. [성장주/가치주 정의 및 핵심 지표 분석]
이 기업이 '성장주(Growth Stock)'인지 '가치주(Value Stock)'인지 규명하고 아래 지표를 150단어 이상으로 심층 분석하십시오.
- 성장주라면: 매출 성장률(5년 추이), Cash Flow 증가세, ROI 개선, Profit Margin 방향성 중점.
- 가치주라면: 시장 점유율 추이, 배당금 안정성, 주가 안정성, EPS 트렌드 중점.

## 2. [심층 분석 섹션 - 개별 분석 필수]
아래 리스트의 모든 항목을 하나도 빠짐없이 각각 별도의 ## 섹션으로 분석하십시오. (각 150단어 이상)
${analysisItems.map(item => `### ${item} [규격: 최소 150단어, 5포인트 분석]`).join('\n')}

---
[특수 분석 수식 지침]
- **Intrinsic Value (내재가치)**: Graham 공식 [$V = EPS \\times (8.5 + 2g)$] (g=예상 성장률 %)을 반드시 사용하십시오.
- **DCF Value (현금흐름할인가치)**: [$DCF = \\sum(FCF_t / (1+WACC)^t) + Terminal Value / (1+WACC)^n$] 공식을 적용하십시오.
- 위 두 가치평가 항목은 반드시 아래 형식의 표를 포함해야 합니다.
  | 가치평가 항목 | 산출 금액 | 현재가 대비 |
  | :--- | :--- | :--- |
  | Intrinsic Value | $XX.XX | XX% (저/고평가) |
  | DCF Value | $XX.XX | XX% (저/고평가) |

## 3. [투자성향별 포트폴리오 비중 분석]
다음 3가지 투자 성향에 맞춰 권장 보유 비중(%)과 이유를 구체적으로 제시하십시오.
(1) 보수적 투자자 (Stable) | (2) 중립적 투자자 (Balanced) | (3) 공격적 투자자 (Aggressive)

## 4. [시나리오별 확률 및 근거 (Scenario Analysis)]
Bull(낙관) / Base(기본) / Bear(비관) 시나리오별 예상 주가 밴드와 실현 확률(%)을 제시하십시오.

[결론]
반드시 [매수 / 매도 / 관망] 중 하나의 명확한 투자 의견을 제시하며 보고서를 마무리하십시오.

⚠️ [최종 검토 체크리스트]
- 모든 항목이 누락 없이 분석되었는가?
- 각 항목의 분량이 150단어 이상인가?
- Graham 및 DCF 수식이 정확히 사용되었는가?
    `.trim();

    setTimeout(() => {
      setGeneratedPrompt(fullPrompt);
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
            <h1 className="text-lg font-black text-white italic leading-tight">프롬프트 빌더</h1>
            <span className="text-[10px] text-rose-500 font-mono tracking-widest uppercase font-bold">V1.13 IRON-CLAD</span>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
          <div className="flex items-center space-x-3 text-left">
            <div className={`w-8 h-4 rounded-full relative transition-colors ${useNews ? 'bg-rose-500' : 'bg-slate-700'}`}>
              <button onClick={() => setUseNews(!useNews)} className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${useNews ? 'left-[18px]' : 'left-[2px]'}`}></button>
            </div>
            <span className="text-xs font-bold text-slate-300">실시간 뉴스 지침 포함</span>
          </div>

          <div className="border border-slate-700 rounded-xl overflow-hidden bg-slate-900/50">
            <button onClick={() => setIsFocusMenuOpen(!isFocusMenuOpen)} className="w-full p-3 flex items-center justify-between hover:bg-slate-800/50 transition-colors">
              <span className="text-xs font-black text-slate-400 uppercase tracking-wider">중점 분석 항목 (STRICT)</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${isFocusMenuOpen ? 'rotate-180' : ''}`} />
            </button>
            {isFocusMenuOpen && (
              <div className="p-3 pt-0 space-y-1.5 max-h-[35vh] overflow-y-auto custom-scrollbar bg-slate-900/20 text-left">
                <label className="flex items-center space-x-3 p-2 rounded hover:bg-slate-800 cursor-pointer sticky top-0 bg-[#111827] z-10 shadow-sm border-b border-slate-800 mb-1">
                  <input type="checkbox" className="w-4 h-4 rounded border-slate-600 text-rose-500" checked={analysisItems.length === availableItems.length} onChange={() => analysisItems.length === availableItems.length ? setAnalysisItems([]) : setAnalysisItems(availableItems)} />
                  <span className="text-xs font-black text-rose-500 uppercase">전체 분석 활성화</span>
                </label>
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
                placeholder="기업명 입력 (예: 삼성전자)" 
                className="w-full pl-10 pr-4 py-3.5 bg-[#070b14] border border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-rose-500 outline-none text-left transition-all"
              />
            </div>
            
            <div className="p-4 bg-rose-500/5 border border-rose-500/10 rounded-xl space-y-2 text-left">
              <div className="flex items-center space-x-2 text-rose-500">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span className="text-[10px] font-black uppercase tracking-widest">Iron-Clad Engine</span>
              </div>
              <p className="text-[10px] text-slate-400 leading-relaxed font-medium">
                V1.13은 분석 항목당 <span className="text-white font-bold">150단어 규격</span>을 AI에게 강제로 주입합니다. 요약이나 생략이 불가능한 구조입니다.
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 bg-[#111827] border-t border-slate-800">
           <button onClick={() => ticker && generatePromptContent(activeStockData)} className="w-full py-4 rounded-2xl font-black text-xs uppercase text-white shadow-2xl flex justify-center items-center space-x-2 bg-gradient-to-r from-rose-600 to-rose-800 hover:from-rose-500 hover:to-rose-700 active:scale-95 transition-all">
            <Terminal className="w-4 h-4" />
            <span>분석 지침서 강제 재생성</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full relative overflow-hidden bg-[#0a0f1e]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,#f43f5e08,transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff02_1px,transparent_1px),linear-gradient(to_bottom,#ffffff02_1px,transparent_1px)] bg-[size:32px_32px]"></div>
        
        <div className="relative h-full flex flex-col p-4 lg:p-12 overflow-y-auto custom-scrollbar">
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
                  <span className="text-xs font-black text-rose-500 ml-6 font-mono bg-rose-500/10 px-2 py-1 rounded border border-rose-500/20">V1.13</span>
                </div>
                <p className="text-slate-500 text-sm mt-5 font-bold uppercase tracking-[0.3em] flex items-center">
                  <Database className="w-4 h-4 mr-2 text-indigo-500" /> STRICT PROMPT GENERATION SYSTEM
                </p>
              </div>
            </div>

            {isGenerating || isSearching ? (
              <div className="flex flex-col items-center justify-center py-32 space-y-8 animate-in fade-in duration-500">
                <div className="relative">
                  <div className="absolute inset-0 bg-rose-500 blur-3xl opacity-20 animate-pulse"></div>
                  <Loader2 className="w-16 h-16 text-rose-500 animate-spin relative z-10" />
                </div>
                <div className="text-center space-y-2">
                  <p className="text-white font-black uppercase tracking-widest text-lg">Injecting Strict Directives...</p>
                  <p className="text-slate-500 text-sm font-medium italic">V1.13 IRON-CLAD 엔진이 150단어 분석 원칙을 강제 주입 중입니다</p>
                </div>
              </div>
            ) : generatedPrompt ? (
              <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 space-y-10 text-left">
                <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-3xl p-6 flex items-start space-x-6 shadow-inner relative overflow-hidden">
                  <CheckCircle className="text-emerald-400 w-7 h-7 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="text-white font-black text-sm uppercase tracking-wider flex items-center">
                      Analysis Protocol Verified: <span className="ml-2 text-emerald-400">{activeStockData?.name || ticker}</span>
                    </h4>
                    <p className="text-emerald-100/60 text-xs lg:text-sm leading-relaxed mt-2 font-medium">
                      Graham 수식($V=EPS \times (8.5+2g)$)과 항목당 150단어 원칙이 <span className="text-white font-bold italic">완전 박제된</span> 프롬프트입니다. 아래 내용을 복사하여 제미나이에 붙여넣으세요.
                    </p>
                  </div>
                </div>

                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-br from-rose-600 to-indigo-600 rounded-[2.5rem] blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
                  <div className="relative bg-[#0d1326] border border-slate-800 rounded-[2rem] overflow-hidden shadow-2xl">
                    <div className="flex items-center justify-between px-8 py-6 border-b border-slate-800 bg-slate-900/50">
                      <div className="flex items-center space-x-3 text-left">
                        <div className="p-1.5 bg-rose-500/10 rounded-lg">
                          <FileText className="w-4 h-4 text-rose-500" />
                        </div>
                        <span className="text-[11px] text-slate-400 font-mono font-black uppercase tracking-[0.3em]">Iron-Clad Full Output</span>
                      </div>
                      <button onClick={copyToClipboard} className={`flex items-center space-x-2 px-6 py-2.5 rounded-xl text-[11px] font-black uppercase transition-all shadow-lg ${copySuccess ? 'bg-emerald-600 text-white' : 'bg-rose-600 hover:bg-rose-500 text-white hover:scale-105 active:scale-95'}`}>
                        {copySuccess ? <CheckCircle className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copySuccess ? 'Protocols Copied' : 'Copy Full Analysis Guide'}</span>
                      </button>
                    </div>
                    <div className="p-8 lg:p-12 max-h-[65vh] overflow-y-auto custom-scrollbar font-mono text-[13px] lg:text-[15px] leading-[1.8] text-slate-300 whitespace-pre-wrap bg-[#080d1a]/80 text-left selection:bg-rose-500/40">
                      {generatedPrompt}
                    </div>
                    <div className="p-8 bg-[#0a1122] border-t border-slate-800 text-center">
                      <button onClick={() => { copyToClipboard(); window.open('https://gemini.google.com/app', '_blank'); }} className="w-full py-6 bg-gradient-to-r from-indigo-700 to-indigo-600 hover:from-indigo-600 hover:to-indigo-500 text-white rounded-2xl font-black text-sm lg:text-base shadow-[0_20px_40px_rgba(79,70,229,0.3)] flex justify-center items-center space-x-4 transition-all transform hover:scale-[1.01] active:scale-95">
                        <ExternalLink className="w-6 h-6" />
                        <span>복사 후 제미나이(Gemini)로 이동하여 무삭제 분석 수행</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-32 flex flex-col items-center justify-center text-center space-y-10 animate-in fade-in slide-in-from-bottom-10 duration-1000">
                <div className="p-8 bg-slate-900/50 rounded-full border border-slate-800 relative">
                   <div className="absolute inset-0 bg-rose-500/5 blur-3xl rounded-full"></div>
                   <FileSearch className="text-slate-600 w-20 h-20 relative z-10" />
                </div>
                <div className="space-y-4">
                  <h3 className="text-2xl lg:text-3xl font-black text-slate-500 uppercase tracking-tighter">Ready for Iron-Clad Analysis</h3>
                  <p className="text-slate-600 text-sm max-w-md mx-auto leading-relaxed font-medium">
                    기업 이름을 입력하면 <span className="text-rose-500 font-bold italic">V1.13 엄격 모드</span>가 활성화되어<br/>
                    단 하나의 지침도 누락되지 않은 완벽한 프롬프트를 생성합니다.
                  </p>
                </div>
                <div className="flex items-center space-x-2 text-[10px] text-slate-700 font-black uppercase tracking-widest bg-slate-900 px-4 py-2 rounded-full border border-slate-800">
                  <History className="w-3.5 h-3.5 text-rose-500" />
                  <span>V1.13 Zero-Omission Protocol Active</span>
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
        @keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}