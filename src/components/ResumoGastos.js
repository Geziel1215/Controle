import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import './ResumoGastos.css';

function ResumoGastos() {
  const [gastos, setGastos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterPago, setFilterPago] = useState('N');
  const [groupBy, setGroupBy] = useState('none');
  const [startDate, setStartDate] = useState('');
  const [dateField, setDateField] = useState('data_vencimento');
  const [endDate, setEndDate] = useState('');
  const [totalGeral, setTotalGeral] = useState(0);
  const [filtrado, setFiltrado] = useState(false); // novo estado

  const limparFiltros = () => {
    setFilterPago('N');
    setGroupBy('none');
    setDateField('data_vencimento');
    setStartDate('');
    setEndDate('');
    setGastos([]);
    setTotalGeral(0);
    setFiltrado(false);
  };

  const fetchGastos = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('vw_resumo_gastos')
        .select(`
          id_gasto,
          descricao,
          valor,
          pago,
          data_compra,
          data_vencimento,
          parcela,
          categoria,
          responsavel,
          tipo_pagamento
        `);

      if (filterPago !== 'all') {
        query = query.eq('pago', filterPago);
      }
      if (startDate) {
        query = query.gte(dateField, startDate);
      }
      if (endDate) {
        query = query.lte(dateField, endDate);
      }

      const { data, error } = await query.order(dateField, { ascending: true });
      if (error) throw error;

      setGastos(data || []);
      setTotalGeral((data || []).reduce((sum, gasto) => sum + parseFloat(gasto.valor), 0));
      setFiltrado(true);
    } catch (error) {
      alert('Erro ao carregar resumo de gastos: ' + error.message);
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
        key = gasto.categoria || 'Sem Categoria';
      } else if (groupBy === 'tipo_pagamento') {
        key = gasto.tipo_pagamento || 'Sem Tipo de Pagamento';
      } else if (groupBy === 'responsavel') {
        key = gasto.responsavel || 'Sem Responsável';
      }
      if (!acc[key]) acc[key] = [];
      acc[key].push(gasto);
      return acc;
    }, {});
    const sortedGrouped = Object.keys(grouped).sort().reduce(
      (obj, key) => { obj[key] = grouped[key]; return obj; }, {}
    );
    return sortedGrouped;
  };

  const groupedGastos = groupAndSumGastos();

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
          <label htmlFor="dateField">Filtrar por:</label>
          <select id="dateField" value={dateField} onChange={e => setDateField(e.target.value)}>
            <option value="data_vencimento">Data de Vencimento</option>
            <option value="data_compra">Data de Compra</option>
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
        <div className="filter-group" style={{ alignSelf: 'flex-end', display: 'flex', gap: 8 }}>
          <button type="button" onClick={fetchGastos} disabled={loading}>
            Filtrar
          </button>
          <button type="button" onClick={limparFiltros} disabled={loading}>
            Limpar Filtros
          </button>
        </div>
      </div>
      {loading && (
        <div className="loading">
          <div className="spinner"></div>
          <p>Carregando resumo...</p>
        </div>
      )}
      {!loading && !filtrado && (
        <div className="empty-state">
          <p>Use os filtros acima e clique em <strong>Filtrar</strong> para ver o resumo de gastos.</p>
        </div>
      )}
      {!loading && filtrado && (
        <>
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
                    <div key={gasto.id_gasto + (gasto.data_vencimento || '')} className={`gasto-card ${gasto.pago === 'S' ? 'pago' : 'nao-pago'}`}>
                      <div className="gasto-header">
                        <h4>{gasto.descricao}</h4>
                      </div>
                      <div className="gasto-valor">
                        R$ {parseFloat(gasto.valor).toFixed(2)}
                      </div>
                      <div className="gasto-details">
                        <div className="detail-item">
                          <strong>Categoria:</strong> {gasto.categoria || 'N/A'}
                        </div>
                        <div className="detail-item">
                          <strong>Responsável:</strong> {gasto.responsavel || 'N/A'}
                        </div>
                        <div className="detail-item">
                          <strong>Pagamento:</strong> {gasto.tipo_pagamento || 'N/A'}
                        </div>
                        <div className="detail-item">
                          <strong>Data Compra:</strong> {gasto.data_compra ? new Date(gasto.data_compra).toLocaleDateString('pt-BR') : 'N/A'}
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
        </>
      )}
    </div>
  );
}

export default ResumoGastos;