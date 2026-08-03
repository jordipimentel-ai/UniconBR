'use client'

import { useState, useRef, useEffect } from 'react'
import { Draggable } from '@hello-pangea/dnd'
import { formatDataLocal } from '@/lib/date-utils'

interface Tarefa {
  id: string
  processo_id: string
  cliente_nome?: string | null
  descricao: string
  prazo: string
  prioridade: 'baixa' | 'media' | 'alta'
  status: 'pendente' | 'em_andamento' | 'concluida'
  user_id?: string
  criado_em: string
  tipos_processo?: { nome: string }
  users?: { nome_completo: string }
}

const PRIORIDADE_CONFIGS = {
  baixa: { label: 'Baixa', bg: '#dcfce7', color: '#166534' },
  media: { label: 'Média', bg: '#fef3c7', color: '#92400e' },
  alta: { label: 'Alta', bg: '#fee2e2', color: '#991b1b' },
}

const AVATAR_GRADIENTS = [
  { grad: 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)', shadow: 'rgba(59, 130, 246, 0.3)' },
  { grad: 'linear-gradient(135deg, #f472b6 0%, #ec4899 100%)', shadow: 'rgba(236, 72, 153, 0.3)' },
  { grad: 'linear-gradient(135deg, #a78bfa 0%, #8b5cf6 100%)', shadow: 'rgba(139, 92, 246, 0.3)' },
  { grad: 'linear-gradient(135deg, #34d399 0%, #10b981 100%)', shadow: 'rgba(16, 185, 129, 0.3)' },
  { grad: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)', shadow: 'rgba(245, 158, 11, 0.3)' },
]

function avatarStyle(nome: string) {
  let hash = 0
  for (let i = 0; i < nome.length; i++) hash = nome.charCodeAt(i) + ((hash << 5) - hash)
  return AVATAR_GRADIENTS[Math.abs(hash) % AVATAR_GRADIENTS.length]
}

function iniciais(nome: string) {
  const partes = nome.trim().split(/\s+/)
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase()
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase()
}

function diasRestantes(prazo: string) {
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  const [ano, mes, dia] = prazo.split('-').map(Number)
  const alvo = new Date(ano, mes - 1, dia)
  const diff = Math.round((alvo.getTime() - hoje.getTime()) / 86400000)
  if (diff < 0) return { label: `${Math.abs(diff)}d atrasado`, vencido: true }
  if (diff === 0) return { label: 'Vence hoje!', vencido: true }
  if (diff === 1) return { label: '1 dia', vencido: false }
  return { label: `${diff} dias`, vencido: false }
}

const COLUNA_HOVER_SHADOW: Record<string, string> = {
  pendente: '0 12px 24px rgba(239, 68, 68, 0.2), 0 4px 16px rgba(0,0,0,0.1)',
  em_andamento: '0 12px 24px rgba(59, 130, 246, 0.2), 0 4px 16px rgba(0,0,0,0.1)',
  concluida: '0 12px 24px rgba(16, 185, 129, 0.2), 0 4px 16px rgba(0,0,0,0.1)',
}

