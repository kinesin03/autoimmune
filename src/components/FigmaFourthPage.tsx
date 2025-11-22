import React, { useState, useEffect } from 'react';
import './FigmaFourthPage.css';

interface FigmaFourthPageProps {
  onComplete: () => void;
}

const FigmaFourthPage: React.FC<FigmaFourthPageProps> = ({ onComplete }) => {
  const [iframeLoaded, setIframeLoaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIframeLoaded(true);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  // Figma 프로토타입의 버튼 클릭을 감지하기 위한 메시지 리스너
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Figma iframe에서 오는 메시지 처리
      if (event.origin.includes('figma.com')) {
        // 프로토타입 네비게이션 감지 시 다음 페이지로
        if (event.data && event.data.type === 'figma-prototype-navigation') {
          onComplete();
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onComplete]);

  return (
    <div className="figma-fourth-page">
      <iframe 
        className="figma-fourth-iframe"
        src="https://embed.figma.com/proto/HO5HKEGZ5J5GWLyZhAEPHb/%EC%9D%B8%ED%8A%B8%EB%A1%9C?node-id=3-120&embed-host=share" 
        allowFullScreen
        title="Figma Fourth Page"
        onLoad={() => setIframeLoaded(true)}
      />
    </div>
  );
};

export default FigmaFourthPage;

