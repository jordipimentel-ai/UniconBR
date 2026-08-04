'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { DragDropContext, Droppable, DropResult } from '@hello-pangea/dnd'
import { supabase } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'
import NovoTarefaModal from '@/components/NovoTarefaModal'
import TaskCard from '@/components/TaskCard'

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

const COLUNAS: { status: Tarefa['status']; titulo: string; icone: string; corBg: string; corBorda: string; corTexto: string }[] = [
  { status: 'pendente', titulo: 'A Fazer', icone: '📋', corBg: '#fef2f2', corBorda: '#ef4444', corTexto: '#7f1d1d' },
  { status: 'em_andamento', titulo: 'Fazendo', icone: '🔄', corBg: '#eff6ff', corBorda: '#3b82f6', corTexto: '#1e40af' },
  { status: 'concluida', titulo: 'Concluído', icone: '✓', corBg: '#f0fdf4', corBorda: '#10b981', corTexto: '#166534' },
]

const SELECT_QUERY = `
  *,
  tipos_processo:tipos_processo(nome),
  users:users(nome_completo)
`

export default function TarefasPage() {
  const router = useRouter()
  const [tarefas, setTarefas] = useState<Tarefa[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [search, setSearch] = useState('')

  async function loadTarefas() {
    const { data, error } = await supabase
      .from('tarefas')
      .select(SELECT_QUERY)
      .order('prazo', { ascending: true })

    if (!error && data) {
      setTarefas(data as unknown as Tarefa[])
    }
  }

  // Tarefas concluídas há mais de 2 dias são apagadas automaticamente
  async function limparConcluidasAntigas() {
    const limite = new Date()
    limite.setDate(limite.getDate() - 2)

    const { error } = await supabase
      .from('tarefas')
      .delete()
      .eq('status', 'concluida')
      .lt('atualizado_em', limite.toISOString())

    if (error) {
      console.error('Erro ao limpar tarefas concluídas antigas:', error)
    }
  }

  useEffect(() => {
    async function init() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/auth')
          return
        }
        await limparConcluidasAntigas()
        await loadTarefas()
      } catch (err) {
        console.error('Erro ao carregar tarefas:', err)
      } finally {
        setLoading(false)
      }
    }

    init()
  }, [router])

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja deletar esta tarefa?')) return

    const { error } = await supabase.from('tarefas').delete().eq('id', id)

    if (!error) {
      setTarefas((prev) => prev.filter((t) => t.id !== id))
    } else {
      alert('Erro ao deletar tarefa')
    }
  }

  const handleEdit = (id: string) => {
    router.push(`/tarefas/${id}`)
  }

  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result
    if (!destination) return
    if (destination.droppableId === source.droppableId && destination.index === source.index) return

    const novoStatus = destination.droppableId as Tarefa['status']
    const tarefaAnterior = tarefas.find((t) => t.id === draggableId)
    if (!tarefaAnterior) return

    setTarefas((prev) => prev.map((t) => (t.id === draggableId ? { ...t, status: novoStatus } : t)))

    let { error } = await supabase
      .from('tarefas')
      .update({ status: novoStatus, atualizado_em: new Date().toISOString() })
      .eq('id', draggableId)

    // Se a coluna atualizado_em ainda não existir no banco, tenta só o status
    if (error?.message?.toLowerCase().includes('atualizado_em')) {
      ;({ error } = await supabase.from('tarefas').update({ status: novoStatus }).eq('id', draggableId))
    }

    if (error) {
      console.error('Erro ao mover tarefa:', error)
      setTarefas((prev) => prev.map((t) => (t.id === draggableId ? tarefaAnterior : t)))
      alert('Erro ao mover tarefa')
    }
  }

  const tarefasFiltradas = tarefas.filter((tarefa) => {
    const termo = search.toLowerCase()
    return (
      tarefa.descricao.toLowerCase().includes(termo) ||
      tarefa.tipos_processo?.nome.toLowerCase().includes(termo) ||
      tarefa.users?.nome_completo.toLowerCase().includes(termo) ||
      tarefa.cliente_nome?.toLowerCase().includes(termo)
    )
  })

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Carregando...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />

      <div className="ml-64">
        <header
          style={{
            background: '#1e293b',
            color: 'white',
            padding: '24px 32px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>Tarefas em Progresso</h1>
            <p style={{ fontSize: 14, color: '#cbd5e1', margin: '4px 0 0 0' }}>Organize seu fluxo de trabalho</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            style={{
              background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              color: 'white',
              padding: '12px 24px',
              borderRadius: 8,
              border: 'none',
              fontWeight: 600,
              fontSize: 14,
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.4)',
              whiteSpace: 'nowrap',
            }}
          >
            + Nova Tarefa
          </button>
        </header>

        <div
          style={{
            background: 'white',
            borderBottom: '1px solid #e2e8f0',
            padding: '16px 32px',
          }}
        >
          <input
            type="text"
            placeholder="🔍 Buscar por descrição, cliente, processo ou responsável..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              maxWidth: 480,
              padding: '10px 14px',
              border: '1px solid #cbd5e1',
              borderRadius: 8,
              fontSize: 13,
              outline: 'none',
            }}
          />
        </div>

        <main style={{ background: '#f0f4f8', padding: 32 }}>
          <DragDropContext onDragEnd={handleDragEnd}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, minmax(280px, 1fr))',
                gap: 24,
              }}
            >
              {COLUNAS.map((coluna) => {
                const tarefasColuna = tarefasFiltradas.filter((t) => t.status === coluna.status)
                return (
                  <div key={coluna.status}>
                    <div
                      style={{
                        background: coluna.corBg,
                        borderBottom: `3px solid ${coluna.corBorda}`,
                        color: coluna.corTexto,
                        fontSize: 13,
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        letterSpacing: '0.8px',
                        padding: '12px 16px',
                        borderRadius: '8px 8px 0 0',
                      }}
                    >
                      {coluna.icone} {coluna.titulo} ({tarefasColuna.length})
                    </div>
                    <Droppable droppableId={coluna.status}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          style={{
                            minHeight: 120,
                            padding: '16px 0 4px 0',
                            background: snapshot.isDraggingOver ? 'rgba(59,130,246,0.05)' : 'transparent',
                            transition: 'background 0.2s',
                          }}
                        >
                          {tarefasColuna.length === 0 && !snapshot.isDraggingOver && (
                            <div style={{ fontSize: 13, color: '#94a3b8', textAlign: 'center', padding: '24px 0' }}>
                              Nenhuma tarefa
                            </div>
                          )}
                          {tarefasColuna.map((tarefa, index) => (
                            <TaskCard
                              key={tarefa.id}
                              tarefa={tarefa}
                              index={index}
                              onEdit={handleEdit}
                              onDelete={handleDelete}
                            />
                          ))}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </div>
                )
              })}
            </div>
          </DragDropContext>

          <div style={{ marginTop: 16, fontSize: 13, color: '#64748b' }}>
            Exibindo {tarefasFiltradas.length} de {tarefas.length} tarefa{tarefas.length !== 1 ? 's' : ''}
          </div>
        </main>
      </div>

      {showModal && (
        <NovoTarefaModal
          onClose={() => setShowModal(false)}
          onTarefaCreated={() => {
            setShowModal(false)
            setSearch('')
            loadTarefas()
          }}
        />
      )}
    </div>
  )
}
