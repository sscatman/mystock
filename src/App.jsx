import React, { useState, useEffect } from 'react';
import { 
  Search, 
  TrendingUp, 
  BarChart2, 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  Copy, 
  Terminal, 
  FileText, 
  Cpu, 
  ChevronRight, 
  Info, 
  Settings,
  ExternalLink,
  Menu,
  X,
  FileSearch,
  Globe
} from 'lucide-react';

/**
 * AI Hyper-Analyst GLOBAL V0.6
 * 업데이트 내역:
 * 1. 질문지 내 '이하 생략' 제거: 모든 분석 지침(수식, 테이블, 검증 로직)을 풀텍스트로 출력
 * 2. 무료 버전 AI 사용자 최적화: 추가 질문 없이 한 번에 결과 도출 가능
 * 3. 한국/미국 시장 자동 감지 및 글로벌 분석 프레임워크 유지
 */
const publicDataApiKey = "885853dbc6a25a93e403ee31fa9e124778e4943b8911869ea2f254ec5d75f99b";

const fetchRealStockData = async (ticker) => {
  const isKOR = /^\d+$/.test(ticker);
  if (!isKOR) return null;

  try {
    const queryParam = `likeSrtnCd=${ticker}`;
    const url = `https://apis.data.go.kr/1160100/service/GetStockSecuritiesInfoService/getStockPriceInfo?serviceKey=${publicDataApiKey}&resultType=json&${queryParam}&numOfRows=1`;
    
    const response = await fetch(url);
    const data = await response.json();
    const item = data?.response?.body?.items?.item?.[0];
    
    if (!item) return null;

    return {
      name: item.itmsNm,
      ticker: item.srtnCd || ticker,
      price: Number(item.clpr).toLocaleString(),
      change: item.vs,
      changeRate: item.fltRt,
      volume: Number(item.trqu).toLocaleString(),
      marketCap: Number(item.mrktTotAmt).toLocaleString(),
      currency: "KRW"
    };
  } catch (error) {
    return null;
  }
};

const availableItems = [
  '현금건전성 지표 (FCF, 유동비율, 부채비율)',
  '핵심 재무제표 분석 (손익, 대차대조, 현금흐름)',
  '투자기관 목표주가 및 컨센서스',
  '호재/악재 뉴스 판단',
  '기술적 지표 (RSI/이평선)',
  '거래량 및 수급 분석 (외국인/기관)',
  '경쟁사 비교 및 업황 분석',
  'P/E Ratio (TTM, Forward) 및 밸류에이션',
  'Intrinsic Value (내재가치) 산출',
  'DCF Value (현금흐름할인가치) 산출',
  '베타(β) 및 WACC (가중평균자본비용) 분석',
  '투자성향별 포트폴리오 적정보유비중',
  '단기/중기 매매 전략 및 대응 시나리오'
];

