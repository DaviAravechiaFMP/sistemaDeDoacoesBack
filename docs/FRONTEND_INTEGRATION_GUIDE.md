# 💻 Guia de Integração Front-end (React + Vite) — Sistema de Doações FMP

> **Instrução para a IA do Front-end:**  
> Utilize as instruções, variáveis e códigos deste arquivo para implementar a camada de comunicação HTTP, controle de sessão/autenticação e renderização das telas no ecossistema **React + Vite**.

---

## 📦 1. Dependências Necessárias

No projeto React/Vite, certifique-se de instalar o Axios e o React Router DOM:

```bash
npm install axios react-router-dom
```

---

## ⚙️ 2. Variáveis de Ambiente (`.env`)

Crie o arquivo `.env` na raiz do seu projeto React:

```env
# URL base do back-end Node.js
VITE_API_URL=http://localhost:3000
```
*(Em produção na Vercel/Netlify, altere para a URL pública do back-end no Render).*

---

## 🌐 3. Cliente HTTP (`src/services/api.js`)

Instância do Axios com interceptor que anexa automaticamente o cabeçalho `Authorization: Bearer <token>` em todas as requisições protegidas:

```javascript
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000",
  headers: {
    "Content-Type": "application/json"
  }
});

// Interceptor para injetar o token JWT salvo no localStorage
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("@DoacoesFMP:token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para redirecionar se o token expirar (401)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem("@DoacoesFMP:token");
      localStorage.removeItem("@DoacoesFMP:usuario");
      // Se não estiver já na página de login, redireciona
      if (!window.location.pathname.includes("/login")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;
```

---

## 🔑 4. Contexto de Autenticação (`src/contexts/AuthContext.jsx`)

Gerencia o estado global de autenticação (usuário logado, token JWT e funções de login/logout):

```jsx
import React, { createContext, useContext, useState, useEffect } from "react";
import api from "../services/api";

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [token, setToken] = useState(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    // Restaura sessão salva
    const tokenSalvo = localStorage.getItem("@DoacoesFMP:token");
    const usuarioSalvo = localStorage.getItem("@DoacoesFMP:usuario");

    if (tokenSalvo && usuarioSalvo) {
      setToken(tokenSalvo);
      setUsuario(JSON.parse(usuarioSalvo));
    }
    setCarregando(false);
  }, []);

  async function login(email, senha) {
    try {
      const resposta = await api.post("/api/auth/login", { email, senha });
      const { token: novoToken, usuario: dadosUsuario } = resposta.data;

      localStorage.setItem("@DoacoesFMP:token", novoToken);
      localStorage.setItem("@DoacoesFMP:usuario", JSON.stringify(dadosUsuario));

      setToken(novoToken);
      setUsuario(dadosUsuario);
      return { sucesso: true };
    } catch (erro) {
      const mensagem = erro.response?.data?.mensagem || "Erro ao efetuar login.";
      return { sucesso: false, mensagem };
    }
  }

  function logout() {
    localStorage.removeItem("@DoacoesFMP:token");
    localStorage.removeItem("@DoacoesFMP:usuario");
    setToken(null);
    setUsuario(null);
  }

  return (
    <AuthContext.Provider
      value={{
        autenticado: !!usuario,
        usuario,
        token,
        carregando,
        login,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth deve ser utilizado dentro de um AuthProvider");
  }
  return context;
}
```

---

## 🛡️ 5. Rota Protegida (`src/components/PrivateRoute.jsx`)

Protege as rotas privadas da aplicação. Se não autenticado, redireciona o usuário para `/login`:

```jsx
import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export function PrivateRoute() {
  const { autenticado, carregando } = useAuth();

  if (carregando) {
    return (
      <div style={{ display: "flex", justifyContent: "center", marginTop: "50px" }}>
        <p>Carregando sessão...</p>
      </div>
    );
  }

  return autenticado ? <Outlet /> : <Navigate to="/login" replace />;
}
```

---

