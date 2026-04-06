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
  X
} from 'lucide-react';

/**
 * AI Hyper-Analyst KOR V. 0.4
 * 변경사항: 
 * 1. 모바일 최적화 레이아웃 (반응형 UI) 적용
 * 2. 질문지 하단 [제미나이 이동] 버튼 추가
 * 3. 복사 및 이동 편의성 개선
 */
const publicDataApiKey = "885853dbc6a25a93e403ee31fa9e124778e4943b8911869ea2f254ec5d75f99b";

// --- 공공데이터 API 호출 함수 ---
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
  const [ticker, setTicker] = useState('휴림로봇');
  const [term, setTerm] = useState('중기 (6개월~1년)');
  const [level, setLevel] = useState('5.시나리오');
  const [analysisItems, setAnalysisItems] = useState(availableItems);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // 화면 크기에 따라 사이드바 초기 상태 설정
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
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
      console.error('복사 실패:', err);
      return false;
    } finally {
      document.body.removeChild(textArea);
    }
  };

  const handleOpenGemini = () => {
    // 복사 시도 후 제미나이로 이동
    copyToClipboard();
    // 제미나이 앱/웹 주소 (Deep Link는 환경마다 다르므로 범용 주소 사용)
    // 모바일에서는 앱이 있으면 앱으로, 없으면 웹으로 연결됩니다.
    window.open('https://gemini.google.com/app', '_blank');
  };

  const handleGeneratePrompt = async () => {
    if (!ticker.trim()) return;
    setIsGenerating(true);
    if (window.innerWidth < 1024) setIsSidebarOpen(false); // 모바일은 자동 접힘

    const stockData = await fetchRealStockData(ticker);
    
    const fullPrompt = `
[역할] 월스트리트 수석 애널리스트 (한국 및 글로벌 증시 전문가)
[대상] ${stockData ? stockData.name : ticker} (공식 기업명: ${stockData ? stockData.name : ticker})
[모드] MAIN (전문가용 심층 분석 모드)
[투자 관점] ${term}
[분석 레벨] ${level}

**주의: '${stockData ? stockData.name : ticker}'는 '${stockData ? stockData.name : ticker}'입니다. 다른 기업과 혼동하지 마십시오.**

[실시간 시장 데이터]
${stockData ? `
- 현재 주가: ${stockData.price} 원
- 전일 대비: ${stockData.change} (${stockData.changeRate}%)
- 거래량: ${stockData.volume} 주
- 시가총액: ${stockData.marketCap} 원
` : '- 실시간 데이터 조회 실패: 최신 시장 데이터를 직접 검색하여 반영할 것'}

[분석 지침]
**다음의 항목들을 순서대로 빠짐없이 상세히 분석하십시오.**
⚠️ [필수] 모든 항목에 대해 데이터 근거와 3-5개의 논리적 포인트를 포함할 것.

1. [성장주/가치주 정의 및 핵심 지표 분석]
2. [중점 분석 상세]
${analysisItems.map(item => `- ${item}`).join('\n')}
3. [투자성향별 포트폴리오 비중]
4. [시나리오 분석 (Bull/Base/Bear)]

[결론] 반드시 [매수 / 매도 / 관망] 중 하나를 제시하며 리포트를 마무리하십시오.
    `.trim();

    setTimeout(() => {
      setGeneratedPrompt(fullPrompt);
      setIsGenerating(false);
    }, 600);
  };

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-slate-900 font-sans text-slate-200 overflow-hidden">
      
      {/* Mobile Header */}
      <div className="lg:hidden flex items-center justify-between p-4 bg-slate-800 border-b border-slate-700 z-30">
        <div className="flex items-center space-x-2">
          <TrendingUp className="text-rose-500 w-5 h-5" />
          <span className="font-bold text-sm uppercase">AI Analyst V0.4</span>
        </div>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 bg-slate-700 rounded-lg">
          {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Sidebar (Responsive) */}
      <div className={`
        fixed inset-0 lg:relative lg:translate-x-0 transform transition-transform duration-300 ease-in-out z-20
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        w-full lg:w-80 bg-slate-800 border-r border-slate-700 flex flex-col h-full shadow-2xl
      `}>
        <div className="hidden lg:flex p-6 border-b border-slate-700 items-center space-x-3">
          <div className="bg-rose-500/10 p-2 rounded-lg">
            <TrendingUp className="text-rose-500 w-6 h-6" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-lg font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">프롬프트 빌더</h1>
            <span className="text-[10px] text-slate-500 font-mono tracking-widest uppercase text-left">Version 0.4</span>
          </div>
        </div>
        
        <div className="p-6 flex-1 flex flex-col space-y-6 overflow-y-auto custom-scrollbar pt-20 lg:pt-6">
          <div className="space-y-4">
            <div className="flex items-center text-sm font-semibold text-slate-400 uppercase tracking-wider">
              <Settings className="w-4 h-4 mr-2" />
              분석 프리셋
            </div>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="text-xs text-slate-500 mb-1 block">투자 관점</label>
                <select value={term} onChange={(e) => setTerm(e.target.value)} className="w-full bg-slate-900/50 border border-slate-700 rounded-lg p-2.5 text-sm outline-none">
                  <option>단기 (1~3개월)</option>
                  <option>중기 (6개월~1년)</option>
                  <option>장기 (1년 이상)</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">분석 레벨</label>
                <select value={level} onChange={(e) => setLevel(e.target.value)} className="w-full bg-slate-900/50 border border-slate-700 rounded-lg p-2.5 text-sm outline-none">
                  <option>1.기본분석</option>
                  <option>3.심층분석</option>
                  <option>5.시나리오</option>
                </select>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center text-sm font-semibold text-slate-400 uppercase tracking-wider">
              <CheckCircle className="w-4 h-4 mr-2" />
              분석 항목 선택
            </div>
            <div className="space-y-1.5 max-h-48 lg:max-h-60 overflow-y-auto pr-2 custom-scrollbar border border-slate-700/50 p-2 rounded-lg bg-slate-900/20">
              {availableItems.map((item, idx) => (
                <label key={idx} className="flex items-start space-x-3 cursor-pointer group p-1.5 rounded hover:bg-slate-700/30 transition-all">
                  <input type="checkbox" className="mt-1 w-4 h-4 rounded border-slate-600 text-rose-500 focus:ring-rose-500 bg-slate-900" checked={analysisItems.includes(item)} onChange={() => toggleAnalysisItem(item)} />
                  <span className="text-[11px] text-slate-400 group-hover:text-slate-200 leading-tight text-left">{item}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <label className="text-xs font-semibold text-slate-400 block uppercase text-left">종목명 또는 코드</label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3.5 text-slate-500" />
              <input type="text" value={ticker} onChange={(e) => setTicker(e.target.value)} placeholder="예: 휴림로봇, 005930" className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-rose-500 outline-none transition-all" onKeyDown={(e) => e.key === 'Enter' && handleGeneratePrompt()} />
            </div>
          </div>
        </div>

        <div className="p-6 bg-slate-800/80 backdrop-blur-sm border-t border-slate-700">
          <button onClick={handleGeneratePrompt} disabled={isGenerating} className={`w-full py-4 rounded-xl font-bold text-white shadow-lg flex justify-center items-center space-x-2 transition-all active:scale-95 ${isGenerating ? 'bg-slate-700' : 'bg-gradient-to-r from-rose-500 to-rose-600 hover:shadow-rose-500/30'}`}>
            {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Terminal className="w-5 h-5" />}
            <span>{isGenerating ? '데이터 수집 중...' : '분석 질문지 생성'}</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full bg-[#0f172a] relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:32px_32px]"></div>
        
        <div className="relative h-full flex flex-col p-4 lg:p-10 overflow-y-auto custom-scrollbar">
          <div className="max-w-4xl mx-auto w-full">
            <div className="flex flex-col lg:flex-row lg:items-center space-y-4 lg:space-y-0 lg:space-x-4 mb-8">
              <div className="bg-indigo-500/20 p-3 rounded-2xl w-fit">
                <Cpu className="text-indigo-400 w-8 h-8" />
              </div>
              <div>
                <h1 className="text-2xl lg:text-3xl font-black tracking-tight text-white italic uppercase text-left">
                  AI Hyper-Analyst <span className="text-rose-500">KOR</span> 
                  <span className="text-sm font-normal text-slate-500 ml-3 not-italic hidden lg:inline">V. 0.4</span>
                </h1>
                <p className="text-slate-400 text-xs lg:text-sm mt-1 text-left">공공데이터 기반 고품질 AI 질문지(Prompt) 생성기</p>
              </div>
            </div>

            {!generatedPrompt && !isGenerating && (
              <div className="mt-12 lg:mt-20 flex flex-col items-center justify-center text-center space-y-6 animate-in fade-in zoom-in duration-700">
                <div className="w-16 h-16 lg:w-20 lg:h-20 bg-slate-800/50 rounded-full flex items-center justify-center border border-slate-700 shadow-inner">
                  <FileText className="text-slate-500 w-8 h-8 lg:w-10 lg:h-10" />
                </div>
                <div>
                  <h3 className="text-lg lg:text-xl font-bold text-white uppercase tracking-tighter">Ready to Build Prompt</h3>
                  <p className="text-slate-500 text-sm max-w-xs mx-auto mt-2 leading-relaxed">왼쪽의 설정을 확인하고 버튼을 누르면 실시간 시세가 포함된 전문가급 질문지가 완성됩니다.</p>
                </div>
              </div>
            )}

            {isGenerating && (
              <div className="mt-20 flex flex-col items-center space-y-4">
                <div className="relative">
                  <div className="w-16 h-16 border-4 border-rose-500/20 border-t-rose-500 rounded-full animate-spin"></div>
                  <BarChart2 className="w-6 h-6 text-rose-500 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                </div>
                <p className="text-slate-400 font-medium animate-pulse text-sm">실시간 시장 데이터를 동기화하고 있습니다...</p>
              </div>
            )}

            {generatedPrompt && (
              <div className="animate-in fade-in slide-in-from-bottom-6 duration-500 space-y-6">
                <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-4 lg:p-5 flex items-start space-x-4">
                  <Info className="text-indigo-400 w-5 h-5 flex-shrink-0 mt-0.5" />
                  <p className="text-indigo-100/80 text-[13px] leading-relaxed text-left">
                    질문지가 생성되었습니다. 아래 버튼을 눌러 <strong>제미나이(Gemini)</strong>로 이동한 후 붙여넣기(Ctrl+V) 하세요.
                  </p>
                </div>

                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-rose-500/20 to-indigo-500/20 rounded-2xl blur opacity-75 group-hover:opacity-100 transition duration-500"></div>
                  <div className="relative bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden shadow-2xl">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700 bg-slate-800/50">
                      <span className="text-[10px] text-slate-500 font-mono uppercase tracking-widest font-bold">Generated Prompt</span>
                      <button onClick={copyToClipboard} className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${copySuccess ? 'bg-emerald-600 text-white' : 'bg-slate-700 hover:bg-slate-600 text-white'}`}>
                        {copySuccess ? <CheckCircle className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        <span>{copySuccess ? '복사됨' : '복사'}</span>
                      </button>
                    </div>
                    <div className="p-5 lg:p-8 max-h-[45vh] lg:max-h-[55vh] overflow-y-auto custom-scrollbar font-mono text-[12px] lg:text-[13px] leading-relaxed text-slate-300 whitespace-pre-wrap text-left select-all bg-[#0a0f1d]">
                      {generatedPrompt}
                    </div>
                    
                    {/* Call Gemini Button */}
                    <div className="p-4 lg:p-6 bg-slate-800/30 border-t border-slate-700 flex flex-col space-y-3">
                      <button 
                        onClick={handleOpenGemini}
                        className="w-full py-4 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white rounded-xl font-black text-sm shadow-xl flex justify-center items-center space-x-3 transition-all transform hover:scale-[1.02] active:scale-95"
                      >
                        <ExternalLink className="w-5 h-5" />
                        <span>복사 후 제미나이(Gemini)로 이동</span>
                      </button>
                      <p className="text-[10px] text-slate-500 italic text-center">
                        * 버튼을 누르면 질문지가 클립보드에 복사되고 제미나이 웹/앱이 열립니다.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Global Styles */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        select { -webkit-appearance: none; appearance: none; }
      `}</style>
    </div>
  );
}