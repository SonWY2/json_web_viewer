# JSONL Viewer

대용량 JSONL 파일을 효율적으로 탐색하고 분석할 수 있는 웹 기반 뷰어입니다.

## ✨ 주요 기능

### 🚀 즉시 사용 가능한 기능 (Phase 1)
- **빠른 파일 로딩**: 스트리밍 방식으로 헤더 분석 및 스키마 자동 감지
- **실시간 데이터 표시**: 샘플 데이터로 즉시 UI 표시
- **유연한 컬럼 관리**: 크기 조절, 숨김/표시, 순서 변경
- **서버사이드 페이지네이션**: 효율적인 대용량 데이터 처리
- **기본 검색 및 필터링**: 빠른 데이터 탐색
- **마크다운 렌더링**: 긴 텍스트 및 코드 블록 지원

### 📊 On-Demand 분석 기능 (Phase 2)
- **컬럼별 통계 요청**: 필요한 컬럼만 선택적 분석
- **백그라운드 작업 관리**: 진행률 표시 및 작업 상태 추적
- **고급 필터링**: 타입별 필터 및 복합 조건
- **결과 캐싱**: 한 번 계산된 분석 결과 재사용
- **데이터 품질 검사**: 중복, 누락값 등 데이터 품질 분석

## 🚀 빠른 시작

### 자동 설정 (권장)
```bash
# 1. 프로젝트 클론
git clone https://github.com/your-repo/jsonl-viewer.git
cd jsonl-viewer

# 2. 자동 설정 실행
chmod +x scripts/setup.sh
./scripts/setup.sh

# 3. 개발 서버 시작
chmod +x scripts/start-dev.sh
./scripts/start-dev.sh
```

### Windows 사용자
```cmd
# 프로젝트 클론 후
scripts\setup.bat
scripts\start-dev.bat
```

### 수동 설정
필요한 경우 [개발 환경 설정](#-개발-환경-설정) 섹션 참조

## 📊 성능 특성

- **최대 파일 크기**: 10GB+
- **즉시 표시**: 30초 이내 (파일 크기 무관)
- **메모리 효율성**: 파일 크기와 무관한 일정한 메모리 사용

## 🛠️ 기술 스택

**프론트엔드**: React 18 + TypeScript + Vite + Tailwind CSS + Zustand  
**백엔드**: FastAPI + Pandas + ijson + SQLite + Whoosh

## 📖 사용 가이드

1. **파일 업로드**: 상단 헤더에서 JSONL 파일 업로드 또는 URL 입력
2. **데이터 탐색**: 컬럼 관리, 정렬, 필터링으로 데이터 탐색
3. **분석 요청**: 필요한 컬럼만 선택하여 On-Demand 분석

## 🔧 개발 환경 설정

### 필수 요구사항
- Node.js 18+
- Python 3.9+

### 백엔드 설정
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env  # 설정 편집 필요
uvicorn main:app --reload --port 8000
```

### 프론트엔드 설정
```bash
cd frontend
npm install
npm run dev
```

## 📝 로드맵

- ✅ **Phase 1**: 기본 파일 로딩 및 데이터 그리드 (완료)
- 🚧 **Phase 2**: On-demand 분석 시스템 (진행 중)
- 🎯 **Phase 3**: 고급 시각화 및 내보내기 (계획)

## 🤝 기여하기

1. Fork 후 Feature 브랜치 생성
2. 변경사항 구현 및 테스트
3. Pull Request 생성

## 📄 라이선스

MIT License

---

**대용량 JSONL 파일 처리를 더 쉽고 효율적으로 만들어보세요!**
