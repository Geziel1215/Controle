import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import AddGastoForm from './AddGastoForm';
import CustomDialog from './CustomDialog';
import GastoActionDialog from './GastoActionDialog';
import './ManutencaoGastos.css';

function ManutencaoGastos() {
  const [gastos, setGastos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterTipoPagamento, setFilterTipoPagamento] = useState('all');
  const [filterResponsavel, setFilterResponsavel] = useState('all');
  const [filterPago, setFilterPago] = useState('all');
  const [filterDataCompraStart, setFilterDataCompraStart] = useState('');
  const [filterDataCompraEnd, setFilterDataCompraEnd] = useState('');
  const [filterDataVencimentoStart, setFilterDataVencimentoStart] = useState('');
  const [filterDataVencimentoEnd, setFilterDataVencimentoEnd] = useState('');

  const [tiposPagamento, setTiposPagamento] = useState([]);
  const [responsaveis, setResponsaveis] = useState([]);

  const [gastoToEdit, setGastoToEdit] = useState(null);
  const [showEditForm, setShowEditForm] = useState(false);

  const [dialogState, setDialogState] = useState({
    isOpen: false,
    title: '',
    message: '',
    showConfirm: false,
    onConfirm: null,
    confirmText: 'Confirmar',
    cancelText: 'Cancelar',
    children: null
  });

  const [mostrarParcelados, setMostrarParcelados] = useState(false);
  const [parcelas, setParcelas] = useState([]);
  const [loadingParcelas, setLoadingParcelas] = useState(false);

  const closeDialog = () => {
    setDialogState({
      isOpen: false,
      title: '',
      message: '',
      showConfirm: false,
      onConfirm: null,
      children: null
    });
  };

  const showDialogInternal = (title, message, showConfirm = false, onConfirm = null, confirmText = 'Confirmar', cancelText = 'Cancelar', children = null) => {
    setDialogState({
      isOpen: true,
      title,
      message,
      showConfirm,
      onConfirm,
      confirmText,
      cancelText,
      children
    });
  };

  const fetchGastos = useCallback(async () => {
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

      if (filterTipoPagamento !== 'all') {
        query = query.eq('id_pagamento', filterTipoPagamento);
      }
      if (filterResponsavel !== 'all') {
        query = query.eq('id_responsavel', filterResponsavel);
      }
      if (filterPago !== 'all') {
        query = query.eq('pago', filterPago);
      }
      if (filterDataCompraStart) {
        query = query.gte('data_compra', filterDataCompraStart);
      }
      if (filterDataCompraEnd) {
        query = query.lte('data_compra', filterDataCompraEnd);
      }
      if (filterDataVencimentoStart) {
        query = query.gte('data_vencimento', filterDataVencimentoStart);
      }
      if (filterDataVencimentoEnd) {
        query = query.lte('data_vencimento', filterDataVencimentoEnd);
      }

      const { data, error } = await query.order('data_compra', { ascending: false });

      if (error) throw error;
      setGastos(data || []);
    } catch (error) {
      console.error('Erro ao carregar gastos para manutenção:', error.message);
    } finally {
      setLoading(false);
    }
  }, [filterTipoPagamento, filterResponsavel, filterPago, 
      filterDataCompraStart, filterDataCompraEnd, 
      filterDataVencimentoStart, filterDataVencimentoEnd]);

  useEffect(() => {
    fetchDropdownData();
  }, []);

  useEffect(() => {
    fetchGastos();
  }, [fetchGastos, showEditForm]); // Adicionado fetchGastos como dependência

  const fetchDropdownData = async () => {
    try {
      const { data: tpData, error: tpError } = await supabase.from('tipo_pagamento').select('*');
      if (tpError) throw tpError;
      setTiposPagamento(tpData);

      const { data: respData, error: respError } = await supabase.from('responsavel').select('*');
      if (respError) throw respError;
      setResponsaveis(respData);
    } catch (error) {
      console.error('Erro ao carregar dados para filtros:', error.message);
    }
  };

  // const handleEditClick = (gasto) => {
  //   setGastoToEdit(gasto);
  //   setShowEditForm(true);
  // };
  const handleEditClick = (gasto) => {
  setGastoToEdit({
    ...gasto,
    idCategoria: gasto.categoria?.id || gasto.id_categoria || '',
    idResponsavel: gasto.responsavel?.id || gasto.id_responsavel || '',
    idPagamento: gasto.tipo_pagamento?.id || gasto.id_pagamento || '',
    // ajuste outros campos se necessário
  });
  setShowEditForm(true);
};

  const handleTogglePago = async (gasto) => {
    const newPagoStatus = gasto.pago === 'S' ? 'N' : 'S';
    const action = newPagoStatus === 'S' ? 'Pagar' : 'Estornar Pagamento';
    const message = `Tem certeza que deseja ${action} o gasto "${gasto.descricao}"?`;

    showDialogInternal(
      `${action} Gasto`,
      message,
      true, // Agora showConfirm é true
      async () => {
        try {
          const { error } = await supabase
            .from('gastos')
            .update({ pago: newPagoStatus })
            .eq('id', gasto.id);

          if (error) throw error;
          alert(`Gasto ${newPagoStatus === 'S' ? 'pago' : 'estornado'} com sucesso!`);
          fetchGastos();
        } catch (error) {
          alert('Erro ao atualizar status: ' + error.message);
          console.error('Erro ao atualizar status:', error);
        }
        closeDialog();
      },
      action, // confirmText
      'Cancelar' // cancelText
    );
  };

  const handleDeleteGasto = async (gasto) => {
    showDialogInternal(
      'Confirmar Exclusão',
      `Tem certeza que deseja excluir o gasto "${gasto.descricao}" no valor de R$ ${parseFloat(gasto.valor).toFixed(2)}?`,
      true, // Agora showConfirm é true
      async () => {
        try {
          const { error } = await supabase
            .from('gastos')
            .delete()
            .eq('id', gasto.id);

          if (error) throw error;
          alert('Gasto excluído com sucesso!');
          fetchGastos();
        } catch (error) {
          alert('Erro ao excluir gasto: ' + error.message);
          console.error('Erro ao excluir gasto:', error);
        }
        closeDialog();
      },
      'Excluir', // confirmText
      'Cancelar' // cancelText
    );
  };

  const handleTogglePagoParcelado = async (gastoId, parcelaIds, novoStatus) => {
    try {
      const { error } = await supabase
        .from('parcelado')
        .update({ pago: novoStatus })
        .in('id', parcelaIds);

      if (error) throw error;

      // Atualiza o estado local das parcelas imediatamente
      setParcelas(prevParcelas =>
        prevParcelas.map(parc =>
          parcelaIds.includes(parc.id)
            ? { ...parc, pago: novoStatus }
            : parc
        )
      );

      // Se todas as parcelas ficarem pagas, atualize o gasto cheio também
      const { data: parcelasRestantes } = await supabase
        .from('parcelado')
        .select('id')
        .eq('id_gasto', gastoId)
        .eq('pago', 'N');

      if (parcelasRestantes.length === 0) {
        await supabase.from('gastos').update({ pago: 'S' }).eq('id', gastoId);
        fetchGastos();
      }

      alert('Parcelas atualizadas com sucesso!');
    } catch (error) {
      alert('Erro ao atualizar parcelas: ' + error.message);
    }
  };

  const buscarParcelas = async (gastoId) => {
    const { data } = await supabase.from('parcelado').select('*').eq('id_gasto', gastoId);
    setParcelas(data || []);
  };

  if (showEditForm) {
    return (
      <div className="manutencao-gastos-container">
        <AddGastoForm 
          gastoToEdit={gastoToEdit} 
          onGastoAdded={() => {
            setShowEditForm(false);
            setGastoToEdit(null);
            fetchGastos();
          }}
          onCancelEdit={() => {
            setShowEditForm(false);
            setGastoToEdit(null);
          }}
        />
      </div>
    );
  }

  const handleCardClick = async (gasto) => {
    let parcelasData = [];
    let loadingParcelasLocal = false;

    if (gasto.parcela > 1) {
      loadingParcelasLocal = true;
      const { data } = await supabase.from('parcelado').select('*').eq('id_gasto', gasto.id);
      parcelasData = data || [];
      loadingParcelasLocal = false;
    }

    showDialogInternal(
      'Ações para Gasto',
      <GastoActionDialog
        gasto={gasto}
        parcelas={parcelasData}
        loadingParcelas={loadingParcelasLocal}
        onEdit={() => { handleEditClick(gasto); closeDialog(); }}
        onTogglePago={() => { closeDialog(); handleTogglePago(gasto); }}
        onDelete={() => { closeDialog(); handleDeleteGasto(gasto); }}
        onTogglePagoParcelado={async (parc) => {
          await handleTogglePagoParcelado(gasto.id, [parc.id], parc.pago === 'S' ? 'N' : 'S');
          // Atualize o array local de parcelas imediatamente
          parcelasData = parcelasData.map(p =>
            p.id === parc.id ? { ...p, pago: parc.pago === 'S' ? 'N' : 'S' } : p
          );
          // Reabra o modal para refletir a mudança (simula re-render)
          closeDialog();
          handleCardClick(gasto);
        }}
      />,
      false, null, 'Confirmar', 'Cancelar', null
    );
  };

  return (
    <div className="manutencao-gastos-container">
      <h2>🛠️ Manutenção de Gastos</h2>

      <div className="filters-card">
        <h3>Filtros</h3>
        <div className="filters-grid">
          <div className="filter-group">
            <label htmlFor="filterTipoPagamento">Tipo de Pagamento:</label>
            <select id="filterTipoPagamento" value={filterTipoPagamento} onChange={(e) => setFilterTipoPagamento(e.target.value)}>
              <option value="all">Todos</option>
              {tiposPagamento.map(tp => (
                <option key={tp.id} value={tp.id}>{tp.descricao}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="filterResponsavel">Responsável:</label>
            <select id="filterResponsavel" value={filterResponsavel} onChange={(e) => setFilterResponsavel(e.target.value)}>
              <option value="all">Todos</option>
              {responsaveis.map(resp => (
                <option key={resp.id} value={resp.id}>{resp.descricao}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="filterPago">Status:</label>
            <select id="filterPago" value={filterPago} onChange={(e) => setFilterPago(e.target.value)}>
              <option value="all">Todos</option>
              <option value="N">Não Pago</option>
              <option value="S">Pago</option>
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="filterDataCompraStart">Data Compra (Início):</label>
            <input type="date" id="filterDataCompraStart" value={filterDataCompraStart} onChange={(e) => setFilterDataCompraStart(e.target.value)} />
          </div>

          <div className="filter-group">
            <label htmlFor="filterDataCompraEnd">Data Compra (Fim):</label>
            <input type="date" id="filterDataCompraEnd" value={filterDataCompraEnd} onChange={(e) => setFilterDataCompraEnd(e.target.value)} />
          </div>

          <div className="filter-group">
            <label htmlFor="filterDataVencimentoStart">Data Vencimento (Início):</label>
            <input type="date" id="filterDataVencimentoStart" value={filterDataVencimentoStart} onChange={(e) => setFilterDataVencimentoStart(e.target.value)} />
          </div>

          <div className="filter-group">
            <label htmlFor="filterDataVencimentoEnd">Data Vencimento (Fim):</label>
            <input type="date" id="filterDataVencimentoEnd" value={filterDataVencimentoEnd} onChange={(e) => setFilterDataVencimentoEnd(e.target.value)} />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="loading">
          <div className="spinner"></div>
          <p>Carregando gastos...</p>
        </div>
      ) : gastos.length === 0 ? (
        <div className="empty-state">
          <p>Nenhum gasto encontrado com os filtros selecionados.</p>
        </div>
      ) : (
        <div className="gastos-grid-manutencao">
          {gastos.map((gasto) => (
            <div 
              key={gasto.id} 
              className={`gasto-card-manutencao ${gasto.pago === 'S' ? 'pago' : 'nao-pago'}`}
              onClick={() => handleCardClick(gasto)}
            >
              <div className="card-header">
                <span className="card-descricao">{gasto.descricao}</span>
                <span className="card-valor">R$ {parseFloat(gasto.valor).toFixed(2)}</span>
              </div>
              <div className="card-details">
                <span><strong>Cat:</strong> {gasto.categoria?.descricao || 'N/A'}</span>
                <span><strong>Resp:</strong> {gasto.responsavel?.descricao || 'N/A'}</span>
                <span><strong>Pag:</strong> {gasto.tipo_pagamento?.descricao || 'N/A'}</span>
                <span><strong>Comp:</strong> {new Date(gasto.data_compra).toLocaleDateString('pt-BR')}</span>
                {gasto.data_vencimento && <span><strong>Venc:</strong> {new Date(gasto.data_vencimento).toLocaleDateString('pt-BR')}</span>}
                {gasto.parcela > 1 && <span><strong>Parc:</strong> {gasto.parcela}</span>}
                <span className={`card-status ${gasto.pago === 'S' ? 'pago' : 'nao-pago'}`}>{gasto.pago === 'S' ? 'Pago' : 'Não Pago'}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <CustomDialog
        isOpen={dialogState.isOpen}
        onClose={closeDialog}
        title={dialogState.title}
        message={dialogState.message}
        showConfirm={dialogState.showConfirm}
        onConfirm={dialogState.onConfirm}
        confirmText={dialogState.confirmText}
        cancelText={dialogState.cancelText}
      >
        {dialogState.children}
      </CustomDialog>
    </div>
  );
}

export default ManutencaoGastos;