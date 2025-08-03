import React from 'react';
import { createClient } from '@supabase/supabase-js';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import './AuthStyles.css'; // Importa os novos estilos

// Substitua com suas credenciais do Supabase
const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

function AuthComponent() {
  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2 className="auth-title">Acessar Controle de Gastos</h2>
        <Auth
          supabaseClient={supabase}
          appearance={{ theme: ThemeSupa }}
          providers={[]}
          redirectTo={window.location.origin}
          view="sign_in" // Garante que a tela inicial seja sempre a de login
          localization={{
            variables: {
              sign_in: {
                email_label: 'Seu e-mail',
                password_label: 'Sua senha',
                button_label: 'Entrar',
                social_provider_text: 'Entrar com {{provider}}',
                link_text: 'Já tem uma conta? Entrar',
              },
              forgotten_password: {
                link_text: 'Esqueceu sua senha?',
                button_label: 'Enviar instruções de redefinição',
                email_label: 'Seu e-mail',
                password_label: 'Sua nova senha',
                confirmation_text: 'Verifique seu e-mail para o link de redefinição de senha',
              },
              update_password: {
                button_label: 'Atualizar senha',
              },
              sign_up: {
                link_text: '', // Remove o link de cadastro
              },
            },
          }}
        />
      </div>
    </div>
  );
}

export default AuthComponent;
