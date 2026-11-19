import { expect, test } from '@playwright/test'
import { criarJogada, criarTime } from './helpers/api'

test('atleta só vê a jogada publicada e ela some quando o treinador despublica', async ({ browser, request }) => {
  // Preparação pela API: um time com uma jogada publicada e outra em rascunho.
  const time = await criarTime(request, { nome: 'Furacão FC', modalidade: 'futebol' })
  await criarJogada(request, time, { titulo: 'Saída de bola', status: 'publicada' })
  await criarJogada(request, time, { titulo: 'Escanteio ensaiado', status: 'rascunho' })

  // Dois navegadores separados, como duas pessoas em computadores diferentes:
  // a sessão (localStorage) do treinador não se mistura com a do atleta.
  const contextoAtleta = await browser.newContext()
  const contextoTreinador = await browser.newContext()
  const atleta = await contextoAtleta.newPage()
  const treinador = await contextoTreinador.newPage()

  const publicadaNoAtleta = atleta.getByRole('button', { name: 'Saída de bola' })
  const rascunhoNoAtleta = atleta.getByRole('button', { name: 'Escanteio ensaiado' })

  await test.step('atleta entra com a chave e só vê a jogada publicada', async () => {
    await atleta.goto('/atleta')
    await atleta.getByLabel('Chave do time').fill(time.chave_atleta)
    await atleta.getByRole('button', { name: 'Entrar' }).click()

    await expect(atleta.getByRole('heading', { name: 'Jogadas do time' })).toBeVisible()
    await expect(publicadaNoAtleta).toBeVisible()
    await expect(rascunhoNoAtleta).not.toBeVisible()
  })

  await test.step('treinador vê as duas jogadas e despublica a publicada', async () => {
    await treinador.goto('/')
    await treinador.getByLabel('Já tenho um time — colar minha chave de treinador').fill(time.chave_treinador)
    await treinador.getByRole('button', { name: 'Entrar' }).click()
    await expect(treinador.getByRole('heading', { name: 'Bem-vindo de volta!' })).toBeVisible()
    await treinador.goto('/times/jogadas')

    const cartaoPublicada = treinador.getByRole('listitem').filter({ hasText: 'Saída de bola' })
    const cartaoRascunho = treinador.getByRole('listitem').filter({ hasText: 'Escanteio ensaiado' })
    await expect(cartaoPublicada.getByText('Publicada', { exact: true })).toBeVisible()
    await expect(cartaoRascunho.getByText('Rascunho', { exact: true })).toBeVisible()

    await cartaoPublicada.getByRole('button', { name: 'Despublicar' }).click()
    await expect(cartaoPublicada.getByText('Rascunho', { exact: true })).toBeVisible()
    await expect(cartaoPublicada.getByRole('button', { name: 'Publicar' })).toBeVisible()
  })

  await test.step('atleta atualiza a tela e a jogada despublicada sumiu', async () => {
    await atleta.reload()

    await expect(atleta.getByText('Nenhuma jogada publicada ainda.')).toBeVisible()
    await expect(publicadaNoAtleta).not.toBeVisible()
    await expect(rascunhoNoAtleta).not.toBeVisible()
  })

  await contextoAtleta.close()
  await contextoTreinador.close()
})
