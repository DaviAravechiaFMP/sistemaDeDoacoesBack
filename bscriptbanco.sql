CREATE TABLE aluno (
    matricula CHAR(8) PRIMARY KEY,
    nome VARCHAR(50) NOT NULL,
    email VARCHAR(50) UNIQUE NOT NULL,
    senha CHAR(60) NOT NULL
);

CREATE TABLE funcionario (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(50) NOT NULL,
    email VARCHAR(50) UNIQUE NOT NULL,
    senha CHAR(60) NOT NULL
);

CREATE TABLE campanha (
    id SERIAL PRIMARY KEY,
    titulo VARCHAR(40) NOT NULL,
    descricao VARCHAR(100),
    data_limite DATE,
    status CHAR(1) NOT NULL
);

CREATE TABLE item_prioritario (
    id SERIAL PRIMARY KEY,
    campanha_id INT NOT NULL,
    nome VARCHAR(30),
    urgencia CHAR(1),
    FOREIGN KEY (campanha_id) REFERENCES campanha(id)
);

CREATE TABLE doacao (
    id SERIAL PRIMARY KEY,
    aluno_matricula CHAR(8) NOT NULL,
    funcionario_id INT,
    campanha_id INT NOT NULL,
    tipo_item VARCHAR(20),
    quantidade SMALLINT,
    data_hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    horas_concedidas DECIMAL(5,2),
    status CHAR(1) DEFAULT 'P',
    FOREIGN KEY (aluno_matricula) REFERENCES aluno(matricula),
    FOREIGN KEY (funcionario_id) REFERENCES funcionario(id),
    FOREIGN KEY (campanha_id) REFERENCES campanha(id)
);

CREATE TABLE anexo (
    id SERIAL PRIMARY KEY,
    doacao_id INT NOT NULL,
    nome_arquivo VARCHAR(50),
    caminho VARCHAR(100),
    FOREIGN KEY (doacao_id) REFERENCES doacao(id)
);

CREATE TABLE certificado (
    id SERIAL PRIMARY KEY,
    doacao_id INT UNIQUE NOT NULL,
    token CHAR(36) UNIQUE NOT NULL,
    caminho_arquivo VARCHAR(100),
    data_emissao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (doacao_id) REFERENCES doacao(id)
);

CREATE TABLE registro_edicao (
    id SERIAL PRIMARY KEY,
    doacao_id INT NOT NULL,
    funcionario_id INT,
    data_hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    campo_alterado VARCHAR(30),
    valor_antigo VARCHAR(100),
    valor_novo VARCHAR(100),
    FOREIGN KEY (doacao_id) REFERENCES doacao(id),
    FOREIGN KEY (funcionario_id) REFERENCES funcionario(id)
);

CREATE TABLE notificacao (
    id SERIAL PRIMARY KEY,
    aluno_matricula CHAR(8) NOT NULL,
    mensagem VARCHAR(100),
    data_envio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    lida BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (aluno_matricula) REFERENCES aluno(matricula)
);