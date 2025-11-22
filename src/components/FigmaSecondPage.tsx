import React, { useEffect, useRef } from 'react';
import './FigmaSecondPage.css';

interface FigmaSecondPageProps {
  onNext: () => void;
  onSkip: () => void;
}

const FigmaSecondPage: React.FC<FigmaSecondPageProps> = ({ onNext, onSkip }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const lastUrlRef = useRef<string>('');

  useEffect(() => {
    // iframe URL 변경 감지
    const checkUrlChange = setInterval(() => {
      if (iframeRef.current) {
        try {
          const currentUrl = iframeRef.current.contentWindow?.location.href || '';
          if (currentUrl && currentUrl !== lastUrlRef.current && lastUrlRef.current !== '') {
            // URL이 변경되었으면 다음 페이지로
            onNext();
          }
          if (currentUrl) {
            lastUrlRef.current = currentUrl;
          }
        } catch (e) {
          // Cross-origin 제한으로 접근 불가능할 수 있음
        }
      }
    }, 500);

    return () => clearInterval(checkUrlChange);
  }, [onNext]);

  // Figma 프로토타입의 메시지 리스너
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin.includes('figma.com')) {
        // Figma 프로토타입 네비게이션 이벤트 감지
        console.log('Figma message:', event.data);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  return (
    <div className="figma-second-page">
      <iframe 
        ref={iframeRef}
        className="figma-second-iframe"
        src="https://embed.figma.com/proto/HO5HKEGZ5J5GWLyZhAEPHb/%EC%9D%B8%ED%8A%B8%EB%A1%9C?node-id=3-26&embed-host=share" 
        allowFullScreen
        title="Figma Second Page"
      />
    </div>
  );
};

export default FigmaSecondPage;

