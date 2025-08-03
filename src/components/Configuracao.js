import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import './Configuracao.css';

function Configuracao({ isDarkTheme, toggleTheme, showDialog }) {
  const [dataCorte, setDataCorte] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchDataCorte = React.useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('config_projeto')
        .select('data_corte')
        .eq('id', 1) // Usando um ID numérico fixo para a configuração única
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = No rows found
        throw error;
      }
    // Se não houver registro, cria um padrão com data_corte nula
    if (!data) {
      const { error: insertError } = await supabase.from('config_projeto').insert({ id: 1, data_corte: null });
      if (insertError) throw insertError;
      setDataCorte('');
    } else {
      setDataCorte(data.data_corte);
    }
    } catch (error) {
      showDialog('Erro', 'Erro ao carregar data de corte: ' + error.message);
      console.error('Erro ao carregar data de corte:', error);
    } finally {
      setLoading(false);
    }
  }, [showDialog]);

  useEffect(() => {
    fetchDataCorte();
  }, [fetchDataCorte]);

  const handleSaveDataCorte = async () => {
    setLoading(true);
    try {
      // Tenta atualizar
      const { data, error } = await supabase
        .from('config_projeto')
        .update({ data_corte: dataCorte })
        .eq('id', 1)
        .select();

      if (error) throw error;

      // Se não atualizou nenhuma linha, faz o insert
      if (data.length === 0) {
        const { error: insertError } = await supabase
          .from('config_projeto')
          .insert({ id: 1, data_corte: dataCorte });
        if (insertError) throw insertError;
      }

      showDialog('Sucesso', 'Data de corte salva com sucesso!');
    } catch (error) {
      showDialog('Erro', 'Erro ao salvar data de corte: ' + error.message);
      console.error('Erro ao salvar data de corte:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <h2>⚙️ Configurações</h2>

      <div className="config-section">
        <h3>Tema do Aplicativo</h3>
        <p>Alterne entre o tema claro e escuro para uma melhor experiência visual.</p>
        <button className="theme-toggle-config" onClick={toggleTheme} disabled={loading}>
          {isDarkTheme ? '☀️ Mudar para Tema Claro' : '🌙 Mudar para Tema Escuro'}
        </button>
      </div>

      <div className="config-section">
        <h3>Data de Corte</h3>
        <p>Defina a data de corte para o fechamento de faturas ou relatórios.</p>
        <div className="form-group">
          <label htmlFor="dataCorte">Data de Corte:</label>
          <input
            type="date"
            id="dataCorte"
            value={dataCorte}
            onChange={(e) => setDataCorte(e.target.value)}
            disabled={loading}
          />
        </div>
        <button className="save-button" onClick={handleSaveDataCorte} disabled={loading}>
          {loading ? 'Salvando...' : 'Salvar Data de Corte'}
        </button>
      </div>
    </>
  );
}

export default Configuracao;
