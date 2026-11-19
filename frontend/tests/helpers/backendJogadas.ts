import type { PlaySummary } from '../../src/lib/api'
import { CHAVE, TIME } from './dados'
import { mockFetch, type RespostaFalsa } from './mockFetch'

// Backend falso que guarda as jogadas do TIME: publicar, editar e excluir mudam o que a
// próxima listagem devolve, como no servidor de verdade. `extras` sobrescreve ou acrescenta rotas.
export function backendComJogadas(jogadas: PlaySummary[], extras: Record<string, RespostaFalsa> = {}) {
  const banco = jogadas.map((jogada) => ({ ...jogada }))
  const rotas: Record<string, RespostaFalsa> = {
    [`GET /teams/${CHAVE}`]: { status: 200, corpo: TIME },
    'GET /teams/7/plays': () => ({ status: 200, corpo: banco.map((jogada) => ({ ...jogada })) }),
  }
  for (const jogada of banco) {
    rotas[`PATCH /plays/${jogada.id}`] = (mudancas) => ({ status: 200, corpo: Object.assign(jogada, mudancas) })
    rotas[`DELETE /plays/${jogada.id}`] = () => (banco.splice(banco.indexOf(jogada), 1), { status: 204 })
  }
  return mockFetch({ ...rotas, ...extras })
}
