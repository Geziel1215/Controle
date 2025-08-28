import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import './Home.css';

const menuItems = [
    { id: 'gastos', label: ' Gastos', icon: '💳' },
    { id: 'manutencao', label: 'Manutenção Gastos', icon: '🛠️' },
    { id: 'resumo', label: 'Resumo', icon: '📊' },
    { id: 'categorias', label: 'Categorias', icon: '📂' },
    { id: 'Tipo de Pagamentos', label: 'Tipos de Pagamento', icon: '💰' },
    { id: 'responsaveis', label: 'Responsáveis', icon: '👤' },
    { id: 'configuracao', label: 'Configuração', icon: '⚙️' }
];

const Home = ({activeTab, onTabChange}) => {
  const [nome, setNome] = useState('');

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('usuario')
          .select('*')
          .eq('id_auth', user.id)
          .single();
        if (data) setNome(data.nome);
      }
    };
    fetchUser();
  }, []);

  return (
    <div className="home-container">
      <div className="menu-grid">
        {menuItems.map((item) => (
          <div
            key={item.id}
            className={`carousel-card${activeTab === item.id ? ' active' : ''}`}
            onClick={() => onTabChange(item.id)}
            style={{ cursor: 'pointer' }}
          >
            <span className="carousel-icon">{item.icon}</span>
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Home;