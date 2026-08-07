// Formata progressivamente enquanto o usuário digita, sempre no padrão
// (DDD) 9XXXX-XXXX — ex.: "82982988834" -> "(82) 98298-8834"
export function formatarTelefone(valor: string): string {
  const digitos = valor.replace(/\D/g, '').slice(0, 11)

  if (digitos.length === 0) return ''
  if (digitos.length <= 2) return `(${digitos}`
  if (digitos.length <= 7) return `(${digitos.slice(0, 2)}) ${digitos.slice(2)}`
  return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 7)}-${digitos.slice(7, 11)}`
}
