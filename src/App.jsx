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
 * AI Hyper-Analyst GLOBAL V1.16 ULTRA-STRICT (RAW SOURCE)
 * 모바일 최적화 패치 적용:
 * 1. 모바일 뷰어(가로 1024px 이하)에서 사이드바 토글(닫기/열기) UI 추가
 * 2. 종목 검색 성공 시 모바일 환경에서는 자동으로 사이드바 숨김 처리
 * 3. 엔터키(Enter) 입력 시 즉시 검색 실행 로직 추가
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
  const [useMacro, setUseMacro] = useState(false);
  const [reportType, setReportType] = useState('MAIN'); 

  const [isFocusMenuOpen, setIsFocusMenuOpen] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);
  
  // 모바일에서 사이드바 기본 열림 상태
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // 수동 검색 함수 (엔터키 용)
  const handleSearch = async () => {
    const cleanInput = ticker.trim();
    if (cleanInput.length < 2) return;
    
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
        generatePromptContent(stockInfo, reportType);
        
        // 모바일 화면일 경우 검색 성공 시 사이드바 닫기
        if (window.innerWidth < 1024) {
          setIsSidebarOpen(false);
        }
      }
    } catch (error) {
      console.error("Fetch error", error);
    } finally {
      setIsSearching(false);
    }
  };

  // 자동 종목 검색
  useEffect(() => {
    const autoGenerate = setTimeout(() => {
      if (ticker.trim().length >= 2) {
        handleSearch();
      }
    }, 1200); 

    return () => clearTimeout(autoGenerate);
  }, [ticker, useMacro, reportType, analysisItems]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const generatePromptContent = (stockInfo, type = 'MAIN') => {
    setIsGenerating(true);
    const stockName = stockInfo ? stockInfo.name : ticker;
    const stockCode = stockInfo ? stockInfo.code : ticker;
    const isKOR = /^\d+$/.test(stockCode);
    const currencySym = isKOR ? "₩" : "$";

    let fullPrompt = "";

    if (type === 'MAIN') {
      fullPrompt = `
[역할] 월스트리트 수석 애널리스트
[대상] ${stockName} (공식 기업명: ${stockName})
[모드] MAIN
[중점 분석] ${analysisItems.join(', ')}
[투자 관점] ${term}
[분석 레벨] ${level}
**주의: '${stockName}'는 '${stockName}'입니다. 다른 기업과 혼동하지 마십시오.**
이 분석은 '시나리오 모드'입니다. 미래 불확실성을 고려하여 확률적 접근이 필수적입니다.

[데이터 요약]
${stockInfo ? `- 현재가: ${Number(stockInfo.price).toLocaleString()} ${isKOR ? 'KRW' : 'USD'} / 전일대비: ${stockInfo.change} (${stockInfo.changeRate}%)` : 'Chart Data Not Available. 가격 정보 조회 실패'}

[재무 지표]
N/A (최신 분기 리포트 및 지표를 직접 검색하여 분석에 반영하십시오.)

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
     | 기업 규모 | N/A |
     | 직원 수 | N/A |

1. **[성장주/가치주 정의 및 핵심 지표 분석]**
   - 이 기업이 '성장주(Growth Stock)'인지 '가치주(Value Stock)'인지 규명하십시오.
   - **성장주라면**: 매출 성장률(5년 추이), Cash Flow 증가세, ROI 개선, Profit Margin 방향성, 실적 지속성을 중점 분석.
   - **가치주라면**: 시장 점유율 추이, 배당금 안정성, 주가 안정성, 이익률(Margin) 변화, EPS 트렌드를 중점 분석.

2. **[사용자 선택 중점 분석 항목 상세]**
   ⚠️ **아래 리스트의 모든 항목을 개별 섹션으로 상세 분석하십시오. 절대 생략 금지!**
   - 선택된 항목 목록: ${analysisItems.join(', ')}
   - **각 항목별로 ## 헤더를 사용하여 별도 섹션으로 작성**하십시오.
   - 각 항목당 최소 3개 이상의 구체적 분석 포인트를 포함하십시오.

   - **만약 'P/E Ratio'가 포함되어 있다면**: P/E TTM(Trailing Twelve Months)과 Forward P/E를 비교 분석하고, 업종 평균 P/E와의 괴리율, 역사적 P/E 밴드 내 현재 위치를 평가하십시오.
   - **만약 'Intrinsic Value' 또는 'DCF'가 포함되어 있다면**:
     * **두 가지 방법론으로 각각 정확한 가격을 산출**하십시오:

     **[1] Intrinsic Value (내재가치) - EPS/성장률 기반**
     * 공식: Intrinsic Value = EPS × (1 + g) × P/E 또는 Graham 공식 사용
     * Graham 공식: V = EPS × (8.5 + 2g) (g = 예상 성장률 %)

     **[2] DCF Value (현금흐름할인가치)**
     * 공식: DCF = Σ(FCF_t / (1+WACC)^t) + Terminal Value / (1+WACC)^n
     * FCF(Free Cash Flow) 기반 미래 현금흐름 할인

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
   - **만약 '베타(β)' 또는 'WACC'가 포함되어 있다면**:
     * 베타(β) 값을 통해 시장 대비 변동성(Systematic Risk)을 분석하십시오.
     * WACC = (E/V × Re) + (D/V × Rd × (1-Tc)) 공식을 사용하여 WACC를 산출하십시오.
     * **ROIC(투하자본이익률)와 WACC를 비교**하여 기업이 자본비용 대비 초과 수익(Value Creation)을 내고 있는지 평가하십시오.
   - **만약 '기술적 지표'가 포함되어 있다면**: RSI(14) 값과 이동평균선(MA5, MA20, MA60, MA120) 수치를 반드시 인용하여 분석하십시오.

3. **[투자성향별 포트폴리오 비중 분석]** (만약 '투자성향별 포트폴리오 적정보유비중'이 선택되었다면):
   - 다음 3가지 투자 성향에 맞춰 이 종목의 **권장 보유 비중(%)**과 **그 이유**를 구체적으로 제시하십시오.
   - (1) **보수적 투자자 (Stable)**: 리스크 최소화 선호, 원금 보존 중시.
   - (2) **중립적 투자자 (Balanced)**: 성장과 안정의 균형, 시장 평균 수익률 추구.
   - (3) **공격적 투자자 (Aggressive)**: 높은 변동성 감내, 고수익(Alpha) 추구.
   
4. **[시나리오별 확률 및 근거 (Scenario Analysis)]**
   - **Bull (낙관) / Base (기본) / Bear (비관)** 3가지 시나리오를 설정하십시오.
   - 각 시나리오별 **예상 주가 밴드**와 **실현 확률(%)**을 명시적으로 제시하십시오.
   - 왜 그러한 확률이 배정되었는지에 대한 **논리적/정량적 근거**를 상세히 설명하십시오.

${useMacro ? `
**[🌍 거시경제 및 지정학적 분석 - 필수 포함]**
이 분석은 거시경제 및 지정학적 관점을 반드시 포함해야 합니다. 아래 항목을 심층 분석하십시오:

1. **통화정책 및 금리 영향**
   - 연준(Fed) 금리 정책이 해당 기업/섹터에 미치는 영향
   - 금리 인상/인하 시나리오별 주가 영향
   - 달러 강세/약세에 따른 수출입 영향

2. **지정학적 리스크**
   - 미중 무역분쟁, 관세 정책이 해당 기업에 미치는 영향
   - 전쟁, 지역 분쟁(우크라이나, 중동 등)의 공급망 영향
   - 글로벌 제재, 수출 규제 관련 리스크
   - 핵심 원자재(반도체, 희토류 등) 공급망 의존도

3. **거시경제 사이클**
   - 현재 경기 사이클 위치 (확장, 정점, 수축, 저점)
   - 경기침체(Recession) 가능성과 해당 기업의 방어력
   - 인플레이션/디플레이션 환경에서의 가격 전가력

4. **글로벌 정책 변화**
   - ESG/탄소중립 정책이 해당 섹터에 미치는 중장기 영향
   - AI 규제, 데이터 보호법 등 기술 규제 영향
   - 정부 보조금, 세제 혜택 변화

5. **환율 및 국제 자금 흐름**
   - 원/달러 환율 변동이 수익에 미치는 영향
   - 신흥국 자금 이탈/유입 트렌드
   - 외국인 투자자 동향과 거시경제 연관성

**출력 시 별도 섹션으로 "🌍 거시경제/지정학 분석" 항목을 반드시 포함하십시오.**
` : ''}

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
    } else if (type === '10-K') {
      fullPrompt = `
[역할] 월가 수석 애널리스트 (펀더멘탈 & 장기 투자 전문가)
[대상] ${stockName} (공식 기업명: ${stockName})
[자료] 최신 SEC 10-K 보고서 (Annual Report)

[지시사항]
당신은 월가 최고의 주식 애널리스트입니다. 위 종목의 **최신 SEC 10-K 보고서**를 기반으로 기업의 기초 체력과 장기 비전을 심층 분석해 주세요.
**주의: '${stockName}'은 '${stockName}'입니다. 다른 기업과 혼동하지 마십시오.** 필요하다면 Google Search 도구를 활용하여 최신 데이터를 교차 검증하세요.

**[출력 형식]**
- 마크다운(Markdown) 형식을 사용하여 깔끔하게 작성하세요.
- 섹션 헤더, 불렛 포인트, 볼드체를 적절히 활용하세요.

**[필수 분석 항목]**
1. **비즈니스 개요 (Overview)**: 산업 내 위치, 비즈니스 모델의 강점, Fiscal Year End 날짜.
2. **MD&A 및 미래 전망 (Outlook)**: (중요) 경영진이 제시하는 내년도 시장 전망 및 전략. 매출 및 수익성 성장에 대한 경영진의 자신감 톤(Tone) 분석.
3. **핵심 리스크 및 법적 이슈 (Risk & Legal)**: 사업에 치명적일 수 있는 Risk Factors. 진행 중인 중요한 소송이나 규제 이슈 여부.
4. **재무제표 정밀 분석 (Financials)**: 대차대조표, 손익계산서, 현금흐름표의 주요 변동 사항. **부채 만기 구조(Debt Maturity)** 및 유동성 위기 가능성 점검.
5. **주요 이벤트 (Key Events)**: 자사주 매입, M&A, 경영진 변동, 대규모 구조조정 등.

[결론] 기업의 장기적인 투자 가치와 해자(Moat)에 대한 종합 평가.
**모든 답변은 반드시 한글로 작성해 주십시오.**
`.trim();
    } else if (type === '10-Q') {
      fullPrompt = `
[역할] 실적 모멘텀 및 트렌드 분석가
[대상] ${stockName} (공식 기업명: ${stockName})
[자료] 최신 SEC 10-Q 보고서 (Quarterly Report)

[지시사항]
위 종목의 **최신 SEC 10-Q 보고서**를 기반으로 **직전 분기 대비 변화(Trend)**에 집중하여 분석 보고서를 작성하세요.
**주의: '${stockName}'는 '${stockName}'입니다.** 단기적인 실적 흐름과 경영진의 가이던스 변화를 포착하는 것이 핵심입니다.

**[출력 형식]**
- 마크다운(Markdown) 형식 사용.

**[필수 분석 항목]**
1. **실적 요약 (Earnings Summary)**: 매출 및 EPS의 전년 동기(YoY) 및 전 분기(QoQ) 대비 성장률. 시장 예상치 상회/하회 여부 및 그 원인.
2. **가이던스 변화 (Guidance Update)**: (매우 중요) 경영진이 제시한 향후 실적 전망치가 상향되었는가, 하향되었는가? 전망 변경의 구체적인 근거(수요 증가, 비용 절감 등).
3. **부문별 성과 (Segment Performance)**: 주요 사업 부문별 매출 및 이익 증감 추이. 가장 빠르게 성장하는 부문과 둔화되는 부문 식별.
4. **현금흐름 및 비용 (Cash & Costs)**: 영업활동 현금흐름의 변화. R&D 및 마케팅 비용 지출 추이 (효율성 분석).

[결론] 이번 분기 실적이 일시적인지 구조적인 추세인지 판단하고, 단기/중기 투자 매력도 제시.
**모든 답변은 반드시 한글로 작성해 주십시오.**
`.trim();
    } else if (type === '8-K') {
      fullPrompt = `
[역할] 속보 뉴스 데스크 / 이벤트 드리븐 트레이더
[대상] ${stockName} (공식 기업명: ${stockName})
[자료] 최신 SEC 8-K 보고서 (Current Report)

[지시사항]
위 종목의 **최신 SEC 8-K 보고서**를 분석하여, 발생한 **특정 사건(Event)**의 내용과 주가에 미칠 영향을 즉각적으로 분석하세요.
**주의: '${stockName}'는 '${stockName}'입니다.** 가장 최근에 공시된 중요한 사건 하나에 집중하십시오.

**[출력 형식]**
- 마크다운(Markdown) 형식 사용. 핵심 위주로 간결하고 명확하게 작성.

**[필수 분석 항목]**
1. **공시 사유 (Triggering Event)**: 8-K가 제출된 핵심 이유 (Item 번호 및 제목 확인). 예: 실적 발표, 주요 계약 체결, 경영진 사퇴, M&A, 유상증자 등.
2. **세부 내용 (Details)**: 계약 금액, 거래 조건, 변경된 인물의 프로필 등 구체적 팩트 정리. 재무적으로 즉각적인 영향이 있는가?
3. **호재/악재 판별 (Impact Analysis)**: 이 뉴스가 주가에 단기적으로 긍정적인지(Bullish) 부정적인지(Bearish) 명확한 판단. 시장의 예상 범위를 벗어난 서프라이즈 요소가 있는지.

[결론] 이 뉴스에 대해 투자자가 취해야 할 즉각적인 대응 전략 (매수 기회 vs 리스크 관리).
**모든 답변은 반드시 한글로 작성해 주십시오.**
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
      
      {/* 모바일 햄버거 메뉴 (사이드바가 닫혀있을 때만 표시) */}
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
              <span className="text-[10px] text-rose-500 font-mono tracking-widest uppercase font-bold">V1.16 RAW SOURCE</span>
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
                placeholder="기업명 입력 (예: 삼성전자)" 
                className="w-full pl-10 pr-4 py-3.5 bg-[#070b14] border border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-rose-500 outline-none text-left transition-all" 
              />
            </div>
          </div>
        </div>

        <div className="p-6 bg-[#111827] border-t border-slate-800">
           <button onClick={() => { handleSearch(); }} className="w-full py-4 rounded-2xl font-black text-xs uppercase text-white shadow-2xl flex justify-center items-center space-x-2 bg-gradient-to-r from-rose-600 to-rose-800 hover:from-rose-500 hover:to-rose-700 active:scale-95 transition-all">
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
                  <span className="hidden md:inline-block text-xs font-black text-rose-500 ml-6 font-mono bg-rose-500/10 px-2 py-1 rounded border border-rose-500/20">V1.16</span>
                </div>
                <p className="text-slate-500 text-xs lg:text-sm mt-5 font-bold uppercase tracking-[0.2em] lg:tracking-[0.3em] flex items-center">
                  <Database className="w-4 h-4 mr-2 text-indigo-500 flex-shrink-0" /> NO SUMMARY - RAW INSTRUCTION PROTOCOL
                </p>
              </div>
            </div>

            {isGenerating || isSearching ? (
              <div className="flex flex-col items-center justify-center py-32 space-y-8 animate-in fade-in duration-500">
                <Loader2 className="w-16 h-16 text-rose-500 animate-spin relative z-10" />
                <div className="text-center space-y-2">
                  <p className="text-white font-black uppercase tracking-widest text-lg">Exporting Raw Text...</p>
                  <p className="text-slate-500 text-sm font-medium italic">데이터를 수집하고 프롬프트를 복원 중입니다.</p>
                </div>
              </div>
            ) : generatedPrompt ? (
              <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 space-y-10 text-left">
                <div className="bg-rose-500/5 border border-rose-500/20 rounded-3xl p-6 flex items-start space-x-6 shadow-inner">
                  <ShieldAlert className="text-rose-400 w-7 h-7 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="text-white font-black text-sm uppercase tracking-wider">
                      Ultra-Strict RAW Prompt Ready
                    </h4>
                    <p className="text-rose-100/60 text-xs lg:text-sm leading-relaxed mt-2">
                      <span className="text-white font-bold italic">요약이 원천 차단된 버전입니다.</span> 모든 수식과 지침 원문이 100% 포함되었습니다.
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
                  <h3 className="text-xl lg:text-3xl font-black text-slate-500 uppercase tracking-tighter italic">V1.16 RAW SOURCE ENGINE</h3>
                  <p className="text-slate-600 text-xs lg:text-sm max-w-md mx-auto leading-relaxed font-medium">
                    사용자님의 모든 지침 원문을 <span className="text-rose-500 font-bold">100% 무삭제 복원</span>하여<br/>
                    프롬프트로 출력하는 울트라 스트릭트 시스템입니다.<br/><br/>
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