export default function TaskCard({
  tarefa,
  index,
  onEdit,
  onDelete,
}: {
  tarefa: Tarefa
  index: number
  onEdit: (id: string) => void
  onDelete: (id: string) => void
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [hover, setHover] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  const prioridadeConfig = PRIORIDADE_CONFIGS[tarefa.prioridade]
  const responsavel = tarefa.users?.nome_completo || ''
  const avatar = responsavel ? avatarStyle(responsavel) : AVATAR_GRADIENTS[0]
  const subtitulo = [tarefa.cliente_nome, tarefa.tipos_processo?.nome].filter(Boolean).join(' • ')
  const prazoInfo = diasRestantes(tarefa.prazo)

  return (
    <Draggable draggableId={tarefa.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
          style={{
            background: 'white',
            border: '1px solid #e2e8f0',
            borderRadius: '0 0 12px 12px',
            padding: '16px',
            minHeight: '180px',
            display: 'flex',
            flexDirection: 'column',
            marginBottom: '16px',
            position: 'relative',
            cursor: snapshot.isDragging ? 'grabbing' : 'grab',
            overflow: 'visible',
            boxShadow: snapshot.isDragging
              ? '0 16px 32px rgba(0,0,0,0.2)'
              : hover
              ? COLUNA_HOVER_SHADOW[tarefa.status] || '0 12px 24px rgba(0,0,0,0.15)'
              : '0 2px 8px rgba(0,0,0,0.06)',
            transform: hover && !snapshot.isDragging ? 'translateY(-4px)' : undefined,
            transition: 'box-shadow 0.3s ease, transform 0.3s ease',
            ...provided.draggableProps.style,
          }}
        >
          <div ref={menuRef} style={{ position: 'absolute', top: 8, right: 8, zIndex: 10 }}>
            <button
              onClick={(e) => {
                e.stopPropagation()
                setMenuOpen((v) => !v)
              }}
              style={{
                background: 'none',
                border: 'none',
                fontSize: 20,
                color: '#94a3b8',
                opacity: hover || menuOpen ? 1 : 0.5,
                cursor: 'pointer',
                padding: '4px 8px',
                transition: 'opacity 0.3s',
              }}
            >
              ⋮
            </button>
            {menuOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: 28,
                  right: 0,
                  background: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: 8,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  zIndex: 100,
                  minWidth: 140,
                }}
              >
                <button
                  onClick={() => {
                    setMenuOpen(false)
                    onEdit(tarefa.id)
                  }}
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    color: '#2563eb',
                    fontWeight: 500,
                    fontSize: 13,
                    borderBottom: '1px solid #f1f5f9',
                    padding: '10px 16px',
                    background: 'none',
                    border: 'none',
                    borderBottomWidth: 1,
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#eff6ff')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                >
                  ✏️ Editar
                </button>
                <button
                  onClick={() => {
                    setMenuOpen(false)
                    onDelete(tarefa.id)
                  }}
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    color: '#dc2626',
                    fontWeight: 500,
                    fontSize: 13,
                    padding: '10px 16px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#fee2e2')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                >
                  🗑️ Deletar
                </button>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 12 }}>
            <div
              style={{
                width: 36,
                height: 36,
                background: avatar.grad,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: 700,
                fontSize: 13,
                boxShadow: `0 2px 8px ${avatar.shadow}`,
                flexShrink: 0,
              }}
            >
              {responsavel ? iniciais(responsavel) : '?'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p
                title={tarefa.descricao}
                style={{
                  margin: 0,
                  fontSize: 13,
                  fontWeight: 700,
                  color: '#1e293b',
                  lineHeight: 1.4,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {tarefa.descricao}
              </p>
            </div>
          </div>

          {subtitulo && (
            <p
              title={subtitulo}
              style={{
                margin: '0 0 12px 0',
                fontSize: 11,
                color: '#64748b',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {subtitulo}
            </p>
          )}

          <div style={{ marginBottom: 12, display: 'flex', gap: 6 }}>
            <span
              style={{
                fontSize: 11,
                padding: '4px 10px',
                borderRadius: 4,
                fontWeight: 700,
                background: prioridadeConfig.bg,
                color: prioridadeConfig.color,
              }}
            >
              {prioridadeConfig.label}
            </span>
          </div>

          <div
            style={{
              marginTop: 'auto',
              fontSize: 11,
              color: '#94a3b8',
              display: 'flex',
              justifyContent: 'space-between',
              paddingTop: 10,
              borderTop: '1px solid #f1f5f9',
            }}
          >
            <span>📅 {formatDataLocal(tarefa.prazo)}</span>
            <span style={{ color: prazoInfo.vencido ? '#dc2626' : '#94a3b8', fontWeight: prazoInfo.vencido ? 700 : 400 }}>
              {prazoInfo.label}
            </span>
          </div>
        </div>
      )}
    </Draggable>
  )
}
