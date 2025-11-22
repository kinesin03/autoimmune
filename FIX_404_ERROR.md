# 404 에러 해결 가이드

## 🔴 문제 원인

Vercel/Netlify에서 404 에러가 발생하는 이유는 **SPA(Single Page Application) 라우팅** 때문입니다.

React 앱은 실제로는 하나의 `index.html` 파일만 있지만, 브라우저가 다른 경로를 요청하면 서버가 해당 파일을 찾지 못해 404를 반환합니다.

## ✅ 해결 방법

### 방법 1: Vercel 설정 확인

1. **vercel.json 파일 확인**
   - 프로젝트 루트에 `vercel.json` 파일이 있는지 확인
   - 내용이 올바른지 확인 (이미 생성됨)

2. **Vercel 대시보드에서 재배포**
   - Vercel 대시보드 → 프로젝트 → Settings → General
   - "Redeploy" 클릭
   - 또는 Git에 푸시하면 자동 재배포

3. **빌드 로그 확인**
   - Vercel 대시보드 → Deployments → 최신 배포 클릭
   - 빌드가 성공했는지 확인
   - `dist` 폴더가 생성되었는지 확인

### 방법 2: 수동으로 설정 (Vercel 대시보드)

1. Vercel 프로젝트 → Settings → General
2. "Framework Preset" 확인: `Vite` 또는 `Other`
3. "Build Command": `npm run build`
4. "Output Directory": `dist`
5. "Install Command": `npm install`
6. Settings → Redirects에서:
   - Source: `/*`
   - Destination: `/index.html`
   - Status Code: `200`

### 방법 3: Netlify 사용 시

`netlify.toml` 파일이 이미 생성되어 있습니다.

1. Netlify 대시보드 → Site settings → Build & deploy
2. Build command: `npm run build`
3. Publish directory: `dist`
4. 재배포

## 🔍 확인 사항

### 1. 빌드가 성공했는지 확인

로컬에서 테스트:
```bash
npm run build
npm run preview
```

`dist` 폴더에 파일이 생성되고, `preview` 명령어로 정상 작동하는지 확인.

### 2. index.html 확인

`dist/index.html` 파일이 있는지 확인:
```bash
ls dist/index.html
```

### 3. Git에 파일 푸시 확인

다음 파일들이 Git에 포함되어 있는지 확인:
- `vercel.json`
- `package.json`
- `vite.config.ts`
- `index.html`

```bash
git status
git add .
git commit -m "Fix 404 error"
git push
```

## 🚀 빠른 해결 (추천)

1. **Git에 모든 파일 푸시**
   ```bash
   git add .
   git commit -m "Add deployment configs"
   git push
   ```

2. **Vercel에서 재배포**
   - Vercel 대시보드 → Deployments → 최신 배포 → "Redeploy"

3. **또는 새로 배포**
   - Vercel 대시보드 → 프로젝트 삭제 후 다시 생성
   - GitHub 저장소 연결
   - 자동 배포

## ⚠️ 여전히 안 되면

1. **Vercel 대시보드에서 직접 설정**
   - Settings → Redirects/Rewrites
   - 수동으로 추가

2. **빌드 로그 확인**
   - 에러 메시지 확인
   - 의존성 문제인지 확인

3. **로컬 빌드 테스트**
   ```bash
   npm run build
   # dist 폴더 확인
   ```

## 📝 체크리스트

- [ ] `vercel.json` 파일이 프로젝트 루트에 있음
- [ ] `package.json`에 build 스크립트 있음
- [ ] Git에 모든 파일 푸시됨
- [ ] Vercel에서 빌드 성공
- [ ] `dist` 폴더에 `index.html` 있음
- [ ] Redirects 설정 확인됨

