import { useEffect, useRef, useState, type DragEvent, type PointerEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useTeamSession } from '../hooks/useTeamSession'
import QuadraSvg, { QUADRA_LIMITES } from '../components/QuadraSvg'
import PecaSvg, { RAIOS } from '../components/PecaSvg'
import AcaoSvg, { SetaMarkerDefs } from '../components/AcaoSvg'
import AcoesPainel from '../components/AcoesPainel'
import EstojoPecas from '../components/EstojoPecas'
import SalvarJogadaModal from '../components/SalvarJogadaModal'
import Button from '../components/Button'
import { FolderOpenIcon, PlusIcon, TrashIcon } from '../components/icons'
import type { Acao, Cena, Peca, TipoAcao, TipoPeca } from '../types/cena'
import { createPlay, type Modalidade, type StatusJogada } from '../lib/api'
import { cabeNoInstante, compactarOrdens } from '../lib/instantes'
import { POSICAO_PADRAO_BASQUETE, TIPO_ARRASTE_PECA, rotuloPeca } from '../lib/basquete'

const PECAS_INICIAIS: Peca[] = [
  { id: 'A1', tipo: 'jogador_time_a', x: 250, y: 150 },
  { id: 'A2', tipo: 'jogador_time_a', x: 250, y: 350 },
  { id: 'B1', tipo: 'jogador_time_b', x: 550, y: 150 },
  { id: 'B2', tipo: 'jogador_time_b', x: 550, y: 350 },
  { id: 'bola', tipo: 'bola', x: 400, y: 250 },
]

