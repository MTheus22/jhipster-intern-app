/**
 * @file Funções auxiliares para manipulação de tabelas em testes E2E.
 */

import { Page, Locator, expect } from '@playwright/test';

/**
 * Garante que a tabela de entidades esteja ordenada pela coluna 'ID' em ordem decrescente.
 * Isso é crucial para que os itens mais recentes, criados durante o teste, apareçam no topo.
 * A função é idempotente: ela verifica o estado atual da ordenação e clica apenas se necessário.
 *
 * @param page A instância da página do Playwright.
 */
export async function sortByHighestID(page: Page) {
  const idHeader = page.locator('th[jhisortby="id"]');
  const sortIcon = idHeader.locator('svg');

  // Garante que o cabeçalho esteja visível antes de interagir.
  await expect(idHeader).toBeVisible();
  const currentSort = await sortIcon.getAttribute('data-icon');

  // Se já estiver ordenado de forma decrescente ('sort-down'), não faz nada.
  if (currentSort === 'sort-down') {
    return;
  }

  // Se estiver no estado inicial ('sort'), clica duas vezes para chegar em 'sort-down'.
  if (currentSort === 'sort') {
    await idHeader.click();
    // Espera a UI atualizar para o estado 'sort-up' antes de clicar novamente.
    await expect(sortIcon).toHaveAttribute('data-icon', 'sort-up', { timeout: 5000 });
  }

  // Clica uma última vez para garantir a ordenação decrescente ('sort-down').
  await idHeader.click();
  await expect(sortIcon).toHaveAttribute('data-icon', 'sort-down', { timeout: 5000 });

  // Sincroniza com a UI, esperando o carregamento da tabela terminar.
  const refreshButton = page.getByRole('button', { name: 'Refresh List' });
  await expect(refreshButton).toBeEnabled({ timeout: 10000 });
}

/**
 * Localiza uma linha em uma tabela com rolagem infinita (infinite scroll).
 * A função lida com a rolagem progressiva, espera de rede e múltiplas tentativas
 * para encontrar um elemento que pode não estar visível inicialmente.
 *
 * @param page A instância da página do Playwright.
 * @param uniqueText O texto único (como CPF ou CNPJ) que identifica a linha desejada.
 * @returns Uma Promise que resolve para o Locator da linha encontrada.
 * @throws Um erro se a linha não for encontrada após esgotar as tentativas de rolagem.
 */
export async function findRowInInfiniteScrollTable(page: Page, uniqueText: string): Promise<Locator> {
  // Aguarda a tabela e pelo menos uma linha estarem presentes na DOM.
  await page.waitForSelector('table tbody tr', { timeout: 5000 });

  const rowLocator = page.locator(`tbody tr`, { hasText: uniqueText });

  // Tenta localizar a linha na porção visível da tabela antes de iniciar a rolagem.
  if (await rowLocator.count() > 0) {
    await rowLocator.first().scrollIntoViewIfNeeded();
    return rowLocator.first();
  }

  // Se não encontrou, inicia a estratégia de rolagem para carregar mais itens.
  const maxScrolls = 10;
  for (let i = 0; i < maxScrolls; i++) {
    // Executa o scroll diretamente no elemento `tbody` que contém o listener de infinite scroll.
    await page.evaluate(() => {
      const tbody = document.querySelector('table tbody');
      if (tbody) {
        tbody.scrollTop = tbody.scrollHeight;
      }
    });

    // Aguarda a resposta da API que carrega os novos itens da tabela.
    // Esta é uma espera mais confiável do que um timeout fixo.
    try {
      await page.waitForResponse(resp => resp.url().includes('/api/pessoas') && resp.status() === 200, { timeout: 2000 });
    } catch (error) {
      // Se a resposta não vier (ex: fim da lista), o loop continua e eventualmente falhará.
    }

    // Verifica novamente se a linha apareceu após o carregamento.
    if (await rowLocator.count() > 0) {
      await rowLocator.first().scrollIntoViewIfNeeded();
      return rowLocator.first();
    }
  }

  // Se o loop terminar sem encontrar a linha, lança um erro claro.
  const totalRows = await page.locator('tbody tr').count();
  throw new Error(`A linha com o texto "${uniqueText}" não foi encontrada após ${maxScrolls} tentativas de rolagem. Total de linhas carregadas: ${totalRows}.`);
}
