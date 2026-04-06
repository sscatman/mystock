import React, { useState, useEffect, useRef } from 'react';
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
  ChevronDown,
  Layout,
  MousePointer2
} from 'lucide-react';

/**
 * AI Hyper-Analyst GLOBAL V1.06 PRO
 * 업데이트 내역:
 * 1. 버전 업데이트: V1.05 -> V1.06 PRO
 * 2. 지능형 제안 시스템: 이름 입력 시 정확한 코드/티커를 검색하여 선택할 수 있는 가이드 UI 추가
 * 3. 엄격한 차트 제어: 검증되지 않은 입력에 대해 애플(AAPL) 등 기본 차트 출력 방지 로직 도입
 * 4. 한국 주식 검색 API 강화: 이름(itmsNm) 기반 검색 로직 추가로 검색 편의성 극대화
 */

const publicDataApiKey = "885853dbc6a25a93e403ee31fa9e124778e4943b8911869ea2f254ec5d75f99b";

// 티커 또는 이름을 판단하여 트레이딩뷰 심볼로 변환
const getTradingViewSymbol = (input) => {
  const cleanInput = input.trim();
  const isKORNumber = /^\d{6}$/.test(cleanInput);
  
  if (isKORNumber) {
    return `KRX:${cleanInput}`;
  }
  
  if (/^[a-zA-Z]{1,5}$/.test(cleanInput)) {
    return cleanInput.toUpperCase();
  }
  
  return null; // 이름 형태일 경우 직접 심볼로 사용하지 않고 검색 유도
};

const fetchStockSuggestions = async (keyword) => {
  if (!keyword || keyword.length < 2) return [];
  
  try {
    // 한국 공공데이터 API를 이용해 이름 기반 검색 시도
    const isNum = /^\d+$/.test(keyword);
    const queryParam = isNum ? `likeSrtnCd=${keyword}` : `itmsNm=${encodeURIComponent(keyword)}`;
    const url = `https://apis.data.go.kr/1160100/service/GetStockSecuritiesInfoService/getStockPriceInfo?serviceKey=${publicDataApiKey}&resultType=json&${queryParam}&numOfRows=5`;
    
    const response = await fetch(url);
    const data = await response.json();
    const items = data?.response?.body?.items?.item;
    
    if (!items) return [];
    
    return (Array.isArray(items) ? items : [items]).map(item => ({
      name: item.itmsNm,
      code: item.srtnCd,
      market: item.mrktCtg
    }));
  } catch (error) {
    return [];
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
  '경쟁사 비교 및 업황',
  'P/E Ratio (P/E TTM, Forward P/E)',
  'Intrinsic Value, DCF Value',
  '베타(β), WACC (가중평균자본비용) 분석',
  '투자성향별 포트폴리오 적정보유비중',
  '단기/중기 매매 전략'
];

// 트레이딩뷰 차트 컴포넌트
const TradingViewWidget = ({ symbol }) => {
  const container = useRef();

  useEffect(() => {
    // symbol이 없거나 유효하지 않으면 렌더링하지 않음
    if (!symbol) {
      if (container.current) container.current.innerHTML = '';
      return;
    }

    const scriptId = 'tradingview-widget-script';
    let script = document.getElementById(scriptId);
    
    const renderWidget = () => {
      const safeId = `tv_chart_${encodeURIComponent(symbol).replace(/[^a-zA-Z0-9]/g, '_')}`;
      
      if (container.current && window.TradingView) {
        container.current.innerHTML = `<div id="${safeId}" style="height: 100%; width: 100%;"></div>`;
        
        try {
          new window.TradingView.widget({
            "autosize": true,
            "symbol": symbol,
            "interval": "D",
            "timezone": "Asia/Seoul",
            "theme": "dark",
            "style": "1",
            "locale": "kr",
            "toolbar_bg": "#f1f3f6",
            "enable_publishing": false,
            "hide_side_toolbar": false,
            "allow_symbol_change": true,
            "container_id": safeId,
            "studies": [
              "RSI@tv-basicstudies",
              "MASimple@tv-basicstudies"
            ],
          });
        } catch (e) {
          console.error("TradingView widget error:", e);
        }
      }
    };

    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://s3.tradingview.com/tv.js';
      script.async = true;
      script.onload = renderWidget;
      document.head.appendChild(script);
    } else {
      renderWidget();
    }
  }, [symbol]);

  return (
    <div className="w-full h-[450px] bg-slate-900/50 rounded-3xl overflow-hidden border border-slate-700/50 shadow-2xl relative group">
      {!symbol ? (
        <div className="w-full h-full flex flex-col items-center justify-center space-y-4 bg-slate-950/40">
          <BarChart2 className="w-12 h-12 text-slate-700 animate-pulse" />
          <p className="text-slate-500 text-sm font-medium uppercase tracking-widest">Select Valid Ticker to View Chart</p>
        </div>
      ) : (
        <div ref={container} className="w-full h-full" />
      )}
      <div className="absolute top-4 right-4 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
        <span className="px-3 py-1 bg-indigo-600 text-white text-[10px] font-black rounded-full shadow-lg uppercase tracking-widest">
          Verified Market View V1.06
        </span>
      </div>
    </div>
  );
};

