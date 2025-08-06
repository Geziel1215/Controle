import React from 'react';
import './Sidebar.css';

function Sidebar({ activeTab, onTabChange, isOpen, toggleSidebar }) {
  const menuItems = [
    { id: 'home', label: ' Home', icon: '🏠' },
    { id: 'gastos', label: ' Gastos', icon: '💳' },
    { id: 'manutencao', label: 'Manutenção de Gastos', icon: '🛠️' },
    { id: 'resumo', label: 'Resumo', icon: '📊' },
    { id: 'categorias', label: 'Categorias', icon: '📂' },
    { id: 'Tipo de Pagamentos', label: 'Tipos de Pagamento', icon: '💰' }, // Corrigido o ID aqui
    { id: 'responsaveis', label: 'Responsáveis', icon: '👤' },
    { id: 'configuracao', label: 'Configuração', icon: '⚙️' }
  ];

  const handleItemClick = (itemId) => {
    onTabChange(itemId);
    if (window.innerWidth <= 768) {
      toggleSidebar(); // Close sidebar on mobile after selection
    }
  };

  return (
    <div className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-header">
        <h3>Menu</h3>
        <button className="close-btn" onClick={toggleSidebar}>
          ✕
        </button>
      </div>
      
      <nav className="sidebar-nav">
        <ul>
          {menuItems.map((item) => (
            <li key={item.id}>
              <button
                className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
                onClick={() => handleItemClick(item.id)}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}

export default Sidebar;
