import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Search, 
  TrendingUp, 
  BarChart2, 
  Newspaper, 
  Globe, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Loader2,
  ChevronRight,
  BookOpen
} from 'lucide-react';

const geminiApiKey = "AIzaSyCwy8DzIFxvjysoluKNLJJFlwjctiwD5-Y"; // 👈 [1] 여기에 구글 Gemini API 키를 넣으세요! (분석 리포트 작성용 뇌)
const publicDataApiKey = "885853dbc6a25a93e403ee31fa9e124778e4943b8911869ea2f254ec5d75f99b"; // 👈 [2] 여기에 공공데이터포털 API 키(Decoding)를 넣으세요! (실제 주가 데이터 수집용 눈)

// --- Public Data API Fetcher (실제 주식 데이터 가져오기) ---
const fetchRealStockData = async (ticker) => {
  if (!publicDataApiKey) {
    console.warn("공공데이터포털 API 키가 없습니다. 가상 데이터를 사용합니다.");
    return getMockStockData(ticker);
  }
  
  try {
    // 공공데이터포털 금융위원회 주식시세정보 API 호출
    const url = `https://apis.data.go.kr/1160100/service/GetStockSecuritiesInfoService/getStockPriceInfo?serviceKey=${publicDataApiKey}&resultType=json&likeSrtnCd=${ticker}&numOfRows=1`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    const item = data?.response?.body?.items?.item?.[0];
    if (!item) throw new Error("데이터를 찾을 수 없습니다.");

    return `
[실시간 시세 정보 (공공데이터 API 실제 반영)]
- 종목명: ${item.itmsNm}
- 현재가: ${Number(item.clpr).toLocaleString()} 원
- 전일대비: ${item.vs} 원
- 등락률: ${item.fltRt}%
- 거래량: ${Number(item.trqu).toLocaleString()} 주
- 시가총액: ${Number(item.mrktTotAmt).toLocaleString()} 원
`;
  } catch (error) {
    console.error("API 호출 실패 (키 오류 혹은 CORS 에러). 임시 데이터로 대체합니다.", error);
    return getMockStockData(ticker); // 실패 시 기존 가짜 데이터로 대체
  }
};

// --- Mock Data Generator for Korean Stocks ---
const getMockStockData = (ticker) => {
  const isSamsung = ticker === '005930';
  const isHynix = ticker === '000660';
  
  const name = isSamsung ? '삼성전자' : isHynix ? 'SK하이닉스' : `종목코드(${ticker})`;
  const price = isSamsung ? 82000 : isHynix ? 185000 : Math.floor(Math.random() * 100000) + 1000;
  const marketCap = isSamsung ? '480조 원' : isHynix ? '135조 원' : `${Math.floor(Math.random() * 10000)}억 원`;
  const sector = isSamsung || isHynix ? '반도체/IT' : '제조/서비스';
  
  return `
[실시간 시세 정보]
- 현재가: ${price.toLocaleString()} 원
- 시장 상태: 정규장
- 전일 대비: ${Math.random() > 0.5 ? '+' : '-'}${(Math.random() * 3).toFixed(2)}%

[기술적 지표 - Technical Indicators]
- RSI(14): ${(Math.random() * 40 + 30).toFixed(2)}
- 이동평균선: MA5: ${(price * 0.99).toLocaleString()}, MA20: ${(price * 0.95).toLocaleString()}, MA60: ${(price * 0.9).toLocaleString()}

[재무 지표 요약]
- P/E TTM: ${(Math.random() * 20 + 5).toFixed(2)}
- P/B: ${(Math.random() * 3 + 0.5).toFixed(2)}
- 부채비율: ${(Math.random() * 100 + 20).toFixed(2)}%
- 유동비율: ${(Math.random() * 150 + 100).toFixed(2)}%

[관련 뉴스 헤드라인]
- [News] ${name}, 외국인 순매수 지속... 하반기 실적 기대감 (오늘)
- [News] 글로벌 거시경제 불확실성 속 ${name}의 향후 주가 향방은? (어제)
- [News] ${sector} 업황 턴어라운드 본격화 분석 리포트 발간 (2일 전)
`;
};

