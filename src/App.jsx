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
  Layout
} from 'lucide-react';

/**
 * AI Hyper-Analyst GLOBAL V1.02 + Real-time Chart (Fixed for KR Stocks)
 * 업데이트 내역:
 * 1. 한국 주식(KRX) 심볼 인식 및 ID 특수문자 오류 수정
 * 2. 차트 컨테이너 초기화 로직 추가로 종목 전환 안정성 확보
 * 3. KRX/US 시장 자동 판별 로직 고도화
 */

const publicDataApiKey = "885853dbc6a25a93e403ee31fa9e124778e4943b8911869ea2f254ec5d75f99b";

// 티커 형식을 판단하여 트레이딩뷰 심볼로 변환
const getTradingViewSymbol = (ticker) => {
  const cleanTicker = ticker.toUpperCase().trim();
  const isKOR = /^\d+$/.test(cleanTicker);
  // 한국 주식은 KRX: 접두사가 필수입니다.
  if (isKOR) return `KRX:${cleanTicker}`;
  return cleanTicker; 
};

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
    const scriptId = 'tradingview-widget-script';
    let script = document.getElementById(scriptId);
    
    const createWidget = () => {
      // 심볼에서 특수문자 제거하여 안전한 ID 생성 (예: KRX:005930 -> KRX_005930)
      const safeId = `tv-chart-${symbol.replace(':', '_')}`;
      
      if (container.current && window.TradingView) {
        // 기존 차트 잔상을 제거하기 위해 내부 비움
        container.current.innerHTML = `<div id="${safeId}" style="height: 100%; width: 100%;"></div>`;
        
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
      }
    };

    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://s3.tradingview.com/tv.js';
      script.async = true;
      script.onload = createWidget;
      document.head.appendChild(script);
    } else {
      createWidget();
    }
  }, [symbol]);

  return (
    <div className="w-full h-[450px] bg-slate-900/50 rounded-3xl overflow-hidden border border-slate-700/50 shadow-2xl relative group">
      <div ref={container} className="w-full h-full" />
      <div className="absolute top-4 left-4 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
        <span className="px-3 py-1 bg-rose-600 text-white text-[10px] font-black rounded-full shadow-lg uppercase">Live Market Data</span>
      </div>
    </div>
  );
};

