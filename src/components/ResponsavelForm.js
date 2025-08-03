import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import './CrudForm.css';

function ResponsavelForm() {
  const [descricao, setDescricao] = useState('');
  const [responsaveis, setResponsaveis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchResponsaveis();
  }, []);

  const fetchResponsaveis = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('responsavel')
        .select('*')
        .order('descricao', { ascending: true });
      if (error) throw error;
      setResponsaveis(data);
    } catch (error) {
      alert('Erro ao carregar responsáveis: ' + error.message);
      console.error('Erro ao carregar responsáveis:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!descricao.trim()) {
      alert('A descrição do responsável não pode ser vazia.');
      return;
    }

    try {
      if (editingId) {
        // Update existing
        const { error } = await supabase
          .from('responsavel')
          .update({ descricao: descricao.trim() })
          .eq('id', editingId);
        if (error) throw error;
        alert('Responsável atualizado com sucesso!');
        setEditingId(null);
      } else {
        // Add new
        const { error } = await supabase
          .from('responsavel')
          .insert([{ descricao: descricao.trim() }]);
        if (error) throw error;
        alert('Responsável adicionado com sucesso!');
      }
      setDescricao('');
      fetchResponsaveis();
    } catch (error) {
      alert('Erro ao salvar responsável: ' + error.message);
      console.error('Erro ao salvar responsável:', error);
    }
  };

  const handleEdit = (responsavel) => {
    setDescricao(responsavel.descricao);
    setEditingId(responsavel.id);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir este responsável?')) {
      return;
    }
    try {
      const { error } = await supabase
        .from('responsavel')
        .delete()
        .eq('id', id);
      if (error) throw error;
      alert('Responsável excluído com sucesso!');
      fetchResponsaveis();
    } catch (error) {
      alert('Erro ao excluir responsável: ' + error.message);
      console.error('Erro ao excluir responsável:', error);
    }
  };

  if (loading) {
    return (
      <div className="crud-container">
        <div className="loading">
          <div className="spinner"></div>
          <p>Carregando responsáveis...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="crud-container">
      <h2>{editingId ? 'Editar Responsável' : 'Novo Responsável'}</h2>
      <form onSubmit={handleSubmit} className="crud-form">
        <input
          type="text"
          placeholder="Nome do Responsável"
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
        />
        <button type="submit">{editingId ? 'Atualizar' : 'Adicionar'}</button>
        {editingId && (
          <button type="button" onClick={() => { setEditingId(null); setDescricao(''); }} className="cancel-button">
            Cancelar Edição
          </button>
        )}
      </form>

      <h3>Responsáveis Cadastrados</h3>
      {responsaveis.length === 0 ? (
        <p className="empty-state">Nenhum responsável cadastrado ainda.</p>
      ) : (
        <ul className="crud-list">
          {responsaveis.map((resp) => (
            <li key={resp.id} className="crud-item">
              <span>{resp.descricao}</span>
              <div className="crud-actions">
                <button onClick={() => handleEdit(resp)} className="edit-button">Editar</button>
                <button onClick={() => handleDelete(resp.id)} className="delete-button">Excluir</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default ResponsavelForm;