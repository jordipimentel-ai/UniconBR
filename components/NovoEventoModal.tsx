'use client'

import { useState } from 'react'
import { createEvento, updateEvento, RepetirEvento } from '@/lib/event-management'
import SelectPill from '@/components/SelectPill'

interface EventoParaEditar {
  id: string
  titulo: string
  descricao?: string
  data: string
  hora?: string
  tipo: 'evento' | 'compromisso' | 'prazo'
  repetir?: RepetirEvento
  cor?: string
}

interface NovoEventoModalProps {
  onClose: () => void
  onEventoCreated: () => void
  dataPadrao?: string
  eventoParaEditar?: EventoParaEditar
}

export default function NovoEventoModal({ onClose, onEventoCreated, dataPadrao, eventoParaEditar }: NovoEventoModalProps) {
  const isEditando = !!eventoParaEditar
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    titulo: eventoParaEditar?.titulo || '',
    descricao: eventoParaEditar?.descricao || '',
    data: eventoParaEditar?.data || dataPadrao || new Date().toISOString().split('T')[0],
    hora: eventoParaEditar?.hora || '09:00',
    tipo: eventoParaEditar?.tipo || ('evento' as 'evento' | 'compromisso' | 'prazo'),
    repetir: eventoParaEditar?.repetir || ('nao' as RepetirEvento),
    cor: eventoParaEditar?.cor || '#3B82F6',
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    if (!formData.titulo.trim()) {
      setError('Título é obrigatório')
      setLoading(false)
      return
    }

    if (isEditando && eventoParaEditar) {
      const { success, error: updateError } = await updateEvento(eventoParaEditar.id, formData)

      if (!success) {
        setError(updateError || 'Erro ao atualizar evento')
        setLoading(false)
        return
      }

      onEventoCreated()
      onClose()
      return
    }

    const { data, error: createError } = await createEvento(formData)

    if (createError) {
      setError(createError)
      setLoading(false)
      return
    }

    if (data) {
      onEventoCreated()
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-8">
        <h2 className="text-3xl font-bold text-slate-900 mb-6">{isEditando ? 'Editar Evento' : 'Novo Evento'}</h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm font-medium">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Título *
            </label>
            <input
              type="text"
              value={formData.titulo}
              onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
              placeholder="Ex: Reunião com cliente"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Descrição
            </label>
            <textarea
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              placeholder="Adicione detalhes..."
              rows={2}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Data *
              </label>
              <input
                type="date"
                value={formData.data}
                onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                required
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Hora
              </label>
              <input
                type="time"
                value={formData.hora}
                onChange={(e) => setFormData({ ...formData, hora: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Tipo
              </label>
              <SelectPill
                value={formData.tipo}
                onChange={(v) => setFormData({ ...formData, tipo: v as any })}
                options={[
                  { value: 'evento', label: '📅 Evento' },
                  { value: 'compromisso', label: '🤝 Compromisso' },
                  { value: 'prazo', label: '⏰ Prazo' },
                ]}
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Repetir
              </label>
              <SelectPill
                value={formData.repetir}
                onChange={(v) => setFormData({ ...formData, repetir: v as RepetirEvento })}
                options={[
                  { value: 'nao', label: 'Não' },
                  { value: 'diario', label: 'Diário' },
                  { value: 'semanal', label: 'Semanal' },
                  { value: 'mensal', label: 'Mensal' },
                  { value: 'anual', label: 'Anual' },
                ]}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-3">
              Cor
            </label>
            <div className="flex gap-3">
              {['#3B82F6', '#EF4444', '#F59E0B', '#10B981', '#8B5CF6', '#EC4899'].map((cor) => (
                <button
                  key={cor}
                  type="button"
                  onClick={() => setFormData({ ...formData, cor })}
                  className={`w-10 h-10 rounded-lg border-2 transition shadow-sm hover:shadow-md ${
                    formData.cor === cor ? 'border-slate-900 ring-2 ring-offset-2 ring-blue-500' : 'border-slate-300'
                  }`}
                  style={{ backgroundColor: cor }}
                />
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-6 border-t border-slate-200">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:bg-slate-400 transition shadow-sm"
            >
              {loading ? 'Salvando...' : isEditando ? 'Salvar Alterações' : 'Criar Evento'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-slate-200 text-slate-900 font-bold rounded-lg hover:bg-slate-300 transition"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
