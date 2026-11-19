import { expect, type Page, test } from '@playwright/test'
import { criarTime } from './helpers/api'

// Arrasta com o mouse de verdade, entre dois pontos dados em coordenadas da quadra (800 x 500).
async function arrastarNaQuadra(page: Page, de: { x: number; y: number }, para: { x: number; y: number }) {
  const quadra = page.getByRole('img', { name: 'Quadra de basquete' })
  const naTela = (ponto: { x: number; y: number }) =>
    quadra.evaluate((svg: SVGSVGElement, { x, y }) => {
      const tela = new DOMPoint(x, y).matrixTransform(svg.getScreenCTM()!)
      return { x: tela.x, y: tela.y }
    }, ponto)
  const inicio = await naTela(de)
  const fim = await naTela(para)
  await page.mouse.move(inicio.x, inicio.y)
  await page.mouse.down()
  await page.mouse.move(fim.x, fim.y, { steps: 5 })
  await page.mouse.up()
}

test('treinador monta a jogada, desenha setas, salva em rascunho e publica', async ({ page, request }) => {
  const time = await criarTime(request, { nome: 'Lakers E2E', modalidade: 'basquete' })
  const titulo = 'Pick and roll'
  const painel = page.getByRole('complementary').filter({ hasText: 'Ações da jogada' })
  const corrida = 'Movimentação de A2 · SG para ponto livre'
  const bloqueio = 'Bloqueio de B1 · PG para ponto livre'

  await test.step('entra com a chave de treinador e abre o editor', async () => {
    await page.goto('/')
    await page.getByLabel('Já tenho um time — colar minha chave de treinador').fill(time.chave_treinador)
    await page.getByRole('button', { name: 'Entrar' }).click()
    await page.getByRole('button', { name: 'Ir para o editor' }).click()
    await expect(page.getByRole('img', { name: 'Quadra de basquete' })).toBeVisible()
  })

  await test.step('coloca A1, A2 e B1 na quadra pelo estojo', async () => {
    const estojo = (grupo: string) => page.getByText(grupo, { exact: true }).locator('..').getByRole('button')
    await estojo('Time A').nth(0).click()
    await estojo('Time A').nth(1).click()
    await estojo('Time B').nth(0).click()
  })

  await test.step('desenha uma corrida do A2 e um bloqueio do B1', async () => {
    await page.getByRole('button', { name: 'Movimentação' }).click()
    await arrastarNaQuadra(page, { x: 270, y: 110 }, { x: 400, y: 80 })
    await page.getByRole('button', { name: 'Bloqueio' }).click()
    await arrastarNaQuadra(page, { x: 470, y: 250 }, { x: 380, y: 330 })

    await expect(painel.getByText(corrida)).toBeVisible()
    await expect(painel.getByText(bloqueio)).toBeVisible()
    await expect(painel.getByText('Instante 2')).toBeVisible()
  })

  await test.step('salva a jogada como rascunho', async () => {
    await page.getByRole('button', { name: 'Salvar jogada' }).click()
    await page.getByLabel('Título').fill(titulo)
    await page.getByRole('button', { name: 'Salvar', exact: true }).click()
    await expect(page.getByRole('heading', { name: 'Salvar jogada' })).toBeHidden()
  })

  const cartao = page.getByRole('listitem').filter({ has: page.getByRole('heading', { name: titulo }) })

  await test.step('em "Minhas jogadas", a jogada aparece em rascunho e é publicada', async () => {
    await page.getByRole('button', { name: 'Minhas jogadas' }).click()
    await expect(cartao.getByText('Rascunho')).toBeVisible()

    await cartao.getByRole('button', { name: 'Publicar' }).click()
    await expect(cartao.getByText('Publicada')).toBeVisible()

    await page.reload()
    await expect(cartao.getByText('Publicada')).toBeVisible()
  })

  await test.step('reaberta no editor, a jogada salva tem as duas setas', async () => {
    await cartao.getByRole('button', { name: 'Reabrir no editor' }).click()
    await expect(painel.getByText(corrida)).toBeVisible()
    await expect(painel.getByText(bloqueio)).toBeVisible()
  })
})
