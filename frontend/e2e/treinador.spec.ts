import { expect, type Page, test } from '@playwright/test'

// Lê a chave exibida pelo CopyableKey que tem o rótulo informado.
async function lerChave(page: Page, rotulo: string): Promise<string> {
  const chave = page.getByText(rotulo, { exact: true }).locator('..').locator('code')
  await expect(chave).not.toBeEmpty()
  return (await chave.textContent()) ?? ''
}

test('treinador cria o time, vê as chaves, recarrega e retoma a sessão', async ({ page }) => {
  const nome = 'Furacão FC'
  const bemVindo = page.getByRole('heading', { name: 'Bem-vindo de volta!' })
  const timeNaSessao = page.getByText(`Time: ${nome} · Futebol`)

  await test.step('cria o time pela tela inicial', async () => {
    await page.goto('/')
    await page.getByLabel('Nome do time').fill(nome)
    await page.getByLabel('Modalidade').selectOption('futebol')
    await page.getByRole('button', { name: 'Criar time' }).click()
  })

  let chaveTreinador = ''
  let chaveAtleta = ''

  await test.step('vê as duas chaves na confirmação', async () => {
    await expect(page.getByText('Time criado com sucesso')).toBeVisible()
    await expect(page.getByRole('heading', { name: nome })).toBeVisible()
    await expect(page.getByText('Futebol', { exact: true })).toBeVisible()

    chaveTreinador = await lerChave(page, 'Sua chave de treinador (guarde com você)')
    chaveAtleta = await lerChave(page, 'Chave do atleta (compartilhe com o time)')
    expect(chaveTreinador).not.toBe(chaveAtleta)
  })

  await test.step('abre o site de novo e retoma a sessão', async () => {
    await page.goto('/')
    await expect(page).toHaveURL('/times/bem-vindo')
    await expect(bemVindo).toBeVisible()
    await expect(timeNaSessao).toBeVisible()

    await page.reload()
    await expect(bemVindo).toBeVisible()
    await expect(timeNaSessao).toBeVisible()

    await page.getByRole('button', { name: 'Ver chave do atleta' }).click()
    expect(await lerChave(page, 'Chave do time')).toBe(chaveAtleta)
    await page.getByRole('button', { name: 'Fechar' }).click()
  })

  await test.step('sai e entra de novo colando a chave de treinador', async () => {
    await page.getByRole('button', { name: 'Sair' }).click()
    await expect(page.getByRole('heading', { name: 'Criar novo time' })).toBeVisible()

    await page.getByLabel('Já tenho um time — colar minha chave de treinador').fill(chaveTreinador)
    await page.getByRole('button', { name: 'Entrar' }).click()
    await expect(bemVindo).toBeVisible()
    await expect(timeNaSessao).toBeVisible()
  })
})
