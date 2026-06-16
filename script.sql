CREATE DATABASE IF NOT EXISTS findash;
USE findash;

CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    senha VARCHAR(100) NOT NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE conta (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    tipo VARCHAR(50) NOT NULL,
    saldo DECIMAL(10, 2) DEFAULT 0.00,
    instituicao VARCHAR(150),
    usuario_id INT NOT NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);


CREATE TABLE transacao (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    tipo VARCHAR(20) NOT NULL,
    titulo VARCHAR(150) NOT NULL,
    valor DECIMAL(10, 2) NOT NULL,
    valor_previsto DECIMAL(10, 2) NOT NULL,
    data DATE NOT NULL,
    categoria VARCHAR(100),
    descricao VARCHAR(255),
    status VARCHAR(30) DEFAULT 'realizado',
    conta_id INT NOT NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
    FOREIGN KEY (conta_id) REFERENCES conta(id)
);

CREATE TABLE receita (
    id INT AUTO_INCREMENT PRIMARY KEY,
    categoria VARCHAR(100),
    previsto DECIMAL(10, 2),
    recorrente BOOLEAN DEFAULT FALSE,
    transacao_id INT NOT NULL,
    FOREIGN KEY (transacao_id) REFERENCES transacao(id)
);

CREATE TABLE despesa (
    id INT AUTO_INCREMENT PRIMARY KEY,
    previsto DECIMAL(10, 2),
    parcelado BOOLEAN DEFAULT FALSE,
    categoria VARCHAR(100),
    transacao_id INT NOT NULL,
    FOREIGN KEY (transacao_id) REFERENCES transacao(id)
);

CREATE TABLE vencimento (
    id INT AUTO_INCREMENT PRIMARY KEY,
    descricao VARCHAR(255) NOT NULL,
    valor DECIMAL(10, 2) NOT NULL,
    dataVencimento DATE NOT NULL,
    status VARCHAR(30) DEFAULT 'pendente',
    dataPagamento DATE,
    usuario_id INT NOT NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

CREATE TABLE meta (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    valorAlvo DECIMAL(10, 2) NOT NULL,
    valorAtual DECIMAL(10, 2) DEFAULT 0.00,
    aporteMensal DECIMAL(10, 2) DEFAULT 0.00,
    prazo DATE,
    usuario_id INT NOT NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);