export default function App() {
  const [ticker, setTicker] = useState('IONQ');
  const [activeSymbol, setActiveSymbol] = useState('IONQ');
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
    
    // 차트 업데이트용 심볼 변환
    const tvSymbol = getTradingViewSymbol(ticker);
    setActiveSymbol(tvSymbol);

    if (window.innerWidth < 1024) setIsSidebarOpen(false);

    const upperTicker = ticker.toUpperCase().trim();
    const isKOR = /^\d+$/.test(upperTicker);
    const stockData = await fetchRealStockData(upperTicker);
    
    const currencySym = isKOR ? "₩" : "$";
    
    const fullPrompt = `
[역할] 월스트리트 수석 애널리스트
[대상] ${stockData ? stockData.name : upperTicker} (공식 기업명: ${stockData ? stockData.name : upperTicker})
[모드] MAIN
[중점 분석] ${analysisItems.join(', ')}
[투자 관점] ${term}
[분석 레벨] ${level}
**주의: '${upperTicker}'는 '${stockData ? stockData.name : upperTicker}'입니다. 다른 기업과 혼동하지 마십시오.**
이 분석은 '시나리오 모드'입니다. 미래 불확실성을 고려하여 확률적 접근이 필수적입니다.

[데이터 요약]
${stockData ? `
- 현재 주가: ${stockData.price} ${stockData.currency}
- 전일 대비: ${stockData.change} (${stockData.changeRate}%)
- 거래량: ${stockData.volume}
- 시가총액: ${stockData.marketCap}
` : 'Chart Data Not Available.\n가격 정보 조회 실패'}

[재무 지표]
N/A (최신 분기 리포트 및 지표를 직접 검색하여 분석에 반영하십시오.)

[관련 뉴스 및 산업 동향 전략]
${useNews ? `
- [Company News]: '${upperTicker}' 기업 개별 호재/악재 뉴스를 3-5개 수집하십시오.
- [Category/Sector News]: 이 기업이 속한 핵심 산업 카테고리(예: ${upperTicker === 'NVDA' ? 'AI, 반도체, 데이터센터' : upperTicker === 'IONQ' ? '양자 컴퓨팅, 차세대 연산' : '해당 산업군'})에 대한 매크로 트렌드와 기술적 동향 뉴스를 반드시 포함하여 분석하십시오.
` : ""}
${useTwitter ? `- [X (via News)] (실시간 시장 반응 및 전문가들의 산업 전망 트윗을 수집하십시오.)` : ""}

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
   - 표 데이터:
     | 정식 기업명 | ${stockData ? stockData.name : upperTicker} |
     | 티커(심볼) | ${upperTicker} |
     | 섹터 (Sector) | N/A |
     | 산업 (Industry) | N/A |
     | 국가 | ${isKOR ? "대한민국" : "N/A"} |
     | 시가총액 | ${stockData ? stockData.marketCap : "N/A"} |

1. **[성장주/가치주 정의 및 핵심 지표 분석]**
   - 이 기업이 '성장주(Growth Stock)'인지 '가치주(Value Stock)'인지 규명하십시오.
   - **성장주라면**: 매출 성장률(5년 추이), Cash Flow 증가세, ROI 개선, Profit Margin 방향성, 실적 지속성을 중점 분석.
   - **가치주라면**: 시장 점유율 추이, 배당금 안정성, 주가 안정성, 이익률(Margin) 변화, EPS 트렌드를 중점 분석.

2. **[중점 분석 항목 상세]**
   ⚠️ **아래 리스트의 모든 항목을 개별 섹션으로 상세 분석하십시오. 절대 생략 금지!**
${analysisItems.map(item => `- ${item}`).join('\n')}

   - **각 항목별로 ## 헤더를 사용하여 별도 섹션으로 작성**하십시오.
   - 각 항목당 최소 3개 이상의 구체적 분석 포인트를 포함하십시오.

   - **만약 'P/E Ratio'가 포함되어 있다면**: P/E TTM(Trailing Twelve Months)과 Forward P/E를 비교 분석하고, 업종 평균 P/E와의 괴리율, 역사적 P/E 밴드 내 현재 위치를 평가하십시오.
   - **만약 'Intrinsic Value' 또는 'DCF'가 포함되어 있다면**:
     * **두 가지 방법론으로 각각 정확한 가격을 산출**하십시오:

     **[1] Intrinsic Value (내재가치) - EPS/성장률 기반**
     * Graham 공식: V = EPS × (8.5 + 2g) (g = 예상 성장률 %)

     **[2] DCF Value (현금흐름할인가치)**
     * 공식: DCF = Σ(FCF_t / (1+WACC)^t) + Terminal Value / (1+WACC)^n

     * **반드시 다음 형식의 표를 작성하십시오:**
     | 가치평가 항목 | 산출 금액 | 현재가 대비 |
     |-------------|----------|------------|
     | 현재 주가 | ${currencySym}XX.XX | - |
     | Intrinsic Value (내재가치) | ${currencySym}XX.XX | XX.X% (저평가/고평가) |
     | DCF Value (현금흐름할인가치) | ${currencySym}XX.XX | XX.X% (저평가/고평가) |
     | 애널리스트 목표가 평균 | ${currencySym}XX.XX | XX.X% |

     * **DCF 계산 가정:**
     | 가정 항목 | 값 |
     |----------|-----|
     | 할인율 (WACC) | XX.X% |
     | 영구성장률 | XX.X% |
     | 예측 기간 | X년 |
     | 기준 FCF | ${currencySym}XX.XXB |

     * 두 가치(Intrinsic Value, DCF Value)의 평균을 "적정 주가 밴드"로 제시하십시오.

   - **만약 '베타(β)' 또는 'WACC'가 포함되어 있다면**: Systematic Risk 및 자본비용 대비 초과 수익(Value Creation)을 분석하십시오.
   - **만약 '기술적 지표'가 포함되어 있다면**: RSI(14) 값과 이동평균선(MA5, MA20, MA60, MA120) 수치를 반드시 인용하여 분석하십시오.
   - 예: **투자기관 컨센서스/목표주가**, **뉴스 호재/악재**, **수급(외국인/기관)**, **경쟁사 비교**, **매매 전략** 등이 포함되어 있다면 반드시 해당 내용을 구체적으로 서술해야 합니다.

3. **[투자성향별 포트폴리오 비중 분석]**
   - 다음 3가지 투자 성향에 맞춰 이 종목의 **권장 보유 비중(%)**과 **그 이유**를 구체적으로 제시하십시오.
   - (1) **보수적 투자자 (Stable)**: 리스크 최소화 선호, 원금 보존 중시.
   - (2) **중립적 투자자 (Balanced)**: 성장과 안정의 균형, 시장 평균 수익률 추구.
   - (3) **공격적 투자자 (Aggressive)**: 높은 변동성 감내, 고수익(Alpha) 추구.

4. **[시나리오별 확률 및 근거 (Scenario Analysis)]**
   - **Bull (낙관) / Base (기본) / Bear (비관)** 3가지 시나리오를 설정하십시오.
   - 각 시나리오별 **예상 주가 밴드**와 **실현 확률(%)**을 명시적으로 제시하십시오.
   - 왜 그러한 확률이 배정되었는지에 대한 **논리적/정량적 근거**를 상세히 설명하십시오.

[출력 형식]
- 보고서는 가독성 있게 마크다운 형식으로 작성하십시오.
- **모든 답변은 반드시 '한글'로 작성하십시오.** (전문 용어는 괄호 안에 영문 병기)
- 불필요한 서론은 생략하고 0번 표부터 바로 시작하십시오.
- **각 분석 항목은 독립된 ## 섹션으로 구분**하여 작성하십시오.

[결론]
반드시 [매수 / 매도 / 관망] 중 하나의 명확한 투자 의견을 제시하십시오.

⚠️ **[최종 검증 - 작성 완료 전 확인]**
아래 항목들이 모두 분석에 포함되었는지 확인하십시오:
- 선택된 중점 분석 항목: ${analysisItems.join(', ')}
- 누락된 항목이 있다면 반드시 추가 작성 후 응답을 완료하십시오.
- 각 항목이 충분한 깊이(최소 3개 포인트)로 분석되었는지 확인하십시오.
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
          <span className="font-extrabold text-xs uppercase tracking-tighter">Hyper Analyst Global V1.02</span>
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
        {/* Sidebar Sticky Header */}
        <div className="flex p-6 border-b border-slate-700 items-center space-x-3 bg-[#1e293b]">
          <div className="bg-rose-500/10 p-2.5 rounded-xl">
            <TrendingUp className="text-rose-500 w-6 h-6" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-lg font-black text-white italic leading-tight text-left">프롬프트 빌더</h1>
            <span className="text-[10px] text-slate-400 font-mono tracking-widest uppercase font-bold text-left">V1.02 FIX</span>
          </div>
        </div>
        
        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`w-8 h-4 rounded-full relative transition-colors ${useNews ? 'bg-rose-500' : 'bg-slate-600'}`}>
                  <button onClick={() => setUseNews(!useNews)} className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${useNews ? 'left-[18px]' : 'left-[2px]'}`}></button>
                </div>
                <span className="text-sm font-medium text-slate-300">뉴스/산업 데이터 반영</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`w-8 h-4 rounded-full relative transition-colors ${useTwitter ? 'bg-rose-500' : 'bg-slate-600'}`}>
                  <button onClick={() => setUseTwitter(!useTwitter)} className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${useTwitter ? 'left-[18px]' : 'left-[2px]'}`}></button>
                </div>
                <span className="text-sm font-medium text-slate-300">x(트위터) 트렌드 포함</span>
              </div>
            </div>
          </div>

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
                  <span className="text-xs font-bold text-rose-400">전체 선택</span>
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

          <div className="space-y-2 pt-2">
            <div className="relative group">
              <Search className="w-4 h-4 absolute left-3 top-3.5 text-slate-500 group-focus-within:text-rose-500 transition-colors" />
              <input 
                type="text" 
                value={ticker} 
                onChange={(e) => setTicker(e.target.value)} 
                placeholder="AAPL, 005930..." 
                className="w-full pl-10 pr-4 py-3.5 bg-slate-900 border border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-rose-500 outline-none transition-all text-left"
                onKeyDown={(e) => e.key === 'Enter' && handleGeneratePrompt()} 
              />
            </div>
            <p className="text-[10px] text-slate-500 px-1 italic text-left">미국주식(NVDA), 한국주식(000660) 지원</p>
          </div>
        </div>

        {/* Sidebar Sticky Footer */}
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
              <span>{isGenerating ? 'ANALYZING MARKET...' : 'Build Full Analysis'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full bg-[#0a0f1e] relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:40px_40px]"></div>
        
        <div className="relative h-full flex flex-col p-4 lg:p-12 overflow-y-auto custom-scrollbar text-left">
          <div className="max-w-6xl mx-auto w-full pb-20 space-y-10">
            
            {/* Header Section */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between space-y-6 lg:space-y-0">
              <div className="flex items-start space-x-5">
                <div className="bg-indigo-600/20 p-4 rounded-2xl border border-indigo-500/30">
                  <Cpu className="text-indigo-400 w-10 h-10" />
                </div>
                <div>
                  <div className="flex items-center">
                    <h1 className="text-3xl lg:text-4xl font-black tracking-tighter text-white italic uppercase leading-none text-left">
                      Hyper Analyst <span className="text-rose-500 underline decoration-indigo-500 decoration-4 underline-offset-8">GLOBAL</span>
                    </h1>
                    <span className="text-sm font-normal text-slate-500 ml-4 not-italic font-mono">V1.02</span>
                  </div>
                  <p className="text-slate-500 text-sm mt-3 font-medium uppercase tracking-widest text-left">Real-Time Data & Prompt Engine</p>
                </div>
              </div>
            </div>

            {/* TradingView Chart Section */}
            <div className="animate-in fade-in zoom-in-95 duration-500">
              <div className="flex items-center space-x-2 mb-4">
                <Layout className="w-4 h-4 text-rose-500" />
                <h2 className="text-sm font-black uppercase tracking-widest text-slate-300">Live Market Intelligence Chart</h2>
              </div>
              <TradingViewWidget symbol={activeSymbol} />
            </div>

            {/* Prompt Output Section */}
            {!generatedPrompt && !isGenerating && (
              <div className="mt-16 flex flex-col items-center justify-center text-center space-y-8 animate-in fade-in slide-in-from-bottom-10 duration-1000">
                <FileSearch className="text-slate-500 w-16 h-16" />
                <h3 className="text-xl lg:text-2xl font-black text-white uppercase tracking-tighter text-left">Market Sentiment Ready</h3>
                <p className="text-slate-500 text-sm max-w-md mx-auto leading-relaxed text-left">차트 데이터를 확인하셨나요? 분석 지침서를 생성하여 월스트리트급 보고서를 완성하세요.</p>
              </div>
            )}

            {isGenerating && (
              <div className="mt-12 flex flex-col items-center space-y-6">
                <Loader2 className="w-12 h-12 text-rose-500 animate-spin" />
                <p className="text-slate-500 text-sm font-medium animate-pulse text-left">실시간 시장 데이터 동기화 및 보고서 설계 중...</p>
              </div>
            )}

            {generatedPrompt && (
              <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 space-y-8">
                <div className="bg-indigo-600/10 border border-indigo-500/20 rounded-3xl p-6 flex items-start space-x-5 shadow-inner">
                  <Info className="text-indigo-400 w-6 h-6 flex-shrink-0" />
                  <div>
                    <h4 className="text-white font-bold text-sm uppercase tracking-wide text-left">AI Analyst Prompt Generated</h4>
                    <p className="text-indigo-100/60 text-xs lg:text-sm leading-relaxed mt-1 text-left">상단 차트 정보와 선택한 분석 항목이 모두 포함된 전문가용 프롬프트입니다.</p>
                  </div>
                </div>

                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-br from-rose-500 to-indigo-600 rounded-[2.5rem] blur opacity-30 group-hover:opacity-60 transition duration-500"></div>
                  <div className="relative bg-[#0d1326] border border-slate-700/50 rounded-[2rem] overflow-hidden shadow-2xl">
                    <div className="flex items-center justify-between px-8 py-5 border-b border-slate-700/50 bg-slate-800/30">
                      <span className="text-[11px] text-slate-400 font-mono font-black uppercase tracking-[0.2em]">Wall-Street Grade Full Output</span>
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