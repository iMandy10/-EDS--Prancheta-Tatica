import { useEffect, useMemo, useState } from 'react'
import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom'
import { getPublishedPlay, type TeamAccess } from '../lib/athleteApi'
import type { Play } from '../lib/api'
import type { Cena } from '../types/cena'
import { useAnimacao } from '../hooks/useAnimacao'
import { simular } from '../lib/animacao'
import QuadraSvg from '../components/QuadraSvg'
import PecaSvg, { RAIOS } from '../components/PecaSvg'
import AcaoSvg, { SetaMarkerDefs } from '../components/AcaoSvg'
import ControlesAnimacao from '../components/ControlesAnimacao'
import { FOLGA_FIM_SETA, FOLGA_INICIO_SETA, recortarSeta, rotuloPeca } from '../lib/basquete'
import BarraProgresso from '../components/BarraProgresso'

function AnimacaoJogada({ cena }: { cena: Cena }) {
  const { pecas, passos, instanteAtual, tempo, duracao, tocando, tocar, pausar, reiniciar } = useAnimacao(cena)
  const { inicios } = useMemo(() => simular(cena), [cena])
  // O drible gera dois passos (jogador e bola), mas uma só seta; a bola é desenhada por cima de quem a conduz.
  const setas = passos.filter((passo, index) => passos.findIndex((outro) => outro.acao.id === passo.acao.id) === index)
  // A seta é desenhada como o treinador a desenhou: de onde a peça está quando a ação começa até a ponta.
  // No basquete ela sai da borda de quem executa e, se o destino for uma peça, para antes da borda dela.
  const recuo = (id: string, folga: number) => {
    const peca = cena.pecas.find((p) => p.id === id)
    return peca && cena.quadra === 'basquete' ? RAIOS[peca.tipo] + folga : 0
  }
  const coordenadas = ({ acao, de, para }: (typeof passos)[number]) => {
    const inicio = inicios.get(acao.id) ?? de
    const fim = typeof acao.destino === 'string' ? para : acao.destino
    const recuoFim = typeof acao.destino === 'string' ? recuo(acao.destino, FOLGA_FIM_SETA) : 0
    return recortarSeta(inicio.x, inicio.y, fim.x, fim.y, recuo(acao.origem, FOLGA_INICIO_SETA), recuoFim)
  }
  const pecasEmOrdem = [...pecas].sort((a, b) => Number(a.tipo === 'bola') - Number(b.tipo === 'bola'))

  return (
    <>
      <QuadraSvg quadra={cena.quadra}>
        <SetaMarkerDefs />
        {setas.map((passo) => (
          <g key={passo.acao.id} opacity={passo.instante === instanteAtual ? 1 : 0.35}>
            <AcaoSvg
              {...coordenadas(passo)}
              tipo={passo.acao.tipo}
              destacada={passo.instante === instanteAtual}
              preta={cena.quadra === 'basquete'}
            />
          </g>
        ))}
        {pecasEmOrdem.map((peca) => (
          <PecaSvg key={peca.id} peca={peca} rotulo={rotuloPeca(peca, cena.quadra)} />
        ))}
      </QuadraSvg>
      <BarraProgresso progresso={duracao > 0 ? tempo / duracao : 0} />
      <ControlesAnimacao
        tocando={tocando}
        desabilitado={duracao === 0}
        onTocar={tocar}
        onPausar={pausar}
        onReiniciar={reiniciar}
      />
    </>
  )
}

export default function AthletePlayViewerPage() {
  const navigate = useNavigate()
  const { playId } = useParams()
  const sessao = useLocation().state as { team: TeamAccess; chave: string } | null
  const [jogada, setJogada] = useState<Play | null>(null)
  const [erro, setErro] = useState<string | null>(null)

  const teamId = sessao?.team.id
  const chave = sessao?.chave

  useEffect(() => {
    if (!teamId || !chave) return
    getPublishedPlay(teamId, Number(playId), chave)
      .then(setJogada)
      .catch(() => setErro('Não foi possível carregar a jogada.'))
  }, [teamId, chave, playId])

  if (!sessao) {
    return <Navigate to="/atleta" replace />
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-10">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-6 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">{sessao.team.nome}</p>
            <h1 className="text-xl font-bold text-slate-900">{jogada?.titulo ?? 'Jogada'}</h1>
          </div>
          <button
            type="button"
            onClick={() => navigate('/atleta/jogadas', { state: sessao })}
            className="text-sm text-slate-500 hover:text-slate-700 hover:underline"
          >
            Voltar
          </button>
        </div>
      </header>

      <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 px-6 pt-6">
        {erro && <p className="text-sm text-red-600">{erro}</p>}
        {jogada ? <AnimacaoJogada cena={jogada.cena_json} /> : !erro && <p className="text-slate-500">Carregando...</p>}
        {jogada?.descricao && <p className="self-start text-sm text-slate-600">{jogada.descricao}</p>}
      </div>
    </div>
  )
}
