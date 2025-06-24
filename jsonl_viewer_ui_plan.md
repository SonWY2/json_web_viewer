# JSONL Viewer Web UI 계획서 (현재 구현 상황 반영)

## 1. 전체 레이아웃 구조

### Desktop Layout (> 1024px) - 현재 구현 상황
```
┌──────────────────────────────────────────────────────────────────┐
│ 🏠 Header Bar (60px)                                             │
│ ┌─ Logo ─┬─ File Actions ─┬─ Global Search ─┬─ View Options ─┐   │
│ │ JSONL  │ 📁 Explorer    │ 🔍 Search all   │ 📊📋📑 Views   │   │
│ │ Viewer │ 🔗 URL Load    │                 │                │   │
│ └────────┴────────────────┴─────────────────┴─────────────────┘   │
├──────────────────────────────────────────────────────────────────┤
│ Main Content Area (calc(100vh - 60px))                          │
│ ┌─────────────────┬────────────────────────────────────────────┐ │
│ │ 📁 File         │ 📋 Data Grid Area                          │ │
│ │ Explorer        │                                            │ │
│ │ Sidebar         │ ┌─ Toolbar (40px) ─────────────────────┐   │ │
│ │ (300px) ✅      │ │ 🔢 Page: 1/20 │ 📊 500/1000 records │   │ │
│ │                 │ │ 📄 50 per page │ 🔍 Quick filters   │   │ │
│ │ ├─ Directory    │ └─────────────────────────────────────┘   │ │
│ │ │  Navigation   │                                            │ │
│ │ │  🏠 Home      │ ┌─ Column Headers with Controls ────────┐ │ │
│ │ │  ⬆️ Up        │ │ Name ↕🔽📊 │ Type ↕🔽 │ Content ↕🔽📊 │ │ │
│ │ │               │ ├─────────────┼──────────┼──────────────┤ │ │
│ │ ├─ File List    │ │ getValue    │ function │ async func...│ │ │
│ │ │  📁 folder1   │ │ setConfig   │ object   │ {name: "...} │ │ │
│ │ │  📁 folder2   │ │ processData │ class    │ class Data...│ │ │
│ │ │  📄 data.jsonl│ └─────────────┴──────────┴──────────────┘ │ │
│ │ │  📄 test.json │                                            │ │
│ │ │               │ ┌─ Pagination (40px) ─────────────────┐   │ │
│ │ ├─ File Info    │ │ ← Prev │ 1 2 3 ... 20 │ Next → │ 📄  │   │ │
│ │ │  📊 Size      │ └─────────────────────────────────────┘   │ │
│ │ │  🔢 Records   │                                            │ │
│ │ │  📋 Columns   │                                            │ │
│ │ └─ Quick Load   │                                            │ │
│ │    🔍 JSONL only│                                            │ │
│ └─────────────────┴────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
```

### Mobile Layout (< 768px) - 반응형 디자인
```
┌─────────────────────────────┐
│ 🏠 Header (Minimal)         │
│ ☰ │ JSONL Viewer │ ⚙️      │
├─────────────────────────────┤
│ 📱 Mobile File Explorer     │
│                             │
│ ┌─ Current Path ──────────┐ │
│ │ 📁 /home/user/data      │ │
│ │ ⬆️ Up │ 🏠 Home          │ │
│ └─────────────────────────┘ │
│                             │
│ ┌─ File List ─────────────┐ │
│ │ 📁 documents            │ │
│ │ 📁 projects             │ │
│ │ 📄 data.jsonl ⭐        │ │
│ │ 📄 test.json ⭐         │ │
│ └─────────────────────────┘ │
│                             │
│ [Load Selected File] 🔄     │
└─────────────────────────────┘
```

## 2. 컴포넌트별 상세 기능

### A. Header Component ✅ 구현중
```typescript
interface HeaderProps {
  onFileExplorerToggle: () => void;
  onSearch: (query: string) => void;
  onViewChange: (view: ViewType) => void;
  currentFile?: FileMetadata;
}

// Features:
// - Logo & Branding ✅
// - File Explorer Toggle ✅
// - Global Search Bar 🔄
// - View Mode Toggle (Table/Card/JSON) 📋
// - Current File Info Display ✅
```

