# 작업물 외부 공유 가이드

## 🚀 빠른 배포 방법

### 1. Vercel (추천 - 가장 쉬움)

**장점**: 무료, 자동 배포, 빠른 속도

**방법**:
1. [vercel.com](https://vercel.com)에 가입 (GitHub 계정으로 가능)
2. "New Project" 클릭
3. GitHub 저장소 연결 (또는 코드 업로드)
4. 설정:
   - Framework Preset: `Vite`
   - Build Command: `npm run build`
   - Output Directory: `dist`
5. "Deploy" 클릭
6. 완료! 자동으로 URL이 생성됩니다.

**GitHub에 푸시 후 배포**:
```bash
# 1. GitHub에 저장소 생성 후
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin [YOUR_GITHUB_REPO_URL]
git push -u origin main

# 2. Vercel에서 GitHub 저장소 연결하면 자동 배포
```

---

### 2. Netlify

**방법**:
1. [netlify.com](https://netlify.com)에 가입
2. "Add new site" → "Import an existing project"
3. GitHub 저장소 선택
4. 설정:
   - Build command: `npm run build`
   - Publish directory: `dist`
5. "Deploy site" 클릭

---

### 3. GitHub Pages

**방법**:
1. `vite.config.ts`에 base 경로 추가 필요
2. GitHub 저장소 → Settings → Pages
3. Source: `gh-pages` 브랜치 선택
4. 빌드 스크립트 추가 필요

**설정 파일 수정 필요**:
```typescript
// vite.config.ts
export default defineConfig({
  base: '/your-repo-name/', // 저장소 이름
  // ... 기타 설정
})
```

---

### 4. 로컬 빌드 후 직접 호스팅

**빌드**:
```bash
npm run build
```

**결과물**: `dist` 폴더에 생성됨

**배포 옵션**:
- `dist` 폴더 전체를 웹 호스팅 서비스에 업로드
- 예: AWS S3, Google Cloud Storage, 일반 웹 호스팅 등

---

## 📦 배포 전 체크리스트

- [ ] 환경 변수 확인 (API 키 등)
- [ ] 빌드 오류 확인: `npm run build`
- [ ] 로컬 프리뷰 확인: `npm run preview`
- [ ] 이미지/리소스 경로 확인
- [ ] API 엔드포인트 확인 (CORS 설정 등)

---

## 🔧 문제 해결

### 빌드 오류 발생 시
```bash
# 의존성 재설치
rm -rf node_modules package-lock.json
npm install

# 빌드 재시도
npm run build
```

### 라우팅 문제 (404 에러)
- Vercel/Netlify: `vercel.json` 또는 `netlify.toml` 설정 필요
- SPA 라우팅을 위한 리다이렉트 설정

---

## 💡 추천 순서

1. **Vercel** - 가장 쉬우며 무료, 자동 배포
2. **Netlify** - Vercel과 유사, 좋은 대안
3. **GitHub Pages** - GitHub 사용 시 편리
4. **직접 호스팅** - 더 많은 제어가 필요한 경우

---

## 📝 참고사항

- 무료 플랜으로도 충분히 사용 가능
- 커스텀 도메인 연결 가능 (대부분 무료)
- 자동 HTTPS 제공
- Git 푸시 시 자동 재배포 (CI/CD)

