import { expect, test } from '@playwright/test'
import { criarJogada, criarTime } from './helpers/api'

test('atleta entra com a chave, vê as jogadas publicadas e controla a animação', async ({ page, request }) => {
  // Preparação pela API: um time de basquete com duas jogadas publicadas.
  // A cena padrão do helper tem 2 instantes, ou seja, 2 s de animação.
  const time = await criarTime(request, { nome: 'Furacão Basquete', modalidade: 'basquete' })
  await criarJogada(request, time, { titulo: 'Pick and roll', status: 'publicada' })
  await criarJogada(request, time, { titulo: 'Contra-ataque', status: 'publicada' })

  // Relógio controlado pelo teste: depois do pauseAt, a animação só anda quando o teste
  // avança o tempo com runFor (sem isso, o relógio instalado continua andando em tempo real).
  const inicio = new Date('2026-01-01T12:00:00')
  await page.clock.install({ time: inicio })

  await test.step('entra pela tela inicial com a chave do atleta', async () => {
    await page.goto('/')
    await page.clock.pauseAt(new Date(inicio.getTime() + 10_000))
    await page.getByRole('button', { name: 'É atleta? Acesse as jogadas do seu time' }).click()
    await expect(page.getByRole('heading', { name: 'Entrar como atleta' })).toBeVisible()

    await page.getByLabel('Chave do time').fill(time.chave_atleta)
    await page.getByRole('button', { name: 'Entrar' }).click()
  })

  await test.step('vê o time e as jogadas publicadas', async () => {
    await expect(page.getByRole('heading', { name: 'Jogadas do time' })).toBeVisible()
    await expect(page.getByText('Furacão Basquete')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Pick and roll' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Contra-ataque' })).toBeVisible()
  })

  const barra = page.getByRole('progressbar', { name: 'Progresso da jogada' })
  const progresso = async () => Number(await barra.getAttribute('aria-valuenow'))
  const botaoPlay = page.getByRole('button', { name: 'Play' })
  const botaoPausar = page.getByRole('button', { name: 'Pausar' })

  await test.step('abre uma jogada parada no início', async () => {
    await page.getByRole('button', { name: 'Pick and roll' }).click()
    await expect(page.getByRole('heading', { name: 'Pick and roll' })).toBeVisible()
    await expect(barra).toHaveAttribute('aria-valuenow', '0')
    await expect(botaoPlay).toBeEnabled()
  })

  await test.step('play anda a animação', async () => {
    await botaoPlay.click()
    await expect(botaoPausar).toBeVisible()
    await page.clock.runFor(500)

    await expect.poll(progresso).toBeGreaterThan(0)
    expect(await progresso()).toBeLessThanOrEqual(25)
  })

  await test.step('pause congela a animação', async () => {
    await botaoPausar.click()
    await expect(botaoPlay).toBeVisible()
    const pausado = await progresso()

    await page.clock.runFor(1000)

    await expect(barra).toHaveAttribute('aria-valuenow', String(pausado))
  })

  await test.step('play de novo vai até o fim e para sozinho', async () => {
    await botaoPlay.click()
    await page.clock.runFor(3000)

    await expect(barra).toHaveAttribute('aria-valuenow', '100')
    await expect(botaoPlay).toBeVisible()
  })

  await test.step('reiniciar volta ao início e recomeça a tocar', async () => {
    await page.getByRole('button', { name: 'Reiniciar' }).click()

    await expect(barra).toHaveAttribute('aria-valuenow', '0')
    await expect(botaoPausar).toBeVisible()
  })
})
