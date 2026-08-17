-- Substitui os papéis genéricos 'admin'/'colaborador' por três papéis
-- nomeados: 'admin' (Administrador), 'financeiro' (Financeiro), 'rh' (RH).
-- Usuários que já eram 'colaborador' viram 'financeiro' por padrão — o
-- administrador pode trocar depois na tela de Usuários.

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

UPDATE users SET role = 'financeiro' WHERE role = 'colaborador';

ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('admin', 'financeiro', 'rh'));