## 📋 6. Exemplo: Listagem de Doações (`src/pages/DoacoesPage.jsx`)

Renderiza a lista consumindo `GET /api/doacoes` utilizando **exatamente os campos retornados pela API**:

```jsx
import React, { useEffect, useState } from "react";
import api from "../services/api";
import { useAuth } from "../contexts/AuthContext";

export function DoacoesPage() {
  const [doacoes, setDoacoes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const { usuario, logout } = useAuth();

  useEffect(() => {
    carregarDoacoes();
  }, []);

  async function carregarDoacoes() {
    try {
      setCarregando(true);
      const resposta = await api.get("/api/doacoes");
      setDoacoes(resposta.data);
    } catch (err) {
      setErro(err.response?.data?.mensagem || "Não foi possível carregar as doações.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div style={{ maxWidth: "1000px", margin: "30px auto", padding: "0 20px" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2>Gestão de Doações — FMP</h2>
          <p>Bem-vindo(a), <strong>{usuario?.nome}</strong></p>
        </div>
        <button onClick={logout} style={{ padding: "8px 16px", cursor: "pointer" }}>
          Sair
        </button>
      </header>

      <hr style={{ margin: "20px 0" }} />

      {carregando && <p>Carregando doações do PostgreSQL...</p>}
      {erro && <p style={{ color: "red" }}>{erro}</p>}

      {!carregando && !erro && (
        <table border="1" cellPadding="10" style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f2f2f2" }}>
              <th>ID</th>
              <th>Doador</th>
              <th>Campanha</th>
              <th>Data</th>
              <th>Status</th>
              <th>Horas Concedidas</th>
              <th>Local de Entrega</th>
            </tr>
          </thead>
          <tbody>
            {doacoes.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: "center" }}>Nenhuma doação cadastrada.</td>
              </tr>
            ) : (
              doacoes.map((item) => (
                <tr key={item.id}>
                  <td>{item.id}</td>
                  <td>{item.doador}</td>
                  <td>{item.campanha || "Geral (Sem campanha)"}</td>
                  <td>{new Date(item.data).toLocaleDateString("pt-BR")}</td>
                  <td>
                    <span
                      style={{
                        padding: "3px 8px",
                        borderRadius: "4px",
                        backgroundColor:
                          item.status === "Aprovada" ? "#d4edda" :
                          item.status === "Reprovada" ? "#f8d7da" : "#fff3cd",
                        color:
                          item.status === "Aprovada" ? "#155724" :
                          item.status === "Reprovada" ? "#721c24" : "#856404"
                      }}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td>{item.horas_concedidas ? `${item.horas_concedidas}h` : "—"}</td>
                  <td>{item.local_entrega}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
```

---

## 🗺️ 7. Configuração das Rotas no `App.jsx`

```jsx
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { PrivateRoute } from "./components/PrivateRoute";
import { LoginPage } from "./pages/LoginPage";
import { DoacoesPage } from "./pages/DoacoesPage";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Rotas Públicas */}
          <Route path="/login" element={<LoginPage />} />

          {/* Rotas Protegidas com JWT */}
          <Route element={<PrivateRoute />}>
            <Route path="/doacoes" element={<DoacoesPage />} />
          </Route>

          {/* Redirecionamento Padrão */}
          <Route path="*" element={<Navigate to="/doacoes" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
```

---

## 🎯 Resumo dos Nomes de Campos Retornados pela API

| Campo na API | Tipo | Exemplo |
|---|---|---|
| `id` | number | `1` |
| `aluno_id` | number | `2` |
| `doador` | string | `"Davi"` |
| `campanha_id` | number / null | `1` |
| `campanha` | string / null | `"Campanha de Inverno 2026"` |
| `data` | string (ISO date) | `"2026-06-01"` |
| `status` | string | `"Pendente"`, `"Aprovada"`, `"Reprovada"` |
| `horas_concedidas`| string / null | `"10.00"` |
| `local_entrega` | string | `"Recepção Principal FMP"` |
