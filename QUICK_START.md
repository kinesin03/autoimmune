# 🚀 빠른 배포 가이드 (5분 안에!)

## 방법 1: Vercel (가장 쉬움) ⭐

### 단계별 가이드:

1. **GitHub에 코드 업로드**
   ```bash
   git init
   git add .
   git commit -m "Ready to deploy"
   git branch -M main
   # GitHub에서 새 저장소 생성 후
   git remote add origin https://github.com/your-username/your-repo.git
   git push -u origin main
   ```

2. **Vercel 배포**
   - [vercel.com](https://vercel.com) 접속
   - "Sign Up" → GitHub 계정으로 로그인
   - "Add New..." → "Project" 클릭
   - GitHub 저장소 선택
   - **설정 자동 감지됨** (Vite 프로젝트)
   - "Deploy" 클릭
   - **완료!** 🎉

3. **결과**
   - 자동으로 URL 생성 (예: `your-app.vercel.app`)
   - 이후 Git 푸시할 때마다 자동 재배포

---

## 방법 2: Netlify

1. [netlify.com](https://netlify.com) 접속
2. "Add new site" → "Import an existing project"
3. GitHub 저장소 선택
4. 빌드 설정:
   - Build command: `npm run build`
   - Publish directory: `dist`
5. "Deploy site" 클릭

---

## 방법 3: 로컬 빌드 테스트

배포 전에 로컬에서 빌드 테스트:

```bash
# 빌드
npm run build

# 프리뷰 (로컬에서 확인)
npm run preview
```

빌드된 파일은 `dist` 폴더에 생성됩니다.

---

## ⚠️ 주의사항

- **환경 변수**: API 키 등이 있다면 배포 플랫폼에서 설정 필요
- **CORS**: 외부 API 사용 시 CORS 설정 확인
- **라우팅**: SPA이므로 모든 경로를 `index.html`로 리다이렉트 (이미 설정됨)

---

## 🎯 추천

**처음 배포하시나요?** → **Vercel 사용하세요!**
- 가장 쉬움
- 무료
- 자동 배포
- 빠른 속도

