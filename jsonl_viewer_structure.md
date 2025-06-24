# JSONL Viewer 프로젝트 구조 (현재 구현 상황)

## 전체 프로젝트 구조

```
jsonl-viewer/
├── 📁 frontend/                    # React TypeScript 앱 ✅ 구현완료
│   ├── 📁 public/
│   │   ├── index.html
│   │   └── favicon.ico
│   ├── 📁 src/
│   │   ├── 📁 components/          # React 컴포넌트
│   │   │   ├── 📁 Layout/
│   │   │   │   ├── Header.tsx      ✅
│   │   │   │   ├── Sidebar.tsx
│   │   │   │   └── Layout.tsx
│   │   │   ├── 📁 FileExplorer/    # 파일 탐색기 ⭐ 구현완료
│   │   │   │   └── FileExplorer.tsx ✅
│   │   │   ├── 📁 FileLoader/
│   │   │   │   ├── FileUpload.tsx
│   │   │   │   ├── UrlLoader.tsx
│   │   │   │   ├── LoadingProgress.tsx
│   │   │   │   └── index.ts
│   │   │   ├── 📁 DataGrid/
│   │   │   │   ├── DataGrid.tsx
│   │   │   │   ├── ColumnHeader.tsx
│   │   │   │   ├── DataCell.tsx
│   │   │   │   ├── ColumnSelector.tsx   # 컬럼 선택/순서 변경 ⭐ 신규 구현
│   │   │   │   ├── VirtualTable.tsx
│   │   │   │   ├── SchemaInfo.tsx
│   │   │   │   └── index.ts
│   │   │   ├── 📁 Analysis/        # On-demand 분석
│   │   │   │   ├── AnalysisPanel.tsx
│   │   │   │   ├── ColumnAnalysis.tsx
│   │   │   │   ├── AnalysisProgress.tsx
│   │   │   │   ├── AnalysisResults.tsx
│   │   │   │   ├── TaskManager.tsx
│   │   │   │   └── index.ts
│   │   │   ├── 📁 Filters/
│   │   │   ├── 📁 Search/
│   │   │   └── 📁 Export/
│   │   ├── 📁 hooks/               # Custom React Hooks
│   │   │   ├── useDataGrid.ts
│   │   │   ├── useFilters.ts
│   │   │   ├── useSearch.ts
│   │   │   ├── useFileLoader.ts    ⭐ 신규
│   │   │   ├── useAnalysis.ts      ⭐ 신규
│   │   │   └── useTaskStatus.ts    ⭐ 신규
│   │   ├── 📁 stores/              # 상태 관리 (Zustand) ✅
│   │   │   ├── dataStore.ts
│   │   │   ├── filterStore.ts
│   │   │   ├── fileStore.ts        ✅ 구현완료
│   │   │   ├── analysisStore.ts
│   │   │   └── index.ts
│   │   ├── 📁 services/            # API 통신 ✅ 구현완료
│   │   │   ├── api.ts              ✅
│   │   │   ├── fileService.ts
│   │   │   ├── dataService.ts
│   │   │   └── exportService.ts
│   │   ├── 📁 types/               # TypeScript 타입 정의 ✅
│   │   │   ├── data.ts
│   │   │   ├── filter.ts
│   │   │   ├── search.ts
│   │   │   └── index.ts            ✅
│   │   ├── 📁 utils/
│   │   │   ├── dataProcessing.ts
│   │   │   ├── formatters.ts
│   │   │   └── constants.ts
│   │   ├── 📁 styles/              # 스타일 파일
│   │   │   ├── globals.css
│   │   │   └── tailwind.css
│   │   ├── App.tsx                 ✅
│   │   ├── main.tsx                ✅
│   │   └── vite-env.d.ts
│   ├── package.json                ✅
│   ├── vite.config.ts              ✅
│   ├── tailwind.config.js          ✅
│   ├── tsconfig.json               ✅
│   └── .eslintrc.js
│
├── 📁 backend/                     # Python FastAPI 서버 ✅ 구현완료
│   ├── 📁 app/
│   │   ├── 📁 api/                 # API 엔드포인트 ✅
│   │   │   ├── 📁 v1/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── files.py        ✅
│   │   │   │   ├── data.py         ✅
│   │   │   │   ├── search.py       ✅
│   │   │   │   ├── analysis.py     ✅
│   │   │   │   ├── tasks.py        ✅
│   │   │   │   ├── export.py       ✅
│   │   │   │   └── filesystem.py   ⭐ 신규 구현 ✅
│   │   │   ├── __init__.py
│   │   │   └── api.py              ✅
│   │   ├── 📁 core/                # 핵심 설정 ✅
│   │   │   ├── __init__.py
│   │   │   ├── config.py           ✅ (pydantic-settings 사용)
│   │   │   ├── security.py
│   │   │   └── middleware.py
│   │   ├── 📁 models/              # 데이터 모델 ✅
│   │   │   ├── __init__.py
│   │   │   ├── file_info.py
│   │   │   ├── schema.py
│   │   │   ├── data.py
│   │   │   ├── filter.py
│   │   │   ├── search.py
│   │   │   ├── analysis.py
│   │   │   └── task.py
│   │   ├── 📁 services/            # 비즈니스 로직
│   │   │   ├── __init__.py
│   │   │   ├── file_loader.py
│   │   │   ├── schema_detector.py
│   │   │   ├── data_service.py
│   │   │   └── search_service.py
│   │   ├── 📁 processors/          # 스트리밍 처리기
│   │   │   ├── __init__.py
│   │   │   ├── jsonl_streamer.py
│   │   │   └── chunk_processor.py
│   │   └── main.py                 ✅
│   ├── main.py                     ✅
│   ├── requirements.txt            ✅
│   ├── pyproject.toml             ✅
│   └── .env.example
│
├── 📁 docs/
├── 📁 scripts/
├── README.md                       
├── .gitignore                     ✅
└── LICENSE

```

