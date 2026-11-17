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

Gerencia o estado global de autenticação, usuário logado e busca automática do **Perfil Completo** (`GET /api/auth/perfil`):

```jsx
import React, { createContext, useContext, useState, useEffect } from "react";
import api from "../services/api";

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [perfil, setPerfil] = useState(null);
  const [token, setToken] = useState(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    async function restaurarSessao() {
      const tokenSalvo = localStorage.getItem("@DoacoesFMP:token");
      const usuarioSalvo = localStorage.getItem("@DoacoesFMP:usuario");

      if (tokenSalvo && usuarioSalvo) {
        setToken(tokenSalvo);
        setUsuario(JSON.parse(usuarioSalvo));
        await carregarPerfil();
      }
      setCarregando(false);
    }
    restaurarSessao();
  }, []);

  async function carregarPerfil() {
    try {
      const resposta = await api.get("/api/auth/perfil");
      setPerfil(resposta.data);
    } catch (erro) {
      console.error("Erro ao carregar perfil do aluno:", erro);
    }
  }

  async function login(email, senha) {
    try {
      const resposta = await api.post("/api/auth/login", { email, senha });
      const { token: novoToken, usuario: dadosUsuario } = resposta.data;

      localStorage.setItem("@DoacoesFMP:token", novoToken);
      localStorage.setItem("@DoacoesFMP:usuario", JSON.stringify(dadosUsuario));

      setToken(novoToken);
      setUsuario(dadosUsuario);

      // Busca dados completos do perfil (matrícula, curso e saldo de horas)
      const resPerfil = await api.get("/api/auth/perfil", {
        headers: { Authorization: `Bearer ${novoToken}` }
      });
      setPerfil(resPerfil.data);

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
    setPerfil(null);
  }

  return (
    <AuthContext.Provider
      value={{
        autenticado: !!usuario,
        usuario,
        perfil,
        carregarPerfil,
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

## 📋 6. Exemplo: Listagem de Doações com Saldo de Horas (`src/pages/DoacoesPage.jsx`)

Renderiza a lista consumindo `GET /api/doacoes` e exibe o saldo de horas via `perfil`:

```jsx
import React, { useEffect, useState } from "react";
import api from "../services/api";
import { useAuth } from "../contexts/AuthContext";

export function DoacoesPage() {
  const [doacoes, setDoacoes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const { usuario, perfil, logout } = useAuth();

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
          <p>
            Aluno: <strong>{perfil?.nome || usuario?.nome}</strong> | Matrícula: <strong>{perfil?.matricula || "—"}</strong>
          </p>
          <p>
            Curso: <strong>{perfil?.curso || "ADS"}</strong> | Saldo de Horas: <strong>{perfil?.saldo_horas || "0.00"}h</strong>
          </p>
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

## 📦 7. Exemplo: Catálogo de Itens Aceitos (`GET /api/itens`)

Componente ou modal para seleção/listagem de itens cadastrados no banco de dados:

```jsx
import React, { useEffect, useState } from "react";
import api from "../services/api";

export function CatalogoItens() {
  const [itens, setItens] = useState([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    async function carregarItens() {
      try {
        const resposta = await api.get("/api/itens");
        setItens(resposta.data);
      } catch (erro) {
        console.error("Erro ao buscar catálogo de itens:", erro);
      } finally {
        setCarregando(false);
      }
    }
    carregarItens();
  }, []);

  if (carregando) return <p>Carregando itens...</p>;

  return (
    <div>
      <h3>Itens Aceitos para Doação</h3>
      <ul>
        {itens.map((item) => (
          <li key={item.id}>
            <strong>{item.nome}</strong> — Categoria: <em>{item.categoria}</em>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

---

## 🎯 Resumo dos Campos Retornados pela API

### Doações (`GET /api/doacoes`)
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

### Perfil do Usuário (`GET /api/auth/perfil`)
| Campo na API | Tipo | Exemplo |
|---|---|---|
| `id` | number | `2` |
| `nome` | string | `"Davi"` |
| `email` | string | `"davi@aluno.fmpsc.edu.br"` |
| `cpf` | string / null | `"111.111.111-11"` |
| `matricula` | string | `"19875"` |
| `curso` | string | `"Análise e Desenvolvimento de Sistemas"` |
| `saldo_horas` | string (numeric) | `"20.00"` |

### Catálogo de Itens (`GET /api/itens`)
| Campo na API | Tipo | Exemplo |
|---|---|---|
| `id` | number | `1` |
| `nome` | string | `"Cobertor Grosso"` |
| `categoria` | string | `"Agasalho"` |
