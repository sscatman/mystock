import React, { useState } from 'react';
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
  Settings 
} from 'lucide-react';

/**
 * AI Hyper-Analyst KOR V. 0.3
 * 변경사항: 제미나이 API 직접 호출 제거 (질문지 생성 전용), 공공데이터 API 연동 유지
 */
const publicDataApiKey = "885853dbc6a25a93e403ee31fa9e124778e4943b8911869ea2f254ec5d75f99b";

// --- 공공데이터 API 호출 함수 (실시간 시세 취득) ---
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
    console.error("공공데이터 API 호출 실패:", error);
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
  const [ticker, setTicker] = useState('한미반도체');
  const [term, setTerm] = useState('중기 (6개월~1년)');
  const [level, setLevel] = useState('5.시나리오');
  const [analysisItems, setAnalysisItems] = useState(availableItems);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);

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
    } catch (err) {
      console.error('복사 실패:', err);
    }
    document.body.removeChild(textArea);
  };

  const handleGeneratePrompt = async () => {
    if (!ticker.trim()) return;
    setIsGenerating(true);
    setGeneratedPrompt('');

    // 공공데이터 API를 통해 실시간 데이터를 가져옵니다.
    const stockData = await fetchRealStockData(ticker);
    
    // 최종 프롬프트 구성 (AI에게 전달할 완벽한 지침서)
    const fullPrompt = `
[역할] 월스트리트 수석 애널리스트 (한국 및 글로벌 증시 전문가)
[대상] ${stockData ? stockData.name : ticker} (공식 기업명: ${stockData ? stockData.name : ticker})
[모드] MAIN (전문가용 심층 분석 모드)
[투자 관점] ${term}
[분석 레벨] ${level}

**주의: '${stockData ? stockData.name : ticker}'는 '${stockData ? stockData.name : ticker}'입니다. 다른 기업과 혼동하지 마십시오.**
이 분석은 '${level.split('.')[1]}' 모드입니다. 미래 불확실성을 고려하여 확률적 접근이 필수적입니다.

[실시간 시장 데이터 데이터]
${stockData ? `
- 현재 주가: ${stockData.price} 원
- 전일 대비: ${stockData.change} (${stockData.changeRate}%)
- 거래량: ${stockData.volume} 주
- 시가총액: ${stockData.marketCap} 원 (공공데이터 API 실시간 반영)
` : '- 실시간 데이터 조회 실패: 직접 최신 시장 데이터를 검색하여 분석에 반영하십시오.'}

[추가 데이터 요청]
- 최근 해당 종목과 관련된 호재/악재 뉴스 및 수급 동향을 웹 검색을 통해 수집하여 분석에 포함하십시오.
- 해당 산업군(Sector)의 업황(AI, 반도체 등)을 반드시 고려하십시오.

[분석 지침]
**다음의 항목들을 순서대로 빠짐없이 분석하십시오.**

⚠️ **[필수 준수 사항 - 매우 중요]** ⚠️
1. **생략 금지**: 아래 나열된 모든 분석 항목은 예외 없이 반드시 개별 섹션으로 상세히 분석해야 합니다. "지면 관계상 생략" 등은 허용되지 않습니다.
2. **일관된 품질**: 각 항목은 최소 3-5개의 구체적 포인트와 데이터 근거를 포함해야 합니다.
3. **구조화된 출력**: 각 분석 항목은 별도의 섹션 헤더(##)로 구분하십시오.
4. **스스로 검증**: 모든 선택 항목이 포함되었는지 최종 확인 후 리포트를 완성하십시오.

---

0. **[기업 기본 정보 (Company Overview)]**
보고서의 가장 첫 부분에 아래 형식의 마크다운 표를 작성하십시오.
| 항목 | 내용 |
|---|---|
| 정식 기업명 | ${stockData ? stockData.name : ticker} |
| 티커(심볼) | ${stockData ? stockData.ticker : ticker} |
| 섹터/산업 | (최신 정보 기입) |
| 시가총액 | ${stockData ? stockData.marketCap : 'N/A'} |

1. **[성장주/가치주 정의 및 핵심 지표 분석]**
이 기업이 '성장주(Growth Stock)'인지 '가치주(Value Stock)'인지 규명하고 핵심 재무 지표를 분석하십시오.

2. **[중점 분석 상세]**
아래 리스트의 모든 항목을 개별 섹션(##)으로 상세 분석하십시오.
${analysisItems.map(item => `- ${item}`).join('\n')}

- **가치평가(Valuation) 포함 시**: Graham 공식(V = EPS × (8.5 + 2g))과 DCF 방법론을 각각 사용하여 적정 주가를 산출하고 표로 비교하십시오.
- **기술적 지표 포함 시**: RSI, 이동평균선(5/20/60/120)의 위치를 분석하십시오.

3. **[투자성향별 포트폴리오 비중]**
보수적, 중립적, 공격적 투자자 각각에 대한 권장 보유 비중(%)과 이유를 제시하십시오.

4. **[시나리오 분석 (Scenario Analysis)]**
Bull(낙관), Base(기본), Bear(비관) 3가지 시나리오의 주가 밴드와 실현 확률(%)을 제시하십시오.

[결론]
반드시 [매수 / 매도 / 관망] 중 하나의 명확한 투자 의견을 한국어로 제시하며 리포트를 마무리하십시오.
    `.trim();

    // 생성 애니메이션 효과를 위해 약간의 지연
    setTimeout(() => {
      setGeneratedPrompt(fullPrompt);
      setIsGenerating(false);
    }, 600);
  };

  return (
    <div className="flex h-screen bg-slate-900 font-sans text-slate-200 overflow-hidden">
      {/* Sidebar */}
      <div className="w-80 bg-slate-800 border-r border-slate-700 flex flex-col h-full shadow-2xl z-10">
        <div className="p-6 border-b border-slate-700 flex items-center space-x-3">
          <div className="bg-rose-500/10 p-2 rounded-lg">
            <TrendingUp className="text-rose-500 w-6 h-6" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-lg font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">프롬프트 빌더</h1>
            <span className="text-[10px] text-slate-500 font-mono tracking-widest uppercase">Version 0.3</span>
          </div>
        </div>
        
        <div className="p-6 flex-1 flex flex-col space-y-6 overflow-y-auto custom-scrollbar">
          <div className="space-y-4">
            <div className="flex items-center text-sm font-semibold text-slate-400 uppercase tracking-wider">
              <Settings className="w-4 h-4 mr-2" />
              분석 프리셋
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs text-slate-500 mb-1 block">투자 관점</label>
                <select value={term} onChange={(e) => setTerm(e.target.value)} className="w-full bg-slate-900/50 border border-slate-700 rounded-lg p-2 text-sm outline-none">
                  <option>단기 (1~3개월)</option>
                  <option>중기 (6개월~1년)</option>
                  <option>장기 (1년 이상)</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">분석 레벨</label>
                <select value={level} onChange={(e) => setLevel(e.target.value)} className="w-full bg-slate-900/50 border border-slate-700 rounded-lg p-2 text-sm outline-none">
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
            <div className="space-y-1.5 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
              {availableItems.map((item, idx) => (
                <label key={idx} className="flex items-start space-x-3 cursor-pointer group p-1.5 rounded hover:bg-slate-700/30 transition-all">
                  <input type="checkbox" className="mt-1 w-3.5 h-3.5 rounded border-slate-600 text-rose-500 focus:ring-rose-500 bg-slate-900" checked={analysisItems.includes(item)} onChange={() => toggleAnalysisItem(item)} />
                  <span className="text-[11px] text-slate-400 group-hover:text-slate-200 leading-tight">{item}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <label className="text-xs font-semibold text-slate-400 block uppercase">대상 종목명 또는 코드</label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
              <input type="text" value={ticker} onChange={(e) => setTicker(e.target.value)} placeholder="예: 삼성전자, 005930" className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-rose-500 outline-none transition-all" onKeyDown={(e) => e.key === 'Enter' && handleGeneratePrompt()} />
            </div>
          </div>
        </div>

        <div className="p-6 bg-slate-800/50 backdrop-blur-sm">
          <button onClick={handleGeneratePrompt} disabled={isGenerating} className={`w-full py-4 rounded-xl font-bold text-white shadow-lg flex justify-center items-center space-x-2 transition-all active:scale-95 ${isGenerating ? 'bg-slate-700' : 'bg-gradient-to-r from-rose-500 to-rose-600 hover:shadow-rose-500/20'}`}>
            {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Terminal className="w-5 h-5" />}
            <span>{isGenerating ? '데이터 수집 중...' : 'AI 분석 질문지 생성'}</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full bg-[#0f172a] relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:32px_32px]"></div>
        
        <div className="relative h-full flex flex-col p-8 overflow-y-auto custom-scrollbar">
          <div className="max-w-4xl mx-auto w-full">
            <div className="flex items-center space-x-4 mb-10">
              <div className="bg-indigo-500/20 p-3 rounded-2xl">
                <Cpu className="text-indigo-400 w-8 h-8" />
              </div>
              <div>
                <h1 className="text-3xl font-black tracking-tight text-white italic uppercase">
                  AI Hyper-Analyst <span className="text-rose-500">KOR</span> 
                  <span className="text-sm font-normal text-slate-500 ml-4 not-italic">V. 0.3</span>
                </h1>
                <p className="text-slate-400 text-sm mt-1">공공데이터 기반 실시간 시세 데이터가 포함된 고품질 AI 질문지 생성기</p>
              </div>
            </div>

            {!generatedPrompt && !isGenerating && (
              <div className="mt-20 flex flex-col items-center justify-center text-center space-y-6">
                <div className="w-20 h-20 bg-slate-800/50 rounded-full flex items-center justify-center border border-slate-700">
                  <FileText className="text-slate-500 w-10 h-10" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">분석 질문지를 생성할 준비가 되었습니다.</h3>
                  <p className="text-slate-500 max-w-sm mx-auto mt-2">왼쪽에서 종목을 입력하고 버튼을 누르시면, 실시간 시세가 포함된 전문가급 질문지가 나타납니다.</p>
                </div>
              </div>
            )}

            {isGenerating && (
              <div className="mt-20 flex flex-col items-center space-y-4">
                <Loader2 className="w-12 h-12 text-rose-500 animate-spin" />
                <p className="text-slate-400 font-medium animate-pulse">금융위원회 실시간 데이터를 조회하고 있습니다...</p>
              </div>
            )}

            {generatedPrompt && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-5 flex items-start space-x-4">
                  <Info className="text-emerald-400 w-5 h-5 flex-shrink-0 mt-0.5" />
                  <p className="text-emerald-100/80 text-sm leading-relaxed">
                    아래 텍스트 박스의 내용을 복사하여 <strong>Gemini(제미나이)</strong>나 <strong>ChatGPT</strong>에 붙여넣으세요. 
                    공공데이터 API로 수집한 최신 데이터가 이미 포함되어 있습니다.
                  </p>
                </div>

                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-rose-500/20 to-indigo-500/20 rounded-2xl blur"></div>
                  <div className="relative bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden shadow-2xl">
                    <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700 bg-slate-800/50">
                      <span className="text-xs text-slate-500 font-mono uppercase tracking-widest">AI Analyst Instruction</span>
                      <button onClick={copyToClipboard} className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${copySuccess ? 'bg-emerald-600 text-white' : 'bg-rose-600 hover:bg-rose-500 text-white'}`}>
                        {copySuccess ? <CheckCircle className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copySuccess ? '복사 완료!' : '질문지 전체 복사'}</span>
                      </button>
                    </div>
                    <div className="p-8 max-h-[60vh] overflow-y-auto custom-scrollbar font-mono text-sm leading-relaxed text-slate-300 whitespace-pre-wrap">
                      {generatedPrompt}
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
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </div>
  );
}