-- ========================================================
-- SISTEMA DE GESTÃO DE DOAÇÕES FMP - POSTGRESQL (pgAdmin)
-- Script DDL, DML e DQL - Desafio Técnico Aula 10
-- ========================================================

-- 1. LIMPEZA PRÉVIA DAS TABELAS
DROP TABLE IF EXISTS registros_edicao CASCADE;
DROP TABLE IF EXISTS notificacoes CASCADE;
DROP TABLE IF EXISTS certificados CASCADE;
DROP TABLE IF EXISTS anexos CASCADE;
DROP TABLE IF EXISTS doacao_itens CASCADE;
DROP TABLE IF EXISTS itens CASCADE;
DROP TABLE IF EXISTS doacoes CASCADE;
DROP TABLE IF EXISTS itens_prioritarios CASCADE;
DROP TABLE IF EXISTS campanhas CASCADE;
DROP TABLE IF EXISTS alunos CASCADE;
DROP TABLE IF EXISTS funcionarios CASCADE;
DROP TABLE IF EXISTS usuarios CASCADE;

-- 2. DDL - CRIAÇÃO DAS TABELAS

CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    cpf CHAR(14) UNIQUE,
    email VARCHAR(100) UNIQUE NOT NULL,
    senha VARCHAR(255) NOT NULL,
    tentativas_falhas INT DEFAULT 0,
    bloqueado_ate TIMESTAMP NULL
);

