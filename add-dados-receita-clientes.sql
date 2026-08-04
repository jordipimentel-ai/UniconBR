-- Campos extras de clientes PJ preenchidos a partir da consulta de CNPJ
-- (BrasilAPI / base pública da Receita Federal), todos editáveis no cadastro.
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS nome_fantasia TEXT;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS endereco TEXT;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS cnaes TEXT;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS porte TEXT;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS natureza_juridica TEXT;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS data_abertura DATE;
