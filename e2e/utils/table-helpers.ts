/**
 * @file Funções auxiliares para manipulação de tabelas em testes E2E.
 */

import { Page, Locator, expect } from '@playwright/test';

/**
 * Garante que a tabela de Pessoas esteja ordenada pelo ID de forma decrescente,
 * @param page A instância da página do Playwright.
 */
export async function sortByHighestID(page: Page) {
  // 1. Localiza o cabeçalho da coluna "ID" pelo seu atributo único.
  const idHeader = page.locator('th[jhisortby="id"]');
  const sortIcon = idHeader.locator('svg');
  const currentSort = await sortIcon.getAttribute('data-icon');

  // 2. Se o ícone for 'sort-down', a tabela já está na ordem desejada (decrescente).
  if (currentSort === 'sort-down') {
    return; 
  } else if (currentSort === 'sort-up') {
    await idHeader.click();
  } else {
    throw new Error(`Ícone de ordenação desconhecido: ${currentSort}`);
  }

  // 3. Sincroniza com a UI, esperando o carregamento terminar.
  const refreshButton = page.getByRole('button', { name: 'Refresh List' });
  await expect(refreshButton).toBeEnabled({ timeout: 10000 });
}

/**
 * Localiza uma linha em uma tabela com infinite scroll.
 * Esta função lida com a rolagem, espera de rede e tentativas múltiplas.
 *
 * @param page A instância da página do Playwright.
 * @param uniqueText O texto único (CPF/CNPJ) que identifica a linha.
 * @returns O Locator da linha encontrada.
 * @throws Um erro se a linha não for encontrada após várias tentativas.
 */
export async function findRowInInfiniteScrollTable(page: Page, uniqueText: string): Promise<Locator> {
  console.log(`Procurando linha com CPF/CNPJ: "${uniqueText}"`);
  
  // Aguarda a tabela carregar
  await page.waitForSelector('table tbody tr', { timeout: 5000 });
  
  // Estratégia mais eficiente: busca primeiro, depois scroll se necessário
  let rowLocator = page.locator(`tbody tr:has-text("${uniqueText}")`);
  
  // Verifica se a linha já está na primeira página
  if (await rowLocator.count() > 0) {
    console.log(`Linha encontrada na primeira página`);
    await rowLocator.first().scrollIntoViewIfNeeded();
    return rowLocator.first();
  }
  
  // Se não encontrou, faz scroll no elemento correto (tbody tem infinite-scroll)
  const maxScrolls = 10; // Aumentado para garantir que carregue mais páginas
  
  for (let i = 0; i < maxScrolls; i++) {
    console.log(`Carregando mais dados... tentativa ${i + 1}/${maxScrolls}`);
    
    // Scroll no tbody (que tem o infinite-scroll)
    await page.evaluate(() => {
      const tbody = document.querySelector('table tbody');
      if (tbody) {
        // Scroll até o final do tbody para disparar o infinite scroll
        tbody.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }
      
      // Também faz scroll na página para garantir
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    });
    
    // Aguarda o carregamento das novas linhas
    await page.waitForTimeout(1000);
    
    // Aguarda potencial requisição de carregamento
    try {
      await page.waitForResponse(
        resp => resp.url().includes('/api/pessoas') && resp.status() === 200, 
        { timeout: 2000 }
      );
      console.log(`Nova página carregada via API`);
    } catch {
      // Se não houve requisição, não tem problema
    }
    
    // Verifica novamente se a linha apareceu
    if (await rowLocator.count() > 0) {
      console.log(`Linha encontrada após carregar ${i + 1} páginas`);
      await rowLocator.first().scrollIntoViewIfNeeded();
      return rowLocator.first();
    }
  }
  
  // Debug final - mostra informações úteis
  const totalRows = await page.locator('tbody tr').count();
  console.log(`Linha não encontrada. Total de linhas carregadas: ${totalRows}`);
  
  // Mostra alguns CPFs para debug (coluna 13)
  const cpfCells = await page.locator('tbody tr td:nth-child(13)').allTextContents();
  const sampleCpfs = cpfCells.slice(0, 5).filter(cpf => cpf.trim()).join(', ');
  console.log(`Primeiros CPFs na tabela: ${sampleCpfs}`);
  
  // Mostra os últimos CPFs também
  const lastCpfs = cpfCells.slice(-3).filter(cpf => cpf.trim()).join(', ');
  console.log(`Últimos CPFs na tabela: ${lastCpfs}`);
  
  throw new Error(`CPF/CNPJ "${uniqueText}" não encontrado após carregar ${maxScrolls} páginas. Total de linhas: ${totalRows}`);
}