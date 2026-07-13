-- Script de dados de teste para o sistema de contabilidade

-- 1. Inserir tipos de processo
INSERT INTO tipos_processo (nome, descricao) VALUES
  ('Abertura de Empresa', 'Processo de constituição e registro de nova empresa'),
  ('IRPF', 'Imposto de Renda Pessoa Física'),
  ('Alteração Contratual', 'Alteração de dados da empresa já constituída'),
  ('Consultoria Tributária', 'Consultoria para planejamento tributário'),
  ('Auditoria', 'Auditoria das contas e registros'),
  ('Encerramento', 'Processo de encerramento de atividades')
ON CONFLICT DO NOTHING;

-- 2. Inserir clientes de teste
INSERT INTO clientes (nome_razao_social, cpf_cnpj, email, telefone, tipo, regime_tributario, segmento, em_funcionamento, representante, ativo) VALUES
  ('João Silva', '123.456.789-00', 'joao@email.com', '(11) 99999-8888', 'PF', 'Simples', 'Consultor', true, NULL, true),
  ('Empresa Tech LTDA', '12.345.678/0001-90', 'contato@techltda.com', '(11) 3333-4444', 'PJ', 'Lucro Presumido', 'Tecnologia', true, 'Maria Silva', true),
  ('Comércio ABC', '98.765.432/0001-11', 'vendas@comercioabc.com', '(11) 2222-3333', 'PJ', 'Simples', 'Comércio', true, 'Pedro Costa', true),
  ('Maria Santos', '987.654.321-11', 'maria@email.com', '(11) 99888-7777', 'PF', 'Simples', 'Autônoma', true, NULL, true),
  ('Indústria XYZ LTDA', '11.111.111/0001-22', 'admin@industriaxyz.com', '(11) 4444-5555', 'PJ', 'Lucro Real', 'Indústria', true, 'Carlos Santos', true)
ON CONFLICT DO NOTHING;

-- 3. Inserir processos de teste
INSERT INTO processos (cliente_id, tipo_processo_id, status, prazo, descricao)
SELECT
  c.id,
  tp.id,
  'Em andamento',
  CURRENT_DATE + INTERVAL '30 days',
  'Processo de teste'
FROM clientes c
CROSS JOIN tipos_processo tp
WHERE c.cpf_cnpj = '123.456.789-00'
  AND tp.nome = 'IRPF'
LIMIT 1;