CREATE TABLE funcionarios (
    id INT PRIMARY KEY,
    departamento VARCHAR(50),
    cargo VARCHAR(50),
    FOREIGN KEY (id) REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE TABLE alunos (
    id INT PRIMARY KEY,
    matricula VARCHAR(20) UNIQUE NOT NULL,
    curso VARCHAR(100),
    saldo_horas NUMERIC(10,2) DEFAULT 0.0,
    FOREIGN KEY (id) REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE TABLE campanhas (
    id SERIAL PRIMARY KEY,
    titulo VARCHAR(100) NOT NULL,
    descricao TEXT,
    data_limite DATE,
    status VARCHAR(20),
    regras_conversao TEXT,
    limite_horas NUMERIC(10,2)
);

CREATE TABLE itens_prioritarios (
    id SERIAL PRIMARY KEY,
    campanha_id INT NOT NULL,
    nome VARCHAR(100) NOT NULL,
    meta INT,
    urgencia VARCHAR(20),
    FOREIGN KEY (campanha_id) REFERENCES campanhas(id) ON DELETE CASCADE
);

CREATE TABLE doacoes (
    id SERIAL PRIMARY KEY,
    aluno_id INT NOT NULL,
    campanha_id INT,
    func_registro_id INT,
    func_validacao_id INT,
    data DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'Pendente',
    foto_evidencia BYTEA,
    motivo_reprovacao TEXT,
    horas_concedidas NUMERIC(10,2),
    horario_doacao TIME,
    retencao_anos INT,
    local_entrega VARCHAR(255),
    FOREIGN KEY (aluno_id) REFERENCES alunos(id),
    FOREIGN KEY (campanha_id) REFERENCES campanhas(id),
    FOREIGN KEY (func_registro_id) REFERENCES funcionarios(id),
    FOREIGN KEY (func_validacao_id) REFERENCES funcionarios(id)
);

CREATE TABLE itens (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    categoria VARCHAR(50)
);

-- Tabela intermediária para o relacionamento N:N entre doacoes e itens
CREATE TABLE doacao_itens (
    doacao_id INT NOT NULL,
    item_id INT NOT NULL,
    quantidade INT NOT NULL CHECK (quantidade > 0),
    PRIMARY KEY (doacao_id, item_id),
    FOREIGN KEY (doacao_id) REFERENCES doacoes(id) ON DELETE CASCADE,
    FOREIGN KEY (item_id) REFERENCES itens(id) ON DELETE CASCADE
);

CREATE TABLE anexos (
    id SERIAL PRIMARY KEY,
    doacao_id INT NOT NULL,
    nome_arquivo VARCHAR(255),
    caminho VARCHAR(255),
    FOREIGN KEY (doacao_id) REFERENCES doacoes(id) ON DELETE CASCADE
);

CREATE TABLE certificados (
    id SERIAL PRIMARY KEY,
    doacao_id INT NOT NULL UNIQUE,
    token VARCHAR(255) UNIQUE NOT NULL,
    caminho_arquivo VARCHAR(255),
    data_emissao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (doacao_id) REFERENCES doacoes(id) ON DELETE CASCADE
);

CREATE TABLE notificacoes (
    id SERIAL PRIMARY KEY,
    aluno_id INT NOT NULL,
    doacao_id INT,
    mensagem TEXT,
    data_envio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    canal VARCHAR(50),
    FOREIGN KEY (aluno_id) REFERENCES alunos(id),
    FOREIGN KEY (doacao_id) REFERENCES doacoes(id)
);

CREATE TABLE registros_edicao (
    id SERIAL PRIMARY KEY,
    doacao_id INT NOT NULL,
    funcionario_id INT NOT NULL,
    data TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    campo_alterado VARCHAR(100),
    valor_antigo TEXT,
    valor_novo TEXT,
    FOREIGN KEY (doacao_id) REFERENCES doacoes(id),
    FOREIGN KEY (funcionario_id) REFERENCES funcionarios(id)
);


-- ========================================================
-- 3. DML - CARGA INICIAL DE DADOS
-- ========================================================

INSERT INTO usuarios (id, nome, cpf, email, senha) VALUES
(1, 'Administrador Geral', '000.000.000-00', 'admin@fmpsc.edu.br', '$2a$10$msgShVeDL9KCBr89ToEeke3ZvxYw2Ul6QsC.5H0thD4Y7UemI.zBS'),
(2, 'Davi', '111.111.111-11', 'davi@aluno.fmpsc.edu.br', '$2a$10$yDSG8/NNll0eOOXXBujQUO/beqHb1tU1UUTbjpVp9XxmoI8aXTnYG'),
(3, 'Eduardo', '222.222.222-22', 'eduardo@aluno.fmpsc.edu.br', '$2a$10$VgD61OxdV8GwQsT0nAkyZedcD15vARjM4QIbUWd29EGqjBNPBnJW2'),
(4, 'Lucas Schutz', '333.333.333-33', 'lucas@aluno.fmpsc.edu.br', '$2a$10$M6UkKvKDq3n8HGYv96ei/.EuXbz8sX1Ro1n7RSvgMLRRKUC.1zqNC'),
(5, 'Vitor', '444.444.444-44', 'vitor@aluno.fmpsc.edu.br', '$2a$10$uoGXR34Z6Td97IagAxamKeqTnP05xmO6S7I65FMqYTSyy9vGJnKui'),
(6, 'Mariana Costa', '555.555.555-55', 'mariana@fmpsc.edu.br', '$2a$10$msgShVeDL9KCBr89ToEeke3ZvxYw2Ul6QsC.5H0thD4Y7UemI.zBS'),
(7, 'Carlos Menezes', '666.666.666-66', 'carlos@fmpsc.edu.br', '$2a$10$msgShVeDL9KCBr89ToEeke3ZvxYw2Ul6QsC.5H0thD4Y7UemI.zBS');

SELECT setval('usuarios_id_seq', (SELECT MAX(id) FROM usuarios));

INSERT INTO funcionarios (id, departamento, cargo) VALUES
(1, 'COPER', 'Administrador'),
(6, 'COPER', 'Coordenadora'),
(7, 'Secretaria Acadêmica', 'Assistente');

INSERT INTO alunos (id, matricula, curso, saldo_horas) VALUES
(2, '19875', 'Análise e Desenvolvimento de Sistemas', 20.00),
(3, '19876', 'Análise e Desenvolvimento de Sistemas', 55.00),
(4, '19877', 'Análise e Desenvolvimento de Sistemas', 21.00),
(5, '19878', 'Análise e Desenvolvimento de Sistemas', 45.00);

INSERT INTO campanhas (id, titulo, descricao, data_limite, status, regras_conversao, limite_horas) VALUES
(1, 'Campanha de Inverno 2026', 'Arrecadação de agasalhos e cobertores.', '2026-08-30', 'Ativa', '1 agasalho/cobertor = 5 horas', 40.00),
(2, 'SOS Enchentes RS', 'Alimentos não perecíveis e água potável.', '2026-07-15', 'Ativa', '1 kg/item = 2 horas', 30.00),
(3, 'Material Escolar Solidário', 'Kits para o início do ano letivo.', '2026-03-10', 'Encerrada', '1 kit completo = 10 horas', 20.00);

SELECT setval('campanhas_id_seq', (SELECT MAX(id) FROM campanhas));

INSERT INTO itens (id, nome, categoria) VALUES
(1, 'Cobertor Grosso', 'Agasalho'),
(2, 'Casaco de Frio', 'Agasalho'),
(3, 'Arroz (Pacote 5kg)', 'Alimento'),
(4, 'Água Mineral (Fardo)', 'Alimento'),
(5, 'Caderno Universitário', 'Material Escolar');

SELECT setval('itens_id_seq', (SELECT MAX(id) FROM itens));

INSERT INTO doacoes (id, aluno_id, campanha_id, func_registro_id, func_validacao_id, data, status, horas_concedidas, horario_doacao, retencao_anos, local_entrega) VALUES
(1, 2, 1, 1, 1, '2026-06-01', 'Aprovada', 10.00, '08:30:00', 10, 'Recepção Principal FMP'),
(2, 3, 2, 1, 1, '2026-06-20', 'Aprovada', 20.00, '11:00:00', 10, 'Hemocentro SC'),
(3, 4, 2, 1, 1, '2026-06-12', 'Aprovada', 6.00, '09:15:00', 10, 'Recepção Principal FMP');

SELECT setval('doacoes_id_seq', (SELECT MAX(id) FROM doacoes));

INSERT INTO doacao_itens (doacao_id, item_id, quantidade) VALUES
(1, 1, 2), -- Doação 1 do Davi possui 2 Cobertores Grossos
(2, 4, 10), -- Doação 2 do Eduardo possui 10 Fardos de Água
(3, 3, 3); -- Doação 3 do Lucas possui 3 Pacotes de Arroz


-- Itens prioritários das campanhas
INSERT INTO itens_prioritarios (id, campanha_id, nome, meta, urgencia) VALUES
(1, 1, 'Cobertor Grosso', 100, 'Alta'),
(2, 1, 'Casaco de Frio', 80, 'Média'),
(3, 2, 'Arroz (Pacote 5kg)', 200, 'Alta');

SELECT setval('itens_prioritarios_id_seq', (SELECT MAX(id) FROM itens_prioritarios));

-- Anexos (comprovantes das doações)
INSERT INTO anexos (id, doacao_id, nome_arquivo, caminho) VALUES
(1, 1, 'comprovante_doacao1.jpg', '/uploads/anexos/comprovante_doacao1.jpg'),
(2, 2, 'comprovante_doacao2.jpg', '/uploads/anexos/comprovante_doacao2.jpg'),
(3, 3, 'comprovante_doacao3.jpg', '/uploads/anexos/comprovante_doacao3.jpg');

SELECT setval('anexos_id_seq', (SELECT MAX(id) FROM anexos));

-- Certificados (um por doação aprovada)
INSERT INTO certificados (id, doacao_id, token, caminho_arquivo) VALUES
(1, 1, 'CERT-FMP-2026-0001', '/certificados/cert_0001.pdf'),
(2, 2, 'CERT-FMP-2026-0002', '/certificados/cert_0002.pdf'),
(3, 3, 'CERT-FMP-2026-0003', '/certificados/cert_0003.pdf');

SELECT setval('certificados_id_seq', (SELECT MAX(id) FROM certificados));

-- Notificações enviadas aos alunos
INSERT INTO notificacoes (id, aluno_id, doacao_id, mensagem, canal) VALUES
(1, 2, 1, 'Sua doação foi aprovada e 10 horas foram creditadas.', 'E-mail'),
(2, 3, 2, 'Sua doação foi aprovada e 20 horas foram creditadas.', 'E-mail'),
(3, 4, 3, 'Sua doação foi aprovada e 6 horas foram creditadas.', 'Sistema');

SELECT setval('notificacoes_id_seq', (SELECT MAX(id) FROM notificacoes));

-- Registros de edição (auditoria)
INSERT INTO registros_edicao (id, doacao_id, funcionario_id, campo_alterado, valor_antigo, valor_novo) VALUES
(1, 1, 6, 'horas_concedidas', '8.00', '10.00'),
(2, 2, 6, 'status', 'Pendente', 'Aprovada'),
(3, 3, 7, 'local_entrega', 'Recepção', 'Recepção Principal FMP');

SELECT setval('registros_edicao_id_seq', (SELECT MAX(id) FROM registros_edicao));


-- ========================================================
-- 4. DQL - CONSULTAS COM JOIN (Exigência do Desafio)
-- ========================================================

-- Consulta 1: Listagem das doações com dados do aluno e da campanha
SELECT 
    d.id AS doacao_id,
    u.nome AS aluno,
    a.matricula,
    c.titulo AS campanha,
    d.data,
    d.status,
    d.horas_concedidas
FROM doacoes d
JOIN alunos a ON d.aluno_id = a.id
JOIN usuarios u ON a.id = u.id
JOIN campanhas c ON d.campanha_id = c.id;

-- Consulta 2: Detalhamento dos itens doados (JOIN com a tabela intermediária N:N)
SELECT 
    d.id AS doacao_id,
    u.nome AS doador,
    c.titulo AS campanha,
    i.nome AS item_doado,
    i.categoria,
    di.quantidade
FROM doacoes d
JOIN alunos a ON d.aluno_id = a.id
JOIN usuarios u ON a.id = u.id
JOIN campanhas c ON d.campanha_id = c.id
JOIN doacao_itens di ON d.id = di.doacao_id
JOIN itens i ON di.item_id = i.id;