import React, { useState, useEffect } from 'react';
import { X, ShoppingBag, ShoppingCart } from 'lucide-react';
import { CharacterItem, CharacterCustomization } from '../types';
import { getGameData, addCoins, saveGameData } from '../utils/gameSystem';
import './CharacterShopModal.css';

interface CharacterShopModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPurchase: () => void;
}

const CharacterShopModal: React.FC<CharacterShopModalProps> = ({ isOpen, onClose, onPurchase }) => {
  const [activeTab, setActiveTab] = useState<'outfit' | 'accessory' | 'background'>('outfit');
  const [gameData, setGameData] = useState(getGameData());
  const [customization, setCustomization] = useState<CharacterCustomization>(() => {
    const saved = localStorage.getItem('characterCustomization');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to load customization:', e);
      }
    }
    return { ownedItems: [] };
  });

  // 상점 아이템 목록
  const shopItems: CharacterItem[] = [
    // 의상
    { id: 'outfit-1', name: '스트라이프 티셔츠', category: 'outfit', price: 150, image: '👕', color: '#93c5fd', description: '클래식한 스트라이프 패턴', design: 'stripe' },
    { id: 'outfit-2', name: '도트 원피스', category: 'outfit', price: 200, image: '👗', color: '#fda4af', description: '귀여운 도트 패턴 원피스', design: 'dot-dress' },
    { id: 'outfit-3', name: '체크 셔츠', category: 'outfit', price: 180, image: '👔', color: '#6ee7b7', description: '시크한 체크 패턴', design: 'check' },
    { id: 'outfit-4', name: '하트 프린트 티', category: 'outfit', price: 170, image: '💕', color: '#c4b5fd', description: '사랑스러운 하트 프린트', design: 'heart' },
    { id: 'outfit-5', name: '별 프린트 티', category: 'outfit', price: 160, image: '⭐', color: '#fcd34d', description: '반짝이는 별 프린트', design: 'star' },
    { id: 'outfit-6', name: '꽃무늬 원피스', category: 'outfit', price: 220, image: '🌸', color: '#f0abfc', description: '우아한 꽃무늬 원피스', design: 'flower-dress' },
    { id: 'outfit-7', name: '니트 스웨터', category: 'outfit', price: 250, image: '🧶', color: '#fef3c7', description: '따뜻한 니트 스웨터', design: 'sweater' },
    { id: 'outfit-8', name: '후드티', category: 'outfit', price: 230, image: '🧥', color: '#ddd6fe', description: '편안한 후드티', design: 'hoodie' },
    
    // 악세서리
    { id: 'acc-1', name: '베레모', category: 'accessory', price: 200, image: '🎩', description: '세련된 베레모' },
    { id: 'acc-2', name: '볼캡', category: 'accessory', price: 180, image: '🧢', description: '캐주얼 볼캡' },
    { id: 'acc-3', name: '선글라스', category: 'accessory', price: 250, image: '🕶️', description: '스타일리시한 선글라스' },
    { id: 'acc-4', name: '별 귀걸이', category: 'accessory', price: 220, image: '⭐', description: '반짝이는 별 귀걸이' },
    { id: 'acc-5', name: '하트 목걸이', category: 'accessory', price: 280, image: '💖', description: '사랑스러운 하트 목걸이' },
    { id: 'acc-6', name: '골드 시계', category: 'accessory', price: 350, image: '⌚', description: '우아한 골드 시계' },
    { id: 'acc-7', name: '리본 헤어핀', category: 'accessory', price: 200, image: '🎀', description: '귀여운 리본 헤어핀' },
    { id: 'acc-8', name: '펄 귀걸이', category: 'accessory', price: 300, image: '💫', description: '우아한 펄 귀걸이' },
    
    // 배경
    { id: 'bg-1', name: '하늘 배경', category: 'background', price: 200, image: '☁️', backgroundGradient: 'linear-gradient(135deg, #87CEEB 0%, #E0F6FF 100%)', description: '맑은 하늘' },
    { id: 'bg-2', name: '숲 배경', category: 'background', price: 200, image: '🌲', backgroundGradient: 'linear-gradient(135deg, #90EE90 0%, #228B22 100%)', description: '푸른 숲' },
    { id: 'bg-3', name: '바다 배경', category: 'background', price: 250, image: '🌊', backgroundGradient: 'linear-gradient(135deg, #1E90FF 0%, #00CED1 100%)', description: '파란 바다' },
    { id: 'bg-4', name: '일몰 배경', category: 'background', price: 300, image: '🌅', backgroundGradient: 'linear-gradient(135deg, #FF6347 0%, #FFD700 100%)', description: '아름다운 일몰' },
    { id: 'bg-5', name: '밤하늘 배경', category: 'background', price: 350, image: '🌙', backgroundGradient: 'linear-gradient(135deg, #191970 0%, #4B0082 100%)', description: '별이 빛나는 밤' },
    { id: 'bg-6', name: '벚꽃 배경', category: 'background', price: 400, image: '🌸', backgroundGradient: 'linear-gradient(135deg, #FFB6C1 0%, #FF69B4 100%)', description: '아름다운 벚꽃' },
  ];

  useEffect(() => {
    if (isOpen) {
      setGameData(getGameData());
      const saved = localStorage.getItem('characterCustomization');
      if (saved) {
        try {
          setCustomization(JSON.parse(saved));
        } catch (e) {
          console.error('Failed to load customization:', e);
        }
      }
    }
  }, [isOpen]);

  const filteredItems = shopItems.filter(item => item.category === activeTab);

  const isOwned = (itemId: string) => {
    return customization.ownedItems.includes(itemId);
  };

  const isEquipped = (itemId: string) => {
    if (activeTab === 'outfit') return customization.outfit === itemId;
    if (activeTab === 'accessory') return customization.accessory === itemId;
    if (activeTab === 'background') return customization.background === itemId;
    return false;
  };

  const handlePurchase = (item: CharacterItem) => {
    if (isOwned(item.id)) {
      // 이미 보유한 경우 장착/해제
      handleEquip(item);
      return;
    }

    if (gameData.coins < item.price) {
      alert(`코인이 부족합니다. 필요: ${item.price}코인, 보유: ${gameData.coins}코인`);
      return;
    }

    // 코인 차감
    const currentGameData = getGameData();
    currentGameData.coins -= item.price;
    saveGameData(currentGameData);
    setGameData(getGameData());

    // 아이템 구매 및 장착
    const newCustomization: CharacterCustomization = {
      ...customization,
      ownedItems: [...customization.ownedItems, item.id],
      [item.category]: item.id
    };

    setCustomization(newCustomization);
    localStorage.setItem('characterCustomization', JSON.stringify(newCustomization));
    
    onPurchase();
    alert(`${item.name}을(를) 구매하고 장착했습니다!`);
  };

  const handleEquip = (item: CharacterItem) => {
    if (!isOwned(item.id)) return;

    const newCustomization: CharacterCustomization = {
      ...customization,
      [item.category]: isEquipped(item.id) ? undefined : item.id
    };

    setCustomization(newCustomization);
    localStorage.setItem('characterCustomization', JSON.stringify(newCustomization));
    onPurchase();
  };

  if (!isOpen) return null;

  return (
    <div className="character-shop-modal-overlay" onClick={onClose}>
      <div className="character-shop-modal" onClick={(e) => e.stopPropagation()}>
        <div className="shop-modal-header">
          <div className="shop-header-content">
            <ShoppingBag size={24} className="shop-icon" />
            <h2 className="shop-title">캐릭터 상점</h2>
          </div>
          <button className="shop-close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="shop-coins-display">
          <span className="coins-label">보유 코인</span>
          <span className="coins-value">🪙 {gameData.coins}</span>
        </div>

        <div className="shop-tabs">
          <button
            className={`shop-tab ${activeTab === 'outfit' ? 'active' : ''}`}
            onClick={() => setActiveTab('outfit')}
          >
            의상
          </button>
          <button
            className={`shop-tab ${activeTab === 'accessory' ? 'active' : ''}`}
            onClick={() => setActiveTab('accessory')}
          >
            악세서리
          </button>
          <button
            className={`shop-tab ${activeTab === 'background' ? 'active' : ''}`}
            onClick={() => setActiveTab('background')}
          >
            배경
          </button>
        </div>

        <div className="shop-items-grid">
          {filteredItems.map(item => {
            const owned = isOwned(item.id);
            const equipped = isEquipped(item.id);
            
            return (
              <div key={item.id} className={`shop-item-card ${equipped ? 'equipped' : ''} ${owned ? 'owned' : ''}`}>
                <div 
                  className="shop-item-image"
                  style={{
                    background: item.backgroundGradient || (item.color ? `linear-gradient(135deg, ${item.color} 0%, ${item.color}dd 100%)` : '#f3f4f6')
                  }}
                >
                  <span className="item-emoji">{item.image}</span>
                </div>
                <div className="shop-item-info">
                  <h4 className="item-name">{item.name}</h4>
                  {item.description && (
                    <p className="item-description">{item.description}</p>
                  )}
                  <div className="item-footer">
                    {owned ? (
                      <button
                        className={`item-action-btn ${equipped ? 'equipped-btn' : 'equip-btn'}`}
                        onClick={() => handleEquip(item)}
                      >
                        {equipped ? '✓ 장착됨' : '장착하기'}
                      </button>
                    ) : (
                      <button
                        className={`item-action-btn purchase-btn ${gameData.coins < item.price ? 'disabled' : ''}`}
                        onClick={() => handlePurchase(item)}
                        disabled={gameData.coins < item.price}
                      >
                        🪙 {item.price}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CharacterShopModal;