// --- API Call with Exponential Backoff ---
const fetchGeminiAnalysis = async (prompt) => {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${geminiApiKey}`;
  const payload = {
    contents: [{ parts: [{ text: prompt }] }],
    systemInstruction: { 
      parts: [{ text: "당신은 여의도 최고의 수석 애널리스트입니다. 입력된 프롬프트의 지시사항을 완벽하게 따르며, 반드시 한국어로 마크다운 형식을 사용하여 전문적인 보고서를 작성합니다." }] 
    }
  };

  const retries = 5;
  const delays = [1000, 2000, 4000, 8000, 16000];

  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const data = await response.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || "결과를 생성하지 못했습니다.";
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(res => setTimeout(res, delays[i]));
    }
  }
};

// --- Simple Markdown Parser Component ---
const MarkdownRenderer = ({ content }) => {
  if (!content) return null;

  const lines = content.split('\n');
  const elements = [];
  let inTable = false;
  let tableHeader = [];
  let tableRows = [];

  const renderTable = (key) => {
    const el = (
      <div key={`table-${key}`} className="overflow-x-auto my-6 rounded-lg border border-slate-200 shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              {tableHeader.map((th, i) => (
                <th key={i} className="px-4 py-3 text-left font-semibold text-slate-700">{th}</th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-100">
            {tableRows.map((row, i) => (
              <tr key={i} className="hover:bg-slate-50 transition-colors">
                {row.map((cell, j) => (
                  <td key={j} className="px-4 py-2.5 text-slate-600">{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
    tableHeader = [];
    tableRows = [];
    inTable = false;
    return el;
  };

  const parseInlineStyles = (text) => {
    // Basic bold parsing: **text**
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-bold text-slate-800">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Table parsing
    if (line.trim().startsWith('|')) {
      const cells = line.split('|').filter(c => c.trim() !== '').map(c => c.trim());
      if (!inTable) {
        if (lines[i+1] && lines[i+1].includes('---')) {
          inTable = true;
          tableHeader = cells;
          i++; // skip separator
        }
      } else {
        tableRows.push(cells);
      }
      continue;
    } else if (inTable) {
      elements.push(renderTable(i));
    }

    // Headings
    if (line.startsWith('## ')) {
      elements.push(<h2 key={i} className="text-2xl font-bold text-slate-800 mt-8 mb-4 pb-2 border-b border-slate-200">{parseInlineStyles(line.replace('## ', ''))}</h2>);
    } else if (line.startsWith('### ')) {
      elements.push(<h3 key={i} className="text-xl font-bold text-slate-700 mt-6 mb-3">{parseInlineStyles(line.replace('### ', ''))}</h3>);
    } else if (line.startsWith('- ')) {
      elements.push(<li key={i} className="ml-6 list-disc mb-2 text-slate-600 leading-relaxed">{parseInlineStyles(line.substring(2))}</li>);
    } else if (line.trim() === '') {
      elements.push(<div key={i} className="h-4"></div>);
    } else {
      elements.push(<p key={i} className="mb-2 text-slate-600 leading-relaxed">{parseInlineStyles(line)}</p>);
    }
  }
  
  if (inTable) elements.push(renderTable('end'));

  return <div className="markdown-body">{elements}</div>;
};


export default function App() {
  const [ticker, setTicker] = useState('005930');
  const [term, setTerm] = useState('중기 (6개월~1년)');
  const [level, setLevel] = useState('5.시나리오');
  
  const [options, setOptions] = useState({
    news: true,
    twitter: true,
    macro: true
  });

  const [analysisItems, setAnalysisItems] = useState([
    '현금건전성 지표 (FCF, 유동비율, 부채비율)',
    '핵심 재무제표 분석 (손익, 대차대조, 현금흐름)',
    '투자기관 목표주가 및 컨센서스',
    '호재/악재 뉴스 판단',
    '기술적 지표 (RSI/이평선)',
    '수급 분석 (외국인/기관)',
    'P/E Ratio 및 밸류에이션',
    '시나리오별 확률 및 근거'
  ]);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [report, setReport] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const toggleAnalysisItem = (item) => {
    setAnalysisItems(prev => 
      prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]
    );
  };

  const handleAnalyze = async () => {
    if (!ticker.trim()) {
      setErrorMsg("종목코드(티커)를 입력해주세요.");
      return;
    }
    
    setIsAnalyzing(true);
    setErrorMsg('');
    setReport('');

    // 1. 공공데이터포털 API에서 실제 데이터를 가져옵니다. (에러 시 가상데이터)
    const stockData = await fetchRealStockData(ticker);
    
    // 2. AI에게 넘길 프롬프트를 구성합니다.
    const prompt = `
[역할] 여의도 수석 애널리스트 (한국 증시 전문가)
[대상] 종목코드: ${ticker}
[모드] MAIN
[투자 관점] ${term}
[분석 레벨] ${level}
주의: 이 분석은 한국 증시(KOSPI/KOSDAQ) 종목을 대상으로 합니다. 미래 불확실성을 고려하여 확률적 접근이 필수적입니다.

[데이터 요약]
${stockData}
${options.macro ? '- 거시경제: 환율, 금리 인상/인하 기대감, 수출입 동향 등을 고려할 것.' : ''}

[분석 지침]
다음의 항목들을 순서대로 빠짐없이 분석하십시오.

[필수 준수 사항]
1. 생략 금지: 선택한 항목은 모두 깊이 있게 다뤄야 합니다.
2. 각 항목당 최소 3~5개의 구체적 포인트를 포함하십시오.
3. 각 항목은 ## 헤더로 분리하십시오.
4. 반드시 한국어로 작성하십시오.

[분석해야 할 항목 목록]
${analysisItems.map(item => `- ${item}`).join('\n')}

보고서의 가장 첫 부분에 다음 데이터를 사용하여 마크다운 표를 작성하십시오. (기업명, 시장, 시가총액, 섹터 등 - 추정치 사용 가능)

결론에는 반드시 [매수 / 매도 / 관망] 중 하나의 명확한 투자 의견을 제시하십시오.
`;

    try {
      const result = await fetchGeminiAnalysis(prompt);
      setReport(result);
    } catch (error) {
      console.error(error);
      setErrorMsg("분석 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const availableItems = [
    '현금건전성 지표 (FCF, 유동비율, 부채비율)',
    '핵심 재무제표 분석 (손익, 대차대조, 현금흐름)',
    '투자기관 목표주가 및 컨센서스',
    '호재/악재 뉴스 판단',
    '기술적 지표 (RSI/이평선)',
    '수급 분석 (외국인/기관)',
    '경쟁사 비교 및 업황',
    'P/E Ratio 및 밸류에이션',
    '적정 주가 산출 (내재가치/DCF)',
    '투자성향별 포트폴리오 비중',
    '시나리오별 확률 및 근거'
  ];

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-800 overflow-hidden">
      
      {/* Sidebar */}
      <div className="w-80 bg-white border-r border-slate-200 flex flex-col h-full shadow-[2px_0_8px_rgba(0,0,0,0.02)] z-10 overflow-y-auto">
        
        <div className="p-5 border-b border-slate-100 flex items-center space-x-2">
          <TrendingUp className="text-rose-500 w-6 h-6" />
          <h1 className="text-lg font-extrabold tracking-tight text-slate-800">분석 옵션</h1>
        </div>

        <div className="p-5 flex-1 flex flex-col space-y-6">
          
          {/* Term Slider */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold text-slate-600">투자 관점</span>
              <span className="text-xs text-rose-500 font-medium bg-rose-50 px-2 py-1 rounded-full">{term}</span>
            </div>
            <input 
              type="range" min="1" max="3" step="1" 
              className="w-full accent-rose-500" 
              defaultValue="2"
              onChange={(e) => {
                const val = e.target.value;
                if(val === "1") setTerm("단기 (1~3개월)");
                if(val === "2") setTerm("중기 (6개월~1년)");
                if(val === "3") setTerm("장기 (1년 이상)");
              }}
            />
          </div>

          {/* Level Slider */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold text-slate-600">분석 레벨</span>
              <span className="text-xs text-rose-500 font-medium bg-rose-50 px-2 py-1 rounded-full">{level}</span>
            </div>
            <input 
              type="range" min="1" max="5" step="1" 
              className="w-full accent-rose-500" 
              defaultValue="5"
              onChange={(e) => setLevel(`${e.target.value}. ${['요약','기본','심층','전문가','시나리오'][e.target.value-1]}`)}
            />
          </div>

          <hr className="border-slate-100" />

          {/* Toggles */}
          <div className="space-y-4">
            <label className="flex items-center space-x-3 cursor-pointer group">
              <div className={`w-10 h-5 flex items-center rounded-full p-1 transition-colors ${options.news ? 'bg-rose-500' : 'bg-slate-300'}`} onClick={() => setOptions({...options, news: !options.news})}>
                <div className={`bg-white w-3.5 h-3.5 rounded-full shadow-md transform transition-transform ${options.news ? 'translate-x-5' : ''}`}></div>
              </div>
              <span className="text-sm font-medium text-slate-700 flex items-center"><Newspaper className="w-4 h-4 mr-1.5 text-slate-400" /> 뉴스 데이터 반영</span>
            </label>

            <label className="flex items-center space-x-3 cursor-pointer group">
              <div className={`w-10 h-5 flex items-center rounded-full p-1 transition-colors ${options.twitter ? 'bg-rose-500' : 'bg-slate-300'}`} onClick={() => setOptions({...options, twitter: !options.twitter})}>
                <div className={`bg-white w-3.5 h-3.5 rounded-full shadow-md transform transition-transform ${options.twitter ? 'translate-x-5' : ''}`}></div>
              </div>
              <span className="text-sm font-medium text-slate-700 flex items-center"><Globe className="w-4 h-4 mr-1.5 text-slate-400" /> SNS 동향 포함</span>
            </label>

            <label className="flex items-center space-x-3 cursor-pointer group">
              <div className={`w-10 h-5 flex items-center rounded-full p-1 transition-colors ${options.macro ? 'bg-rose-500' : 'bg-slate-300'}`} onClick={() => setOptions({...options, macro: !options.macro})}>
                <div className={`bg-white w-3.5 h-3.5 rounded-full shadow-md transform transition-transform ${options.macro ? 'translate-x-5' : ''}`}></div>
              </div>
              <span className="text-sm font-medium text-slate-700 flex items-center"><BarChart2 className="w-4 h-4 mr-1.5 text-slate-400" /> 거시경제/지정학 분석</span>
            </label>
          </div>

          <hr className="border-slate-100" />

          {/* Analysis Items (Collapsible-like visually) */}
          <div className="space-y-3">
            <div className="flex items-center text-sm font-semibold text-slate-800 bg-slate-100 p-2.5 rounded-lg border border-slate-200 cursor-pointer">
              <ChevronRight className="w-4 h-4 mr-2 text-slate-500" /> 중점 분석 항목
            </div>
            <div className="pl-2 space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
              {availableItems.map((item, idx) => (
                <label key={idx} className="flex items-start space-x-2 cursor-pointer group">
                  <input 
                    type="checkbox" 
                    className="mt-1 w-4 h-4 text-rose-500 border-slate-300 rounded focus:ring-rose-500"
                    checked={analysisItems.includes(item)}
                    onChange={() => toggleAnalysisItem(item)}
                  />
                  <span className="text-xs text-slate-600 group-hover:text-slate-900 leading-tight">{item}</span>
                </label>
              ))}
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* Ticker Input */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 block">종목코드 (예: 005930)</label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input 
                type="text" 
                value={ticker}
                onChange={(e) => setTicker(e.target.value.replace(/[^0-9a-zA-Z]/g, '').toUpperCase())}
                placeholder="005930"
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all"
                onKeyDown={(e) => { if(e.key === 'Enter') handleAnalyze(); }}
              />
            </div>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="flex items-center space-x-1.5 text-red-500 text-xs bg-red-50 p-2 rounded-md">
              <AlertCircle className="w-4 h-4" />
              <span>{errorMsg}</span>
            </div>
          )}

        </div>

        {/* Action Button */}
        <div className="p-5 border-t border-slate-100 bg-white">
          <button 
            onClick={handleAnalyze}
            disabled={isAnalyzing || analysisItems.length === 0}
            className={`w-full py-3.5 rounded-xl font-bold text-white shadow-md flex justify-center items-center space-x-2 transition-all
              ${isAnalyzing 
                ? 'bg-rose-400 cursor-not-allowed' 
                : 'bg-gradient-to-r from-rose-500 to-red-500 hover:from-rose-600 hover:to-red-600 hover:shadow-lg hover:-translate-y-0.5'
              }
            `}
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>분석 중...</span>
              </>
            ) : (
              <>
                <Search className="w-5 h-5" />
                <span>AI 심층 분석 시작</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full relative bg-slate-50 overflow-y-auto">
        
        {/* Header Title */}
        <div className="px-10 pt-10 pb-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <BarChart2 className="text-white w-6 h-6" />
            </div>
            <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight flex items-center">
              AI Hyper-Analyst <span className="ml-2 text-rose-500 text-2xl font-black">KOR</span>
            </h1>
          </div>

          {/* Info Banner */}
          {!report && !isAnalyzing && (
             <div className="bg-blue-50 border border-blue-100 text-blue-800 px-5 py-4 rounded-xl flex items-center shadow-sm">
             <span className="text-xl mr-3">👉</span>
             <p className="text-sm font-medium">왼쪽 사이드바에서 분석 옵션을 설정하고 종목코드를 입력한 후 <strong>'분석 시작'</strong> 버튼을 눌러주세요.</p>
           </div>
          )}
        </div>

        {/* Report Content */}
        <div className="px-10 pb-20 w-full max-w-5xl">
          {isAnalyzing ? (
            <div className="flex flex-col items-center justify-center h-64 bg-white rounded-2xl border border-slate-100 shadow-sm">
              <Loader2 className="w-10 h-10 text-rose-500 animate-spin mb-4" />
              <p className="text-slate-600 font-medium">방대한 시장 데이터와 재무 제표를 분석하고 있습니다...</p>
              <p className="text-slate-400 text-sm mt-2">잠시만 기다려주세요 (최대 30초 소요)</p>
            </div>
          ) : report ? (
            <div className="bg-white rounded-2xl p-10 shadow-sm border border-slate-200">
              <div className="flex items-center space-x-2 text-indigo-600 mb-8 bg-indigo-50 inline-flex px-3 py-1.5 rounded-lg border border-indigo-100">
                <BookOpen className="w-4 h-4" />
                <span className="text-sm font-bold">여의도 수석 애널리스트 AI 리포트</span>
              </div>
              <MarkdownRenderer content={report} />
            </div>
          ) : null}
        </div>

      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9; 
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1; 
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8; 
        }
      `}} />
    </div>
  );
}
