import React from 'react';
import './TabNavigation.css';

function TabNavigation({ activeTab, onTabChange }) {
  const tabs = [
    { id: 'gastos', label: '💰 Gastos' },
    { id: 'categorias', label: '📂 Categorias' },
    { id: 'pagamentos', label: '💳 Tipos de Pagamento' },
    { id: 'responsaveis', label: '👤 Responsáveis' }
  ];

  return (
    <div className="tab-navigation">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
          onClick={() => onTabChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

export default TabNavigation;