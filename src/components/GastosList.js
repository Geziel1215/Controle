import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import './GastosList.css';

function GastosList({ refreshTrigger }) {
  const [gastosEmAbertoAgrupados, setGastosEmAbertoAgrupados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalGeralEmAberto, setTotalGeralEmAberto] = useState(0);

  useEffect(() => {
    fetchGastosEmAberto();

    // Realtime Subscriptions para atualizar a lista automaticamente
    // Nota: Realtime para views pode ser complexo. Para simplificar, vamos focar na query inicial.
    // Se o realtime for essencial para a view, uma abordagem mais avançada seria necessária.
    const channel = supabase
      .channel('vw_gastos_em_aberto_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'gastos' }, payload => {
        console.log('Change in gastos table detected, refreshing vw_gastos_em_aberto!', payload);
        fetchGastosEmAberto();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refreshTrigger]);

  const fetchGastosEmAberto = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('vw_gastos_em_aberto')
        .select('*')
        .order('tipo_pagamento', { ascending: true });

      if (error) {
        throw error;
      }

      setGastosEmAbertoAgrupados(data || []);
      
      // Calcular total geral a partir da view
      const totalValue = (data || []).reduce((sum, item) => sum + parseFloat(item.total), 0);
      setTotalGeralEmAberto(totalValue);
      
    } catch (error) {
      alert('Erro ao carregar gastos em aberto: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="gastos-list">
        <div className="loading">
          <div className="spinner"></div>
          <p>Carregando gastos em aberto...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="gastos-list">
      <div className="header">
        <h2>💳 Fatura de Gastos em Aberto</h2>
      </div>
      
      {gastosEmAbertoAgrupados.length === 0 ? (
        <div className="empty-state">
          <p>🎉 Parabéns! Não há gastos em aberto.</p>
          <p>Todos os seus gastos estão quitados!</p>
        </div>
      ) : (
        <div className="fatura-container">
          {gastosEmAbertoAgrupados.map((item) => (
            <div key={item.tipo_pagamento} className="tipo-pagamento-group">
              <div className="tipo-pagamento-header">
                <h3>{item.tipo_pagamento || 'Sem Tipo de Pagamento'}</h3>
                <div className="tipo-total">
                  R$ {parseFloat(item.total).toFixed(2)}
                </div>
              </div>
              {/* Removida a listagem de gastos individuais */}
            </div>
          ))}
        </div>
      )}
      <div className="total-geral" style={{ marginTop: '20px', textAlign: 'right' }}>
        <strong>Total Geral em Aberto: R$ {totalGeralEmAberto.toFixed(2)}</strong>
      </div>
    </div>
  );
}

export default GastosList;
