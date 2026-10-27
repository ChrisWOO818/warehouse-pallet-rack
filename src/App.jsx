import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Search, X, Save, Download, Upload, Trash2, 
  Layers, MapPin, Calendar, CheckCircle2, ChevronUp 
} from 'lucide-react';

// 창고 동별 스펙 정의
const WAREHOUSE_CONFIG = {
  'A': { name: 'A동', rows: 11, floors: 3 },
  'B': { name: 'B동', rows: 8,  floors: 4 },
  'C': { name: 'C동', rows: 8,  floors: 4 },
  'D': { name: 'D동', rows: 8,  floors: 4 },
  'E': { name: 'E동', rows: 8,  floors: 4 },
  'F': { name: 'F동', rows: 8,  floors: 3 },
  'G': { name: 'G동', rows: 5,  floors: 4 },
};

const STORAGE_KEY = 'warehouse_rack_data_v1';
export const DEFAULT_CLOUD_API_URL = 'https://script.google.com/macros/s/AKfycbwyAnehnaRzB2TWfxvli7g29wdPgs__s5Ws39wHOgAld3yeMxjtiqLc1NhStqUdCFez/exec';

export default function App() {
  const [rackData, setRackData] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [selectedDong, setSelectedDong] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedSlot, setHighlightedSlot] = useState(null);
  const [showSavedMsg, setShowSavedMsg] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importText, setImportText] = useState('');

  const saveTimerRef = useRef(null);

  // 오늘 날짜 YYMMDD 포맷
  const todayYYMMDD = useMemo(() => {
    const now = new Date();
    const yy = String(now.getFullYear()).slice(-2);
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    return `${yy}${mm}${dd}`;
  }, []);

  // 총 슬롯 수 및 사용 중인 슬롯 수 통계
  const stats = useMemo(() => {
    let total = 0;
    Object.keys(WAREHOUSE_CONFIG).forEach((dong) => {
      const cfg = WAREHOUSE_CONFIG[dong];
      total += cfg.rows * cfg.floors * 2;
    });

    const filled = Object.keys(rackData).filter(
      (k) => (rackData[k] || '').trim() !== ''
    ).length;
    const rate = total > 0 ? ((filled / total) * 100).toFixed(1) : '0';

    return { total, filled, rate };
  }, [rackData]);

  // 검색 결과
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];

    const results = [];
    Object.keys(rackData).forEach((key) => {
      const val = rackData[key] || '';
      if (val.toLowerCase().includes(q) || key.toLowerCase().includes(q)) {
        results.push({ key, val });
      }
    });
    return results;
  }, [searchQuery, rackData]);

  // 슬롯 데이터 변경 핸들러
  const handleSlotChange = (slotKey, value) => {
    setRackData((prev) => {
      const next = { ...prev };
      if (value.trim() === '') {
        delete next[slotKey];
      } else {
        next[slotKey] = value;
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });

    // 즉시 자동 저장 알림
    setShowSavedMsg(true);
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => setShowSavedMsg(false), 1500);
  };

  // 날짜 추가 단축키
  const handleAddToday = (slotKey) => {
    const current = rackData[slotKey] || '';
    if (!current) {
      handleSlotChange(slotKey, todayYYMMDD);
    } else if (!current.includes(todayYYMMDD)) {
      handleSlotChange(slotKey, `${current}, ${todayYYMMDD}`);
    }
  };

  // 슬롯 비우기
  const handleClearSlot = (slotKey) => {
    handleSlotChange(slotKey, '');
  };

  // 검색 결과 클릭 시 이동
  const handleSelectSearchResult = (slotKey) => {
    const dong = slotKey.split('-')[0];
    if (selectedDong !== 'ALL' && selectedDong !== dong) {
      setSelectedDong(dong);
    }

    setTimeout(() => {
      const el = document.getElementById(`slot-box-${slotKey}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setHighlightedSlot(slotKey);
        setTimeout(() => setHighlightedSlot(null), 3500);
      }
    }, 120);
  };

  // 백업 (JSON)
  const handleExportJSON = () => {
    const blob = new Blob([JSON.stringify(rackData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `창고파렛트렉_백업_${todayYYMMDD}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // CSV 내보내기
  const handleExportCSV = () => {
    let csv = '\uFEFF동,열,층,좌우,슬롯코드,품목기록정보\n';
    Object.keys(WAREHOUSE_CONFIG).forEach((dong) => {
      const cfg = WAREHOUSE_CONFIG[dong];
      for (let r = 1; r <= cfg.rows; r++) {
        const row = String(r).padStart(2, '0');
        for (let f = 1; f <= cfg.floors; f++) {
          ['L', 'R'].forEach((side) => {
            const sideKor = side === 'L' ? '좌' : '우';
            const key = `${dong}-${row}-${f}-${side}`;
            const val = (rackData[key] || '').replace(/"/g, '""');
            csv += `"${dong}동","${row}열","${f}층","${sideKor}","${key}","${val}"\n`;
          });
        }
      }
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `창고파렛트렉_현황_${todayYYMMDD}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // 복원 적용
  const handleApplyImport = () => {
    try {
      const parsed = JSON.parse(importText);
      if (confirm('기존 데이터를 덮어쓰고 복원하시겠습니까?')) {
        setRackData(parsed);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
        setImportModalOpen(false);
        alert('복원되었습니다.');
      }
    } catch {
      alert('올바른 JSON 형식이 아닙니다.');
    }
  };

  // 전체 초기화
  const handleReset = () => {
    if (confirm('모든 랙의 데이터를 초기화하시겠습니까? (되돌릴 수 없습니다)')) {
      setRackData({});
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  // 렌더링 대상 동 목록
  const displayedDongs = selectedDong === 'ALL' 
    ? Object.keys(WAREHOUSE_CONFIG) 
    : [selectedDong];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16 font-sans">
      {/* 10. 최상단 품목 기록 요령 안내 */}
      <header className="sticky top-0 z-50 bg-slate-900 text-slate-100 px-4 py-3 border-b-2 border-blue-500 shadow-md">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-2 text-blue-400 font-bold text-sm">
            <span>📋</span> 품목 기록 요령
          </div>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 leading-snug">
            사용 모델 명, 부품명, 입고일 순으로 기재 <br className="sm:hidden" />
            <strong className="text-yellow-300">
              ex) APST-2031, 모터, 261027
            </strong>
          </p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-3 sm:px-4 pt-4">
        {/* 상단 앱 제목 및 통계 */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <h1 className="text-xl font-extrabold flex items-center gap-2 text-slate-800">
            <span>📦</span> 창고 파렛트 렉 관리
          </h1>
          <div className="text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200 px-3 py-1.5 rounded-full">
            적재율: {stats.filled}/{stats.total}칸 ({stats.rate}%)
          </div>
        </div>

        {/* 유틸리티 액션 바 */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-3 text-xs">
          <button 
            onClick={handleExportCSV} 
            className="flex items-center gap-1 bg-white border border-slate-200 hover:bg-slate-100 px-2.5 py-1.5 rounded font-semibold text-slate-700 whitespace-nowrap shadow-sm"
          >
            <Download className="w-3.5 h-3.5" /> CSV 엑셀
          </button>
          <button 
            onClick={handleExportJSON} 
            className="flex items-center gap-1 bg-white border border-slate-200 hover:bg-slate-100 px-2.5 py-1.5 rounded font-semibold text-slate-700 whitespace-nowrap shadow-sm"
          >
            <Save className="w-3.5 h-3.5" /> 백업
          </button>
          <button 
            onClick={() => setImportModalOpen(true)} 
            className="flex items-center gap-1 bg-white border border-slate-200 hover:bg-slate-100 px-2.5 py-1.5 rounded font-semibold text-slate-700 whitespace-nowrap shadow-sm"
          >
            <Upload className="w-3.5 h-3.5" /> 복원
          </button>
          <button 
            onClick={handleReset} 
            className="flex items-center gap-1 bg-white border border-slate-200 hover:bg-red-50 text-red-600 px-2.5 py-1.5 rounded font-semibold whitespace-nowrap shadow-sm"
          >
            <Trash2 className="w-3.5 h-3.5" /> 비우기
          </button>

          {showSavedMsg && (
            <span className="ml-auto text-xs font-bold text-emerald-600 flex items-center gap-1 transition-opacity">
              <CheckCircle2 className="w-3.5 h-3.5" /> 즉시 저장됨
            </span>
          )}
        </div>

        {/* 9. 검색 기능 */}
        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm mb-4">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="🔍 제품명, 모델명, 부품명, 날짜 검색..."
              className="w-full pl-9 pr-9 py-2.5 bg-slate-50 focus:bg-white border-2 border-slate-200 focus:border-blue-500 rounded-lg text-sm outline-none transition"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 p-1 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-600"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {searchQuery && (
            <div className="mt-3 pt-3 border-t border-slate-100 max-h-56 overflow-y-auto">
              <div className="text-xs font-bold text-blue-600 mb-2">
                검색 결과: {searchResults.length}건 발견
              </div>
              {searchResults.length === 0 ? (
                <div className="text-xs text-slate-400 py-1">일치하는 품목이 없습니다.</div>
              ) : (
                <div className="space-y-1.5">
                  {searchResults.map((item) => {
                    const [dong, row, fl, side] = item.key.split('-');
                    return (
                      <div 
                        key={item.key}
                        onClick={() => handleSelectSearchResult(item.key)}
                        className="p-2 bg-slate-50 hover:bg-blue-50 border border-slate-200 rounded-lg text-xs cursor-pointer flex justify-between items-center transition"
                      >
                        <span className="font-bold text-blue-600 mr-2 whitespace-nowrap">
                          {dong}동 {row}열 {fl}층 {side === 'L' ? '좌' : '우'}
                        </span>
                        <span className="text-slate-700 truncate">{item.val}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* 5, 6, 7. 동 드롭다운 및 탭 필터 */}
        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm mb-4">
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center text-xs font-bold text-slate-600">
              <span>동 구역 선택</span>
              <span>{selectedDong === 'ALL' ? '전체 동 보기' : `${selectedDong}동 랙 목록`}</span>
            </div>

            {/* 5. 드롭다운 */}
            <select 
              value={selectedDong}
              onChange={(e) => setSelectedDong(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border-2 border-slate-200 rounded-lg text-sm font-bold text-slate-800 outline-none focus:border-blue-500"
            >
              <option value="ALL">전체 (A동 ~ G동 모두 보기)</option>
              <option value="A">A동 (11열 · 3층)</option>
              <option value="B">B동 (8열 · 4층)</option>
              <option value="C">C동 (8열 · 4층)</option>
              <option value="D">D동 (8열 · 4층)</option>
              <option value="E">E동 (8열 · 4층)</option>
              <option value="F">F동 (8열 · 3층)</option>
              <option value="G">G동 (5열 · 4층)</option>
            </select>

            {/* 빠른 탭 */}
            <div className="flex gap-1 overflow-x-auto pt-1">
              {['ALL', 'A', 'B', 'C', 'D', 'E', 'F', 'G'].map((d) => (
                <button
                  key={d}
                  onClick={() => setSelectedDong(d)}
                  className={`flex-1 min-w-[44px] py-1.5 px-2 rounded-md text-xs font-bold transition ${
                    selectedDong === d 
                      ? 'bg-blue-600 text-white shadow-sm' 
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {d === 'ALL' ? '전체' : `${d}동`}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 6, 7, 8. 랙 입력 리스트 */}
        <div className="space-y-6">
          {displayedDongs.map((dong) => {
            const cfg = WAREHOUSE_CONFIG[dong];
            return (
              <section key={dong} className="space-y-3">
                <div className="flex justify-between items-baseline border-l-4 border-blue-600 pl-2">
                  <h2 className="text-lg font-extrabold text-slate-800">{cfg.name}</h2>
                  <span className="text-xs font-semibold text-slate-500">
                    {cfg.rows}열 · {cfg.floors}층 (열당 {cfg.floors * 2}칸)
                  </span>
                </div>

                {/* 열 목록 (A-01, A-02 ...) */}
                {Array.from({ length: cfg.rows }, (_, rIdx) => {
                  const rowNum = String(rIdx + 1).padStart(2, '0');
                  const rowKey = `${dong}-${rowNum}`;

                  return (
                    <div 
                      key={rowKey}
                      className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden"
                    >
                      <div className="bg-slate-100/70 px-3 py-2 border-b border-slate-200 flex justify-between items-center text-xs font-bold text-slate-700">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-blue-600" />
                          {rowKey}열
                        </span>
                      </div>

                      {/* 층별 좌/우 슬롯 (상층 -> 1층 순서) */}
                      <div className="p-2 sm:p-3 space-y-2">
                        {Array.from({ length: cfg.floors }, (_, fIdx) => {
                          const floor = cfg.floors - fIdx; // 역순 배치 (3층, 2층, 1층)
                          return (
                            <div key={floor} className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-slate-50/60 p-2 rounded-lg border border-dashed border-slate-200">
                              {['L', 'R'].map((side) => {
                                const sideText = side === 'L' ? '좌' : '우';
                                const slotKey = `${rowKey}-${floor}-${side}`;
                                const val = rackData[slotKey] || '';
                                const isFilled = val.trim() !== '';
                                const isHighlighted = highlightedSlot === slotKey;

                                return (
                                  <div 
                                    id={`slot-box-${slotKey}`}
                                    key={slotKey}
                                    className={`p-2 rounded-lg border transition-all ${
                                      isHighlighted 
                                        ? 'bg-yellow-100 border-yellow-500 ring-4 ring-yellow-300'
                                        : isFilled
                                          ? 'bg-emerald-50/70 border-emerald-400'
                                          : 'bg-white border-slate-200'
                                    }`}
                                  >
                                    <div className="flex justify-between items-center mb-1 text-xs">
                                      <span className={`font-bold flex items-center gap-1 ${isFilled ? 'text-emerald-800' : 'text-slate-700'}`}>
                                        <span>{floor}층 {sideText}</span>
                                        <span className="text-[10px] text-slate-400 font-normal">({slotKey})</span>
                                      </span>
                                      <div className="flex gap-1">
                                        <button 
                                          type="button"
                                          onClick={() => handleAddToday(slotKey)}
                                          className="text-[10px] bg-slate-100 hover:bg-blue-50 hover:text-blue-600 px-1.5 py-0.5 rounded border border-slate-300 text-slate-600"
                                        >
                                          +오늘
                                        </button>
                                        <button 
                                          type="button"
                                          onClick={() => handleClearSlot(slotKey)}
                                          className="text-[10px] bg-slate-100 hover:bg-red-50 hover:text-red-600 px-1.5 py-0.5 rounded border border-slate-300 text-slate-600"
                                        >
                                          비움
                                        </button>
                                      </div>
                                    </div>

                                    {/* 텍스트 입력창 (즉시 자동 저장) */}
                                    <textarea 
                                      value={val}
                                      onChange={(e) => handleSlotChange(slotKey, e.target.value)}
                                      rows={2}
                                      placeholder={`예: APST-2031, 모터, ${todayYYMMDD}`}
                                      className="w-full text-xs p-1.5 bg-white border border-slate-200 rounded focus:border-blue-500 outline-none resize-y"
                                    />
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </section>
            );
          })}
        </div>
      </main>

      {/* 맨 위로 스크롤 버튼 */}
      <button 
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className="fixed bottom-4 right-4 bg-slate-800 text-white p-3 rounded-full shadow-lg hover:bg-slate-700 transition"
      >
        <ChevronUp className="w-5 h-5" />
      </button>

      {/* 복원 모달 */}
      {importModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-4 shadow-xl">
            <h3 className="font-bold text-sm mb-2 text-slate-800">📂 백업 데이터 복원</h3>
            <p className="text-xs text-slate-500 mb-2">백업 JSON 텍스트를 붙여넣으세요.</p>
            <textarea 
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              rows={6}
              className="w-full border border-slate-300 rounded p-2 text-xs font-mono mb-3"
              placeholder='{"A-01-1-L": "APST-2031, 모터, 261027"}'
            />
            <div className="flex justify-end gap-2 text-xs">
              <button 
                onClick={() => setImportModalOpen(false)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded font-semibold text-slate-600"
              >
                취소
              </button>
              <button 
                onClick={handleApplyImport}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded font-semibold"
              >
                복원하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
