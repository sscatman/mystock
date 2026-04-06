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
  Database
} from 'lucide-react';

/**
 * AI Hyper-Analyst GLOBAL V1.10 ULTRA-LIGHT (COPY FIX)
 * 업데이트 내역:
 * 1. 복사 편의성 개선: 출력물 영역의 '전체 선택(select-all)' 속성을 제거하여 부분 복사 가능하도록 수정
 * 2. 제로 클릭 자동화 유지: 종목명 입력 시 대표 코드를 자동 매칭하여 프롬프트 즉시 생성
 * 3. 무삭제 지침 엔진: 모든 분석 수식(Graham, DCF) 및 분량 제한(150단어) 지침 100% 보존
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
    }, 1000); 

    return () => clearTimeout(autoGenerate);
  }, [ticker]);

  const generatePromptContent = (stockInfo) => {
    setIsGenerating(true);
    if (window.innerWidth < 1024) setIsSidebarOpen(false);

    const stockName = stockInfo ? stockInfo.name : ticker;
    const stockCode = stockInfo ? stockInfo.code : ticker;
    const isKOR = /^\d+$/.test(stockCode);
    const currencySym = isKOR ? "₩" : "$";

    const fullPrompt = `
[역할] 월스트리트 수석 애널리스트
[대상] ${stockName} (공식 기업명: ${stockName})
[모드] MAIN
[중점 분석] ${analysisItems.join(', ')}
[투자 관점] ${term}
[분석 레벨] ${level}
**주의: '${stockCode}'는 '${stockName}'입니다. 다른 기업과 혼동하지 마십시오.**
이 분석은 '시나리오 모드'입니다. 미래 불확실성을 고려하여 확률적 접근이 필수적입니다.

[데이터 요약]
- 티커/코드: ${stockCode}
${stockInfo ? `
- 현재 주가: ${Number(stockInfo.price).toLocaleString()} ${isKOR ? 'KRW' : 'USD'}
- 전일 대비: ${stockInfo.change} (${stockInfo.changeRate}%)
` : '- 실시간 시세 정보: [분석 시 직접 검색하여 반영할 것]'}

[재무 지표]
N/A (최신 분기 리포트 및 지표를 직접 검색하여 분석에 반영하십시오.)

[관련 뉴스 및 산업 동향 전략]
${useNews ? `
- [Company News]: '${stockName}' 기업 개별 호재/악재 뉴스를 3-5개 수집하십시오.
- [Category/Sector News]: 이 기업이 속한 핵심 산업 카테고리에 대한 매크로 트렌드와 기술적 동향 뉴스를 반드시 포함하여 분석하십시오.
- [X (via News)] (실시간 시장 반응 및 전문가들의 산업 전망 트윗을 수집하십시오.)
` : ""}

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
     | 정식 기업명 | ${stockName} |
     | 티커(심볼) | ${stockCode} |
     | 섹터 (Sector) | N/A |
     | 산업 (Industry) | N/A |
     | 국가 | ${isKOR ? '대한민국' : 'N/A'} |
     | 시가총액 | N/A |

1. **[성장주/가치주 정의 및 핵심 지표 분석]**
   - 이 기업이 '성장주(Growth Stock)'인지 '가치주(Value Stock)'인지 규명하십시오.
   - **성장주라면**: 매출 성장률(5년 추이), Cash Flow 증가세, ROI 개선, Profit Margin 방향성, 실적 지속성을 중점 분석.
   - **가치주라면**: 시장 점유율 추이, 배당금 안정성, 주가 안정성, 이익률(Margin) 변화, EPS 트렌드를 중점 분석.

2. **[사용자 선택 중점 분석 항목 상세]**
   ⚠️ **아래 리스트의 모든 항목을 개별 섹션으로 상세 분석하십시오. 절대 생략 금지!**
${analysisItems.map(item => `- ${item}`).join('\n')}

   - **각 항목별로 ## 헤더를 사용하여 별도 섹션으로 작성**하십시오.
   - 각 항목당 최소 3개 이상의 구체적 분석 포인트를 포함하십시오.

   - **만약 'P/E Ratio'가 포함되어 있다면**: P/E TTM과 Forward P/E를 비교 분석하고, 업종 평균 P/E와의 괴리율을 평가하십시오.
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

   - **만약 '베타(β)' 또는 'WACC'가 포함되어 있다면**: 시장 대비 변동성 및 자본비용 대비 초과 수익(Value Creation)을 분석하십시오.
   - **만약 '기술적 지표'가 포함되어 있다면**: RSI(14) 값과 이동평균선 수치를 반드시 인용하여 분석하십시오.

3. **[투자성향별 포트폴리오 비중 분석]**
   - (1) **보수적 투자자 (Stable)**: 리스크 최소화 선호, 원금 보존 중시.
   - (2) **중립적 투자자 (Balanced)**: 성장과 안정의 균형, 시장 평균 수익률 추구.
   - (3) **공격적 투자자 (Aggressive)**: 높은 변동성 감내, 고수익(Alpha) 추구.

4. **[시나리오별 확률 및 근거 (Scenario Analysis)]**
   - **Bull (낙관) / Base (기본) / Bear (비관)** 3가지 시나리오의 주가 밴드와 실현 확률(%) 제시.
   - 논리적/정량적 근거 상세 설명.

[출력 형식]
- 모든 답변은 반드시 '한글'로 작성하십시오. (전문 용어는 괄호 안에 영문 병기)
- 불필요한 서론은 생략하고 0번 표부터 바로 시작하십시오.
- 각 분석 항목은 독립된 ## 섹션으로 구분하여 작성하십시오.

[결론]
반드시 [매수 / 매도 / 관망] 중 하나의 명확한 투자 의견을 제시하십시오.

⚠️ **[최종 검증 - 작성 완료 전 확인]**
- 선택된 중점 분석 항목: ${analysisItems.join(', ')}
- 누락된 항목이 있다면 반드시 추가 작성하십시오.
- 각 항목이 최소 150단어 이상의 깊이로 분석되었는지 확인하십시오.
    `.trim();

    setTimeout(() => {
      setGeneratedPrompt(fullPrompt);
      setIsGenerating(false);
    }, 500);
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
    <div className="flex flex-col lg:flex-row h-screen bg-[#0a0f1e] font-sans text-slate-200 overflow-hidden text-left">
      
      {/* Mobile Header */}
      <div className="lg:hidden flex items-center justify-between p-4 bg-slate-900 border-b border-slate-800 z-30">
        <div className="flex items-center space-x-2">
          <Globe className="text-rose-500 w-5 h-5" />
          <span className="font-extrabold text-xs uppercase tracking-tighter text-left">Hyper Analyst Global V1.10</span>
        </div>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 bg-slate-800 rounded-lg">
          {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Sidebar */}
      <div className={`fixed inset-0 lg:relative lg:translate-x-0 transform transition-transform duration-300 ease-in-out z-20 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} w-full lg:w-80 bg-[#161e31] border-r border-slate-800 flex flex-col h-full shadow-2xl`}>
        <div className="flex p-6 border-b border-slate-800 items-center space-x-3 bg-[#161e31]">
          <TrendingUp className="text-rose-500 w-6 h-6" />
          <div className="flex flex-col text-left">
            <h1 className="text-lg font-black text-white italic leading-tight">프롬프트 빌더</h1>
            <span className="text-[10px] text-slate-400 font-mono tracking-widest uppercase font-bold">V1.10 AUTO</span>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
          <div className="flex items-center space-x-3">
            <div className={`w-8 h-4 rounded-full relative transition-colors ${useNews ? 'bg-rose-500' : 'bg-slate-600'}`}>
              <button onClick={() => setUseNews(!useNews)} className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${useNews ? 'left-[18px]' : 'left-[2px]'}`}></button>
            </div>
            <span className="text-sm font-medium text-slate-300">뉴스 데이터 반영</span>
          </div>

          <div className="border border-slate-700 rounded-xl overflow-hidden bg-slate-800/30">
            <button onClick={() => setIsFocusMenuOpen(!isFocusMenuOpen)} className="w-full p-3 flex items-center justify-between hover:bg-slate-700/50">
              <span className="text-sm font-bold text-slate-200">중점 분석 항목</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${isFocusMenuOpen ? 'rotate-180' : ''}`} />
            </button>
            {isFocusMenuOpen && (
              <div className="p-3 pt-0 space-y-1.5 max-h-[35vh] overflow-y-auto custom-scrollbar bg-slate-900/20 text-left">
                <label className="flex items-center space-x-3 p-1.5 rounded hover:bg-slate-700/50 cursor-pointer sticky top-0 bg-[#1c263d] z-10 shadow-sm">
                  <input type="checkbox" className="w-4 h-4 rounded border-slate-500 text-rose-500" checked={analysisItems.length === availableItems.length} onChange={() => analysisItems.length === availableItems.length ? setAnalysisItems([]) : setAnalysisItems(availableItems)} />
                  <span className="text-xs font-bold text-rose-400">전체 선택</span>
                </label>
                {availableItems.map((item, idx) => (
                  <label key={idx} className="flex items-start space-x-3 p-1.5 rounded hover:bg-slate-700/50 cursor-pointer">
                    <input type="checkbox" className="mt-0.5 w-4 h-4 rounded border-slate-500 text-indigo-500" checked={analysisItems.includes(item)} onChange={() => setAnalysisItems(prev => prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item])} />
                    <span className="text-[11px] text-slate-300 leading-snug">{item}</span>
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
                placeholder="삼성전자, 엔비디아..." 
                className="w-full pl-10 pr-4 py-3.5 bg-slate-900 border border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-rose-500 outline-none text-left"
              />
            </div>
            
            <div className="p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-xl space-y-2">
              <div className="flex items-center space-x-2 text-indigo-400">
                <Zap className="w-3.5 h-3.5" />
                <span className="text-[11px] font-black uppercase">Auto-Match Active</span>
              </div>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                입력 시 시스템이 가장 적절한 코드를 찾아 <span className="text-rose-400 font-bold">즉시 프롬프트를 생성</span>합니다.
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 bg-[#161e31] border-t border-slate-800">
           <button onClick={() => ticker && generatePromptContent(activeStockData)} className="w-full py-4 rounded-2xl font-black text-xs uppercase text-white shadow-2xl flex justify-center items-center space-x-2 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 active:scale-95 transition-all">
            <Terminal className="w-4 h-4" />
            <span>프롬프트 강제 재생성</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full relative overflow-hidden bg-[#070b14]">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff02_1px,transparent_1px),linear-gradient(to_bottom,#ffffff02_1px,transparent_1px)] bg-[size:32px_32px]"></div>
        
        <div className="relative h-full flex flex-col p-4 lg:p-12 overflow-y-auto custom-scrollbar">
          <div className="max-w-4xl mx-auto w-full pb-20 space-y-12">
            
            <div className="flex items-start space-x-6">
              <div className="bg-rose-500/10 p-5 rounded-3xl border border-rose-500/20 shadow-[0_0_20px_rgba(244,63,94,0.1)]">
                <Cpu className="text-rose-500 w-12 h-12" />
              </div>
              <div>
                <div className="flex items-center">
                  <h1 className="text-3xl lg:text-5xl font-black tracking-tighter text-white italic uppercase leading-none">
                    Hyper Analyst <span className="text-indigo-500 underline decoration-rose-500 decoration-8 underline-offset-[12px]">GLOBAL</span>
                  </h1>
                  <span className="text-xs font-black text-slate-600 ml-6 font-mono bg-slate-900 px-2 py-1 rounded border border-slate-800">V1.10</span>
                </div>
                <p className="text-slate-500 text-sm mt-5 font-bold uppercase tracking-[0.2em] flex items-center">
                  <Database className="w-4 h-4 mr-2 text-indigo-500" /> Pure Analysis Intelligence Engine
                </p>
              </div>
            </div>

            {isGenerating || isSearching ? (
              <div className="flex flex-col items-center justify-center py-32 space-y-8 animate-in fade-in duration-500">
                <div className="relative">
                  <div className="absolute inset-0 bg-rose-500 blur-2xl opacity-20 animate-pulse"></div>
                  <Loader2 className="w-16 h-16 text-rose-500 animate-spin relative z-10" />
                </div>
                <div className="text-center space-y-2">
                  <p className="text-white font-black uppercase tracking-widest text-lg">Auto-Matching Data...</p>
                  <p className="text-slate-500 text-sm font-medium">실시간 시장 코드 확인 및 무삭제 프롬프트 구성 중</p>
                </div>
              </div>
            ) : generatedPrompt ? (
              <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 space-y-10 text-left">
                <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-3xl p-6 flex items-start space-x-6 shadow-inner relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-5">
                    <CheckCircle className="w-24 h-24 text-emerald-500" />
                  </div>
                  <CheckCircle className="text-emerald-400 w-7 h-7 flex-shrink-0" />
                  <div>
                    <h4 className="text-white font-black text-sm uppercase tracking-wider flex items-center">
                      Auto-Matched Symbol: <span className="ml-2 text-emerald-400">{activeStockData?.name} ({activeStockData?.code})</span>
                    </h4>
                    <p className="text-emerald-100/60 text-xs lg:text-sm leading-relaxed mt-2 font-medium">
                      모든 분석 지침이 포함된 전문가용 프롬프트가 자동 생성되었습니다. 아래 내용을 자유롭게 선택하여 복사하거나 이동 버튼을 누르세요.
                    </p>
                  </div>
                </div>

                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-br from-rose-500 to-indigo-600 rounded-[2.5rem] blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
                  <div className="relative bg-[#0d1326] border border-slate-800 rounded-[2rem] overflow-hidden shadow-2xl">
                    <div className="flex items-center justify-between px-8 py-6 border-b border-slate-800 bg-slate-900/50">
                      <div className="flex items-center space-x-3">
                        <div className="p-1.5 bg-rose-500/10 rounded-lg">
                          <FileText className="w-4 h-4 text-rose-500" />
                        </div>
                        <span className="text-[11px] text-slate-400 font-mono font-black uppercase tracking-[0.3em]">Full Analyst Output</span>
                      </div>
                      <button onClick={copyToClipboard} className={`flex items-center space-x-2 px-6 py-2.5 rounded-xl text-[11px] font-black uppercase transition-all shadow-lg ${copySuccess ? 'bg-emerald-600 text-white' : 'bg-rose-600 hover:bg-rose-500 text-white hover:scale-105 active:scale-95'}`}>
                        {copySuccess ? <CheckCircle className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copySuccess ? 'Copied to Clipboard' : 'Copy Full Text'}</span>
                      </button>
                    </div>
                    {/* select-all 속성을 제거하여 부분 선택 및 부분 복사가 가능하도록 수정함 */}
                    <div className="p-8 lg:p-12 max-h-[65vh] overflow-y-auto custom-scrollbar font-mono text-[13px] lg:text-[15px] leading-[1.8] text-slate-300 whitespace-pre-wrap bg-[#080d1a]/80 text-left selection:bg-rose-500/30">
                      {generatedPrompt}
                    </div>
                    <div className="p-8 bg-[#0a1122] border-t border-slate-800 text-center">
                      <button onClick={() => { copyToClipboard(); window.open('https://gemini.google.com/app', '_blank'); }} className="w-full py-6 bg-gradient-to-r from-indigo-700 to-indigo-600 hover:from-indigo-600 hover:to-indigo-400 text-white rounded-2xl font-black text-sm lg:text-base shadow-[0_20px_40px_rgba(79,70,229,0.2)] flex justify-center items-center space-x-4 transition-all transform hover:scale-[1.01] active:scale-95">
                        <ExternalLink className="w-6 h-6" />
                        <span>복사 후 제미나이(Gemini)로 이동하여 분석 시작</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-32 flex flex-col items-center justify-center text-center space-y-10 animate-in fade-in slide-in-from-bottom-10 duration-1000">
                <div className="p-8 bg-slate-900/50 rounded-full border border-slate-800 relative">
                   <div className="absolute inset-0 bg-indigo-500/5 blur-3xl rounded-full"></div>
                   <FileSearch className="text-slate-700 w-20 h-20 relative z-10" />
                </div>
                <div className="space-y-4 text-center">
                  <h3 className="text-2xl lg:text-3xl font-black text-slate-500 uppercase tracking-tighter">Enter Stock Name to Start</h3>
                  <p className="text-slate-600 text-sm max-w-md mx-auto leading-relaxed font-medium">
                    기업 이름을 입력하면 자동으로 대표 코드를 조회하여<br/>
                    <span className="text-rose-500 font-bold italic">무삭제 분석 지침서</span>를 즉시 생성합니다.
                  </p>
                </div>
                <div className="flex items-center space-x-2 text-[10px] text-slate-700 font-black uppercase tracking-widest">
                  <History className="w-3.5 h-3.5" />
                  <span>V1.10 Zero-Click Technology applied</span>
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