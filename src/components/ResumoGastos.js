import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import './ResumoGastos.css';

function ResumoGastos() {
  const [gastos, setGastos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterPago, setFilterPago] = useState('N'); // Default to 'Não Pago'
  const [groupBy, setGroupBy] = useState('none'); // 'none', 'categoria', 'tipo_pagamento', 'responsavel'
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [totalGeral, setTotalGeral] = useState(0);

  useEffect(() => {
    fetchGastos();
  }, [filterPago, groupBy, startDate, endDate]);

  const fetchGastos = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('gastos')
        .select(`
          id,
          descricao,
          valor,
          data_compra,
          data_vencimento,
          parcela,
          pago,
          categoria:id_categoria(descricao),
          tipo_pagamento:id_pagamento(descricao),
          responsavel:id_responsavel(descricao)
        `);

      if (filterPago !== 'all') {
        query = query.eq('pago', filterPago);
      }

      if (startDate) {
        query = query.gte('data_vencimento', startDate);
      }
      if (endDate) {
        query = query.lte('data_vencimento', endDate);
      }

      const { data, error } = await query.order('data_vencimento', { ascending: true });

      if (error) throw error;

      setGastos(data || []);
      const calculatedTotal = (data || []).reduce((sum, gasto) => sum + parseFloat(gasto.valor), 0);
      setTotalGeral(calculatedTotal);

    } catch (error) {
      alert('Erro ao carregar resumo de gastos: ' + error.message);
      console.error('Erro ao carregar resumo de gastos:', error);
    } finally {
      setLoading(false);
    }
  };

  const groupAndSumGastos = () => {
    if (groupBy === 'none') {
      return { 'Todos os Gastos': gastos };
    }

    const grouped = gastos.reduce((acc, gasto) => {
      let key;
      if (groupBy === 'categoria') {
        key = gasto.categoria?.descricao || 'Sem Categoria';
      } else if (groupBy === 'tipo_pagamento') {
        key = gasto.tipo_pagamento?.descricao || 'Sem Tipo de Pagamento';
      } else if (groupBy === 'responsavel') {
        key = gasto.responsavel?.descricao || 'Sem Responsável';
      }

      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(gasto);
      return acc;
    }, {});

    // Sort groups alphabetically
    const sortedGrouped = Object.keys(grouped).sort().reduce(
      (obj, key) => { 
        obj[key] = grouped[key]; 
        return obj; 
      }, 
      {}
    );

    return sortedGrouped;
  };

  const groupedGastos = groupAndSumGastos();

  if (loading) {
    return (
      <div className="resumo-gastos-container">
        <div className="loading">
          <div className="spinner"></div>
          <p>Carregando resumo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="resumo-gastos-container">
      <h2>📊 Resumo de Gastos</h2>

      <div className="controls">
        <div className="filter-group">
          <label htmlFor="filterPago">Status de Pagamento:</label>
          <select id="filterPago" value={filterPago} onChange={(e) => setFilterPago(e.target.value)}>
            <option value="N">Não Pago</option>
            <option value="S">Pago</option>
            <option value="all">Todos</option>
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="groupBy">Agrupar por:</label>
          <select id="groupBy" value={groupBy} onChange={(e) => setGroupBy(e.target.value)}>
            <option value="none">Nenhum</option>
            <option value="categoria">Categoria</option>
            <option value="tipo_pagamento">Tipo de Pagamento</option>
            <option value="responsavel">Responsável</option>
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="startDate">Data Inicial:</label>
          <input type="date" id="startDate" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </div>

        <div className="filter-group">
          <label htmlFor="endDate">Data Final:</label>
          <input type="date" id="endDate" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>
      </div>

      <div className="total-geral">
        Total Geral ({filterPago === 'N' ? 'Não Pagos' : filterPago === 'S' ? 'Pagos' : 'Todos'}):
        <strong>R$ {totalGeral.toFixed(2)}</strong>
      </div>

      {Object.keys(groupedGastos).length === 0 ? (
        <div className="empty-state">
          <p>Nenhum gasto encontrado com os filtros selecionados.</p>
        </div>
      ) : (
        Object.entries(groupedGastos).map(([groupName, gastosInGroup]) => (
          <div key={groupName} className="gasto-group">
            <h3>{groupName} <span className="group-total">R$ {gastosInGroup.reduce((sum, g) => sum + parseFloat(g.valor), 0).toFixed(2)}</span></h3>
            <div className="gastos-grid">
              {gastosInGroup.map((gasto) => (
                <div key={gasto.id} className={`gasto-card ${gasto.pago === 'S' ? 'pago' : 'nao-pago'}`}>
                  <div className="gasto-header">
                    <h4>{gasto.descricao}</h4>
                  </div>
                  <div className="gasto-valor">
                    R$ {parseFloat(gasto.valor).toFixed(2)}
                  </div>
                  <div className="gasto-details">
                    <div className="detail-item">
                      <strong>Categoria:</strong> {gasto.categoria?.descricao || 'N/A'}
                    </div>
                    <div className="detail-item">
                      <strong>Responsável:</strong> {gasto.responsavel?.descricao || 'N/A'}
                    </div>
                    <div className="detail-item">
                      <strong>Pagamento:</strong> {gasto.tipo_pagamento?.descricao || 'N/A'}
                    </div>
                    <div className="detail-item">
                      <strong>Data Compra:</strong> {new Date(gasto.data_compra).toLocaleDateString('pt-BR')}
                    </div>
                    {gasto.data_vencimento && (
                      <div className="detail-item">
                        <strong>Vencimento:</strong> {new Date(gasto.data_vencimento).toLocaleDateString('pt-BR')}
                      </div>
                    )}
                    {gasto.parcela > 1 && (
                      <div className="detail-item">
                        <strong>Parcela:</strong> {gasto.parcela}
                      </div>
                    )}
                    <div className="detail-item">
                      <strong>Status:</strong> {gasto.pago === 'S' ? 'Pago' : 'Não Pago'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

export default ResumoGastos;



