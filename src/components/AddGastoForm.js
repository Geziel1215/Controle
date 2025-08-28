import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import './AddGastoForm.css';

function AddGastoForm({ onGastoAdded, gastoToEdit, onCancelEdit }) {
  const [descricao, setDescricao] = useState('');
  const [valor, setValor] = useState('');
  const [idCategoria, setIdCategoria] = useState('');
  const [idResponsavel, setIdResponsavel] = useState('');
  const [idPagamento, setIdPagamento] = useState('');
  const [pago, setPago] = useState('N');
  const [dataCompra, setDataCompra] = useState('');
  const [parcela, setParcela] = useState('1');

  const [categorias, setCategorias] = useState([]);
  const [responsaveis, setResponsaveis] = useState([]);
  const [tiposPagamento, setTiposPagamento] = useState([]);

  const [loading, setLoading] = useState(false);
  const [fetchingDropdowns, setFetchingDropdowns] = useState(true);
  const [userIdAuth, setUserIdAuth] = useState('');

  // Função para resetar os campos do formulário
  const resetForm = () => {
    setDescricao('');
    setValor('');
    setIdCategoria(''); // Limpa o campo de categoria
    setIdResponsavel(''); // Limpa o campo de responsável
    setIdPagamento(''); // Limpa o campo de tipo de pagamento
    setPago('N');
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    setDataCompra(`${year}-${month}-${day}`);
    setParcela('1');
  };

  useEffect(() => {
    fetchDropdownData();
  }, []);

  useEffect(() => {
    if (gastoToEdit) {
      setDescricao(gastoToEdit.descricao);
      setValor(gastoToEdit.valor);
      setIdCategoria(String(gastoToEdit.id_categoria));
      setIdResponsavel(String(gastoToEdit.id_responsavel));
      setIdPagamento(String(gastoToEdit.id_pagamento));
      setPago(gastoToEdit.pago);
      setDataCompra(gastoToEdit.data_compra);
      setParcela(String(gastoToEdit.parcela));
    } else {
      resetForm(); // Reseta o formulário ao sair do modo de edição ou ao iniciar
    }
  }, [gastoToEdit]); // Removidas categorias, responsaveis, tiposPagamento para evitar loop e garantir reset

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUserIdAuth(user.id);
    };
    fetchUser();
  }, []);

  const fetchDropdownData = async () => {
    setFetchingDropdowns(true);
    try {
      const { data: catData, error: catError } = await supabase.from('categoria').select('*');
      if (catError) throw catError;
      setCategorias(catData);

      const { data: respData, error: respError } = await supabase.from('responsavel').select('*');
      if (respError) throw respError;
      setResponsaveis(respData);

      const { data: pagData, error: pagError } = await supabase.from('tipo_pagamento').select('*');
      if (pagError) throw pagError;
      setTiposPagamento(pagData);

      // Define a data atual como padrão para dataCompra se não estiver em modo de edição
      if (!gastoToEdit || !dataCompra) {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        setDataCompra(`${year}-${month}-${day}`);
      }

    } catch (error) {
      alert('Erro ao carregar dados para os campos: ' + error.message);
    } finally {
      setFetchingDropdowns(false);
    }
  };

  const getDataCorte = async () => {
  const { data, error } = await supabase
    .from('config_projeto')
    .select('data_corte')
    .eq('id', 1)
    .single();
  if (error) {
    throw new Error('Erro ao buscar data de corte: ' + error.message);
  }
  return data?.data_corte;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const currentIdCategoria = String(idCategoria);
    const currentIdResponsavel = String(idResponsavel);
    const currentIdPagamento = String(idPagamento);
    const currentParcela = String(parcela);

    if (!descricao || !valor || !currentIdCategoria || !currentIdResponsavel || !currentIdPagamento || !dataCompra || !currentParcela) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    const parsedValor = parseFloat(valor);
    if (isNaN(parsedValor)) {
      alert('O valor deve ser um número válido.');
      return;
    }

    const parsedParcela = parseInt(currentParcela);
    if (isNaN(parsedParcela) || parsedParcela < 1) {
      alert('O número de parcelas deve ser um número inteiro maior ou igual a 1.');
      return;
    }

    try {
      setLoading(true);
      
      let dataVencimento = null;
    if (parseInt(parcela) === 1) {
      dataVencimento = await getDataCorte();
    }

    const gastoData = {
      descricao,
      valor: parsedValor,
      id_categoria: parseInt(currentIdCategoria),
      id_responsavel: parseInt(currentIdResponsavel),
      id_pagamento: parseInt(currentIdPagamento),
      pago,
      data_compra: dataCompra,
      parcela: parsedParcela,
      origem: 'manual',
      data_vencimento: dataVencimento,
      usuario: userIdAuth // <-- aqui!
    };

      if (gastoToEdit) {
        const { error } = await supabase
          .from('gastos')
          .update(gastoData)
          .eq('id', gastoToEdit.id);
        if (error) throw error;
        alert('Gasto atualizado com sucesso!');
      } else {
        const { error } = await supabase
          .from('gastos')
          .insert([gastoData]);
        if (error) throw error;
        alert('Gasto adicionado com sucesso!');
        resetForm(); // Limpa os campos após adicionar um novo gasto
      }
      
      onGastoAdded();
    } catch (error) {
      alert('Erro ao salvar gasto: ' + error.message);

    } finally {
      setLoading(false);
    }
  };

  if (fetchingDropdowns) {
    return (
      <div className="add-gasto-form">
        <div className="loading">
          <div className="spinner"></div>
          <p>Carregando formulário...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="add-gasto-form">
      <h2>{gastoToEdit ? 'Editar Gasto' : 'Adicionar Novo Gasto'}</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="descricao">Descrição:</label>
          <input
            type="text"
            id="descricao"
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            placeholder="Ex: Almoço, Remédios, etc."
            disabled={loading}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="valor">Valor (R$):</label>
          <input
            type="number"
            id="valor"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            placeholder="0.00"
            step="0.01"
            min="0"
            disabled={loading}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="idCategoria">Categoria:</label>
          <select
            id="idCategoria"
            value={idCategoria}
            onChange={(e) => setIdCategoria(e.target.value)}
            disabled={loading}
            required
          >
            <option value="">Selecione uma categoria</option> {/* Opção vazia */}
            {categorias.map((cat) => (
              <option key={cat.id} value={String(cat.id)}>{cat.descricao}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="idResponsavel">Responsável:</label>
          <select
            id="idResponsavel"
            value={idResponsavel}
            onChange={(e) => setIdResponsavel(e.target.value)}
            disabled={loading}
            required
          >
            <option value="">Selecione um responsável</option> {/* Opção vazia */}
            {responsaveis.map((resp) => (
              <option key={resp.id} value={String(resp.id)}>{resp.descricao}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="idPagamento">Tipo de Pagamento:</label>
          <select
            id="idPagamento"
            value={idPagamento}
            onChange={(e) => setIdPagamento(e.target.value)}
            disabled={loading}
            required
          >
            <option value="">Selecione um tipo de pagamento</option> {/* Opção vazia */}
            {tiposPagamento.map((tp) => (
              <option key={tp.id} value={String(tp.id)}>{tp.descricao}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="dataCompra">Data da Compra:</label>
          <input
            type="date"
            id="dataCompra"
            value={dataCompra}
            onChange={(e) => setDataCompra(e.target.value)}
            disabled={loading}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="parcela">Parcelas:</label>
          <input
            type="number"
            id="parcela"
            value={parcela}
            onChange={(e) => setParcela(e.target.value)}
            min="1"
            disabled={loading}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="pago">Pago:</label>
          <select
            id="pago"
            value={pago}
            onChange={(e) => setPago(e.target.value)}
            disabled={loading}
            required
          >
            <option value="S">Sim</option>
            <option value="N">Não</option>
          </select>
        </div>
        
        <button type="submit" disabled={loading}>
          {loading ? (gastoToEdit ? 'Atualizando...' : 'Adicionando...') : (gastoToEdit ? 'Atualizar Gasto' : 'Adicionar Gasto')}
        </button>
        {gastoToEdit && (
          <button type="button" onClick={onCancelEdit} className="cancel-button" disabled={loading}>
            Cancelar Edição
          </button>
        )}
      </form>
    </div>
  );
}

export default AddGastoForm;
