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
  const [activeTab, setActiveTab] = useState<'accessory' | 'prop'>('accessory');
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
    // 악세서리
    { id: 'acc-1', name: '베레모', category: 'accessory', price: 200, image: '🎩', description: '세련된 베레모' },
    { id: 'acc-2', name: '볼캡', category: 'accessory', price: 180, image: '🧢', description: '캐주얼 볼캡' },
    { id: 'acc-3', name: '선글라스', category: 'accessory', price: 250, image: '🕶️', description: '스타일리시한 선글라스' },
    { id: 'acc-4', name: '별 헤어핀', category: 'accessory', price: 220, image: '⭐', description: '반짝이는 별 헤어핀' },
    { id: 'acc-5', name: '하트 헤어핀', category: 'accessory', price: 280, image: '💖', description: '사랑스러운 하트 헤어핀' },
    { id: 'acc-7', name: '리본 헤어핀', category: 'accessory', price: 200, image: '🎀', description: '귀여운 리본 헤어핀' },
    
    // 소품
    { id: 'prop-1', name: '물고기', category: 'prop', price: 150, image: '🐟', description: '귀여운 물고기' },
    { id: 'prop-2', name: '선인장', category: 'prop', price: 180, image: '🌵', description: '귀여운 선인장' },
    { id: 'prop-3', name: '선물상자', category: 'prop', price: 200, image: '🎁', description: '반짝이는 선물상자' },
    { id: 'prop-4', name: '별풍선', category: 'prop', price: 220, image: '⭐', description: '하늘로 날아가는 별풍선' },
    { id: 'prop-5', name: '케이크', category: 'prop', price: 250, image: '🎂', description: '달콤한 케이크' },
    { id: 'prop-6', name: '책', category: 'prop', price: 180, image: '📚', description: '지식을 담은 책' },
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
    if (activeTab === 'accessory') return customization.accessory === itemId;
    if (activeTab === 'prop') return customization.prop === itemId;
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
            className={`shop-tab ${activeTab === 'accessory' ? 'active' : ''}`}
            onClick={() => setActiveTab('accessory')}
          >
            악세서리
          </button>
          <button
            className={`shop-tab ${activeTab === 'prop' ? 'active' : ''}`}
            onClick={() => setActiveTab('prop')}
          >
            소품
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