## 주요 기술 스택 (실제 구현)

### Frontend ✅ 구현완료
- **React 18 + TypeScript**: 메인 프레임워크 ✅
- **Vite**: 빌드 도구 ✅
- **Tailwind CSS**: 스타일링 ✅
- **Zustand**: 상태 관리 (스토어 구조 완료) ✅
- **Lucide React**: 아이콘 라이브러리 ✅
- **API Service**: HTTP 통신 레이어 ✅
- **FileExplorer**: 파일 탐색 컴포넌트 ✅

### Backend ✅ 구현완료
- **FastAPI**: 웹 프레임워크 ✅
- **Pydantic-Settings**: 설정 관리 (BaseSettings 대신) ✅
- **SQLite**: 경량 메타데이터 저장 ✅
- **Uvicorn**: ASGI 서버 ✅
- **Pydantic**: 데이터 검증 ✅
- **Pathlib**: 파일 시스템 처리 ✅
- **CORS**: 프론트엔드 연동 ✅

### 개발 도구 ✅
- **Python**: 백엔드 주 언어
- **TypeScript**: 프론트엔드 주 언어
- **Git**: 버전 관리 ✅

## 현재 구현 상황

### Phase 1 (현재 구현 상황) ✅ 거의 완료
1. **파일시스템 탐색** - 디렉토리 브라우징 및 파일 선택 ✅ 완료
2. **API 인프라** - FastAPI 기반 백엔드 구조 ✅ 완료
3. **프론트엔드 기반** - React + TypeScript 환경 ✅ 완료
4. **컬럼 선택 기능** - 필드 가시성 및 순서 제어 ⭐ 신규 완료
5. **스트리밍 파일 로더** - 빠른 헤더 분석 및 스키마 감지 🔄 진행중
6. **기본 데이터 그리드** - 샘플 데이터로 즉시 표시 🔄 진행중

### Phase 2 (예정)
1. **컬럼별 통계 요청** - 사용자가 원하는 컬럼만 분석
2. **고급 필터링** - 타입별 필터 및 복합 조건
3. **정렬 기능** - 컬럼별 정렬
4. **진행률 표시** - 분석 작업 진행 상황
5. **결과 캐싱** - 계산된 분석 결과 저장

### Phase 3 (계획)
1. **전체 파일 분석** - 완전한 통계 및 인덱스
2. **고급 시각화** - 차트 및 분포 그래프
3. **복합 분석** - 컬럼 간 상관관계 등
4. **내보내기** - 분석 결과 포함 내보내기
5. **성능 최적화** - 인덱싱 및 캐싱 개선

## 핵심 구현 특징

### 1. 파일시스템 탐색 ✅
- 안전한 디렉토리 브라우징
- JSONL/JSON 파일 필터링
- 크로스 플랫폼 경로 처리
- 권한 기반 접근 제어

### 2. API 구조 ✅
- RESTful API 설계
- 자동 문서화 (OpenAPI/Swagger)
- CORS 지원
- 타입 안전 모델

### 3. 프론트엔드 아키텍처 ✅
- 컴포넌트 기반 구조
- 타입 안전 상태 관리
- 모듈화된 서비스 레이어
- 반응형 디자인 기반

이 구조로 확장 가능하고 유지보수가 쉬운 시스템을 구축할 수 있습니다.
