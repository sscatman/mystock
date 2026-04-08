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
 * AI Hyper-Analyst GLOBAL V1.17 DUAL-API (KEY-FREE EDITION)
 * 업데이트 내역:
 * 1. Yahoo Finance API 키 완전 제거 (무료 Public 엔드포인트 활용)
 * 2. CORS 프록시(allorigins) 우회를 통한 브라우저(JS) 환경 야후 데이터 로드
 * 3. KODEX 등 ETF 및 해외주식 실시간 가격/티커 자동 매핑
 */

// 한국 공공데이터 API 키 (국내 개별 주식 1차 검색용)
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
  const [useMacro, setUseMacro] = useState(false);
  const [reportType, setReportType] = useState('MAIN'); 

  const [isFocusMenuOpen, setIsFocusMenuOpen] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // 수동 검색 함수 (Dual API 적용 - API Key Free)
  const handleSearch = async (isManual = false) => {
    const cleanInput = ticker.trim();
    if (cleanInput.length < 2) return;
    
    // 모바일에서 직접 검색 시 사이드바 닫기
    if (isManual && window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }

    setIsSearching(true);
    let currentStockInfo = null;

    try {
      // --- 1단계: 한국 공공데이터 API 호출 (개별 주식) ---
      const isNum = /^\d+$/.test(cleanInput);
      const queryParam = isNum ? `likeSrtnCd=${cleanInput}` : `itmsNm=${encodeURIComponent(cleanInput)}`;
      const publicUrl = `https://apis.data.go.kr/1160100/service/GetStockSecuritiesInfoService/getStockPriceInfo?serviceKey=${publicDataApiKey}&resultType=json&${queryParam}&numOfRows=1`;
      
      const response = await fetch(publicUrl);
      const data = await response.json();
      const item = data?.response?.body?.items?.item?.[0];
      
      if (item) {
        currentStockInfo = {
          name: item.itmsNm,
          code: item.srtnCd,
          market: item.mrktCtg,
          price: item.clpr,
          change: item.vs,
          changeRate: item.fltRt
        };
      } else {
        // --- 2단계: 공공데이터 실패 시 야후 Public API (CORS 프록시 우회) ---
        console.log("공공데이터 없음. Yahoo Public API (Proxy)를 호출합니다...");
        try {
          // 1) 야후 검색 API로 심볼(티커) 찾기
          const searchUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(`https://query2.finance.yahoo.com/v1/finance/search?q=${cleanInput}`)}`;
          const searchRes = await fetch(searchUrl);
          const searchData = await searchRes.json();
          const firstResult = searchData?.quotes?.[0];

          if (firstResult && firstResult.symbol) {
            // 2) 찾은 심볼로 현재가(Chart) 조회
            const quoteUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(`https://query1.finance.yahoo.com/v8/finance/chart/${firstResult.symbol}`)}`;
            const quoteRes = await fetch(quoteUrl);
            const quoteData = await quoteRes.json();
            const meta = quoteData?.chart?.result?.[0]?.meta;

            if (meta) {
              const previousClose = meta.chartPreviousClose || meta.previousClose;
              const changeValue = meta.regularMarketPrice - previousClose;
              const changePercent = (changeValue / previousClose) * 100;

              currentStockInfo = {
                name: firstResult.shortname || firstResult.longname || cleanInput,
                code: firstResult.symbol,
                market: firstResult.exchDisp || 'Global',
                price: meta.regularMarketPrice,
                change: changeValue.toFixed(2),
                changeRate: changePercent.toFixed(2)
              };
            }
          }
        } catch (yahooErr) {
          console.error("Yahoo Public API Fetch Error:", yahooErr);
        }
      }
    } catch (error) {
      console.error("Fetch error", error);
    } finally {
      setIsSearching(false);
      setActiveStockData(currentStockInfo);
      // API 실패하더라도 입력한 이름으로 프롬프트는 무조건 생성
      generatePromptContent(currentStockInfo || { name: cleanInput, code: cleanInput }, reportType);
    }
  };

  // 자동 종목 검색
  useEffect(() => {
    const autoGenerate = setTimeout(() => {
      if (ticker.trim().length >= 2) {
        handleSearch(false);
      }
    }, 1200); 

    return () => clearTimeout(autoGenerate);
  }, [ticker, useMacro, reportType, analysisItems]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault(); 
      e.target.blur(); // 모바일 키보드 숨기기
      handleSearch(true); 
    }
  };

  const generatePromptContent = (stockInfo, type = 'MAIN') => {
    setIsGenerating(true);
    const stockName = stockInfo?.name || ticker;
    const stockCode = stockInfo?.code || ticker;
    const isKOR = /^\d+$/.test(stockCode) || (stockInfo && stockInfo.market && (stockInfo.market.includes('KOSPI') || stockInfo.market.includes('KOSDAQ')));
    const currencySym = isKOR ? "₩" : "$";

    let fullPrompt = "";

    if (type === 'MAIN') {
      fullPrompt = `
[역할] 월스트리트 수석 애널리스트
[대상] ${stockName} (공식 기업/ETF명: ${stockName})
[모드] MAIN
[중점 분석] ${analysisItems.join(', ')}
[투자 관점] ${term}
[분석 레벨] ${level}
**주의: '${stockName}'는 '${stockName}'입니다. 다른 종목과 혼동하지 마십시오.**
이 분석은 '시나리오 모드'입니다. 미래 불확실성을 고려하여 확률적 접근이 필수적입니다.

[데이터 요약]
${stockInfo && stockInfo.price !== undefined ? `- 현재가: ${Number(stockInfo.price).toLocaleString()} ${isKOR ? 'KRW' : 'USD'} / 전일대비: ${stockInfo.change > 0 ? '+' : ''}${stockInfo.change} (${stockInfo.changeRate}%)` : '실시간 시세 연동 실패 (오프라인 모드로 자체 분석 진행 요망)'}

[관련 뉴스]
(이 섹션에서 실시간 뉴스를 수집하십시오. 형식: [Google News] 제목 - 출처 (날짜))

[분석 지침]
**다음의 항목들을 순서대로 빠짐없이 분석하십시오.**

⚠️ **[필수 준수 사항 - 매우 중요]** ⚠️
1. **생략 금지**: 사용자가 선택한 모든 분석 항목은 **예외 없이 반드시** 분석해야 합니다.
   - "지면 관계상 생략", "간략히 언급하면" 등의 표현은 절대 금지됩니다.
   - 분석 항목이 많더라도 **모든 항목을 동일한 깊이**로 다뤄야 합니다.

2. **일관된 분석 품질**: 각 분석 항목은 **최소 3-5개의 구체적 포인트**를 포함해야 합니다.
   - 단순 한 줄 요약이 아닌, 데이터와 근거를 포함한 상세 분석을 제공하십시오.

3. **구조화된 출력**: 각 분석 항목은 별도의 섹션 헤더(##)로 구분하십시오.

---

0. **[종목 기본 정보 (Overview)]**
   - 보고서의 **가장 첫 부분**에 다음 데이터를 사용하여 **마크다운 표**를 작성하십시오.
     | 정식 명칭 | ${stockName} |
     | 티커(심볼) | ${stockCode} |
     | 시장/섹터 | ${stockInfo?.market || 'N/A'} |
     | 국가 | ${isKOR ? '대한민국' : 'Global'} |

1. **[성장성 및 핵심 지표 분석]**
   - 이 종목(ETF 포함)의 성장성과 가치를 분석하십시오. ETF일 경우 주요 구성 종목(Holdings)과 추종 지수를 포함하여 분석하십시오.

2. **[사용자 선택 중점 분석 항목 상세]**
   ⚠️ **아래 리스트의 모든 항목을 개별 섹션으로 상세 분석하십시오. 절대 생략 금지!**
   - 선택된 항목 목록: ${analysisItems.join(', ')}
   - 각 항목당 최소 3개 이상의 구체적 분석 포인트를 포함하십시오.

3. **[투자성향별 포트폴리오 비중 분석]** (선택 시):
   - 보수적(Stable), 중립적(Balanced), 공격적(Aggressive) 3가지 투자 성향에 맞춘 권장 보유 비중(%)

4. **[시나리오별 확률 및 근거 (Scenario Analysis)]**
   - **Bull (낙관) / Base (기본) / Bear (비관)** 3가지 시나리오 (예상 가격 및 확률 포함)

${useMacro ? `
**[🌍 거시경제 및 지정학적 분석 - 필수 포함]**
- 통화정책 및 금리 영향 / 지정학적 리스크 / 거시경제 사이클 / 글로벌 정책 변화 / 환율 및 자금 흐름을 심층 분석하십시오.
` : ''}

[출력 형식]
- 보고서는 가독성 있게 마크다운 형식으로 작성하십시오.
- **모든 답변은 반드시 '한글'로 작성하십시오.**

[결론]
반드시 [매수 / 매도 / 관망] 중 하나의 명확한 투자 의견을 제시하십시오.

⚠️ **[최종 검증]**
- 선택된 중점 분석 항목: ${analysisItems.join(', ')} (누락 시 반드시 추가 작성)
`.trim();
    } else {
      fullPrompt = `
[역할] 월가 수석 애널리스트
[대상] ${stockName} (공식명: ${stockName})
[자료] 최신 ${type} 보고서 기반 분석
**주의: '${stockName}' 분석 시 다른 종목과 혼동하지 마십시오.**

[지시사항]
이 종목의 최신 ${type} 공시 자료를 바탕으로 핵심 이슈, 실적(가이던스), 리스크, 그리고 투자 매력도를 상세히 분석해 주십시오. 
ETF의 경우 운용사의 최신 보고서나 포트폴리오 변경 내역(Rebalancing)을 분석하십시오.
모든 답변은 한글로, 마크다운 형식(## 섹션)을 지켜 상세히 작성하십시오.
`.trim();
    }

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
      
      {/* 모바일 햄버거 메뉴 */}
      <div className="lg:hidden p-4 flex justify-between items-center border-b border-slate-800 bg-[#111827]">
        <div className="flex items-center space-x-2">
          <Cpu className="text-rose-500 w-6 h-6" />
          <span className="font-black text-white italic">Hyper-Analyst</span>
        </div>
        <button 
          onClick={() => setIsSidebarOpen(true)} 
          className="p-2 text-slate-400 hover:text-white rounded-lg bg-slate-800/50"
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* Sidebar */}
      <div className={`fixed inset-0 lg:relative lg:translate-x-0 transform transition-transform duration-300 ease-in-out z-50 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} w-full lg:w-80 bg-[#111827] border-r border-slate-800 flex flex-col h-full shadow-2xl`}>
        <div className="flex p-6 border-b border-slate-800 items-center justify-between bg-[#111827]">
          <div className="flex items-center space-x-3">
            <div className="bg-rose-500/20 p-2 rounded-lg">
              <TrendingUp className="text-rose-500 w-6 h-6" />
            </div>
            <div className="flex flex-col text-left">
              <h1 className="text-lg font-black text-white italic leading-tight">Hyper-Analyst</h1>
              <span className="text-[10px] text-rose-500 font-mono tracking-widest uppercase font-bold">V1.17 FREE-API</span>
            </div>
          </div>
          {/* 모바일 닫기 버튼 */}
          <button 
            onClick={() => setIsSidebarOpen(false)} 
            className="lg:hidden p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6 text-left">
          <div className="space-y-4">
            <h3 className="text-[10px] font-black text-rose-500 uppercase tracking-widest">분석 옵션</h3>
            <div className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-800/50 transition-colors cursor-pointer" onClick={() => setUseNews(!useNews)}>
               <div className="flex items-center space-x-3">
                <Newspaper className="w-4 h-4 text-slate-400" />
                <span className="text-xs font-bold text-slate-300">뉴스 데이터 반영</span>
              </div>
              <div className={`w-8 h-4 rounded-full relative transition-colors ${useNews ? 'bg-rose-500' : 'bg-slate-700'}`}>
                <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${useNews ? 'left-[18px]' : 'left-[2px]'}`}></div>
              </div>
            </div>

            <div className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-800/50 transition-colors cursor-pointer" onClick={() => setUseMacro(!useMacro)}>
               <div className="flex items-center space-x-3">
                <Globe2 className="w-4 h-4 text-rose-500" />
                <span className="text-xs font-bold text-slate-300">거시경제/지정학 분석</span>
              </div>
              <div className={`w-8 h-4 rounded-full relative transition-colors ${useMacro ? 'bg-rose-500' : 'bg-slate-700'}`}>
                <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${useMacro ? 'left-[18px]' : 'left-[2px]'}`}></div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
             <h3 className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">포트폴리오 공시 분석</h3>
             <div className="grid grid-cols-2 gap-2">
                {['10-K', '10-Q', '8-K', 'MAIN'].map(type => (
                  <button key={type} onClick={() => setReportType(type)} className={`p-2 rounded-lg border text-[11px] font-bold transition-all ${reportType === type ? 'bg-indigo-500/20 border-indigo-500 text-indigo-400' : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-600'}`}>
                    {type === 'MAIN' ? '종합 분석' : type}
                  </button>
                ))}
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
                onKeyDown={handleKeyDown}
                placeholder="기업/ETF 검색 (예: KODEX 반도체, TSLA)" 
                className="w-full pl-10 pr-4 py-3.5 bg-[#070b14] border border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-rose-500 outline-none text-left transition-all" 
              />
            </div>
          </div>
        </div>

        <div className="p-6 bg-[#111827] border-t border-slate-800">
           <button onClick={() => { handleSearch(true); }} className="w-full py-4 rounded-2xl font-black text-xs uppercase text-white shadow-2xl flex justify-center items-center space-x-2 bg-gradient-to-r from-rose-600 to-rose-800 hover:from-rose-500 hover:to-rose-700 active:scale-95 transition-all">
            <Terminal className="w-4 h-4" />
            <span>프롬프트 생성 / 적용</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full relative overflow-hidden bg-[#0a0f1e]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,#f43f5e08,transparent_50%)]"></div>
        <div className="relative h-full flex flex-col p-4 lg:p-12 overflow-y-auto custom-scrollbar text-left">
          <div className="max-w-4xl mx-auto w-full pb-20 space-y-12">
            
            <div className="flex items-start space-x-6 text-left">
              <div className="hidden lg:flex bg-rose-500/10 p-5 rounded-3xl border border-rose-500/20 shadow-[0_0_30px_rgba(244,63,94,0.1)]">
                <Cpu className="text-rose-500 w-12 h-12" />
              </div>
              <div>
                <div className="flex items-center">
                  <h1 className="text-3xl lg:text-5xl font-black tracking-tighter text-white italic uppercase leading-none">
                    Hyper Analyst <span className="text-indigo-500 underline decoration-rose-500 decoration-8 underline-offset-[12px]">GLOBAL</span>
                  </h1>
                  <span className="hidden md:inline-block text-xs font-black text-rose-500 ml-6 font-mono bg-rose-500/10 px-2 py-1 rounded border border-rose-500/20">V1.17</span>
                </div>
                <p className="text-slate-500 text-xs lg:text-sm mt-5 font-bold uppercase tracking-[0.2em] lg:tracking-[0.3em] flex items-center">
                  <Database className="w-4 h-4 mr-2 text-indigo-500 flex-shrink-0" /> KEY-FREE YAHOO API INTEGRATED
                </p>
              </div>
            </div>

            {isGenerating || isSearching ? (
              <div className="flex flex-col items-center justify-center py-32 space-y-8 animate-in fade-in duration-500">
                <Loader2 className="w-16 h-16 text-rose-500 animate-spin relative z-10" />
                <div className="text-center space-y-2">
                  <p className="text-white font-black uppercase tracking-widest text-lg">Fetching Global Data...</p>
                  <p className="text-slate-500 text-sm font-medium italic">야후 파이낸스망을 통해 KODEX/해외 종목을 조회 중입니다.</p>
                </div>
              </div>
            ) : generatedPrompt ? (
              <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 space-y-10 text-left">
                <div className="bg-rose-500/5 border border-rose-500/20 rounded-3xl p-6 flex items-start space-x-6 shadow-inner">
                  <ShieldAlert className="text-rose-400 w-7 h-7 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="text-white font-black text-sm uppercase tracking-wider">
                      Dual API Prompt Ready
                    </h4>
                    <p className="text-rose-100/60 text-xs lg:text-sm leading-relaxed mt-2">
                      <span className="text-white font-bold italic">한국 공공데이터 및 야후 파이낸스망이 통합 적용되었습니다.</span> (API Key 없이 구동)
                    </p>
                  </div>
                </div>

                <div className="relative group text-left">
                  <div className="absolute -inset-1 bg-gradient-to-br from-rose-600 to-indigo-600 rounded-[2.5rem] blur opacity-20"></div>
                  <div className="relative bg-[#0d1326] border border-slate-800 rounded-[2rem] overflow-hidden">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-6 lg:px-8 py-6 border-b border-slate-800 bg-slate-900/50 space-y-4 sm:space-y-0">
                      <div className="flex items-center space-x-3">
                        <FileText className="w-4 h-4 text-rose-500" />
                        <span className="text-[11px] text-slate-400 font-mono font-black uppercase tracking-[0.2em] lg:tracking-[0.3em]">RAW SOURCE OUTPUT</span>
                      </div>
                      <button onClick={copyToClipboard} className={`w-full sm:w-auto flex justify-center items-center space-x-2 px-6 py-2.5 rounded-xl text-[11px] font-black uppercase transition-all ${copySuccess ? 'bg-emerald-600 text-white' : 'bg-rose-600 hover:bg-rose-500 text-white'}`}>
                        {copySuccess ? <CheckCircle className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copySuccess ? 'Copied' : 'Copy Full Text'}</span>
                      </button>
                    </div>
                    <div className="p-6 lg:p-12 max-h-[50vh] lg:max-h-[60vh] overflow-y-auto custom-scrollbar font-mono text-[12px] lg:text-[14px] leading-[1.8] text-slate-300 whitespace-pre-wrap bg-[#080d1a]/80 text-left selection:bg-rose-500/40 break-words">
                      {generatedPrompt}
                    </div>
                    <div className="p-6 lg:p-8 bg-[#0a1122] border-t border-slate-800">
                      <button onClick={() => { copyToClipboard(); window.open('https://gemini.google.com/app', '_blank'); }} className="w-full py-5 lg:py-6 bg-gradient-to-r from-indigo-700 to-indigo-600 hover:from-indigo-600 hover:to-indigo-500 text-white rounded-2xl font-black text-sm lg:text-base shadow-2xl flex justify-center items-center space-x-4 transition-all transform hover:scale-[1.01]">
                        <ExternalLink className="w-5 h-5 lg:w-6 lg:h-6" />
                        <span>복사 후 제미나이(Gemini)로 이동</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-16 lg:mt-32 flex flex-col items-center justify-center text-center space-y-10">
                <div className="p-8 bg-slate-900/50 rounded-full border border-slate-800 relative">
                   <div className="absolute inset-0 bg-rose-500/5 blur-3xl rounded-full"></div>
                   <FileSearch className="text-slate-600 w-16 h-16 lg:w-20 lg:h-20 relative z-10" />
                </div>
                <div className="space-y-4 px-4">
                  <h3 className="text-xl lg:text-3xl font-black text-slate-500 uppercase tracking-tighter italic">V1.17 DUAL API ENGINE</h3>
                  <p className="text-slate-600 text-xs lg:text-sm max-w-md mx-auto leading-relaxed font-medium">
                    국내 공공데이터 및 <span className="text-rose-500 font-bold">야후 파이낸스 글로벌망</span>을 교차 탐색하여<br/>
                    ETF와 해외주식의 실시간 시세를 무제한으로 렌더링합니다.<br/><br/>
                    <span className="text-indigo-400">메뉴 버튼(≡)을 눌러 종목 검색을 시작하세요.</span>
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