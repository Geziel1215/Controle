import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import './Home.css';
import { Swiper, SwiperSlide } from 'swiper/react';
import { EffectCoverflow } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/effect-coverflow';

const menuItems = [
    { id: 'gastos', label: ' Gastos', icon: '💳' },
    { id: 'manutencao', label: 'Manutenção Gastos', icon: '🛠️' },
    { id: 'resumo', label: 'Resumo', icon: '📊' },
    { id: 'categorias', label: 'Categorias', icon: '📂' },
    { id: 'Tipo de Pagamentos', label: 'Tipos de Pagamento', icon: '💰' }, // Corrigido o ID aqui
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
      <Swiper
        effect="coverflow"
        grabCursor={true}
        centeredSlides={true}
        slidesPerView={2.5}
        spaceBetween={30}
        coverflowEffect={{
          rotate: 0,
          stretch: 0,
          depth: 100,
          modifier: 2,
          slideShadows: true,
        }}
        modules={[EffectCoverflow]}
        style={{ width: 520, height: 260, marginBottom: 54 }}
      >
        {menuItems.map((item, idx) => (
          <SwiperSlide key={idx}>
            <div
              className={`carousel-card${activeTab === item.id ? ' active' : ''}`}
              onClick={() => onTabChange(item.id)}
              style={{ cursor: 'pointer' }}
            >
              <span className="carousel-icon">{item.icon}</span>
              <span>{item.label}</span>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
};
export default Home;