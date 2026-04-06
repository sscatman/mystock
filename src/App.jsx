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
  FileSearch
} from 'lucide-react';

/**
 * AI Hyper-Analyst KOR V. 0.5
 * 업데이트 내역:
 * 1. 월가 수석 애널리스트급 초정밀 프롬프트 엔진 탑재
 * 2. 섹션별 150단어 이상, 구체적 데이터(Graham, DCF) 산출 지침 강화
 * 3. AI의 자체 검증(Validation) 블록 추가
 * 4. UI/UX 정밀화 및 모바일 대응 유지
 */
const publicDataApiKey = "885853dbc6a25a93e403ee31fa9e124778e4943b8911869ea2f254ec5d75f99b";

const fetchRealStockData = async (ticker) => {
  try {
    const isNumeric = /^\d+$/.test(ticker);
    const queryParam = isNumeric ? `likeSrtnCd=${ticker}` : `itmsNm=${encodeURIComponent(ticker)}`;
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
      marketCap: Number(item.mrktTotAmt).toLocaleString()
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
  const [ticker, setTicker] = useState('아이온큐');
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

    const stockData = await fetchRealStockData(ticker);
    
    const fullPrompt = `
[역할] 월스트리트 수석 애널리스트 (한국 및 글로벌 증시 전문가)
[대상] ${stockData ? stockData.name : ticker} (공식 기업명: ${stockData ? stockData.name : ticker})
[모드] MAIN (전문가용 심층 분석 모드)
[중점 분석] ${analysisItems.join(', ')}
[투자 관점] ${term}
[분석 레벨] ${level}

**주의: '${stockData ? stockData.name : ticker}'는 '${stockData ? stockData.name : ticker}'입니다. 다른 기업과 혼동하지 마십시오.**
이 분석은 '${level.split('.')[1]}' 모드입니다. 미래 불확실성을 고려하여 확률적 접근이 필수적입니다.

[데이터 요약]
${stockData ? `
- 현재 주가: ${stockData.price} 원
- 전일 대비: ${stockData.change} (${stockData.changeRate}%)
- 거래량: ${stockData.volume} 주
- 시가총액: ${stockData.marketCap} 원
` : '- 실시간 시세 데이터 조회 실패: 검색 기능을 사용하여 최신 데이터를 반드시 반영하십시오.'}

[재무 지표 및 뉴스]
- [재무 지표]: 최신 분기 실적 및 관련 재무 배수를 검색하여 반영하십시오.
- [관련 뉴스]: 구글 뉴스 및 금융 포털에서 최근 호재/악재를 수집하십시오.

[분석 지침]
**다음의 항목들을 순서대로 빠짐없이 분석하십시오.**

⚠️ **[필수 준수 사항 - 매우 중요]** ⚠️
1. **생략 금지**: 사용자가 선택한 모든 분석 항목(${analysisItems.join(', ')})은 **예외 없이 반드시** 분석해야 합니다. "지면 관계상 생략" 등은 절대 금지됩니다.
2. **일관된 분석 품질**: 각 분석 항목은 **최소 3-5개의 구체적 포인트**를 포함해야 하며, 데이터와 근거를 바탕으로 상세히 설명하십시오.
   - 각 항목별 분석 분량: 최소 150단어 이상 (표 제외)
3. **구조화된 출력**: 각 분석 항목은 별도의 섹션 헤더(##)로 구분하십시오.
4. **체크리스트 확인**: 답변 완료 전 모든 항목이 포함되었는지 스스로 검토하고 누락 시 추가 작성하십시오.

---

0. **[기업 기본 정보 (Company Overview)]**
보고서 첫 부분에 아래 마크다운 표를 작성하십시오.
| 항목 | 내용 |
|---|---|
| 정식 기업명 | ${stockData ? stockData.name : ticker} |
| 티커(심볼) | ${stockData ? stockData.ticker : ticker} |
| 섹터 (Sector) | (최신 정보 기입) |
| 시가총액 | ${stockData ? stockData.marketCap : 'N/A'} |

1. **[성장주/가치주 정의 및 핵심 지표 분석]**
해당 기업의 성격(성장주 vs 가치주)을 규명하고 매출 성장률, 현금흐름, 이익률 추이를 상세 분석하십시오.

2. **[사용자 선택 중점 분석 항목 상세]**
⚠️ **아래 모든 항목을 개별 ## 섹션으로 상세 분석하십시오.**
${analysisItems.map(item => `- ${item}`).join('\n')}

- **만약 'P/E Ratio'가 포함되어 있다면**: P/E TTM과 Forward P/E를 업종 평균과 비교하십시오.
- **만약 'Intrinsic Value' 또는 'DCF'가 포함되어 있다면**:
  * [1] Graham 공식: V = EPS × (8.5 + 2g) 사용
  * [2] DCF: FCF 및 WACC 기반 미래 현금흐름 할인
  * 반드시 [가치평가 항목 | 산출 금액 | 현재가 대비] 형식의 표를 작성하십시오.
- **만약 '기술적 지표'가 포함되어 있다면**: RSI(14) 및 주요 이동평균선 배열 수치를 명시하십시오.

3. **[투자성향별 포트폴리오 비중 분석]**
보수적(Stable), 중립적(Balanced), 공격적(Aggressive) 투자자 성향별 권장 비중(%)과 논거를 제시하십시오.

4. **[시나리오별 확률 및 근거 (Scenario Analysis)]**
Bull(낙관), Base(기본), Bear(비관) 3가지 시나리오별 예상 주가 밴드와 실현 확률(%) 및 근거를 제시하십시오.

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
          <TrendingUp className="text-rose-500 w-5 h-5" />
          <span className="font-extrabold text-xs uppercase tracking-tighter">AI Hyper-Analyst V0.5</span>
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
          <div className="bg-rose-500/10 p-2.5 rounded-xl">
            <TrendingUp className="text-rose-500 w-6 h-6" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-lg font-black bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent italic">AI Analyst</h1>
            <span className="text-[10px] text-rose-500 font-mono tracking-widest uppercase font-bold">Version 0.5</span>
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
              Middle Focus Items
            </div>
            <div className="space-y-1 max-h-52 overflow-y-auto pr-2 custom-scrollbar bg-slate-900/40 p-2 rounded-xl border border-slate-700/50">
              {availableItems.map((item, idx) => (
                <label key={idx} className="flex items-start space-x-3 cursor-pointer group p-1.5 rounded-md hover:bg-slate-700/50 transition-all">
                  <input type="checkbox" className="mt-1 w-3.5 h-3.5 rounded border-slate-600 text-rose-500 focus:ring-rose-500 bg-slate-900" checked={analysisItems.includes(item)} onChange={() => toggleAnalysisItem(item)} />
                  <span className="text-[10px] text-slate-400 group-hover:text-slate-100 leading-snug">{item}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <label className="text-xs font-bold text-slate-200 block uppercase tracking-tighter text-left">Ticker or Name</label>
            <div className="relative group">
              <Search className="w-4 h-4 absolute left-3 top-3.5 text-slate-500 group-focus-within:text-rose-500 transition-colors" />
              <input type="text" value={ticker} onChange={(e) => setTicker(e.target.value)} placeholder="예: 아이온큐, NVDA" className="w-full pl-10 pr-4 py-3.5 bg-slate-900 border border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-rose-500 outline-none transition-all placeholder-slate-600" onKeyDown={(e) => e.key === 'Enter' && handleGeneratePrompt()} />
            </div>
          </div>
        </div>

        <div className="p-6 bg-slate-800/90 backdrop-blur-xl border-t border-slate-700">
          <button onClick={handleGeneratePrompt} disabled={isGenerating} className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-white shadow-2xl flex justify-center items-center space-x-2 transition-all active:scale-95 ${isGenerating ? 'bg-slate-700' : 'bg-gradient-to-br from-rose-500 to-rose-700 hover:shadow-rose-500/40'}`}>
            {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Terminal className="w-4 h-4" />}
            <span>{isGenerating ? 'Generating...' : 'Build Pro Prompt'}</span>
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
                <div className="bg-indigo-600/20 p-4 rounded-2xl border border-indigo-500/30 shadow-2xl shadow-indigo-500/10">
                  <Cpu className="text-indigo-400 w-10 h-10" />
                </div>
                <div>
                  <h1 className="text-3xl lg:text-4xl font-black tracking-tighter text-white italic uppercase leading-none">
                    Hyper Analyst <span className="text-rose-500 underline decoration-indigo-500 decoration-4 underline-offset-8">KOR</span>
                  </h1>
                  <p className="text-slate-500 text-sm mt-3 font-medium">Wall-Street Grade Professional Prompt Engine</p>
                </div>
              </div>
              <div className="hidden lg:flex items-center space-x-2 text-slate-600 bg-slate-800/40 px-3 py-1.5 rounded-full border border-slate-700/50">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="text-[10px] font-mono font-bold tracking-widest uppercase">System Operational</span>
              </div>
            </div>

            {!generatedPrompt && !isGenerating && (
              <div className="mt-16 lg:mt-24 flex flex-col items-center justify-center text-center space-y-8 animate-in fade-in slide-in-from-bottom-10 duration-1000">
                <div className="relative">
                  <div className="absolute -inset-4 bg-indigo-500/20 blur-3xl rounded-full"></div>
                  <div className="w-20 h-20 lg:w-24 lg:h-24 bg-slate-800/50 rounded-3xl flex items-center justify-center border border-slate-700 shadow-2xl transform rotate-3 hover:rotate-0 transition-transform duration-500">
                    <FileSearch className="text-slate-400 w-10 h-10 lg:w-12 lg:h-12" />
                  </div>
                </div>
                <div className="space-y-3">
                  <h3 className="text-xl lg:text-2xl font-black text-white uppercase tracking-tighter">Ready to Execute Analysis</h3>
                  <p className="text-slate-500 text-sm lg:text-base max-w-md mx-auto leading-relaxed">
                    종목을 입력하고 하단의 버튼을 눌러주세요. 월가 수석 애널리스트의 분석 지침과 실시간 시세 데이터가 결합된 정교한 질문지를 생성합니다.
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
                  <p className="text-white font-black text-lg tracking-tight uppercase italic">Syncing Market Data</p>
                  <p className="text-slate-500 text-sm font-medium animate-pulse">금융위원회 실시간 시세 데이터를 취득하고 지침서를 구성 중입니다...</p>
                </div>
              </div>
            )}

            {generatedPrompt && (
              <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 space-y-8 pb-20">
                <div className="bg-indigo-600/10 border border-indigo-500/20 rounded-3xl p-6 flex items-start space-x-5 shadow-inner">
                  <div className="bg-indigo-500/20 p-2 rounded-xl">
                    <Info className="text-indigo-400 w-6 h-6 flex-shrink-0" />
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-sm uppercase tracking-wide">성공적으로 생성되었습니다!</h4>
                    <p className="text-indigo-100/60 text-xs lg:text-sm leading-relaxed mt-1">
                      아래 질문지는 <strong>월스트리트 리포트 표준</strong>을 따릅니다. 버튼을 눌러 복사한 뒤 제미나이(Gemini)에 그대로 입력하세요.
                    </p>
                  </div>
                </div>

                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-br from-rose-500 to-indigo-600 rounded-[2.5rem] blur opacity-30 group-hover:opacity-60 transition duration-500"></div>
                  <div className="relative bg-[#0d1326] border border-slate-700/50 rounded-[2rem] overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                    <div className="flex items-center justify-between px-8 py-5 border-b border-slate-700/50 bg-slate-800/30">
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 rounded-full bg-rose-500/80 shadow-[0_0_10px_#f43f5e]"></div>
                        <span className="text-[11px] text-slate-400 font-mono font-black uppercase tracking-[0.2em]">Lead Analyst Prompt Output</span>
                      </div>
                      <button onClick={copyToClipboard} className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-tighter transition-all shadow-lg ${copySuccess ? 'bg-emerald-600 text-white' : 'bg-rose-600 hover:bg-rose-500 text-white hover:scale-105 active:scale-95'}`}>
                        {copySuccess ? <CheckCircle className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copySuccess ? 'Copied' : 'Copy Full'}</span>
                      </button>
                    </div>
                    
                    <div className="p-8 lg:p-12 max-h-[50vh] lg:max-h-[60vh] overflow-y-auto custom-scrollbar font-mono text-[12px] lg:text-[14px] leading-[1.8] text-slate-300 whitespace-pre-wrap select-all bg-[#080d1a]/50">
                      {generatedPrompt}
                    </div>
                    
                    <div className="p-6 lg:p-8 bg-[#0a0f1d] border-t border-slate-800 flex flex-col space-y-4">
                      <button 
                        onClick={handleOpenGemini}
                        className="w-full py-5 bg-gradient-to-r from-indigo-700 to-indigo-500 hover:from-indigo-600 hover:to-indigo-400 text-white rounded-2xl font-black text-sm lg:text-base shadow-[0_10px_30px_rgba(79,70,229,0.3)] flex justify-center items-center space-x-4 transition-all transform hover:scale-[1.02] active:scale-95 border-t border-white/10"
                      >
                        <ExternalLink className="w-6 h-6" />
                        <span>복사 후 제미나이(Gemini)로 이동하여 분석 실행</span>
                      </button>
                      <p className="text-[10px] text-slate-600 italic text-center font-bold tracking-tight">
                        * 클립보드에 질문지가 복사되며, 모바일은 앱(설치 시) 또는 웹으로 자동 연결됩니다.
                      </p>
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
        .select-all { -webkit-user-select: all; user-select: all; }
      `}</style>
    </div>
  );
}