# JSONL Viewer 🚀

대용량 JSONL 파일을 위한 강력한 웹 기반 뷰어 및 분석 도구

![JSONL Viewer](https://img.shields.io/badge/Status-Production%20Ready-brightgreen)
![License](https://img.shields.io/badge/License-MIT-blue)
![Backend](https://img.shields.io/badge/Backend-FastAPI-009688)
![Frontend](https://img.shields.io/badge/Frontend-React%20%2B%20TypeScript-61dafb)

## ✨ 주요 기능

### 🎯 대용량 파일 처리
- **최대 10GB JSONL 파일 지원**
- **스트리밍 처리**: 메모리 사용량 일정 유지
- **압축 파일 지원**: `.gz`, `.bz2` 형식
- **즉시 사용 가능**: 업로드 후 30초 내 데이터 표시

### 📊 Excel 수준의 데이터 조작
- **고급 필터링**: 텍스트, 숫자, 날짜별 다양한 필터 조건
- **다중 컬럼 정렬**: 오름차순/내림차순 정렬
- **전역 검색**: 모든 필드 대상 빠른 검색
- **정규식 검색**: 고급 패턴 매칭 지원

### 🔬 On-Demand 분석
- **컬럼별 상세 통계**: 평균, 중앙값, 분포, 분위수
- **실시간 진행률**: 백그라운드 분석 작업 상태 표시
- **차트 시각화**: 히스토그램, 분포 그래프
- **데이터 품질 분석**: 중복값, 누락값 체크

### 💾 다양한 내보내기
- **JSON/JSONL**: 원본 형식 유지
- **CSV**: 스프레드시트 호환
- **Excel**: 통계 시트 포함 옵션
- **필터링된 결과**: 선택된 데이터만 내보내기

### 🎨 사용자 친화적 UI
- **반응형 디자인**: Desktop, Tablet, Mobile 지원
- **셀 상세보기**: 긴 텍스트/JSON 객체 모달 표시
- **실시간 피드백**: 검색, 필터링 결과 즉시 표시
- **직관적 인터페이스**: Excel과 유사한 사용법

## 🚀 빠른 시작

### 필수 요구사항
- **Python 3.8+**
- **Node.js 16+**
- **npm 또는 yarn**

### 설치 및 실행

1. **저장소 클론**
```bash
git clone <repository-url>
cd jsonl-viewer
```

2. **백엔드 실행**
```bash
cd backend
pip install -r requirements.txt
python main.py
```

3. **프론트엔드 실행** (새 터미널)
```bash
cd frontend
npm install
npm run dev
```

4. **브라우저에서 접속**
```
http://localhost:3000
```

## 📁 프로젝트 구조

```
jsonl-viewer/
├── 📁 backend/                 # FastAPI 서버
│   ├── 📁 app/
│   │   ├── 📁 api/v1/          # API 엔드포인트
│   │   ├── 📁 services/        # 비즈니스 로직
│   │   ├── 📁 models/          # 데이터 모델
│   │   ├── 📁 processors/      # 데이터 처리
│   │   └── 📁 core/            # 핵심 설정
│   └── main.py                 # 서버 진입점
├── 📁 frontend/                # React 앱
│   ├── 📁 src/
│   │   ├── 📁 components/      # React 컴포넌트
│   │   ├── 📁 stores/          # 상태 관리 (Zustand)
│   │   ├── 📁 services/        # API 클라이언트
│   │   ├── 📁 hooks/           # Custom 훅
│   │   └── 📁 types/           # TypeScript 타입
│   └── package.json
└── README.md
```

## 🎯 사용 방법

### 1. 파일 업로드
- 드래그 앤 드롭으로 JSONL 파일 업로드
- 압축 파일 (`.gz`, `.bz2`) 지원
- 자동 스키마 감지 및 타입 추론

### 2. 데이터 탐색
- **페이지네이션**: 큰 데이터셋을 효율적으로 탐색
- **정렬**: 컬럼 헤더 클릭으로 정렬
- **필터링**: 컬럼별 다양한 필터 조건 적용

### 3. 검색
- **전역 검색**: 헤더의 검색창 사용
- **컬럼별 검색**: 필터 드롭다운에서 검색
- **정규식**: 고급 패턴 매칭 지원

### 4. 분석
- **컬럼 분석**: 컬럼 헤더의 📊 버튼 클릭
- **실시간 진행률**: 분석 작업 상태 확인
- **결과 시각화**: 차트와 통계 확인

### 5. 내보내기
- **Export 버튼**: 헤더에서 내보내기 모달 열기
- **형식 선택**: JSON, JSONL, CSV, Excel 중 선택
- **옵션 설정**: 통계 포함 여부 선택

## 🔧 API 문서

서버 실행 후 API 문서 확인:
- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`

### 주요 엔드포인트

```
POST /api/v1/files/upload     # 파일 업로드
GET  /api/v1/files/{id}       # 파일 정보 조회
POST /api/v1/data             # 데이터 조회 (페이지네이션)
POST /api/v1/search           # 검색
POST /api/v1/analysis/column  # 컬럼 분석
POST /api/v1/export           # 데이터 내보내기
```

## ⚙️ 설정

### 백엔드 설정 (`backend/app/core/config.py`)
```python
max_file_size = 10 * 1024 * 1024 * 1024  # 10GB
max_sample_size = 10000                   # 스키마 감지용 샘플 크기
chunk_size = 1000                         # 청크 처리 크기
max_workers = 4                           # 백그라운드 작업 수
```

### 환경변수 (`.env`)
```bash
MAX_FILE_SIZE=10737418240
DEBUG=true
UPLOAD_DIR=uploads
CACHE_DIR=cache
```

## 🎨 기술 스택

### Backend
- **FastAPI**: 고성능 웹 프레임워크
- **Pandas**: 데이터 처리 및 분석
- **ijson**: 스트리밍 JSON 파싱
- **Pydantic**: 데이터 검증 및 시리얼라이제이션
- **ThreadPoolExecutor**: 백그라운드 작업 처리

### Frontend
- **React 18**: 모던 React 훅 기반
- **TypeScript**: 타입 안전성
- **TailwindCSS**: 유틸리티 우선 CSS
- **Zustand**: 경량 상태 관리
- **Recharts**: 차트 라이브러리
- **Vite**: 빠른 개발 서버

## 📈 성능 최적화

### 메모리 효율성
- **스트리밍 처리**: 파일 크기와 무관한 일정한 메모리 사용
- **청크 단위 로딩**: 필요한 데이터만 메모리에 로드
- **가비지 컬렉션**: 사용하지 않는 데이터 자동 정리

### 응답성
- **가상화**: 대용량 테이블의 효율적 렌더링
- **디바운싱**: 검색 및 필터링 최적화
- **백그라운드 작업**: UI 블로킹 없는 무거운 작업 처리

### 캐싱
- **분석 결과**: 한 번 계산된 통계 재사용
- **검색 인덱스**: 빠른 검색을 위한 인덱스 캐시
- **메타데이터**: 파일 정보 및 스키마 캐싱

## 🧪 테스트

### 백엔드 테스트
```bash
cd backend
python test_backend.py
```

### 프론트엔드 테스트
```bash
cd frontend
npm run test
```

## 🐛 트러블슈팅

### 일반적인 문제

**1. 파일 업로드 실패**
- 파일 크기가 10GB를 초과하는지 확인
- JSONL 형식이 올바른지 확인 (각 줄이 유효한 JSON)

**2. 메모리 부족**
- 백엔드 설정에서 `chunk_size` 값 감소
- 샘플 크기 (`max_sample_size`) 감소

**3. 분석 작업 실패**
- 데이터 타입 호환성 확인
- 백그라운드 작업 로그 확인

## 🤝 기여하기

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 `LICENSE` 파일을 참조하세요.

## 🙏 감사의 말

- **FastAPI**: 훌륭한 Python 웹 프레임워크
- **React**: 강력한 UI 라이브러리
- **TailwindCSS**: 효율적인 스타일링
- **ijson**: 스트리밍 JSON 파싱

## 📞 지원

문제가 있거나 기능 요청이 있으시면 [Issues](../../issues)에 등록해 주세요.

---

**JSONL Viewer**로 대용량 데이터 분석을 더 쉽고 빠르게! 🚀
