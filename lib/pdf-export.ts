// Converte um elemento HTML em PDF para download direto no navegador.
// Centralizado aqui porque a captura de tela (html2canvas) tem uma pegadinha
// conhecida: se outro elemento da página usar "position: sticky", ela pode
// calcular uma altura errada e gerar um PDF com centenas de páginas em branco.
export async function exportarElementoParaPDF(elementId: string, nomeArquivo: string): Promise<{ success: boolean; error?: string }> {
  try {
    const html2canvas = (await import('html2canvas-pro')).default
    const { default: jsPDF } = await import('jspdf')
    const element = document.getElementById(elementId)
    if (!element) return { success: false, error: 'Elemento não encontrado' }

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      // Força as dimensões exatas do elemento — sem isso, o html2canvas pode
      // inflar a altura capturada por causa de elementos "sticky" na página
      width: element.offsetWidth,
      height: element.scrollHeight,
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight,
    })

    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

    const margem = 10
    const larguraPagina = pdf.internal.pageSize.getWidth()
    const alturaPagina = pdf.internal.pageSize.getHeight()
    const larguraUtil = larguraPagina - margem * 2
    const alturaUtil = alturaPagina - margem * 2

    const imgData = canvas.toDataURL('image/png')
    const imgWidth = larguraUtil
    const imgHeight = (canvas.height * imgWidth) / canvas.width

    if (imgHeight <= alturaUtil) {
      pdf.addImage(imgData, 'PNG', margem, margem, imgWidth, imgHeight)
    } else {
      // Limite de segurança: nunca gera um PDF gigante caso a altura
      // capturada esteja incorreta por algum motivo
      const MAX_PAGINAS = 6
      let heightLeft = imgHeight
      let position = margem
      let paginas = 1

      pdf.addImage(imgData, 'PNG', margem, position, imgWidth, imgHeight)
      heightLeft -= alturaUtil

      while (heightLeft > 0 && paginas < MAX_PAGINAS) {
        position = margem - (imgHeight - heightLeft)
        pdf.addPage()
        pdf.addImage(imgData, 'PNG', margem, position, imgWidth, imgHeight)
        heightLeft -= alturaUtil
        paginas++
      }
    }

    pdf.save(nomeArquivo)
    return { success: true }
  } catch (error: any) {
    console.error('Erro ao gerar PDF:', error)
    return { success: false, error: error.message || 'Erro ao gerar PDF' }
  }
}