### B. FileExplorer Sidebar ✅ 구현완료
```typescript
interface FileExplorerProps {
  onFileSelect: (filePath: string) => void;
  onDirectoryChange: (path: string) => void;
  currentPath: string;
}

// 📁 Directory Navigation ✅
// ├─ Home Button (Default Path) ✅
// ├─ Up Button (Parent Directory) ✅
// ├─ Current Path Display ✅
// └─ Breadcrumb Navigation 📋

// 📄 File Listing ✅
// ├─ Directory Filtering (Show folders + JSONL/JSON) ✅
// ├─ File Size Display ✅
// ├─ File Type Icons ✅
// ├─ Safe Path Validation ✅
// └─ Error Handling with Retry ✅

// 🔍 Quick Features ✅
// ├─ JSONL/JSON File Highlighting ✅
// ├─ Cross-platform Path Support ✅
// ├─ Permission-based Access ✅
// └─ Loading States ✅
```

### C. Data Grid Component 🔄 진행중
```typescript
interface DataGridProps {
  data: JSONLData[];
  columns: ColumnConfig[];
  filters: FilterConfig[];
  sorting: SortConfig[];
  pagination: PaginationConfig;
  onSort: (column: string) => void;
  onFilter: (column: string, filter: FilterRule) => void;
  onCellClick: (row: number, column: string) => void;
}

// Grid Features 📋 예정:
// ├─ Virtual Scrolling (Performance)
// ├─ Resizable Columns
// ├─ Sortable Headers
// ├─ Filterable Columns
// ├─ Cell Content Preview
// ├─ Row Selection
// ├─ Context Menu
// └─ Keyboard Navigation
```

### D. API Integration ✅ 구현완료
```typescript
// Current API Endpoints ✅:
// ├─ GET /api/v1/filesystem/ - Directory listing
// ├─ GET /api/v1/filesystem/default-path - Default directory
// ├─ POST /api/v1/files/upload - File upload
// ├─ POST /api/v1/files/load-path - Load from path
// ├─ POST /api/v1/data/ - Data retrieval with pagination
// ├─ POST /api/v1/search/ - Search functionality
// ├─ POST /api/v1/analysis/column - Column analysis
// ├─ GET /api/v1/tasks/{task_id} - Task status
// └─ POST /api/v1/export/ - Data export

// API Features ✅:
// ├─ Type-safe Pydantic models
// ├─ Automatic OpenAPI documentation
// ├─ CORS support for frontend
// ├─ Error handling with detailed messages
// └─ File system security validation
```

## 3. 사용자 인터랙션 플로우

### A. 파일 로딩 플로우 ✅ 구현완료
```
1. File System Navigation ✅:
   ├─ Open File Explorer → Browse Directories → Select File
   ├─ Path Validation → Permission Check → File Access
   └─ JSONL/JSON Detection → File Size Display → Load Action

2. File Loading Process ✅:
   ├─ File Path Submission → Backend Validation
   ├─ File Size Check → Format Validation
   ├─ Schema Detection (Quick sample) 🔄
   └─ Success Response → UI Update

3. Error Handling ✅:
   ├─ Access Denied → Show Permission Error + Retry
   ├─ File Not Found → Directory Refresh + User Notice
   ├─ Invalid Format → Format Guidelines
   └─ Network Issues → Retry with Exponential Backoff
```

### B. 디렉토리 탐색 플로우 ✅ 구현완료
```
1. Navigation Actions ✅:
   ├─ Home Button → Default Directory
   ├─ Up Button → Parent Directory (if safe)
   ├─ Folder Click → Enter Subdirectory
   └─ Path Display → Current Location

2. Safety Features ✅:
   ├─ Path Validation → Block system directories
   ├─ Permission Check → Readable directories only
   ├─ Cross-platform → Windows/Linux/macOS paths
   └─ Error Recovery → Fallback to safe directory

3. User Experience ✅:
   ├─ Loading States → Spinner during navigation
   ├─ File Filtering → Show only JSONL/JSON + folders
   ├─ Size Display → Human-readable file sizes
   └─ Visual Cues → Icons for file types and folders
```

