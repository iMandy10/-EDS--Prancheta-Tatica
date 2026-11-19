import { vi } from 'vitest'

// Resposta de uma rota: status + corpo JSON, uma Promise (para "servidor demorando")
// ou uma função que recebe o corpo enviado e decide a resposta.
export type RespostaFalsa =
  | { status: number; corpo?: unknown }
  | Promise<Response>
  | ((corpoEnviado: unknown) => { status: number; corpo?: unknown })

// Troca o fetch global por um backend falso que responde por "MÉTODO /caminho".
// Uma chamada para rota não cadastrada falha alto, para o teste não passar por acaso.
// Devolve o mock, para conferir o que a página mandou (headers, corpo, quantas vezes).
export function mockFetch(rotas: Record<string, RespostaFalsa>) {
  const fetchFalso = vi.fn(async (url: string, init?: RequestInit) => {
    const rota = `${init?.method ?? 'GET'} ${new URL(url).pathname}`
    const resposta = rotas[rota]
    if (!resposta) throw new Error(`rota inesperada no teste: ${rota}`)
    if (resposta instanceof Promise) return resposta
    const corpoEnviado = init?.body ? JSON.parse(init.body as string) : undefined
    const { status, corpo } = typeof resposta === 'function' ? resposta(corpoEnviado) : resposta
    return new Response(status === 204 ? null : JSON.stringify(corpo ?? {}), { status })
  })
  vi.stubGlobal('fetch', fetchFalso)
  return fetchFalso
}

// Header e corpo da n-ésima chamada (0 = a primeira), já convertidos.
export function chamada(fetchFalso: ReturnType<typeof mockFetch>, n = 0) {
  const [url, init] = fetchFalso.mock.calls[n]
  return {
    url,
    metodo: init?.method ?? 'GET',
    headers: (init?.headers ?? {}) as Record<string, string>,
    corpo: init?.body ? JSON.parse(init.body as string) : undefined,
  }
}
