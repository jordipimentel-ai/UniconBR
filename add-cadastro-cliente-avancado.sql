-- Campos novos do cadastro de clientes: contato de cobrança/faturamento
-- separado do contato geral, e inscrições fiscais adicionais.
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS email_cobranca TEXT;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS whatsapp_cobranca TEXT;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS ie_indicador TEXT;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS inscricao_estadual TEXT;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS inscricao_municipal TEXT;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS inscricao_suframa TEXT;

-- Anexos/documentos do cliente (pasta de arquivos por cliente)
CREATE TABLE IF NOT EXISTS cliente_documentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  nome_arquivo TEXT NOT NULL,
  caminho_storage TEXT NOT NULL,
  url TEXT NOT NULL,
  tamanho_bytes BIGINT,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cliente_documentos_cliente_id ON cliente_documentos(cliente_id);

-- Bucket de storage para os anexos, com políticas abertas (mesmo padrão já
-- usado no bucket "escritorio" — o controle de acesso é o login do próprio
-- sistema, não RLS por usuário)
INSERT INTO storage.buckets (id, name, public)
VALUES ('clientes-documentos', 'clientes-documentos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "clientes_documentos_select" ON storage.objects
  FOR SELECT USING (bucket_id = 'clientes-documentos');

CREATE POLICY "clientes_documentos_insert" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'clientes-documentos');

CREATE POLICY "clientes_documentos_update" ON storage.objects
  FOR UPDATE USING (bucket_id = 'clientes-documentos');

CREATE POLICY "clientes_documentos_delete" ON storage.objects
  FOR DELETE USING (bucket_id = 'clientes-documentos');
