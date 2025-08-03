/**
 * @file Steps independentes para testes de Pessoa Contato.
 * Implementação autônoma sem dependências de outros arquivos de steps.
 */

import { createBdd } from 'playwright-bdd';
import { expect, Page, Locator } from '@playwright/test';
import { DataTable } from '@cucumber/cucumber';

const { Given, When, Then } = createBdd();

// ==========================================================================================
// │                                    MAPAS DE SELETORES                                  │
// ==========================================================================================
export const pessoaContatoButtonSelectors: { [key: string]: string } = {
  'Create a new Pessoa Contato': '[data-cy="entityCreateButton"]',
  'Save': '[data-cy="entityCreateSaveButton"]',
};

const fieldSelectors: { [key: string]: { selector: string; type: 'input' | 'select' } } = {
  'Descricao': { selector: '[data-cy="descricao"]', type: 'input' },
  'Telefone Numero Completo': { selector: '[data-cy="telefoneNumeroCompleto"]', type: 'input' },
  'Contato Digital Ident': { selector: '[data-cy="contatoDigitalIdent"]', type: 'input' },
  'Contato': { selector: '[data-cy="contato"]', type: 'select' },
};

const checkboxSelectors: { [key: string]: string } = {
    'Preferido': '[data-cy="preferido"]',
    'Possui Whatsapp': '[data-cy="possuiWhatsapp"]',
    'Receber Confirmacoes': '[data-cy="receberConfirmacoes"]',
};

// ==========================================================================================
// │                                   VARIÁVEIS DE ESTADO                                  │
// ==========================================================================================
// Armazena o ID da pessoa criada no Background para ser usado nos cenários.
let createdPessoaId: number;

// ==========================================================================================
// │                             FUNÇÃO AUXILIAR DE BUSCA EM TABELA                           │
// ==========================================================================================
/**
 * Localiza uma linha em uma tabela com infinite scroll.
 * @param page A instância da página do Playwright.
 * @param uniqueText O texto único (neste caso, a descrição) que identifica a linha.
 * @returns O Locator da linha encontrada.
 */
async function findRowInPessoaContatoTable(page: Page, uniqueText: string): Promise<Locator> {
  const rowLocator = page.locator(`tbody tr`, { hasText: uniqueText });
  for (let i = 0; i < 10; i++) {
    if (await rowLocator.isVisible()) {
      return rowLocator;
    }
    const lastRow = page.locator('tbody tr').last();
    if (await lastRow.count() > 0) {
      await lastRow.scrollIntoViewIfNeeded();
    } else {
      break;
    }
    try {
      // Espera pela API específica de 'pessoa-contatos'
      await page.waitForResponse(resp => resp.url().includes('/api/pessoa-contatos') && resp.status() === 200, { timeout: 2000 });
    } catch (error) {
      // Ignora o timeout se não houver mais dados a carregar.
    }
  }
  await expect(rowLocator).toBeVisible({ timeout: 5000 });
  return rowLocator;
}

// ==========================================================================================
// │                                    STEPS: GIVEN (DADO)                                 │
// ==========================================================================================

/**
 * Cria uma entidade 'Pessoa' via API para servir como pré-requisito para os testes de contato.
 * @param {string} nome - O nome da pessoa a ser criada.
 */
Given('que uma pessoa com o nome {string} e um CPF único já existe no sistema', async ({ page }, nome: string) => {
  const pessoaData = {
    nome: nome,
    cpf: Math.floor(10000000000 + Math.random() * 90000000000).toString(),
    tipoPessoa: 'PF', // Um valor padrão, já que não é especificado
    dataRegistro: new Date().toISOString(),
  };

  const cookies = await page.context().cookies();
  const csrfCookie = cookies.find(cookie => cookie.name === 'XSRF-TOKEN');
  if (!csrfCookie) throw new Error('Cookie XSRF-TOKEN não encontrado.');
  
  const response = await page.request.post('/api/pessoas', {
    data: pessoaData,
    headers: { 'X-XSRF-TOKEN': csrfCookie.value },
  });
  expect(response.status()).toBe(201);
  
  const responseBody = await response.json();
  createdPessoaId = responseBody.id; // Salva o ID da pessoa para uso futuro.
});

// ==========================================================================================
// │                                    STEPS: WHEN (QUANDO)                                │
// ==========================================================================================

/**
 * Preenche o formulário de contato com dados de uma tabela Gherkin.
 * Possui lógica especial para associar o contato à pessoa criada no Background.
 */
When('eu preencho o formulário de contato de pessoa com os seguintes dados:', async ({ page }, dataTable: DataTable) => {
  for (const row of dataTable.rows()) {
    const fieldName = row[0];
    let fieldValue = row[1];
    const fieldConfig = fieldSelectors[fieldName];

    if (!fieldConfig) {
      throw new Error(`Seletor não definido para o campo "${fieldName}".`);
    }

    // Lógica especial para o campo 'Contato'
    if (fieldName === 'Contato' && fieldValue.startsWith('o id da pessoa')) {
      if (!createdPessoaId) {
        throw new Error('O ID da pessoa de teste não foi definido. O step do Background falhou?');
      }
      await page.locator(fieldConfig.selector).selectOption({ value: createdPessoaId.toString() });
    } 
    // Lógica para campos padrão
    else if (fieldConfig.type === 'input') {
      await page.locator(fieldConfig.selector).fill(fieldValue);
    }
  }
});

/**
 * Marca (seleciona) um checkbox com base no seu nome mapeado.
 * @param {string} checkboxName - O nome do checkbox, conforme 'checkboxSelectors'.
 */
When('eu marco o checkbox {string}', async ({ page }, checkboxName: string) => {
    const selector = checkboxSelectors[checkboxName];
    if (!selector) {
        throw new Error(`Seletor não definido para o checkbox "${checkboxName}".`);
    }
    await page.locator(selector).check();
});

// ==========================================================================================
// │                                    STEPS: THEN (ENTÃO)                                 │
// ==========================================================================================

/**
 * Verifica se a tabela de contatos contém uma linha com a descrição fornecida.
 * @param {string} description - A descrição esperada na linha da tabela.
 */
Then('a tabela de contatos de pessoa deve conter uma linha com a descrição {string}', async ({ page }, description: string) => {
    await findRowInPessoaContatoTable(page, description);
});