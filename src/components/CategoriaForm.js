import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import './CrudForm.css';

function CategoriaForm() {
  const [descricao, setDescricao] = useState('');
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [categoriasUsadas, setCategoriasUsadas] = useState([]); // NOVO

  useEffect(() => {
    fetchCategorias();
    fetchCategoriasUsadas(); // NOVO
  }, []);

  const fetchCategorias = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('categoria')
        .select('*')
        .order('descricao', { ascending: true });
      if (error) throw error;
      setCategorias(data);
    } catch (error) {
      alert('Erro ao carregar categorias: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // NOVO: Busca IDs de categorias usadas em gastos
  const fetchCategoriasUsadas = async () => {
    const { data, error } = await supabase
      .from('gastos')
      .select('id_categoria');
    if (!error && data) {
      setCategoriasUsadas([...new Set(data.map(g => g.id_categoria))]);
    }
  };

  // Chame fetchCategoriasUsadas após adicionar, editar ou excluir
  const afterChange = () => {
    fetchCategorias();
    fetchCategoriasUsadas();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!descricao.trim()) {
      alert('A descrição da categoria não pode ser vazia.');
      return;
    }

    try {
      if (editingId) {
        const { error } = await supabase
          .from('categoria')
          .update({ descricao: descricao.trim() })
          .eq('id', editingId);
        if (error) throw error;
        alert('Categoria atualizada com sucesso!');
        setEditingId(null);
      } else {
        const { error } = await supabase
          .from('categoria')
          .insert([{ descricao: descricao.trim() }]);
        if (error) throw error;
        alert('Categoria adicionada com sucesso!');
      }
      setDescricao('');
      afterChange(); // Use afterChange
    } catch (error) {
      alert('Erro ao salvar categoria: ' + error.message);
    }
  };

  const handleEdit = (categoria) => {
    setDescricao(categoria.descricao);
    setEditingId(categoria.id);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir esta categoria?')) {
      return;
    }
    try {
      const { error } = await supabase
        .from('categoria')
        .delete()
        .eq('id', id);
      if (error) throw error;
      alert('Categoria excluída com sucesso!');
      afterChange(); // Use afterChange
    } catch (error) {
      alert('Erro ao excluir categoria: ' + error.message);
    }
  };

  if (loading) {
    return (
      <div className="crud-container">
        <div className="loading">
          <div className="spinner"></div>
          <p>Carregando categorias...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="crud-container">
      <h2>{editingId ? 'Editar Categoria' : 'Nova Categoria'}</h2>
      <form onSubmit={handleSubmit} className="crud-form">
        <input
          type="text"
          placeholder="Descrição da Categoria"
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

      <h3>Categorias Cadastradas</h3>
      {categorias.length === 0 ? (
        <p className="empty-state">Nenhuma categoria cadastrada ainda.</p>
      ) : (
        <ul className="crud-list">
          {categorias.map((cat) => (
            <li key={cat.id} className="crud-item">
              <span>{cat.descricao}</span>
              <div className="crud-actions">
                <button onClick={() => handleEdit(cat)} className="edit-button">Editar</button>
                {/* Só mostra o botão excluir se NÃO estiver em uso */}
                {!categoriasUsadas.includes(cat.id) && (
                  <button onClick={() => handleDelete(cat.id)} className="delete-button">Excluir</button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default CategoriaForm;