# JSONL Viewer

대용량 JSONL 파일을 손쉽게 탐색하고 분석할 수 있는 웹 기반 뷰어

## 🚀 주요 기능

### ✅ 구현완료
- **파일시스템 탐색**: 안전한 디렉토리 브라우징 및 파일 선택
- **크로스 플랫폼**: Windows, macOS, Linux 지원
- **API 인프라**: FastAPI 기반 RESTful API
- **반응형 UI**: React + TypeScript + Tailwind CSS
- **타입 안전**: 프론트엔드와 백엔드 모두 타입 검증

### 🔄 진행중
- **스트리밍 파일 로더**: 빠른 스키마 감지 및 메타데이터 생성
- **데이터 그리드**: 페이지네이션 및 가상 스크롤링
- **기본 검색**: 전역 및 컬럼별 검색

### 📋 예정
- **고급 필터링**: Excel 수준의 데이터 조작
- **마크다운 지원**: 긴 텍스트 및 코드 렌더링
- **컬럼 통계**: On-demand 분석 및 시각화
- **내보내기**: 다양한 형식 지원

## 🛠️ 기술 스택

### Backend
- **FastAPI**: Python 웹 프레임워크
- **Pydantic-Settings**: 설정 관리
- **SQLite**: 메타데이터 저장
- **Uvicorn**: ASGI 서버

### Frontend
- **React 18**: UI 라이브러리
- **TypeScript**: 타입 안전성
- **Vite**: 빌드 도구
- **Tailwind CSS**: 스타일링
- **Zustand**: 상태 관리
- **Lucide React**: 아이콘

## 📦 설치 및 실행

### 필수 요구사항
- Python 3.8+
- Node.js 16+

### 1. 저장소 클론
```bash
git clone <repository-url>
cd jsonl-viewer
```

### 2. 백엔드 설정
```bash
cd backend
pip install -r requirements.txt
python main.py
```

백엔드 서버가 http://localhost:8000 에서 실행됩니다.

### 3. 프론트엔드 설정
```bash
cd frontend
npm install
npm run dev
```

프론트엔드 앱이 http://localhost:5173 에서 실행됩니다.

## 🎯 사용법

### 파일 탐색
1. 좌측 사이드바에서 **File Explorer** 열기
2. 디렉토리 탐색하여 JSONL/JSON 파일 찾기
3. 파일 클릭하여 로드

### 지원 파일 형식
- `.jsonl` - JSON Lines 형식
- `.json` - JSON 파일 (배열 형태)

### 파일 크기 제한
- 최대 10GB 파일 지원
- 스트리밍 처리로 메모리 효율적

## 🏗️ 프로젝트 구조

```
jsonl-viewer/
├── backend/          # FastAPI 서버
│   ├── app/
│   │   ├── api/      # API 엔드포인트
│   │   ├── core/     # 설정 및 보안
│   │   ├── models/   # 데이터 모델
│   │   └── services/ # 비즈니스 로직
│   └── main.py
├── frontend/         # React 앱
│   ├── src/
│   │   ├── components/ # UI 컴포넌트
│   │   ├── hooks/      # React 훅
│   │   ├── stores/     # 상태 관리
│   │   ├── services/   # API 통신
│   │   └── types/      # TypeScript 타입
│   └── package.json
└── docs/            # 문서
```

## 🔒 보안

### 파일시스템 보안
- 시스템 디렉토리 접근 차단
- 읽기 권한 검증
- 안전한 경로 검증

### API 보안
- CORS 설정
- 파일 크기 제한
- 타입 검증

## 🚧 개발 상황

### Phase 1 (진행중)
- [x] 파일시스템 탐색
- [x] API 인프라
- [x] 프론트엔드 기반
- [ ] 스트리밍 파일 로더
- [ ] 기본 데이터 그리드

### Phase 2 (예정)
- [ ] 고급 필터링
- [ ] 검색 기능
- [ ] 마크다운 렌더링
- [ ] 컬럼 통계

### Phase 3 (계획)
- [ ] 시각화
- [ ] 내보내기
- [ ] 성능 최적화

## 📝 API 문서

백엔드 실행 후 다음 URL에서 API 문서 확인:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## 🤝 기여

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 있습니다. 자세한 내용은 `LICENSE` 파일을 참조하세요.

## 🐛 버그 리포트

문제를 발견하셨나요? [Issues](../../issues)에서 버그 리포트를 작성해 주세요.

## 📞 지원

질문이나 제안사항이 있으시면 이슈를 생성하거나 이메일로 연락주세요.