const MAX_JOGADORES: Record<Modalidade, number> = {
  futebol: 11,
  basquete: 5,
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

// Tira a ação do instante em que está e a coloca num instante próprio logo em seguida.
function separarAcao(acoes: Acao[], id: string): Acao[] {
  const alvo = acoes.find((acao) => acao.id === id)
  if (!alvo) return acoes
  return compactarOrdens(
    acoes.map((acao) => {
      if (acao.id === id) return { ...acao, ordem: alvo.ordem + 1 }
      if (acao.ordem > alvo.ordem) return { ...acao, ordem: acao.ordem + 1 }
      return acao
    }),
  )
}

// Aplica uma mudança numa ação; se ela deixar de caber no instante, vai para um instante próprio.
function editarAcao(acoes: Acao[], id: string, mudanca: Partial<Acao>, pecas: Peca[]): Acao[] {
  const editadas = acoes.map((acao) => (acao.id === id ? { ...acao, ...mudanca } : acao))
  const editada = editadas.find((acao) => acao.id === id)
  const grupo = editadas.filter((acao) => acao.ordem === editada?.ordem)
  return editada && cabeNoInstante(editada, grupo, pecas) ? editadas : separarAcao(editadas, id)
}

function paraCoordenadasSvg(svg: SVGSVGElement, clientX: number, clientY: number) {
  const ponto = svg.createSVGPoint()
  ponto.x = clientX
  ponto.y = clientY
  const ctm = svg.getScreenCTM()
  if (!ctm) return { x: clientX, y: clientY }
  const transformado = ponto.matrixTransform(ctm.inverse())
  return { x: transformado.x, y: transformado.y }
}

export default function EditorPage() {
  const { chave, team, notFound } = useTeamSession()
  const navigate = useNavigate()
  const location = useLocation()
  const cenaInicial = (location.state as { cenaInicial?: Cena } | null)?.cenaInicial
  const [cena, setCena] = useState<Cena | null>(null)
  const quadra = cena?.quadra
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [modoDesenho, setModoDesenho] = useState<TipoAcao | null>(null)
  const [origemSelecionada, setOrigemSelecionada] = useState<string | null>(null)
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [acaoSelecionadaId, setAcaoSelecionadaId] = useState<string | null>(null)
  const [pontaSeta, setPontaSeta] = useState<{ x: number; y: number } | null>(null)
  const [arrastandoPonta, setArrastandoPonta] = useState(false)
  const [modalSalvarAberto, setModalSalvarAberto] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [erroSalvar, setErroSalvar] = useState<string | null>(null)
  const proximoIdRef = useRef({ jogador_time_a: 3, jogador_time_b: 3 })

  useEffect(() => {
    if (team && !cena) {
      const pecas = team.modalidade === 'basquete' ? [] : PECAS_INICIAIS
      setCena(cenaInicial ?? { quadra: team.modalidade, pecas, acoes: [] })
    }
  }, [team, cena, cenaInicial])

  useEffect(() => {
    function atalhos(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setModoDesenho(null)
        setOrigemSelecionada(null)
        setEditandoId(null)
        setPontaSeta(null)
        setAcaoSelecionadaId(null)
        return
      }
      // Delete/Backspace removem a seta selecionada no basquete, exceto enquanto se digita num campo.
      const digitando = (event.target as HTMLElement).closest('input, textarea')
      if ((event.key === 'Delete' || event.key === 'Backspace') && !digitando && quadra === 'basquete') {
        if (!acaoSelecionadaId) return
        setCena((prev) => {
          if (!prev) return prev
          return { ...prev, acoes: compactarOrdens(prev.acoes.filter((acao) => acao.id !== acaoSelecionadaId)) }
        })
        setAcaoSelecionadaId(null)
      }
    }
    window.addEventListener('keydown', atalhos)
    return () => window.removeEventListener('keydown', atalhos)
  }, [acaoSelecionadaId, quadra])

  function alternarModoDesenho(tipo: TipoAcao) {
    return () => {
      setModoDesenho((atual) => (atual === tipo ? null : tipo))
      setOrigemSelecionada(null)
      setEditandoId(null)
    }
  }

  // No basquete, com uma seta selecionada, a ferramenta do estojo troca o tipo dela em vez de desenhar.
  function escolherFerramenta(tipo: TipoAcao) {
    if (acaoSelecionadaId) {
      setCena((prev) => prev && { ...prev, acoes: editarAcao(prev.acoes, acaoSelecionadaId, { tipo }, prev.pecas) })
      return
    }
    alternarModoDesenho(tipo)()
  }

  function selecionarSeta(id: string) {
    setAcaoSelecionadaId(id)
    setSelectedId(null)
    setModoDesenho(null)
    setOrigemSelecionada(null)
    setEditandoId(null)
  }

  function iniciarEdicaoAcao(id: string) {
    const acao = cena?.acoes.find((a) => a.id === id)
    if (!acao) return
    setEditandoId(id)
    setModoDesenho(acao.tipo)
    setOrigemSelecionada(null)
  }

  function criarAcao(destino: Acao['destino']) {
    if (!modoDesenho || !origemSelecionada) return
    const estavaEditando = editandoId !== null

    setCena((prev) => {
      if (!prev) return prev

      if (editandoId) {
        return { ...prev, acoes: editarAcao(prev.acoes, editandoId, { origem: origemSelecionada, destino }, prev.pecas) }
      }

      const ordem = Math.max(0, ...prev.acoes.map((acao) => acao.ordem)) + 1
      const numero = Math.max(0, ...prev.acoes.map((acao) => Number(acao.id.slice(1)) || 0)) + 1
      const novaAcao: Acao = {
        id: `a${numero}`,
        tipo: modoDesenho,
        origem: origemSelecionada,
        destino,
        ordem,
      }
      return { ...prev, acoes: [...prev.acoes, novaAcao] }
    })

    setOrigemSelecionada(null)
    if (estavaEditando) {
      setEditandoId(null)
      setModoDesenho(null)
    }
  }

  function removerAcao(id: string) {
    setCena((prev) => {
      if (!prev) return prev
      return { ...prev, acoes: compactarOrdens(prev.acoes.filter((acao) => acao.id !== id)) }
    })
    if (editandoId === id) {
      setEditandoId(null)
      setModoDesenho(null)
      setOrigemSelecionada(null)
    }
    if (acaoSelecionadaId === id) {
      setAcaoSelecionadaId(null)
    }
  }

  function alternarSelecaoAcao(id: string) {
    setAcaoSelecionadaId((atual) => (atual === id ? null : id))
  }

  function moverInstante(ordem: number, direcao: -1 | 1) {
    setCena((prev) => {
      if (!prev) return prev
      const vizinha = ordem + direcao
      if (!prev.acoes.some((acao) => acao.ordem === vizinha)) return prev
      return {
        ...prev,
        acoes: prev.acoes.map((acao) => {
          if (acao.ordem === ordem) return { ...acao, ordem: vizinha }
          if (acao.ordem === vizinha) return { ...acao, ordem }
          return acao
        }),
      }
    })
  }

  function juntarAoInstanteAnterior(id: string) {
    setCena((prev) => {
      const acao = prev?.acoes.find((a) => a.id === id)
      if (!prev || !acao) return prev
      const anterior = prev.acoes.filter((a) => a.ordem === acao.ordem - 1)
      if (anterior.length === 0 || !cabeNoInstante(acao, anterior, prev.pecas)) return prev
      return {
        ...prev,
        acoes: compactarOrdens(prev.acoes.map((a) => (a.id === id ? { ...a, ordem: acao.ordem - 1 } : a))),
      }
    })
  }

  function separarEmInstanteProprio(id: string) {
    setCena((prev) => (prev ? { ...prev, acoes: separarAcao(prev.acoes, id) } : prev))
  }

  function handlePecaPointerDown(id: string) {
    return (event: PointerEvent<SVGGElement>) => {
      event.preventDefault()
      event.stopPropagation()

      if (modoDesenho && cena?.quadra === 'basquete') {
        // No basquete a seta é desenhada arrastando: começa aqui e termina no pointerup da quadra.
        // Se a bola está sobre um jogador, a seta sai do jogador que a conduz.
        const bola = cena.pecas.find((peca) => peca.id === id && peca.tipo === 'bola')
        const condutor =
          bola &&
          cena.pecas.find(
            (peca) => peca.tipo !== 'bola' && Math.hypot(peca.x - bola.x, peca.y - bola.y) <= RAIOS[peca.tipo],
          )
        setOrigemSelecionada(condutor ? condutor.id : id)
        setPontaSeta(null)
        return
      }

      if (modoDesenho) {
        if (!origemSelecionada) {
          setOrigemSelecionada(id)
        } else if (origemSelecionada === id) {
          setOrigemSelecionada(null)
        } else {
          criarAcao(id)
        }
        return
      }

      setDraggingId(id)
      setSelectedId(id)
      if (cena?.quadra === 'basquete') setAcaoSelecionadaId(null)
    }
  }

  function handleSvgPointerDown(event: PointerEvent<SVGSVGElement>) {
    if (modoDesenho && origemSelecionada) {
      const { x, y } = paraCoordenadasSvg(event.currentTarget, event.clientX, event.clientY)
      criarAcao({
        x: clamp(x, QUADRA_LIMITES.minX, QUADRA_LIMITES.maxX),
        y: clamp(y, QUADRA_LIMITES.minY, QUADRA_LIMITES.maxY),
      })
      return
    }

    setSelectedId(null)
    if (cena?.quadra === 'basquete') setAcaoSelecionadaId(null)
  }

  function handleSvgPointerMove(event: PointerEvent<SVGSVGElement>) {
    const { x, y } = paraCoordenadasSvg(event.currentTarget, event.clientX, event.clientY)
    if (((modoDesenho && origemSelecionada) || arrastandoPonta) && cena?.quadra === 'basquete') {
      setPontaSeta({ x, y })
      return
    }
    if (!draggingId) return

    setCena((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        pecas: prev.pecas.map((peca) => {
          if (peca.id !== draggingId) return peca
          const raio = RAIOS[peca.tipo]
          return {
            ...peca,
            x: clamp(x, QUADRA_LIMITES.minX + raio, QUADRA_LIMITES.maxX - raio),
            y: clamp(y, QUADRA_LIMITES.minY + raio, QUADRA_LIMITES.maxY - raio),
          }
        }),
      }
    })
  }

  // Onde uma seta que sai de origemId termina ao ser solta: numa peça (jogadores têm prioridade
  // sobre a bola), num ponto livre, ou null quando é solta na própria origem ou fora da quadra.
  function destinoAoSoltar(event: PointerEvent<SVGSVGElement>, origemId: string): Acao['destino'] | null {
    if (!cena) return null
    const { x, y } = paraCoordenadasSvg(event.currentTarget, event.clientX, event.clientY)
    const perto = (peca: Peca) => Math.hypot(peca.x - x, peca.y - y) <= RAIOS[peca.tipo] + 4
    const candidatos = cena.pecas.filter((peca) => peca.id !== origemId && perto(peca))
    const alvo = candidatos.find((peca) => peca.tipo !== 'bola') ?? candidatos[0]
    const origem = cena.pecas.find((peca) => peca.id === origemId)
    const { width, height } = event.currentTarget.viewBox.baseVal

    if (alvo) return alvo.id
    if (x < 0 || y < 0 || x > width || y > height || (origem && perto(origem))) return null
    return {
      x: clamp(x, QUADRA_LIMITES.minX, QUADRA_LIMITES.maxX),
      y: clamp(y, QUADRA_LIMITES.minY, QUADRA_LIMITES.maxY),
    }
  }

  function handleSvgPointerUp(event: PointerEvent<SVGSVGElement>) {
    setDraggingId(null)
    if (!cena || cena.quadra !== 'basquete') return

    const selecionada = cena.acoes.find((acao) => acao.id === acaoSelecionadaId)
    if (arrastandoPonta && selecionada) {
      const destino = destinoAoSoltar(event, selecionada.origem)
      if (destino) {
        setCena((prev) => prev && { ...prev, acoes: editarAcao(prev.acoes, selecionada.id, { destino }, prev.pecas) })
      }
      setArrastandoPonta(false)
      setPontaSeta(null)
      return
    }

    if (!modoDesenho || !origemSelecionada) return
    const destino = destinoAoSoltar(event, origemSelecionada)
    if (destino) {
      criarAcao(destino)
    } else {
      setOrigemSelecionada(null)
    }
    setPontaSeta(null)
  }

  function handleAdicionarJogador(tipo: 'jogador_time_a' | 'jogador_time_b') {
    return () => {
      if (!cena) return
      const max = MAX_JOGADORES[cena.quadra]
      const atuais = cena.pecas.filter((peca) => peca.tipo === tipo)
      if (atuais.length >= max) return

      const prefixo = tipo === 'jogador_time_a' ? 'A' : 'B'
      const numero = proximoIdRef.current[tipo]++
      const novaPeca: Peca = {
        id: `${prefixo}${numero}`,
        tipo,
        x: tipo === 'jogador_time_a' ? 250 : 550,
        y: 100 + (atuais.length % 5) * 70,
      }
      setCena({ ...cena, pecas: [...cena.pecas, novaPeca] })
    }
  }

  async function handleSalvarJogada(dados: { titulo: string; descricao: string; status: StatusJogada }) {
    if (!team || !cena || !chave) return

    setSalvando(true)
    setErroSalvar(null)
    try {
      await createPlay(team.id, chave, {
        titulo: dados.titulo,
        descricao: dados.descricao || null,
        status: dados.status,
        cena,
      })
      setModalSalvarAberto(false)
    } catch {
      setErroSalvar('Não foi possível salvar a jogada. Verifique se o servidor está rodando e tente novamente.')
    } finally {
      setSalvando(false)
    }
  }

  // Remove a peça e as setas ligadas a ela, que ficariam sem origem ou destino.
  function removerPeca(id: string) {
    setCena((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        pecas: prev.pecas.filter((peca) => peca.id !== id),
        acoes: compactarOrdens(prev.acoes.filter((acao) => acao.origem !== id && acao.destino !== id)),
      }
    })
    if (selectedId === id) setSelectedId(null)
    if (origemSelecionada === id) setOrigemSelecionada(null)
  }

  function handleRemoverSelecionado() {
    if (cena?.quadra === 'basquete' && acaoSelecionadaId) {
      removerAcao(acaoSelecionadaId)
    } else if (selectedId) {
      removerPeca(selectedId)
    }
  }

  function limparPrancheta() {
    if (!window.confirm('Limpar a prancheta? Todas as peças e setas serão removidas.')) return
    setCena((prev) => (prev ? { ...prev, pecas: [], acoes: [] } : prev))
    setSelectedId(null)
    setModoDesenho(null)
    setOrigemSelecionada(null)
    setEditandoId(null)
    setAcaoSelecionadaId(null)
  }

  function colocarPeca(id: string, tipo: TipoPeca, x: number, y: number) {
    const raio = RAIOS[tipo]
    setCena((prev) => {
      if (!prev || prev.pecas.some((peca) => peca.id === id)) return prev
      const peca: Peca = {
        id,
        tipo,
        x: clamp(x, QUADRA_LIMITES.minX + raio, QUADRA_LIMITES.maxX - raio),
        y: clamp(y, QUADRA_LIMITES.minY + raio, QUADRA_LIMITES.maxY - raio),
      }
      return { ...prev, pecas: [...prev.pecas, peca] }
    })
  }

  function alternarPecaDoEstojo(id: string, tipo: TipoPeca) {
    if (cena?.pecas.some((peca) => peca.id === id)) {
      removerPeca(id)
    } else {
      colocarPeca(id, tipo, POSICAO_PADRAO_BASQUETE[id].x, POSICAO_PADRAO_BASQUETE[id].y)
    }
  }

  function handleSoltarNaQuadra(event: DragEvent<HTMLDivElement>) {
    const dados = event.dataTransfer.getData(TIPO_ARRASTE_PECA)
    const svg = event.currentTarget.querySelector('svg')
    if (!dados || !svg) return
    event.preventDefault()
    const { id, tipo } = JSON.parse(dados) as { id: string; tipo: TipoPeca }
    const { x, y } = paraCoordenadasSvg(svg, event.clientX, event.clientY)
    colocarPeca(id, tipo, x, y)
  }

  if (!chave || notFound) {
    return <Navigate to="/" replace />
  }

  if (!team || !cena) {
    return (
      <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center p-6 text-gray-500">
        Carregando...
      </div>
    )
  }

  const contagem: Record<TipoPeca, number> = {
    jogador_time_a: cena.pecas.filter((peca) => peca.tipo === 'jogador_time_a').length,
    jogador_time_b: cena.pecas.filter((peca) => peca.tipo === 'jogador_time_b').length,
    bola: cena.pecas.filter((peca) => peca.tipo === 'bola').length,
  }
  const max = MAX_JOGADORES[cena.quadra]
  const selecionada = cena.pecas.find((peca) => peca.id === selectedId)
  const setaSelecionadaNoBasquete = cena.quadra === 'basquete' && acaoSelecionadaId !== null
  const podeRemover =
    setaSelecionadaNoBasquete || (selecionada && (selecionada.tipo !== 'bola' || cena.quadra === 'basquete'))
  const origemDaSeta = cena.pecas.find((peca) => peca.id === origemSelecionada)
  // Geometria de cada seta; a seta selecionada acompanha o cursor enquanto a ponta é arrastada.
  const setasNaQuadra = cena.acoes.flatMap((acao) => {
    const origem = cena.pecas.find((peca) => peca.id === acao.origem)
    const destino =
      typeof acao.destino === 'string' ? cena.pecas.find((peca) => peca.id === acao.destino) : acao.destino
    if (!origem || !destino) return []
    const ponta = acao.id === acaoSelecionadaId && arrastandoPonta && pontaSeta ? pontaSeta : destino
    return [{ acao, x1: origem.x, y1: origem.y, x2: ponta.x, y2: ponta.y }]
  })
  const setaSelecionada = setasNaQuadra.find((seta) => seta.acao.id === acaoSelecionadaId)

  return (
    <div className="min-h-screen bg-slate-50 pb-10">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">Editor de jogadas</p>
            <h1 className="text-xl font-bold text-slate-900">{team.nome}</h1>
          </div>
          <Button onClick={() => navigate('/times/jogadas')} variant="outline">
            <FolderOpenIcon className="h-4 w-4" />
            Minhas jogadas
          </Button>
        </div>
      </header>

      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 pt-6">
        <div className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-card ring-1 ring-slate-900/5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            {cena.quadra === 'futebol' && (
              <>
                <Button onClick={handleAdicionarJogador('jogador_time_a')} disabled={contagem.jogador_time_a >= max} variant="outline">
                  <PlusIcon className="h-4 w-4 text-blue-600" />
                  Time A ({contagem.jogador_time_a}/{max})
                </Button>
                <Button onClick={handleAdicionarJogador('jogador_time_b')} disabled={contagem.jogador_time_b >= max} variant="outline">
                  <PlusIcon className="h-4 w-4 text-red-600" />
                  Time B ({contagem.jogador_time_b}/{max})
                </Button>
              </>
            )}
            <Button onClick={handleRemoverSelecionado} disabled={!podeRemover} variant="danger">
              <TrashIcon className="h-4 w-4" />
              Remover
            </Button>
            {cena.quadra === 'basquete' && (
              <Button onClick={limparPrancheta} disabled={cena.pecas.length === 0} variant="danger">
                Limpar prancheta
              </Button>
            )}
            {cena.quadra === 'futebol' && (
            <>
            <div className="mx-1 hidden h-6 w-px bg-slate-200 sm:block" />
            <Button
              onClick={alternarModoDesenho('movimentacao')}
              disabled={editandoId !== null}
              variant="movimento"
              active={modoDesenho === 'movimentacao'}
            >
              {modoDesenho === 'movimentacao' ? 'Desenhando... (clique p/ sair)' : 'Desenhar movimentação'}
            </Button>
            <Button
              onClick={alternarModoDesenho('passe')}
              disabled={editandoId !== null}
              variant="passe"
              active={modoDesenho === 'passe'}
            >
              {modoDesenho === 'passe' ? 'Desenhando... (clique p/ sair)' : 'Desenhar passe'}
            </Button>
            </>
            )}
          </div>

          <Button onClick={() => setModalSalvarAberto(true)} variant="primary">
            Salvar jogada
          </Button>
        </div>

        {cena.quadra === 'basquete' && (
          <EstojoPecas
            pecas={cena.pecas}
            onAlternar={alternarPecaDoEstojo}
            ferramenta={setaSelecionada?.acao.tipo ?? modoDesenho}
            onFerramenta={escolherFerramenta}
            ferramentasBloqueadas={editandoId !== null}
          />
        )}

        {modoDesenho && (
          <div className="rounded-xl border border-brand-100 bg-brand-50 px-4 py-2.5 text-sm text-brand-800">
            {editandoId ? <strong>Editando seta — </strong> : null}
            {cena.quadra === 'basquete'
              ? 'Arraste de uma peça até outra peça ou até um ponto da quadra. Esc sai do modo de desenho.'
              : origemSelecionada
                ? 'Selecione a peça de destino, ou clique num ponto vazio da quadra.'
                : editandoId
                  ? 'Selecione a nova peça de origem da seta.'
                  : 'Selecione a peça de origem da seta.'}
          </div>
        )}

        <div className="flex w-full flex-col items-start gap-6 lg:flex-row lg:justify-center">
        <div className="w-full max-w-3xl" onDragOver={(event) => event.preventDefault()} onDrop={handleSoltarNaQuadra}>
        <QuadraSvg
          quadra={cena.quadra}
          onPointerDown={handleSvgPointerDown}
          onPointerMove={handleSvgPointerMove}
          onPointerUp={handleSvgPointerUp}
        >
          <SetaMarkerDefs />
          {cena.quadra === 'basquete' &&
            setasNaQuadra.map(({ acao, x1, y1, x2, y2 }) => (
              <line
                key={`clique-${acao.id}`}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="transparent"
                strokeWidth={14}
                className="cursor-pointer touch-none"
                onPointerDown={(event) => {
                  event.preventDefault()
                  event.stopPropagation()
                  selecionarSeta(acao.id)
                }}
              />
            ))}
          {cena.pecas.map((peca) => (
            <PecaSvg
              key={peca.id}
              peca={peca}
              rotulo={rotuloPeca(peca, cena.quadra)}
              dragging={peca.id === draggingId}
              selected={peca.id === selectedId || peca.id === origemSelecionada}
              onPointerDown={handlePecaPointerDown(peca.id)}
            />
          ))}
          <g pointerEvents="none">
          {setasNaQuadra.map(({ acao, x1, y1, x2, y2 }) => (
            <AcaoSvg
              key={acao.id}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              tipo={acao.tipo}
              destacada={acao.id === acaoSelecionadaId || acao.id === editandoId}
            />
          ))}
          {modoDesenho && pontaSeta && origemDaSeta && (
            <g opacity={0.6}>
              <AcaoSvg
                x1={origemDaSeta.x}
                y1={origemDaSeta.y}
                x2={pontaSeta.x}
                y2={pontaSeta.y}
                tipo={modoDesenho}
              />
            </g>
          )}
          </g>
          {cena.quadra === 'basquete' && setaSelecionada && (
            <circle
              cx={setaSelecionada.x2}
              cy={setaSelecionada.y2}
              r={7}
              fill="white"
              stroke="#facc15"
              strokeWidth={3}
              className="cursor-grab touch-none"
              aria-label="Arrastar a ponta da seta"
              onPointerDown={(event) => {
                // Sem isso, um duplo clique seleciona o número da peça embaixo e o arraste vira arraste de texto.
                event.preventDefault()
                event.stopPropagation()
                setArrastandoPonta(true)
              }}
            />
          )}
        </QuadraSvg>
        </div>

        <AcoesPainel
          acoes={cena.acoes}
          pecas={cena.pecas}
          quadra={cena.quadra}
          editandoId={editandoId}
          selecionadaId={acaoSelecionadaId}
          onMoverInstante={moverInstante}
          onJuntar={juntarAoInstanteAnterior}
          onSeparar={separarEmInstanteProprio}
          onEditar={iniciarEdicaoAcao}
          onRemover={removerAcao}
          onSelecionar={alternarSelecaoAcao}
        />
        </div>
      </div>

      <SalvarJogadaModal
        aberto={modalSalvarAberto}
        salvando={salvando}
        erro={erroSalvar}
        onFechar={() => setModalSalvarAberto(false)}
        onSalvar={handleSalvarJogada}
      />
    </div>
  )
}