export default function App() {
  const [ticker, setTicker] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [activeSymbol, setActiveSymbol] = useState(null);
  
  const [term, setTerm] = useState('중기 (6개월~1년)');
  const [level, setLevel] = useState('5.시나리오');
  const [analysisItems, setAnalysisItems] = useState(availableItems);
  
  const [useNews, setUseNews] = useState(true);
  const [useTwitter, setUseTwitter] = useState(true);
  const [isFocusMenuOpen, setIsFocusMenuOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('search');

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // 실시간 검색 제안 로직
  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      if (ticker.trim().length >= 2) {
        setIsSearching(true);
        const results = await fetchStockSuggestions(ticker);
        setSuggestions(results);
        setIsSearching(false);
      } else {
        setSuggestions([]);
      }
    }, 500);

    return () => clearTimeout(delayDebounce);
  }, [ticker]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) setIsSidebarOpen(false);
      else setIsSidebarOpen(true);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const selectSuggestion = (item) => {
    setTicker(item.code);
    setActiveSymbol(`KRX:${item.code}`);
    setSuggestions([]);
  };

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
    const cleanInput = ticker.trim();
    if (!cleanInput) return;
    
    setIsGenerating(true);
    
    // 차트 업데이트 (엄격한 검증)
    const tvSymbol = getTradingViewSymbol(cleanInput);
    if (tvSymbol) {
      setActiveSymbol(tvSymbol);
    } else {
      // 심볼이 형식이 아니면 일단 차트를 비움 (Apple 방지)
      setActiveSymbol(null);
    }

    if (window.innerWidth < 1024) setIsSidebarOpen(false);

    // 공공데이터 API를 통해 최종 데이터 요약 가져오기
    const upperTicker = cleanInput.toUpperCase();
    const isKOR = /^\d+$/.test(upperTicker);
    
    let stockData = null;
    if (isKOR) {
      const url = `https://apis.data.go.kr/1160100/service/GetStockPriceInfoService/getStockPriceInfo?serviceKey=${publicDataApiKey}&resultType=json&likeSrtnCd=${upperTicker}&numOfRows=1`;
      try {
        const resp = await fetch(url);
        const json = await resp.json();
        const item = json?.response?.body?.items?.item?.[0];
        if (item) {
          stockData = {
            name: item.itmsNm,
            ticker: item.srtnCd,
            price: Number(item.clpr).toLocaleString(),
            change: item.vs,
            changeRate: item.fltRt,
            volume: Number(item.trqu).toLocaleString(),
            marketCap: Number(item.mrktTotAmt).toLocaleString(),
            currency: "KRW"
          };
        }
      } catch (e) {}
    }
    
    const currencySym = isKOR ? "₩" : "$";
    
    const fullPrompt = `
[역할] 월스트리트 수석 애널리스트
[대상] ${stockData ? stockData.name : cleanInput} (공식 기업명: ${stockData ? stockData.name : cleanInput})
[모드] MAIN
[중점 분석] ${analysisItems.join(', ')}
[투자 관점] ${term}
[분석 레벨] ${level}
**주의: '${cleanInput}'는 '${stockData ? stockData.name : cleanInput}'입니다. 다른 기업과 혼동하지 마십시오.**
이 분석은 '시나리오 모드'입니다. 미래 불확실성을 고려하여 확률적 접근이 필수적입니다.

[데이터 요약]
${stockData ? `
- 현재 주가: ${stockData.price} ${stockData.currency}
- 전일 대비: ${stockData.change} (${stockData.changeRate}%)
- 거래량: ${stockData.volume}
- 시가총액: ${stockData.marketCap}
` : 'Chart Data Not Available.\n정확한 티커(종목코드) 입력 시 실시간 가격 데이터가 활성화됩니다.'}

[재무 지표]
N/A (최신 분기 리포트 및 지표를 직접 검색하여 분석에 반영하십시오.)

[관련 뉴스 및 산업 동향 전략]
${useNews ? `
- [Company News]: '${cleanInput}' 기업 개별 호재/악재 뉴스를 3-5개 수집하십시오.
- [Category/Sector News]: 이 기업이 속한 핵심 산업 카테고리(예: ${cleanInput === 'NVDA' ? 'AI, 반도체, 데이터센터' : cleanInput === 'IONQ' ? '양자 컴퓨팅, 차세대 연산' : '해당 산업군'})에 대한 매크로 트렌드와 기술적 동향 뉴스를 반드시 포함하여 분석하십시오.
` : ""}
${useTwitter ? `- [X (via News)] (실시간 시장 반응 및 전문가들의 산업 전망 트윗을 수집하십시오.)` : ""}

[분석 지침]
**다음의 항목들을 순서대로 빠침없이 분석하십시오.**

⚠️ **[필수 준수 사항 - 매우 중요]** ⚠️
1. **생략 금지**: 사용자가 선택한 모든 분석 항목은 **예외 없이 반드시** 분석해야 합니다.
2. **일관된 분석 품질**: 각 분석 항목은 **최소 3-5개의 구체적 포인트**를 포함해야 합니다.
3. **구조화된 출력**: 각 분석 항목은 별도의 섹션 헤더(##)로 구분하십시오.
4. **체크리스트 확인**: 분석 완료 후 선택된 모든 항목(${analysisItems.join(', ')})이 포함되었는지 스스로 검증하십시오.

---

0. **[기업 기본 정보 (Company Overview)]**
   - | 항목 | 내용 |
     | 정식 기업명 | ${stockData ? stockData.name : cleanInput} |
     | 티커(심볼) | ${upperTicker} |
     | 섹터 (Sector) | N/A |
     | 산업 (Industry) | N/A |
     | 국가 | ${isKOR ? "대한민국" : "N/A"} |
     | 시가총액 | ${stockData ? stockData.marketCap : "N/A"} |

1. **[성장주/가치주 정의 및 핵심 지표 분석]**
   - 이 기업이 '성장주(Growth Stock)'인지 '가치주(Value Stock)'인지 규명하십시오.

2. **[중점 분석 항목 상세]**
   ⚠️ **아래 리스트의 모든 항목을 개별 섹션으로 상세 분석하십시오. 절대 생략 금지!**
${analysisItems.map(item => `- ${item}`).join('\n')}

   - **각 항목별로 ## 헤더를 사용하여 별도 섹션으로 작성**하십시오.
   - **Intrinsic Value / DCF**가 포함되어 있다면 반드시 형식에 맞는 표를 작성하십시오.

3. **[투자성향별 포트폴리오 비중 분석]**
   - 보수적(Stable), 중립적(Balanced), 공격적(Aggressive) 성향별 권장 비중 제시.

4. **[시나리오별 확률 및 근거 (Scenario Analysis)]**
   - Bull / Base / Bear 시나리오와 실현 확률 제시.

[결론]
반드시 [매수 / 매도 / 관망] 중 하나의 명확한 투자 의견을 제시하십시오.
    `.trim();

    setTimeout(() => {
      setGeneratedPrompt(fullPrompt);
      setIsGenerating(false);
    }, 800);
  };

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-[#0f172a] font-sans text-slate-200 overflow-hidden">
      
      {/* Mobile Header */}
      <div className="lg:hidden flex items-center justify-between p-4 bg-slate-900 border-b border-slate-800 z-30">
        <div className="flex items-center space-x-2">
          <Globe className="text-rose-500 w-5 h-5" />
          <span className="font-extrabold text-xs uppercase tracking-tighter text-left">Hyper Analyst Global V1.06</span>
        </div>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 bg-slate-800 rounded-lg">
          {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Sidebar */}
      <div className={`
        fixed inset-0 lg:relative lg:translate-x-0 transform transition-transform duration-300 ease-in-out z-20
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        w-full lg:w-80 bg-[#1e293b] border-r border-slate-700 flex flex-col h-full shadow-2xl overflow-hidden
      `}>
        <div className="flex p-6 border-b border-slate-700 items-center space-x-3 bg-[#1e293b]">
          <div className="bg-rose-500/10 p-2.5 rounded-xl">
            <TrendingUp className="text-rose-500 w-6 h-6" />
          </div>
          <div className="flex flex-col text-left">
            <h1 className="text-lg font-black text-white italic leading-tight">프롬프트 빌더</h1>
            <span className="text-[10px] text-slate-400 font-mono tracking-widest uppercase font-bold">V1.06 PRO</span>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
          {/* Analysis Settings */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`w-8 h-4 rounded-full relative transition-colors ${useNews ? 'bg-rose-500' : 'bg-slate-600'}`}>
                  <button onClick={() => setUseNews(!useNews)} className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${useNews ? 'left-[18px]' : 'left-[2px]'}`}></button>
                </div>
                <span className="text-sm font-medium text-slate-300">뉴스 데이터 반영</span>
              </div>
            </div>
          </div>

          {/* Analysis Items */}
          <div className="border border-slate-600 rounded-xl overflow-hidden bg-slate-800/50">
            <button onClick={() => setIsFocusMenuOpen(!isFocusMenuOpen)} className="w-full p-3 flex items-center justify-between hover:bg-slate-700 transition-colors">
              <div className="flex items-center space-x-2 text-left">
                <CheckCircle className="w-4 h-4 text-indigo-400 mr-2" />
                <span className="text-sm font-bold text-slate-200">중점 분석 항목</span>
              </div>
              <ChevronDown className={`w-4 h-4 transition-transform ${isFocusMenuOpen ? 'rotate-180' : ''}`} />
            </button>
            {isFocusMenuOpen && (
              <div className="p-3 pt-0 space-y-1.5 max-h-[40vh] overflow-y-auto custom-scrollbar bg-slate-900/20">
                <label className="flex items-center space-x-3 p-1.5 rounded hover:bg-slate-700/50 cursor-pointer sticky top-0 bg-[#252d41] z-10 shadow-sm">
                  <input type="checkbox" className="w-4 h-4 rounded border-slate-500 text-rose-500" checked={analysisItems.length === availableItems.length} onChange={selectAllItems} />
                  <span className="text-xs font-bold text-rose-400 text-left">전체 선택</span>
                </label>
                {availableItems.map((item, idx) => (
                  <label key={idx} className="flex items-start space-x-3 p-1.5 rounded hover:bg-slate-700/50 cursor-pointer">
                    <input type="checkbox" className="mt-0.5 w-4 h-4 rounded border-slate-500 text-indigo-500" checked={analysisItems.includes(item)} onChange={() => toggleAnalysisItem(item)} />
                    <span className="text-[11px] text-slate-300 text-left leading-snug">{item}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Search Box with Smart Suggestions */}
          <div className="space-y-3 pt-2 relative">
            <div className="relative group">
              <Search className="w-4 h-4 absolute left-3 top-3.5 text-slate-500 group-focus-within:text-rose-500 transition-colors" />
              <input 
                type="text" 
                value={ticker} 
                onChange={(e) => setTicker(e.target.value)} 
                placeholder="삼성전자, NVDA..." 
                className="w-full pl-10 pr-4 py-3.5 bg-slate-900 border border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-rose-500 outline-none transition-all text-left"
                onKeyDown={(e) => e.key === 'Enter' && handleGeneratePrompt()} 
              />
            </div>
            
            {/* Suggestions UI */}
            {(isSearching || suggestions.length > 0) && (
              <div className="absolute left-0 right-0 top-full mt-2 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                {isSearching ? (
                  <div className="p-4 flex items-center justify-center space-x-3">
                    <Loader2 className="w-4 h-4 text-rose-500 animate-spin" />
                    <span className="text-xs text-slate-400">데이터 검색 중...</span>
                  </div>
                ) : (
                  <div className="flex flex-col p-1">
                    <div className="px-3 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-tighter flex items-center">
                      <MousePointer2 className="w-3 h-3 mr-1" /> 선택하여 차트 활성화
                    </div>
                    {suggestions.map((item, i) => (
                      <button 
                        key={i} 
                        onClick={() => selectSuggestion(item)}
                        className="flex items-center justify-between px-3 py-2.5 hover:bg-slate-700 rounded-lg transition-colors group text-left"
                      >
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-slate-100">{item.name}</span>
                          <span className="text-[10px] text-slate-500 font-mono">{item.market}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-[10px] font-black text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded uppercase tracking-tighter">
                            {item.code}
                          </span>
                          <ChevronRight className="w-3 h-3 text-slate-600 group-hover:text-rose-500" />
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            <div className="px-1 space-y-1 text-left">
              <p className="text-[10px] text-slate-500 italic">기업 이름을 입력하고 제안된 코드를 클릭하세요.</p>
              <p className="text-[10px] text-slate-400 font-medium">예: 삼성전자, 엔비디아, 아이온큐</p>
            </div>
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="bg-[#1e293b] border-t border-slate-700">
          <div className="p-3 flex items-center justify-around">
            <button onClick={() => setActiveTab('search')} className={`flex items-center space-x-1.5 px-4 py-2 rounded-lg text-xs font-bold ${activeTab === 'search' ? 'text-rose-500' : 'text-slate-500'}`}>
              <Zap className="w-4 h-4" /><span>검색</span>
            </button>
            <button onClick={() => setActiveTab('portfolio')} className={`flex items-center space-x-1.5 px-4 py-2 rounded-lg text-xs font-bold ${activeTab === 'portfolio' ? 'text-rose-500' : 'text-slate-500'}`}>
              <Star className="w-4 h-4" /><span>포트폴리오</span>
            </button>
          </div>

          <div className="p-6 pt-0">
            <button onClick={handleGeneratePrompt} disabled={isGenerating} className={`w-full py-4 rounded-2xl font-black text-xs uppercase text-white shadow-2xl flex justify-center items-center space-x-2 transition-all active:scale-95 ${isGenerating ? 'bg-slate-700' : 'bg-gradient-to-br from-indigo-600 to-indigo-800'}`}>
              {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Terminal className="w-4 h-4" />}
              <span>{isGenerating ? 'ANALYZING...' : 'Build Full Analysis'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full bg-[#0a0f1e] relative overflow-hidden text-left">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:40px_40px]"></div>
        
        <div className="relative h-full flex flex-col p-4 lg:p-12 overflow-y-auto custom-scrollbar">
          <div className="max-w-6xl mx-auto w-full pb-20 space-y-10">
            
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between space-y-6 lg:space-y-0 text-left">
              <div className="flex items-start space-x-5">
                <div className="bg-indigo-600/20 p-4 rounded-2xl border border-indigo-500/30">
                  <Cpu className="text-indigo-400 w-10 h-10" />
                </div>
                <div>
                  <div className="flex items-center">
                    <h1 className="text-3xl lg:text-4xl font-black tracking-tighter text-white italic uppercase leading-none">
                      Hyper Analyst <span className="text-rose-500 underline decoration-indigo-500 decoration-4 underline-offset-8">GLOBAL</span>
                    </h1>
                    <span className="text-sm font-normal text-slate-500 ml-4 not-italic font-mono">V1.06</span>
                  </div>
                  <p className="text-slate-500 text-sm mt-3 font-medium uppercase tracking-widest">Verified Market Intelligence Engine</p>
                </div>
              </div>
            </div>

            {/* TradingView Chart Section */}
            <div className="animate-in fade-in zoom-in-95 duration-500 text-left">
              <div className="flex items-center space-x-2 mb-4">
                <Layout className="w-4 h-4 text-rose-500" />
                <h2 className="text-sm font-black uppercase tracking-widest text-slate-300">
                  {activeSymbol ? `Live Market Intelligence Chart (${activeSymbol})` : 'Waiting for Symbol Selection'}
                </h2>
              </div>
              <TradingViewWidget symbol={activeSymbol} />
              
              {/* Alert for manual input issues */}
              {activeSymbol && (
                <div className="mt-4 p-4 bg-slate-900/80 border border-slate-700/50 rounded-2xl flex items-start space-x-3 shadow-xl text-left">
                  <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                  <div className="space-y-1">
                    <p className="text-[11px] text-slate-300 font-bold">
                      차트가 여전히 "제공되지 않는 심볼"이라고 뜨나요?
                    </p>
                    <p className="text-[10px] text-slate-400 leading-relaxed">
                      트레이딩뷰 엔진이 실시간으로 해당 코드를 확인하는 중입니다. 
                      오류 메시지 확인 버튼 클릭 시 <span className="text-white font-bold">애플(AAPL) 차트로 넘어가는 것은 엔진 기본값</span>이며, 
                      반드시 검색창 하단의 <span className="text-rose-400 font-bold">검증된 추천 코드(005930 등)</span>를 클릭하여 로드해 주세요.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Prompt Output Section */}
            {!generatedPrompt && !isGenerating && (
              <div className="mt-16 flex flex-col items-center justify-center text-center space-y-8 animate-in fade-in slide-in-from-bottom-10 duration-1000">
                <FileSearch className="text-slate-500 w-16 h-16" />
                <h3 className="text-xl lg:text-2xl font-black text-white uppercase tracking-tighter text-left">Global Market Insight</h3>
                <p className="text-slate-500 text-sm max-w-md mx-auto leading-relaxed text-left">
                  {activeSymbol ? '차트 분석을 마쳤다면 정밀 분석 프롬프트를 생성하세요.' : '왼쪽 사이드바에서 기업명을 입력하고 제안된 코드를 클릭하여 차트를 활성화하세요.'}
                </p>
              </div>
            )}

            {isGenerating && (
              <div className="mt-12 flex flex-col items-center space-y-6">
                <Loader2 className="w-12 h-12 text-rose-500 animate-spin" />
                <p className="text-slate-500 text-sm font-medium animate-pulse text-left">시장 데이터를 검증하고 월스트리트 등급 보고서를 구성 중입니다...</p>
              </div>
            )}

            {generatedPrompt && (
              <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 space-y-8 text-left">
                <div className="bg-indigo-600/10 border border-indigo-500/20 rounded-3xl p-6 flex items-start space-x-5 shadow-inner">
                  <div className="bg-indigo-500/20 p-2 rounded-lg h-fit">
                    <Info className="text-indigo-400 w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-sm uppercase tracking-wide">Analysis Prompt Verified</h4>
                    <p className="text-indigo-100/60 text-xs lg:text-sm leading-relaxed mt-1">사용자가 선택한 코드를 바탕으로 무삭제 풀텍스트 분석 지침서가 생성되었습니다.</p>
                  </div>
                </div>

                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-br from-rose-500 to-indigo-600 rounded-[2.5rem] blur opacity-30 group-hover:opacity-60 transition duration-500"></div>
                  <div className="relative bg-[#0d1326] border border-slate-700/50 rounded-[2rem] overflow-hidden shadow-2xl">
                    <div className="flex items-center justify-between px-8 py-5 border-b border-slate-700/50 bg-slate-800/30">
                      <span className="text-[11px] text-slate-400 font-mono font-black uppercase tracking-[0.2em]">Wall-Street Full Output (V1.06)</span>
                      <button onClick={copyToClipboard} className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-[11px] font-black uppercase transition-all ${copySuccess ? 'bg-emerald-600 text-white' : 'bg-rose-600 hover:bg-rose-500 text-white'}`}>
                        {copySuccess ? <CheckCircle className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copySuccess ? 'Copied' : 'Copy Full'}</span>
                      </button>
                    </div>
                    <div className="p-8 lg:p-12 max-h-[55vh] lg:max-h-[65vh] overflow-y-auto custom-scrollbar font-mono text-[12px] lg:text-[14px] leading-[1.8] text-slate-300 whitespace-pre-wrap select-all bg-[#080d1a]/50 text-left">
                      {generatedPrompt}
                    </div>
                    <div className="p-6 lg:p-8 bg-[#0a0f1d] border-t border-slate-800">
                      <button onClick={handleOpenGemini} className="w-full py-5 bg-gradient-to-r from-indigo-700 to-indigo-500 hover:from-indigo-600 hover:to-indigo-400 text-white rounded-2xl font-black text-sm lg:text-base shadow-[0_10px_30px_rgba(79,70,229,0.3)] flex justify-center items-center space-x-4 transition-all transform hover:scale-[1.01] active:scale-95">
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
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        @keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}