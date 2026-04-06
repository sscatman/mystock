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
  Globe,
  Star,
  Zap,
  ChevronDown
} from 'lucide-react';

/**
 * AI Hyper-Analyst GLOBAL V0.7
 * 업데이트 내역:
 * 1. 사이드바 UI 최적화: 뉴스 반영, X(트위터) 포함, 거시경제 분석 토글 추가
 * 2. 질문지 엔진 강화: '관련 뉴스' 섹션 및 '생략 금지' 지침 풀텍스트 탑재
 * 3. 가치평가 정교화: Graham 공식 및 DCF 테이블 가이드 보강
 * 4. 모바일 및 데스크톱 탭 시스템(검색/포트폴리오) 시각화
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
  '거래량, 수급 분석',
  '외국인/기관 수급 분석',
  '경쟁사 비교 및 업황 분석',
  'P/E Ratio (P/E TTM, Forward P/E)',
  'Intrinsic Value, DCF Value',
  '베타(β), WACC (가중평균자본비용) 분석',
  '투자성향별 포트폴리오 적정보유비중',
  '단기/중기 매매 전략'
];

export default function App() {
  const [ticker, setTicker] = useState('아이온큐');
  const [term, setTerm] = useState('중기 (6개월~1년)');
  const [level, setLevel] = useState('5.시나리오');
  const [analysisItems, setAnalysisItems] = useState(availableItems);
  
  // New UI States from image_9c1d5d.png
  const [useNews, setUseNews] = useState(true);
  const [useTwitter, setUseTwitter] = useState(true);
  const [useMacro, setUseMacro] = useState(false);
  const [isFocusMenuOpen, setIsFocusMenuOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('search');

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

  const selectAllItems = () => {
    if (analysisItems.length === availableItems.length) setAnalysisItems([]);
    else setAnalysisItems(availableItems);
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
    
    // 요청하신 수준의 초정밀 질문지 풀텍스트 구성
    const fullPrompt = `
[역할] 월스트리트 수석 애널리스트
[대상] ${stockData ? stockData.name : upperTicker} (공식 기업명: ${stockData ? stockData.name : upperTicker})
[모드] MAIN
[중점 분석] ${analysisItems.join(', ')}
[투자 관점] ${term}
[분석 레벨] ${level}

**주의: '${upperTicker}'는 '${stockData ? stockData.name : upperTicker}'입니다. 다른 기업과 혼동하지 마십시오.**
이 분석은 '${level.split('.')[1]}' 모드입니다. 미래 불확실성을 고려하여 확률적 접근이 필수적입니다.

[데이터 요약]
${stockData ? `
- 현재 주가: ${stockData.price} ${stockData.currency}
- 전일 대비: ${stockData.change} (${stockData.changeRate}%)
- 거래량: ${stockData.volume}
- 시가총액: ${stockData.marketCap}
` : 'Chart Data Not Available.\n가격 정보 조회 실패 (직접 최신 데이터를 검색하여 반영하십시오.)'}

[재무 지표]
${isKOR ? "재무제표 수치는 검색을 통해 최신 분기 리포트(DART 등)를 참고하십시오." : "N/A (최신 Seeking Alpha 또는 Yahoo Finance 데이터를 검색하여 반영하십시오.)"}

[관련 뉴스]
${useNews ? `- [Google News] (관련 최신 뉴스를 3-5개 수집하여 형식에 맞게 리스트화 하십시오.)` : ""}
${useTwitter ? `- [X (via News)] (실시간 트위터 반응 및 전문가 코멘트를 수집하십시오.)` : ""}
${!useNews && !useTwitter ? "뉴스 분석 제외" : ""}

[분석 지침]
**다음의 항목들을 순서대로 빠짐없이 분석하십시오.**

⚠️ **[필수 준수 사항 - 매우 중요]** ⚠️
1. **생략 금지**: 사용자가 선택한 모든 분석 항목은 **예외 없이 반드시** 분석해야 합니다.
   - "지면 관계상 생략", "간략히 언급하면" 등의 표현은 절대 금지됩니다.
   - 분석 항목이 많더라도 **모든 항목을 동일한 깊이**로 다뤄야 합니다.

2. **일관된 분석 품질**: 각 분석 항목은 **최소 3-5개의 구체적 포인트**를 포함해야 합니다.
   - 단순 한 줄 요약이 아닌, 데이터와 근거를 포함한 상세 분석을 제공하십시오.
   - 각 항목별 분석 분량: 최소 150단어 이상 (표 제외)

3. **구조화된 출력**: 각 분석 항목은 별도의 섹션 헤더(##)로 구분하십시오.
   - 항목 간 명확한 시각적 구분이 필요합니다.

4. **체크리스트 확인**: 분석 완료 후, 선택된 모든 항목(${analysisItems.join(', ')})이 포함되었는지 **스스로 검증**하십시오.
   - 누락된 항목이 있다면 반드시 추가 작성하십시오.

---

0. **[기업 기본 정보 (Company Overview)]**
   - 보고서의 **가장 첫 부분**에 다음 데이터를 사용하여 **마크다운 표**를 작성하십시오.
   - 표 헤더: | 항목 | 내용 |
   - 표 데이터: | 정식 기업명 | ${stockData ? stockData.name : upperTicker} | 티커 | ${upperTicker} | 국가 | ${isKOR ? "대한민국" : "미국"} | 시가총액 | ${stockData ? stockData.marketCap : "N/A"} |

1. **[성장주/가치주 정의 및 핵심 지표 분석]**
   - 이 기업이 '성장주(Growth Stock)'인지 '가치주(Value Stock)'인지 규명하십시오.

2. **[사용자 선택 중점 분석 항목 상세]**
   ⚠️ **아래 모든 항목을 개별 섹션(##)으로 상세 분석하십시오. 절대 생략 금지!**
${analysisItems.map(item => `- ${item}`).join('\n')}

   - **만약 'P/E Ratio'가 포함되어 있다면**: P/E TTM과 Forward P/E를 비교하고 업계 평균 대비 괴리율을 분석하십시오.
   - **만약 'Intrinsic Value' 또는 'DCF'가 포함되어 있다면**:
     * **[1] Intrinsic Value (내재가치)**: Graham 공식 (V = EPS × (8.5 + 2g)) 사용.
     * **[2] DCF Value (현금흐름할인가치)**: FCF 및 WACC 기반 산출.
     * **반드시 [가치평가 항목 | 산출 금액 | 현재가 대비] 형식의 표를 작성하십시오.**

3. **[투자성향별 포트폴리오 비중 분석]**
   - 보수적(Stable), 중립적(Balanced), 공격적(Aggressive) 투자자 각각에 대한 권장 비중(%)을 제시하십시오.

4. **[시나리오별 확률 및 근거 (Scenario Analysis)]**
   - Bull(낙관), Base(기본), Bear(비관) 3가지 시나리오와 각 확률(%) 및 정량적 근거를 제시하십시오.

[결론]
반드시 [매수 / 매도 / 관망] 중 하나의 명확한 투자 의견을 제시하십시오.

⚠️ **[최종 검증 - 작성 완료 전 확인]**
선택된 모든 중점 분석 항목이 분석에 포함되었는지 확인 후 응답을 완료하십시오.
    `.trim();

    setTimeout(() => {
      setGeneratedPrompt(fullPrompt);
      setIsGenerating(false);
    }, 800);
  };

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-[#0f172a] font-sans text-slate-200 overflow-hidden">
      
      {/* Mobile Top Header */}
      <div className="lg:hidden flex items-center justify-between p-4 bg-slate-900 border-b border-slate-800 z-30">
        <div className="flex items-center space-x-2">
          <Globe className="text-rose-500 w-5 h-5" />
          <span className="font-extrabold text-xs uppercase tracking-tighter">Hyper Analyst Global V0.7</span>
        </div>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 bg-slate-800 rounded-lg">
          {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Sidebar (Responsive & Styled like image_9c1d5d.png) */}
      <div className={`
        fixed inset-0 lg:relative lg:translate-x-0 transform transition-transform duration-300 ease-in-out z-20
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        w-full lg:w-80 bg-[#1e293b] border-r border-slate-700 flex flex-col h-full shadow-2xl
      `}>
        {/* Sidebar Header */}
        <div className="hidden lg:flex p-6 border-b border-slate-700 items-center space-x-3">
          <div className="bg-rose-500/20 p-2.5 rounded-xl">
            <TrendingUp className="text-rose-500 w-6 h-6" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-lg font-black text-white italic leading-tight">프롬프트 빌더</h1>
            <span className="text-[10px] text-slate-400 font-mono tracking-widest uppercase font-bold">VERSION 0.7</span>
          </div>
        </div>
        
        {/* Sidebar Content (Toggles from image) */}
        <div className="p-6 flex-1 flex flex-col space-y-5 overflow-y-auto custom-scrollbar pt-24 lg:pt-6">
          
          {/* Toggles */}
          <div className="space-y-4">
            <div className="flex items-center justify-between group">
              <div className="flex items-center space-x-3">
                <div className={`w-8 h-4 rounded-full relative transition-colors ${useNews ? 'bg-rose-500' : 'bg-slate-600'}`}>
                  <button onClick={() => setUseNews(!useNews)} className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${useNews ? 'left-4.5' : 'left-0.5'}`} style={{left: useNews ? '18px' : '2px'}}></button>
                </div>
                <span className="text-sm font-medium text-slate-300">뉴스 데이터 반영</span>
              </div>
            </div>

            <div className="flex items-center justify-between group">
              <div className="flex items-center space-x-3">
                <div className={`w-8 h-4 rounded-full relative transition-colors ${useTwitter ? 'bg-rose-500' : 'bg-slate-600'}`}>
                  <button onClick={() => setUseTwitter(!useTwitter)} className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${useTwitter ? 'left-4.5' : 'left-0.5'}`} style={{left: useTwitter ? '18px' : '2px'}}></button>
                </div>
                <span className="text-sm font-medium text-slate-300">x(트위터) 뉴스 포함</span>
                <Info className="w-3.5 h-3.5 text-slate-500 cursor-help" />
              </div>
            </div>

            <div className="flex items-center justify-between group">
              <div className="flex items-center space-x-3">
                <div className={`w-8 h-4 rounded-full relative transition-colors ${useMacro ? 'bg-rose-500' : 'bg-slate-600'}`}>
                  <button onClick={() => setUseMacro(!useMacro)} className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${useMacro ? 'left-4.5' : 'left-0.5'}`} style={{left: useMacro ? '18px' : '2px'}}></button>
                </div>
                <span className="text-sm font-medium text-slate-300 flex items-center">
                  <Globe className="w-3.5 h-3.5 mr-1.5 text-blue-400" />
                  거시경제/지정학 분석
                </span>
                <Info className="w-3.5 h-3.5 text-slate-500 cursor-help" />
              </div>
            </div>
          </div>

          {/* Analysis Items (Dropdown style from image) */}
          <div className="border border-slate-600 rounded-xl overflow-hidden bg-slate-800/50">
            <button 
              onClick={() => setIsFocusMenuOpen(!isFocusMenuOpen)}
              className="w-full p-3 flex items-center justify-between hover:bg-slate-700 transition-colors"
            >
              <div className="flex items-center space-x-2">
                <CheckCircle className={`w-4 h-4 ${analysisItems.length > 0 ? 'text-indigo-400' : 'text-slate-500'}`} />
                <span className="text-sm font-bold text-slate-200">중점 분석 항목</span>
              </div>
              <ChevronDown className={`w-4 h-4 transition-transform ${isFocusMenuOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {isFocusMenuOpen && (
              <div className="p-3 pt-0 space-y-1.5 max-h-72 overflow-y-auto custom-scrollbar">
                <label className="flex items-center space-x-3 p-1.5 rounded hover:bg-slate-700/50 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 rounded border-slate-500 text-rose-500" checked={analysisItems.length === availableItems.length} onChange={selectAllItems} />
                  <span className="text-xs font-bold text-rose-400">전체 선택</span>
                </label>
                {availableItems.map((item, idx) => (
                  <label key={idx} className="flex items-start space-x-3 p-1.5 rounded hover:bg-slate-700/50 cursor-pointer group">
                    <input 
                      type="checkbox" 
                      className="mt-0.5 w-4 h-4 rounded border-slate-500 text-indigo-500" 
                      checked={analysisItems.includes(item)} 
                      onChange={() => toggleAnalysisItem(item)} 
                    />
                    <span className="text-[11px] text-slate-300 group-hover:text-white leading-snug">{item}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Ticker Input */}
          <div className="space-y-2 pt-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-tighter ml-1">대상 종목명 또는 티커</label>
            <div className="relative group">
              <Search className="w-4 h-4 absolute left-3 top-3.5 text-slate-500 group-focus-within:text-rose-500 transition-colors" />
              <input type="text" value={ticker} onChange={(e) => setTicker(e.target.value)} placeholder="AAPL, NVDA, 005930..." className="w-full pl-10 pr-4 py-3.5 bg-slate-900 border border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-rose-500 outline-none transition-all placeholder-slate-600" onKeyDown={(e) => e.key === 'Enter' && handleGeneratePrompt()} />
            </div>
          </div>
        </div>

        {/* Sidebar Footer Tabs (From image) */}
        <div className="p-3 bg-[#1e293b] border-t border-slate-700 flex items-center justify-around">
          <button onClick={() => setActiveTab('search')} className={`flex items-center space-x-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'search' ? 'text-rose-500' : 'text-slate-500 hover:text-slate-300'}`}>
            <Zap className="w-4 h-4" />
            <span>검색</span>
            {activeTab === 'search' && <div className="absolute bottom-0 w-8 h-1 bg-rose-500 rounded-t-full"></div>}
          </button>
          <button onClick={() => setActiveTab('portfolio')} className={`flex items-center space-x-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'portfolio' ? 'text-rose-500' : 'text-slate-500 hover:text-slate-300'}`}>
            <Star className="w-4 h-4" />
            <span>포트폴리오</span>
          </button>
        </div>

        {/* Generate Button */}
        <div className="p-6 bg-[#0f172a] border-t border-slate-700">
          <button onClick={handleGeneratePrompt} disabled={isGenerating} className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-white shadow-2xl flex justify-center items-center space-x-2 transition-all active:scale-95 ${isGenerating ? 'bg-slate-700' : 'bg-gradient-to-br from-indigo-600 to-indigo-800 hover:shadow-indigo-500/40'}`}>
            {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Terminal className="w-4 h-4" />}
            <span>{isGenerating ? '프롬프트 제작 중...' : 'Build Pro Prompt'}</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full bg-[#0a0f1e] relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,#1e293b,transparent)] opacity-20"></div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:40px_40px]"></div>
        
        <div className="relative h-full flex flex-col p-4 lg:p-12 overflow-y-auto custom-scrollbar">
          <div className="max-w-5xl mx-auto w-full pb-20">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-12 space-y-6 lg:space-y-0">
              <div className="flex items-start space-x-5">
                <div className="bg-indigo-600/20 p-4 rounded-2xl border border-indigo-500/30 shadow-2xl">
                  <Cpu className="text-indigo-400 w-10 h-10" />
                </div>
                <div>
                  <h1 className="text-3xl lg:text-4xl font-black tracking-tighter text-white italic uppercase leading-none">
                    Hyper Analyst <span className="text-rose-500 underline decoration-indigo-500 decoration-4 underline-offset-8">GLOBAL</span>
                  </h1>
                  <p className="text-slate-500 text-sm mt-3 font-medium uppercase tracking-widest">Ultimate AI Analysis Engine</p>
                </div>
              </div>
              <div className="hidden lg:flex items-center space-x-2 text-slate-600 bg-slate-800/40 px-3 py-1.5 rounded-full border border-slate-700/50">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="text-[10px] font-mono font-bold tracking-widest uppercase">Lead Analyst Active</span>
              </div>
            </div>

            {!generatedPrompt && !isGenerating && (
              <div className="mt-16 lg:mt-24 flex flex-col items-center justify-center text-center space-y-8 animate-in fade-in slide-in-from-bottom-10 duration-1000">
                <div className="relative">
                  <div className="absolute -inset-4 bg-indigo-500/10 blur-3xl rounded-full"></div>
                  <div className="w-20 h-20 lg:w-24 lg:h-24 bg-slate-800/50 rounded-3xl flex items-center justify-center border border-slate-700 shadow-2xl">
                    <FileSearch className="text-slate-400 w-10 h-10 lg:w-12 lg:h-12" />
                  </div>
                </div>
                <div className="space-y-3">
                  <h3 className="text-xl lg:text-2xl font-black text-white uppercase tracking-tighter">Ready to Build Global Analysis</h3>
                  <p className="text-slate-500 text-sm lg:text-base max-w-md mx-auto leading-relaxed">
                    월가 수석 애널리스트 수준의 프롬프트를 생성합니다. 종목을 입력하고 뉴스 데이터 반영 옵션을 선택해 주세요.
                  </p>
                </div>
              </div>
            )}

            {isGenerating && (
              <div className="mt-24 flex flex-col items-center space-y-6">
                <div className="relative">
                  <div className="w-20 h-20 border-t-4 border-rose-500 border-solid rounded-full animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <BarChart2 className="w-8 h-8 text-indigo-400 animate-pulse" />
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-white font-black text-lg tracking-tight uppercase italic">Synthesizing Instruction Set</p>
                  <p className="text-slate-500 text-sm font-medium animate-pulse">최고 품질의 분석 지침서를 구성하고 있습니다...</p>
                </div>
              </div>
            )}

            {generatedPrompt && (
              <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 space-y-8">
                <div className="bg-indigo-600/10 border border-indigo-500/20 rounded-3xl p-6 flex items-start space-x-5 shadow-inner">
                  <div className="bg-indigo-500/20 p-2 rounded-xl">
                    <Info className="text-indigo-400 w-6 h-6 flex-shrink-0" />
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-sm uppercase tracking-wide">분석 지침서 생성 완료</h4>
                    <p className="text-indigo-100/60 text-xs lg:text-sm leading-relaxed mt-1">
                      모든 항목을 누락 없이 포함하도록 지시되었습니다. 복사 후 <strong>제미나이(Gemini)</strong>에서 리포트를 확인하세요.
                    </p>
                  </div>
                </div>

                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-br from-rose-500 to-indigo-600 rounded-[2.5rem] blur opacity-30 group-hover:opacity-60 transition duration-500"></div>
                  <div className="relative bg-[#0d1326] border border-slate-700/50 rounded-[2rem] overflow-hidden shadow-2xl">
                    <div className="flex items-center justify-between px-8 py-5 border-b border-slate-700/50 bg-slate-800/30">
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 rounded-full bg-rose-500/80 shadow-[0_0_10px_#f43f5e]"></div>
                        <span className="text-[11px] text-slate-400 font-mono font-black uppercase tracking-[0.2em]">Wall-Street Grade Output</span>
                      </div>
                      <button onClick={copyToClipboard} className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-tighter transition-all shadow-lg ${copySuccess ? 'bg-emerald-600 text-white' : 'bg-rose-600 hover:bg-rose-500 text-white hover:scale-105 active:scale-95'}`}>
                        {copySuccess ? <CheckCircle className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copySuccess ? 'Copied' : 'Copy Full'}</span>
                      </button>
                    </div>
                    
                    <div className="p-8 lg:p-12 max-h-[50vh] lg:max-h-[60vh] overflow-y-auto custom-scrollbar font-mono text-[12px] lg:text-[13px] leading-[1.8] text-slate-300 whitespace-pre-wrap select-all bg-[#080d1a]/50 text-left">
                      {generatedPrompt}
                    </div>
                    
                    <div className="p-6 lg:p-8 bg-[#0a0f1d] border-t border-slate-800 flex flex-col space-y-4">
                      <button 
                        onClick={handleOpenGemini}
                        className="w-full py-5 bg-gradient-to-r from-indigo-700 to-indigo-500 hover:from-indigo-600 hover:to-indigo-400 text-white rounded-2xl font-black text-sm lg:text-base shadow-[0_10px_30px_rgba(79,70,229,0.3)] flex justify-center items-center space-x-4 transition-all transform hover:scale-[1.02] active:scale-95 border-t border-white/10"
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
        select { -webkit-appearance: none; appearance: none; }
      `}</style>
    </div>
  );
}