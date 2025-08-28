import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import './CrudForm.css';

function TipoPagamentoForm() {
  const [formData, setFormData] = useState({
    descricao: '',
    data_vencimento: '',
    data_fechamento: '',
    ativo: 'S',
    tipo: 'CARTAO'
  });
  const [tiposPagamento, setTiposPagamento] = useState([]);
  const [tiposPagamentoUsados, setTiposPagamentoUsados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchTiposPagamento();
    fetchTiposPagamentoUsados();
  }, []);

  const fetchTiposPagamento = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('tipo_pagamento')
        .select('*')
        .order('descricao', { ascending: true });
      if (error) throw error;
      setTiposPagamento(data);
    } catch (error) {
      alert('Erro ao carregar tipos de pagamento: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchTiposPagamentoUsados = async () => {
    // Busca todos os id_pagamento usados em gastos
    const { data, error } = await supabase
      .from('gastos')
      .select('id_pagamento');
    if (!error && data) {
      // Cria um array só com os ids únicos
      setTiposPagamentoUsados([...new Set(data.map(g => g.id_pagamento))]);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const afterChange = () => {
    fetchTiposPagamento();
    fetchTiposPagamentoUsados();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.descricao.trim()) {
      alert('A descrição do tipo de pagamento não pode ser vazia.');
      return;
    }

    try {
      const dataToSave = {
        descricao: formData.descricao.trim(),
        data_vencimento: formData.data_vencimento ? parseInt(formData.data_vencimento) : null,
        data_fechamento: formData.data_fechamento ? parseInt(formData.data_fechamento) : null,
        ativo: formData.ativo,
        tipo: formData.tipo
      };

      if (editingId) {
        // Update existing
        const { error } = await supabase
          .from('tipo_pagamento')
          .update(dataToSave)
          .eq('id', editingId);
        if (error) throw error;
        alert('Tipo de pagamento atualizado com sucesso!');
        setEditingId(null);
        afterChange();
      } else {
        // Add new
        const { error } = await supabase
          .from('tipo_pagamento')
          .insert([dataToSave]);
        if (error) throw error;
        alert('Tipo de pagamento adicionado com sucesso!');
        afterChange();
      }
      
      setFormData({
        descricao: '',
        data_vencimento: '',
        data_fechamento: '',
        ativo: 'S',
        tipo: 'CARTAO'
      });
    } catch (error) {
      alert('Erro ao salvar tipo de pagamento: ' + error.message);
    }
  };

  const handleEdit = (tipoPagamento) => {
    setFormData({
      descricao: tipoPagamento.descricao,
      data_vencimento: tipoPagamento.data_vencimento || '',
      data_fechamento: tipoPagamento.data_fechamento || '',
      ativo: tipoPagamento.ativo,
      tipo: tipoPagamento.tipo
    });
    setEditingId(tipoPagamento.id);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir este tipo de pagamento?')) {
      return;
    }
    try {
      const { error } = await supabase
        .from('tipo_pagamento')
        .delete()
        .eq('id', id);
      if (error) throw error;
      alert('Tipo de pagamento excluído com sucesso!');
      afterChange();
    } catch (error) {
      alert('Erro ao excluir tipo de pagamento: ' + error.message);
    }
  };

  if (loading) {
    return (
      <div className="crud-container">
        <div className="loading">
          <div className="spinner"></div>
          <p>Carregando tipos de pagamento...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="crud-container">
      <h2>{editingId ? 'Editar Tipo de Pagamento' : 'Novo Tipo de Pagamento'}</h2>
      <form onSubmit={handleSubmit} className="crud-form">
        <input
          type="text"
          name="descricao"
          placeholder="Descrição (ex: Cartão Itaú, Dinheiro, PIX)"
          value={formData.descricao}
          onChange={handleInputChange}
          required
        />
        
        <select
          name="tipo"
          value={formData.tipo}
          onChange={handleInputChange}
        >
          <option value="CARTAO">Cartão</option>
          <option value="DINHEIRO">Dinheiro</option>
          <option value="PIX">PIX</option>
          <option value="TRANSFERENCIA">Transferência</option>
        </select>

        <input
          type="number"
          name="data_vencimento"
          placeholder="Dia do Vencimento (1-31)"
          min="1"
          max="31"
          value={formData.data_vencimento}
          onChange={handleInputChange}
        />

        <input
          type="number"
          name="data_fechamento"
          placeholder="Dia do Fechamento (1-31)"
          min="1"
          max="31"
          value={formData.data_fechamento}
          onChange={handleInputChange}
        />

        <select
          name="ativo"
          value={formData.ativo}
          onChange={handleInputChange}
        >
          <option value="S">Ativo</option>
          <option value="N">Inativo</option>
        </select>

        <button type="submit">{editingId ? 'Atualizar' : 'Adicionar'}</button>
        {editingId && (
          <button 
            type="button" 
            onClick={() => { 
              setEditingId(null); 
              setFormData({
                descricao: '',
                data_vencimento: '',
                data_fechamento: '',
                ativo: 'S',
                tipo: 'CARTAO'
              }); 
            }} 
            className="cancel-button"
          >
            Cancelar Edição
          </button>
        )}
      </form>

      <h3>Tipos de Pagamento Cadastrados</h3>
      {tiposPagamento.length === 0 ? (
        <p className="empty-state">Nenhum tipo de pagamento cadastrado ainda.</p>
      ) : (
        <ul className="crud-list">
          {tiposPagamento.map((tipo) => (
            <li key={tipo.id} className="crud-item">
              <div className="crud-info">
                <strong>{tipo.descricao}</strong>
                <span>Tipo: {tipo.tipo}</span>
                {tipo.data_vencimento && <span>Vencimento: Dia {tipo.data_vencimento}</span>}
                {tipo.data_fechamento && <span>Fechamento: Dia {tipo.data_fechamento}</span>}
                <span>Status: {tipo.ativo === 'S' ? 'Ativo' : 'Inativo'}</span>
              </div>
              <div className="crud-actions">
                <button onClick={() => handleEdit(tipo)} className="edit-button">Editar</button>
                {/* Só mostra o botão excluir se NÃO estiver em uso */}
                {!tiposPagamentoUsados.includes(tipo.id) && (
                  <button onClick={() => handleDelete(tipo.id)} className="delete-button">Excluir</button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default TipoPagamentoForm;