import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import AuthComponent from './AuthComponent';
import Sidebar from './components/Sidebar';
import AddGastoForm from './components/AddGastoForm';
import GastosList from './components/GastosList';
import CategoriaForm from './components/CategoriaForm';
import TipoPagamentoForm from './components/TipoPagamentoForm';
import ResponsavelForm from './components/ResponsavelForm';
import ResumoGastos from './components/ResumoGastos';
import ManutencaoGastos from './components/ManutencaoGastos';
import Configuracao from './components/Configuracao';
import CustomDialog from './components/CustomDialog';
import Home from './components/Home';
import './App.css';

// Substitua com suas credenciais do Supabase
const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('home');  
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDarkTheme, setIsDarkTheme] = useState(false);
  const [gastoToEdit, setGastoToEdit] = useState(null);
  const [dialogState, setDialogState] = useState({
    isOpen: false,
    title: '',
    message: '',
    showConfirm: false,
    onConfirm: null
  });
  const [showDateWarning, setShowDateWarning] = useState(false);
  const [userName, setUserName] = useState(''); // Novo estado para o nome do usuário

  // Debug: Log das variáveis de ambiente
  useEffect(() => {
    console.log('REACT_APP_SUPABASE_URL:', process.env.REACT_APP_SUPABASE_URL);
    console.log('REACT_APP_SUPABASE_ANON_KEY:', process.env.REACT_APP_SUPABASE_ANON_KEY ? 'Definida' : 'Não definida');
  }, []);

  // Load theme preference from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setIsDarkTheme(true);
      document.documentElement.classList.add('dark-theme');
    }
  }, []);

  // Gerenciar sessão de autenticação
  useEffect(() => {
    console.log('Iniciando verificação de sessão...');
    
    // Obter sessão inicial
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      console.log('Sessão obtida:', session);
      console.log('Erro na sessão:', error);
      setSession(session);
      setLoading(false);
    }).catch((error) => {
      console.error('Erro ao obter sessão:', error);
      setLoading(false);
    });

    // Escutar mudanças na autenticação
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('Mudança de estado de auth:', _event, session);
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Debug: Log dos estados
  useEffect(() => {
    console.log('Estado atual - Loading:', loading, 'Session:', session);
  }, [loading, session]);

  // Nova lógica para buscar o nome do usuário
  useEffect(() => {
  const fetchUserName = async () => {
    if (session?.user?.id) {
      try {
        const { data, error } = await supabase
          .from('usuario')
          .select('id, id_auth, nome')
          .eq('id_auth', session.user.id)
          .single();

        console.log('Dados retornados da tabela usuario:', data, 'Erro:', error);

        if (error) {
          console.error('Erro ao buscar nome do usuário:', error.message);
          setUserName(session.user.email);
          return;
        }

        if (data) {
          console.log('Campos do usuário:', data);
        }

        if (data && data.nome && data.nome.trim() !== '') {
          setUserName(data.nome);
        } else {
          setUserName(session.user.email);
        }
      } catch (error) {
        console.error('Erro inesperado ao buscar nome do usuário:', error.message);
        setUserName(session.user.email);
      }
    } else {
      setUserName('');
    }
  };

  fetchUserName();
}, [session]);

  // Nova lógica para verificar data_corte
  useEffect(() => {
    const checkDataCorte = async () => {
      try {
        const { data, error } = await supabase
          .from('config_projeto')
          .select('data_corte')
          .eq('id', 1)
          .single();

        if (error) {
          console.error('Erro ao buscar data_corte:', error.message);
          return;
        }

        if (data && data.data_corte) {
          const dataCorte = new Date(data.data_corte);
          const hoje = new Date();
          // Zera as horas para comparar apenas as datas
          dataCorte.setHours(0, 0, 0, 0);
          hoje.setHours(0, 0, 0, 0);

          if (hoje > dataCorte) {
            setShowDateWarning(true);
          } else {
            setShowDateWarning(false);
          }
        }
      } catch (error) {
        console.error('Erro inesperado ao verificar data_corte:', error.message);
      }
    };

    // Executa a verificação apenas se houver sessão e não estiver carregando
    if (session && !loading) {
      checkDataCorte();
    }
  }, [session, loading]); // Depende da sessão e do estado de carregamento

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const toggleTheme = () => {
    const newTheme = !isDarkTheme;
    setIsDarkTheme(newTheme);
    
    if (newTheme) {
      document.documentElement.classList.add('dark-theme');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark-theme');
      localStorage.setItem('theme', 'light');
    }
  };

  const handleGastoAdded = () => {
    setRefreshTrigger(prev => prev + 1);
    setGastoToEdit(null);
  };

  const handleEditGasto = (gasto) => {
    setGastoToEdit(gasto);
    setActiveTab('gastos');
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const showDialog = (title, message, showConfirm = false, onConfirm = null) => {
    setDialogState({
      isOpen: true,
      title,
      message,
      showConfirm,
      onConfirm
    });
  };

  const closeDialog = () => {
    setDialogState({
      isOpen: false,
      title: '',
      message: '',
      showConfirm: false,
      onConfirm: null
    });
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'gastos':
        return (
          <>
            <AddGastoForm 
              onGastoAdded={handleGastoAdded} 
              gastoToEdit={gastoToEdit}
              onCancelEdit={() => setGastoToEdit(null)}
              userId={session?.user?.id} // Passando o ID do usuário
            />
            {showDateWarning && (
              <p style={{ color: 'red', textAlign: 'center', marginTop: '10px' }}>
                Ajuste a data de corte nas configurações do projeto.
              </p>
            )}
            <GastosList 
              refreshTrigger={refreshTrigger} 
              onEditGasto={handleEditGasto}
              showDialog={showDialog}
            />
          </>
        );
      case 'home':
        return <Home activeTab={activeTab} onTabChange={setActiveTab} userName={userName} />;
      case 'manutencao':
        return <ManutencaoGastos />;
      case 'categorias':
        return <CategoriaForm />;
      case 'Tipo de Pagamentos':
        return <TipoPagamentoForm />;
      case 'responsaveis':
        return <ResponsavelForm />;
      case 'resumo':
        return <ResumoGastos />;
      case 'configuracao':
        return (<Configuracao isDarkTheme={isDarkTheme}toggleTheme={toggleTheme}showDialog={showDialog}/>);  
      default:
        return null;
    }
  };

  // Debug: Forçar renderização da tela de login para teste
  console.log('Renderizando - Loading:', loading, 'Session:', session);

  // Mostrar loading enquanto verifica a sessão
  if (loading) {
    console.log('Renderizando loading...');
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div>Carregando... (Debug: verificando sessão)</div>
      </div>
    );
  }

  // Se não há sessão, mostrar tela de login
  if (!session) {
    console.log('Renderizando AuthComponent...');
    return <AuthComponent />;
  }

  // Se há sessão, mostrar a aplicação principal
  console.log('Renderizando aplicação principal...');
  return (
    <div className="App">
      {/* Sidebar Overlay */}
      {isSidebarOpen && (
        <div className="sidebar-overlay open" onClick={toggleSidebar}></div>
      )}
      
      {/* Sidebar */}
      <Sidebar 
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isOpen={isSidebarOpen}
        toggleSidebar={toggleSidebar}
      />
      
      <div className={`main-content ${isSidebarOpen ? 'sidebar-open' : ''}`}>
        <header className="App-header">
          <div className="header-content">
            <button className="menu-toggle" onClick={toggleSidebar}>
              ☰
            </button>
            <div className="header-text">
              <h1>Controle de Gastos</h1>
              
            </div>
            { <div className="header-actions">              
              {userName && (
                <p>Olá, {userName}</p>
              )}
            </div> }
            <div className="header-actions">              
              <button className="sign-out-btn" onClick={handleSignOut} title="Sair">
                🚪 Sair
              </button>
            </div>
          </div>
        </header>
        
        <main className="App-main">
          <div className="container">
            {renderTabContent()}
          </div>
        </main>
                
      </div>

      {/* Custom Dialog */}
      <CustomDialog
        isOpen={dialogState.isOpen}
        onClose={closeDialog}
        title={dialogState.title}
        message={dialogState.message}
        showConfirm={dialogState.showConfirm}
        onConfirm={dialogState.onConfirm}
      />
    </div>
  );
}

export default App;