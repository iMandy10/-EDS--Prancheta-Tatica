export type Formacao = '4-4-2' | '4-3-3' | '4-2-3-1' | '3-5-2'

export const FORMACOES: Formacao[] = ['4-4-2', '4-3-3', '4-2-3-1', '3-5-2']

// Sigla da posição de cada uma das 11 peças (A1..A11) na formação, do goleiro ao ataque.
export const POSICOES_FUTEBOL: Record<Formacao, string[]> = {
  '4-4-2': ['GOL', 'LE', 'ZAG', 'ZAG', 'LD', 'ME', 'VOL', 'VOL', 'MD', 'ATA', 'ATA'],
  '4-3-3': ['GOL', 'LE', 'ZAG', 'ZAG', 'LD', 'VOL', 'MEI', 'VOL', 'PE', 'ATA', 'PD'],
  '4-2-3-1': ['GOL', 'LE', 'ZAG', 'ZAG', 'LD', 'VOL', 'VOL', 'PE', 'MEI', 'PD', 'ATA'],
  '3-5-2': ['GOL', 'ZAG', 'ZAG', 'ZAG', 'LE', 'VOL', 'MEI', 'VOL', 'LD', 'ATA', 'ATA'],
}

// Posição padrão de cada peça do Time A (ataca a direita); o Time B é o espelho horizontal.
const POSICOES_PADRAO_TIME_A: Record<Formacao, { x: number; y: number }[]> = {
  '4-4-2': [
    { x: 45, y: 250 },
    { x: 150, y: 70 },
    { x: 150, y: 190 },
    { x: 150, y: 310 },
    { x: 150, y: 430 },
    { x: 330, y: 70 },
    { x: 300, y: 190 },
    { x: 300, y: 310 },
    { x: 330, y: 430 },
    { x: 520, y: 170 },
    { x: 520, y: 330 },
  ],
  '4-3-3': [
    { x: 45, y: 250 },
    { x: 150, y: 70 },
    { x: 150, y: 190 },
    { x: 150, y: 310 },
    { x: 150, y: 430 },
    { x: 300, y: 190 },
    { x: 330, y: 250 },
    { x: 300, y: 310 },
    { x: 500, y: 70 },
    { x: 540, y: 250 },
    { x: 500, y: 430 },
  ],
  '4-2-3-1': [
    { x: 45, y: 250 },
    { x: 150, y: 70 },
    { x: 150, y: 190 },
    { x: 150, y: 310 },
    { x: 150, y: 430 },
    { x: 280, y: 190 },
    { x: 280, y: 310 },
    { x: 420, y: 70 },
    { x: 420, y: 250 },
    { x: 420, y: 430 },
    { x: 560, y: 250 },
  ],
  '3-5-2': [
    { x: 45, y: 250 },
    { x: 150, y: 150 },
    { x: 150, y: 250 },
    { x: 150, y: 350 },
    { x: 280, y: 70 },
    { x: 300, y: 190 },
    { x: 330, y: 250 },
    { x: 300, y: 310 },
    { x: 280, y: 430 },
    { x: 520, y: 190 },
    { x: 520, y: 310 },
  ],
}

const LARGURA_QUADRA = 800

function espelhar(ponto: { x: number; y: number }) {
  return { x: LARGURA_QUADRA - ponto.x, y: ponto.y }
}

// Onde uma peça do estojo (A1..A11, B1..B11) entra na quadra quando o treinador só clica nela.
export function posicaoPadraoFutebol(formacao: Formacao, id: string): { x: number; y: number } {
  const time = id[0]
  const indice = Number(id.slice(1)) - 1
  const posicao = POSICOES_PADRAO_TIME_A[formacao][indice] ?? { x: 400, y: 250 }
  return time === 'B' ? espelhar(posicao) : posicao
}