### C. 데이터 탐색 플로우 🔄 진행중
```
1. Data Loading 🔄:
   ├─ File Selection → Schema Detection → Column Analysis
   ├─ Sample Data → First 1K-10K records for quick preview
   ├─ Pagination Setup → Server-side chunked loading
   └─ Background Indexing → Search optimization

2. Data Interaction 📋 예정:
   ├─ Column Sorting → Multiple sort levels
   ├─ Filtering → Type-specific filter options
   ├─ Search → Global and column-specific
   └─ Cell Details → Modal view for long content

3. Performance 📋 예정:
   ├─ Virtual Scrolling → Handle large datasets
   ├─ Lazy Loading → Load data on demand
   ├─ Caching → Cache frequently accessed data
   └─ Background Tasks → Progress tracking for analysis
```

## 4. 현재 구현 상황

### ✅ 완료된 기능
1. **파일시스템 탐색**
   - 안전한 디렉토리 브라우징
   - 크로스 플랫폼 경로 지원
   - JSONL/JSON 파일 필터링
   - 파일 크기 및 타입 표시
   - 권한 기반 접근 제어

2. **API 인프라**
   - FastAPI 백엔드 구조
   - RESTful API 설계
   - 자동 문서화 (Swagger)
   - CORS 설정
   - 타입 안전 모델

3. **프론트엔드 기반**
   - React + TypeScript 환경
   - Tailwind CSS 스타일링
   - Zustand 상태 관리
   - 컴포넌트 아키텍처
   - 서비스 레이어 구조

### 🔄 진행중인 기능
1. **파일 로딩 시스템**
   - 스트리밍 파일 분석
   - 스키마 자동 감지
   - 메타데이터 생성

2. **데이터 표시**
   - 기본 데이터 그리드
   - 페이지네이션
   - 컬럼 헤더 시스템

### 📋 예정 기능
1. **고급 데이터 조작**
   - 정렬 및 필터링
   - 검색 기능
   - 마크다운 렌더링

2. **분석 기능**
   - 컬럼별 통계
   - 데이터 품질 검사
   - 시각화

3. **내보내기**
   - 다양한 형식 지원
   - 필터링된 데이터 내보내기

## 5. 반응형 디자인 전략

### Desktop First → Mobile Adaptive
```css
/* Current Implementation ✅ */
.file-explorer {
  /* Desktop: Full sidebar */
  @apply w-80 h-full border-r bg-white;
  
  /* Tablet: Collapsible */
  @media (max-width: 1024px) {
    @apply fixed left-0 top-16 z-20 transform transition-transform;
    @apply -translate-x-full; /* Hidden by default */
    
    &.open {
      @apply translate-x-0; /* Slide in when opened */
    }
  }
  
  /* Mobile: Full screen overlay */
  @media (max-width: 768px) {
    @apply w-full h-full;
  }
}

.main-content {
  /* Desktop: With sidebar */
  @apply ml-80 p-6;
  
  /* Tablet/Mobile: Full width */
  @media (max-width: 1024px) {
    @apply ml-0 p-4;
  }
}
```

## 6. 성능 최적화 계획

### 현재 최적화 ✅
- **안전한 파일 접근**: 시스템 디렉토리 차단
- **효율적인 API**: RESTful 설계 + 타입 검증
- **반응형 UI**: Tailwind 기반 적응형 레이아웃

### 예정 최적화 📋
- **가상 스크롤링**: 대용량 데이터 렌더링
- **지연 로딩**: 필요한 데이터만 로딩
- **백그라운드 작업**: 분석 작업 비동기 처리
- **캐싱 전략**: 계산 결과 및 메타데이터 캐시

이 UI 계획서는 현재 구현 상황과 향후 개발 계획을 반영하여 지속적으로 업데이트됩니다.