export default function App() {
  const [ticker, setTicker] = useState('NVDA');
  const [term, setTerm] = useState('중기 (6개월~1년)');
  const [level, setLevel] = useState('5.시나리오');
  const [analysisItems, setAnalysisItems] = useState(availableItems);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) setIsSidebarOpen(false);
      else setIsSidebarOpen(true);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleAnalysisItem = (item) => {
    setAnalysisItems(prev => prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]);
  };

  const copyToClipboard = () => {
    const textArea = document.createElement("textarea");
    textArea.value = generatedPrompt;
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
      return true;
    } catch (err) {
      return false;
    } finally {
      document.body.removeChild(textArea);
    }
  };

  const handleOpenGemini = () => {
    copyToClipboard();
    window.open('https://gemini.google.com/app', '_blank');
  };

  const handleGeneratePrompt = async () => {
    if (!ticker.trim()) return;
    setIsGenerating(true);
    if (window.innerWidth < 1024) setIsSidebarOpen(false);

    const upperTicker = ticker.toUpperCase().trim();
    const isKOR = /^\d+$/.test(upperTicker);
    const stockData = await fetchRealStockData(upperTicker);
    
    const marketType = isKOR ? "한국 거래소(KRX)" : "미국 증시(NASDAQ/NYSE/AMEX)";
    const currency = isKOR ? "KRW (₩)" : "USD ($)";
    
    // 생략 없는 전체 질문지 생성
    const fullPrompt = `
[역할] 월스트리트 수석 애널리스트 (글로벌 자산운용사 시니어 전략가)
[시장 구분] ${marketType}
[대상] ${stockData ? stockData.name : upperTicker} (공식 기업명: ${stockData ? stockData.name : upperTicker})
[모드] MAIN (전문가용 심층 분석 모드)
[중점 분석 항목] ${analysisItems.join(', ')}
[투자 관점] ${term}
[분석 레벨] ${level}
[통화 단위] ${currency}

**주의: '${upperTicker}'는 ${marketType}의 기업입니다. 다른 국가의 기업과 혼동하지 마십시오.**
이 분석은 '${level.split('.')[1]}' 모드입니다. 미래 불확실성을 고려하여 확률적 접근이 필수적입니다.
${!isKOR ? "특히 미국 시장 분석 시 나스닥(NASDAQ) 및 S&P 500 지수 추이, 원/달러 환율 영향력을 반드시 포함하십시오." : ""}

[데이터 요약]
${stockData ? `
- 현재 주가: ${stockData.price} ${stockData.currency}
- 전일 대비: ${stockData.change} (${stockData.changeRate}%)
- 거래량: ${stockData.volume}
- 시가총액: ${stockData.marketCap} (공공데이터 API 실시간 반영)
` : `- 실시간 데이터 검색 필요: ${upperTicker}의 최신 주가, 거래량, 시가총액 정보를 실시간 검색하여 분석에 반영하십시오.`}

[분석 지침]
**다음의 항목들을 순서대로 빠짐없이 분석하십시오.**

⚠️ **[필수 준수 사항 - 매우 중요]** ⚠️
1. **생략 금지**: 사용자가 선택한 모든 분석 항목은 **예외 없이 반드시** 분석해야 합니다. "지면 관계상 생략", "간략히 언급하면" 등의 표현은 절대 금지됩니다.
2. **일관된 분석 품질**: 각 분석 항목은 **최소 3-5개의 구체적 포인트**를 포함해야 하며, 데이터와 근거를 바탕으로 상세히 설명하십시오.
   - 각 항목별 분석 분량: 최소 150단어 이상 (표 제외)
3. **구조화된 출력**: 각 분석 항목은 별도의 섹션 헤더(##)로 구분하십시오.
4. **체크리스트 확인**: 답변 완료 전 모든 항목이 포함되었는지 스스로 검토하고 누락 시 추가 작성하십시오.

---

0. **[기업 기본 정보 (Company Overview)]**
보고서의 가장 첫 부분에 다음 데이터를 사용하여 **마크다운 표**를 작성하십시오.
| 항목 | 내용 |
|---|---|
| 정식 기업명 | ${stockData ? stockData.name : upperTicker} |
| 티커(심볼) | ${upperTicker} |
| 섹터 (Sector) | (최신 정보 기입) |
| 산업 (Industry) | (최신 정보 기입) |
| 국가 | ${isKOR ? "대한민국" : "미국"} |
| 시가총액 | ${stockData ? stockData.marketCap : '검색 결과 반영'} |

1. **[성장주/가치주 정의 및 핵심 지표 분석]**
- 이 기업이 '성장주(Growth Stock)'인지 '가치주(Value Stock)'인지 규명하십시오.
- **성장주라면**: 매출 성장률(5년 추이), Cash Flow 증가세, ROI 개선, Profit Margin 방향성, 실적 지속성을 중점 분석.
- **가치주라면**: 시장 점유율 추이, 배당금 안정성, 주가 안정성, 이익률(Margin) 변화, EPS 트렌드를 중점 분석.

2. **[중점 분석 항목 상세]**
⚠️ **아래 모든 항목을 개별 섹션(##)으로 상세 분석하십시오. 절대 생략 금지!**
${analysisItems.map(item => `- ${item}`).join('\n')}

- **만약 'P/E Ratio'가 포함되어 있다면**: P/E TTM(Trailing Twelve Months)과 Forward P/E를 비교 분석하고, 업종 평균 P/E와의 괴리율, 역사적 P/E 밴드 내 현재 위치를 평가하십시오.
- **만약 'Intrinsic Value' 또는 'DCF'가 포함되어 있다면**: 두 가지 방법론으로 각각 정확한 가격을 산출하십시오.
  * **[1] Intrinsic Value (내재가치)**: Graham 공식 (V = EPS × (8.5 + 2g)) 또는 성장률 기반 가치 산출.
  * **[2] DCF Value (현금흐름할인가치)**: FCF_t / (1+WACC)^t 기반 산출. WACC, 영구성장률, 예측 기간을 명시한 표를 포함하십시오.
  * 반드시 [가치평가 항목 | 산출 금액 | 현재가 대비] 형식의 표를 작성하십시오.

- **만약 '기술적 지표'가 포함되어 있다면**: RSI(14) 값과 이동평균선(MA5, MA20, MA60, MA120) 수치를 인용하여 분석하십시오.

3. **[투자성향별 포트폴리오 비중 분석]**
보수적(Stable), 중립적(Balanced), 공격적(Aggressive) 투자자 각각에 대한 권장 보유 비중(%)과 논리적 이유를 제시하십시오.

4. **[시나리오별 확률 및 근거 (Scenario Analysis)]**
Bull(낙관), Base(기본), Bear(비관) 3가지 시나리오별 예상 주가 밴드와 실현 확률(%) 및 정량적 근거를 설명하십시오.

[결론]
반드시 [매수 / 매도 / 관망] 중 하나의 명확한 투자 의견을 한국어로 제시하며 마무리하십시오.

⚠️ **[최종 검증 확인]**
위 분석 리스트(${analysisItems.join(', ')})가 모두 텍스트 내에 존재하는지 확인 후 답변을 마칩니다.
    `.trim();

    setTimeout(() => {
      setGeneratedPrompt(fullPrompt);
      setIsGenerating(false);
    }, 800);
  };

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-slate-900 font-sans text-slate-200 overflow-hidden">
      
      {/* Mobile Top Header */}
      <div className="lg:hidden flex items-center justify-between p-4 bg-slate-800 border-b border-slate-700 z-30">
        <div className="flex items-center space-x-2">
          <Globe className="text-rose-500 w-5 h-5" />
          <span className="font-extrabold text-xs uppercase tracking-tighter">AI Analyst Global V0.6</span>
        </div>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 bg-slate-700 rounded-lg">
          {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Responsive Sidebar */}
      <div className={`
        fixed inset-0 lg:relative lg:translate-x-0 transform transition-transform duration-300 ease-in-out z-20
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        w-full lg:w-80 bg-slate-800 border-r border-slate-700 flex flex-col h-full shadow-2xl
      `}>
        <div className="hidden lg:flex p-6 border-b border-slate-700 items-center space-x-3">
          <div className="bg-indigo-500/10 p-2.5 rounded-xl">
            <Globe className="text-indigo-400 w-6 h-6" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-lg font-black bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent italic leading-tight text-left">Global Analyst</h1>
            <span className="text-[10px] text-rose-500 font-mono tracking-widest uppercase font-bold text-left">V0.6 GLOBAL</span>
          </div>
        </div>
        
        <div className="p-6 flex-1 flex flex-col space-y-6 overflow-y-auto custom-scrollbar pt-24 lg:pt-6">
          <div className="space-y-4">
            <div className="flex items-center text-xs font-bold text-slate-400 uppercase tracking-widest">
              <Settings className="w-3.5 h-3.5 mr-2" />
              Analysis Presets
            </div>
            <div className="grid grid-cols-1 gap-3">
              <div>
                <label className="text-[10px] text-slate-500 mb-1 block uppercase">Investment Term</label>
                <select value={term} onChange={(e) => setTerm(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs outline-none focus:ring-1 focus:ring-rose-500 transition-all">
                  <option>단기 (1~3개월)</option>
                  <option>중기 (6개월~1년)</option>
                  <option>장기 (1년 이상)</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] text-slate-500 mb-1 block uppercase">Analysis Depth</label>
                <select value={level} onChange={(e) => setLevel(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs outline-none focus:ring-1 focus:ring-rose-500 transition-all">
                  <option>1.기본분석</option>
                  <option>3.심층분석</option>
                  <option>5.시나리오</option>
                </select>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center text-xs font-bold text-slate-400 uppercase tracking-widest">
              <CheckCircle className="w-3.5 h-3.5 mr-2 text-rose-500" />
              Analysis Focus Items
            </div>
            <div className="space-y-1 max-h-52 overflow-y-auto pr-2 custom-scrollbar bg-slate-900/40 p-2 rounded-xl border border-slate-700/50">
              {availableItems.map((item, idx) => (
                <label key={idx} className="flex items-start space-x-3 cursor-pointer group p-1.5 rounded-md hover:bg-slate-700/50 transition-all">
                  <input type="checkbox" className="mt-1 w-3.5 h-3.5 rounded border-slate-600 text-rose-500 focus:ring-rose-500 bg-slate-900" checked={analysisItems.includes(item)} onChange={() => toggleAnalysisItem(item)} />
                  <span className="text-[10px] text-slate-400 group-hover:text-slate-100 leading-snug text-left">{item}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <label className="text-xs font-bold text-slate-200 block uppercase tracking-tighter text-left text-left">Symbol (AAPL, NVDA, 005930)</label>
            <div className="relative group">
              <Search className="w-4 h-4 absolute left-3 top-3.5 text-slate-500 group-focus-within:text-rose-500 transition-colors" />
              <input type="text" value={ticker} onChange={(e) => setTicker(e.target.value)} placeholder="Symbol (예: NVDA, 005930)" className="w-full pl-10 pr-4 py-3.5 bg-slate-900 border border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-rose-500 outline-none transition-all placeholder-slate-600" onKeyDown={(e) => e.key === 'Enter' && handleGeneratePrompt()} />
            </div>
          </div>
        </div>

        <div className="p-6 bg-slate-800/90 backdrop-blur-xl border-t border-slate-700">
          <button onClick={handleGeneratePrompt} disabled={isGenerating} className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-white shadow-2xl flex justify-center items-center space-x-2 transition-all active:scale-95 ${isGenerating ? 'bg-slate-700' : 'bg-gradient-to-br from-indigo-500 to-indigo-700 hover:shadow-indigo-500/40'}`}>
            {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Terminal className="w-4 h-4" />}
            <span>{isGenerating ? 'Generating...' : 'Build Global Prompt'}</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full bg-[#0a0f1e] relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,#1e293b,transparent)] opacity-20"></div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:40px_40px]"></div>
        
        <div className="relative h-full flex flex-col p-4 lg:p-12 overflow-y-auto custom-scrollbar">
          <div className="max-w-5xl mx-auto w-full">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-12 space-y-6 lg:space-y-0">
              <div className="flex items-start space-x-5">
                <div className="bg-rose-600/20 p-4 rounded-2xl border border-rose-500/30 shadow-2xl shadow-rose-500/10">
                  <Globe className="text-rose-400 w-10 h-10" />
                </div>
                <div>
                  <h1 className="text-2xl lg:text-3xl font-black tracking-tighter text-white italic uppercase leading-none text-left">
                    Hyper Analyst <span className="text-indigo-500 underline decoration-rose-500 decoration-4 underline-offset-8">GLOBAL</span>
                    <span className="text-sm font-normal text-slate-500 ml-3 not-italic">V0.6</span>
                  </h1>
                  <p className="text-slate-500 text-sm mt-3 font-medium text-left">KOR & GLOBAL Professional Prompt Engine</p>
                </div>
              </div>
              <div className="hidden lg:flex items-center space-x-2 text-slate-600 bg-slate-800/40 px-3 py-1.5 rounded-full border border-slate-700/50">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="text-[10px] font-mono font-bold tracking-widest uppercase">Global Terminal Active</span>
              </div>
            </div>

            {!generatedPrompt && !isGenerating && (
              <div className="mt-16 lg:mt-24 flex flex-col items-center justify-center text-center space-y-8 animate-in fade-in slide-in-from-bottom-10 duration-1000">
                <div className="relative">
                  <div className="absolute -inset-4 bg-rose-500/20 blur-3xl rounded-full"></div>
                  <div className="w-20 h-20 lg:w-24 lg:h-24 bg-slate-800/50 rounded-3xl flex items-center justify-center border border-slate-700 shadow-2xl transform rotate-3 hover:rotate-0 transition-transform duration-500">
                    <FileSearch className="text-slate-400 w-10 h-10 lg:w-12 lg:h-12" />
                  </div>
                </div>
                <div className="space-y-3">
                  <h3 className="text-xl lg:text-2xl font-black text-white uppercase tracking-tighter">Ready to Execute Global Analysis</h3>
                  <p className="text-slate-500 text-sm lg:text-base max-w-md mx-auto leading-relaxed">
                    티커(예: AAPL, NVDA) 또는 한국 종목코드를 입력하세요. 시장을 자동 감지하여 글로벌 전문가급 질문지를 생성합니다.
                  </p>
                </div>
              </div>
            )}

            {isGenerating && (
              <div className="mt-24 flex flex-col items-center space-y-6">
                <div className="relative">
                  <div className="w-20 h-20 border-t-4 border-indigo-500 border-solid rounded-full animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <BarChart2 className="w-8 h-8 text-rose-400 animate-pulse" />
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-white font-black text-lg tracking-tight uppercase italic">Syncing Global Market Data</p>
                  <p className="text-slate-500 text-sm font-medium animate-pulse">글로벌 마켓 데이터를 확인하고 분석 지침서를 구성 중입니다...</p>
                </div>
              </div>
            )}

            {generatedPrompt && (
              <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 space-y-8 pb-20">
                <div className="bg-rose-600/10 border border-rose-500/20 rounded-3xl p-6 flex items-start space-x-5 shadow-inner">
                  <div className="bg-rose-500/20 p-2 rounded-xl">
                    <Globe className="text-rose-400 w-6 h-6 flex-shrink-0" />
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-sm uppercase tracking-wide text-left">글로벌 분석 질문지 생성 완료</h4>
                    <p className="text-rose-100/60 text-xs lg:text-sm leading-relaxed mt-1 text-left">
                      모든 생략 지침이 제거된 전체 분석 지침이 포함되었습니다. 복사 후 제미나이에 붙여넣으세요.
                    </p>
                  </div>
                </div>

                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-br from-indigo-500 to-rose-600 rounded-[2.5rem] blur opacity-30 group-hover:opacity-60 transition duration-500"></div>
                  <div className="relative bg-[#0d1326] border border-slate-700/50 rounded-[2rem] overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                    <div className="flex items-center justify-between px-8 py-5 border-b border-slate-700/50 bg-slate-800/30">
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 rounded-full bg-indigo-500/80 shadow-[0_0_10px_#6366f1]"></div>
                        <span className="text-[11px] text-slate-400 font-mono font-black uppercase tracking-[0.2em]">Full Lead Prompt</span>
                      </div>
                      <button onClick={copyToClipboard} className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-tighter transition-all shadow-lg ${copySuccess ? 'bg-emerald-600 text-white' : 'bg-indigo-600 hover:bg-indigo-500 text-white hover:scale-105 active:scale-95'}`}>
                        {copySuccess ? <CheckCircle className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copySuccess ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                    
                    <div className="p-8 lg:p-12 max-h-[50vh] lg:max-h-[60vh] overflow-y-auto custom-scrollbar font-mono text-[12px] lg:text-[14px] leading-[1.8] text-slate-300 whitespace-pre-wrap select-all bg-[#080d1a]/50 text-left">
                      {generatedPrompt}
                    </div>
                    
                    <div className="p-6 lg:p-8 bg-[#0a0f1d] border-t border-slate-800 flex flex-col space-y-4">
                      <button 
                        onClick={handleOpenGemini}
                        className="w-full py-5 bg-gradient-to-r from-rose-700 to-rose-500 hover:from-rose-600 hover:to-rose-400 text-white rounded-2xl font-black text-sm lg:text-base shadow-[0_10px_30px_rgba(244,63,94,0.3)] flex justify-center items-center space-x-4 transition-all transform hover:scale-[1.02] active:scale-95 border-t border-white/10"
                      >
                        <ExternalLink className="w-6 h-6" />
                        <span>복사 후 제미나이(Gemini)로 이동</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        @keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}