/**
 * @file Arquivo de implementação dos steps (passos) BDD para a entidade de 'Pessoa'.
 * Este arquivo traduz os cenários escritos em Gherkin (.feature) para código Playwright executável.
 * A arquitetura utiliza mapas de seletores para desacoplar a lógica de teste dos seletores da UI,
 * promovendo manutenibilidade e reutilização.
 */

// --- IMPORTS ---

import { expect } from '@playwright/test';
import { DataTable } from '@cucumber/cucumber';
// Garante que nossos steps terão acesso ao contexto (ctx) das fixtures customizadas.
import { Given, When, Then } from './fixtures';
import { sortByHighestID } from '../utils/table-helpers';

// --- MAPAS DE SELETORES ---
// Centralizam os seletores da UI para reutilização e fácil manutenção.

export const PESSOA_BUTTON_SELECTORS: { [key: string]: string } = {
  'Create a new Pessoa': '[data-cy="entityCreateButton"]',
  'Save': '[data-cy="entityCreateSaveButton"]',
};

export const PESSOA_FIELD_SELECTORS: { [key: string]: { selector: string; type: 'input' | 'select' } } = {
  'Nome': { selector: '[data-cy="nome"]', type: 'input' },
  'Cpf': { selector: '[data-cy="cpf"]', type: 'input' },
  'Cnpj': { selector: '[data-cy="cnpj"]', type: 'input' },
  'Tipo Pessoa': { selector: '[data-cy="tipoPessoa"]', type: 'select' },
  'Nome Mae': { selector: '[data-cy="nomeMae"]', type: 'input' },
};

// --- STEPS: GIVEN (DADO) ---
// Configura o estado inicial do sistema antes da ação do usuário.

/**
 * Cria uma nova entidade 'Pessoa' via API para pré-condição do teste.
 * Utiliza a sessão de login estabelecida para autenticar a chamada.
 * Dados dinâmicos (CPF, CNPJ, ID) são armazenados no contexto (ctx) do cenário.
 *
 * @param {object} fixtures - Contém a 'page' e o contexto 'ctx'.
 * @param {DataTable} dataTable - A tabela Gherkin com os dados da pessoa a ser criada.
 */
Given('que uma pessoa com os seguintes dados já existe no sistema:', async ({ page, ctx }, dataTable: DataTable) => {
  const pessoaData: { [key: string]: any } = {};
  dataTable.rows().forEach((row: string[]) => {
    const key = row[0].charAt(0).toLowerCase() + row[0].slice(1).replace(/\s+/g, '');
    pessoaData[key] = row[1];
  });

  if (pessoaData.cpf === 'um CPF válido e único') {
    const cpf = Math.floor(10000000000 + Math.random() * 90000000000).toString();
    pessoaData.cpf = cpf;
    ctx.generatedCpf = cpf;
  }

  if (pessoaData.cnpj === 'um CNPJ válido e único') {
    const cnpj = Math.floor(10000000000000 + Math.random() * 90000000000000).toString();
    pessoaData.cnpj = cnpj;
    ctx.generatedCnpj = cnpj;
  }

  pessoaData.dataRegistro = new Date().toISOString();

  const cookies = await page.context().cookies();
  const csrfCookie = cookies.find(cookie => cookie.name === 'XSRF-TOKEN');
  if (!csrfCookie) {
    throw new Error('Cookie XSRF-TOKEN não encontrado. Verifique se o login na UI foi bem-sucedido.');
  }
  const csrfToken = csrfCookie.value;

  const response = await page.request.post('/api/pessoas', {
    data: pessoaData,
    headers: { 'X-XSRF-TOKEN': csrfToken },
  });

  if (!response.ok()) {
    const errorText = await response.text();
    throw new Error(`Falha ao criar pessoa via API: ${response.status()} - ${errorText}`);
  }
  expect(response.status()).toBe(201);

  const responseBody = await response.json();
  ctx.createdPessoaId = responseBody.id;

  // Recarrega a página para garantir que a UI reflita a criação via API.
  await page.reload();
  await page.waitForResponse(resp => resp.url().includes('/api/pessoas') && resp.status() === 200);
});

// --- STEPS: WHEN (QUANDO) ---
// Representam as ações principais que o usuário realiza no sistema.

/**
 * Preenche um formulário com múltiplos campos, com base em uma tabela Gherkin.
 * Suporta a geração dinâmica de CPF e CNPJ e os armazena no contexto (ctx).
 * @param {object} fixtures - Contém a 'page' e o contexto 'ctx'.
 * @param {DataTable} dataTable - A tabela Gherkin com os pares de 'campo' e 'valor'.
 */
When('eu preencho o formulário de pessoa com os seguintes dados:', async ({ page, ctx }, dataTable: DataTable) => {
  for (const row of dataTable.rows()) {
    const fieldName = row[0];
    let fieldValue = row[1];
    const fieldConfig = PESSOA_FIELD_SELECTORS[fieldName];

    if (!fieldConfig) {
      throw new Error(`Seletor não definido para o campo "${fieldName}".`);
    }

    if (fieldValue === 'um CPF válido e único') {
      fieldValue = Math.floor(10000000000 + Math.random() * 90000000000).toString();
      ctx.generatedCpf = fieldValue;
    }

    if (fieldValue === 'um CNPJ válido e único') {
      fieldValue = Math.floor(10000000000000 + Math.random() * 90000000000000).toString();
      ctx.generatedCnpj = fieldValue;
    }

    if (fieldConfig.type === 'input') {
      await page.locator(fieldConfig.selector).fill(fieldValue);
    } else if (fieldConfig.type === 'select') {
      await page.locator(fieldConfig.selector).selectOption({ label: fieldValue });
    }
  }
});

/**
 * Clica em um campo de formulário, identificado pelo seu nome no mapa de seletores.
 * @param {string} fieldName - O nome do campo a ser clicado.
 */
When('eu clico no campo {string}', async ({ page }, fieldName: string) => {
  const fieldConfig = PESSOA_FIELD_SELECTORS[fieldName];
  if (!fieldConfig) {
    throw new Error(`Seletor não definido para o campo "${fieldName}".`);
  }
  await page.locator(fieldConfig.selector).click();
});

/**
 * Clica no botão de visualização da linha da tabela que contém o CPF gerado no contexto.
 */
When('eu clico no botão de visualização na linha que contém o CPF gerado', async ({ page, ctx }) => {
  if (!ctx.generatedCpf) {
    throw new Error('O CPF gerado não foi encontrado no contexto do teste (ctx).');
  }
  await sortByHighestID(page);
  const targetRow = page.locator('tbody tr', { hasText: ctx.generatedCpf });
  await targetRow.locator('[data-cy="entityDetailsButton"]').click();
});

/**
 * Clica no botão de edição da linha da tabela que contém o CPF gerado no contexto.
 */
When('eu clico no botão de edição na linha que contém o CPF gerado', async ({ page, ctx }) => {
  if (!ctx.generatedCpf) {
    throw new Error('O CPF gerado não foi encontrado no contexto do teste (ctx).');
  }
  await sortByHighestID(page);
  const targetRow = page.locator('tbody tr', { hasText: ctx.generatedCpf });
  await targetRow.locator('[data-cy="entityEditButton"]').click();
  await expect(page.locator('[data-cy="entityCreateSaveButton"]')).toBeVisible({ timeout: 10000 });
});

/**
 * Preenche um campo específico do formulário com um valor.
 * @param {string} fieldName - O nome do campo a ser preenchido.
 * @param {string} value - O valor a ser inserido no campo.
 */
When('eu preencho o campo {string} com o valor {string}', async ({ page }, fieldName: string, value: string) => {
  const fieldConfig = PESSOA_FIELD_SELECTORS[fieldName];
  if (!fieldConfig) {
    throw new Error(`Seletor não definido para o campo "${fieldName}".`);
  }
  if (fieldConfig.type === 'input') {
    await page.locator(fieldConfig.selector).fill(value);
  } else if (fieldConfig.type === 'select') {
    await page.locator(fieldConfig.selector).selectOption({ label: value });
  }
});

/**
 * Clica no botão de exclusão da linha da tabela que contém o CPF gerado no contexto.
 */
When('eu clico no botão de exclusão na linha que contém o CPF gerado', async ({ page, ctx }) => {
  if (!ctx.generatedCpf) {
    throw new Error('O CPF gerado não foi encontrado no contexto do teste (ctx).');
  }
  await sortByHighestID(page);
  const targetRow = page.locator('tbody tr', { hasText: ctx.generatedCpf });
  await targetRow.locator('[data-cy="entityDeleteButton"]').click();
  await expect(page.locator('#jhi-delete-pessoa-heading')).toBeVisible();
});

/**
 * Clica no botão de confirmação no modal de exclusão e espera a resposta da API.
 * @param {string} buttonText - O texto do botão de confirmação (ex: "Delete").
 */
When('eu clico no botão de confirmação {string} no modal', async ({ page }, buttonText: string) => {
  // Combina a espera pela resposta da API com a ação de clique para evitar race conditions.
  await Promise.all([
    page.waitForResponse(resp => resp.url().includes('/api/pessoas') && resp.status() === 204, { timeout: 10000 }),
    page.locator('[data-cy="entityConfirmDeleteButton"]').click(),
  ]);
});

// --- STEPS: THEN (ENTÃO) ---
// Verificam os resultados e fazem as asserções finais.

/**
 * Verifica se a tabela de pessoas contém uma linha com o nome e o CPF gerado no contexto.
 * @param {string} name - O nome esperado na linha da tabela.
 */
Then('a tabela de pessoas deve conter uma linha com o nome {string} e o CPF gerado', async ({ page, ctx }, name: string) => {
  if (!ctx.generatedCpf) {
    throw new Error('O CPF gerado não foi encontrado no contexto do teste (ctx).');
  }
  await sortByHighestID(page);
  const targetRow = page.locator('tbody tr', { hasText: ctx.generatedCpf });
  await expect(targetRow.getByRole('cell', { name })).toBeVisible();
});

/**
 * Verifica se a tabela de pessoas contém uma linha com o nome e o CNPJ gerado no contexto.
 * @param {string} name - O nome esperado na linha da tabela.
 */
Then('a tabela de pessoas deve conter uma linha com o nome {string} e o CNPJ gerado', async ({ page, ctx }, name: string) => {
  if (!ctx.generatedCnpj) {
    throw new Error('O CNPJ gerado não foi encontrado no contexto do teste (ctx).');
  }
  await sortByHighestID(page);
  const targetRow = page.locator('tbody tr', { hasText: ctx.generatedCnpj });
  await expect(targetRow.getByRole('cell', { name, exact: true })).toBeVisible();
});

/**
 * Verifica se um botão específico está desabilitado.
 * @param {string} buttonName - O nome do botão, conforme mapeado em `PESSOA_BUTTON_SELECTORS`.
 */
Then('o botão {string} deve estar desabilitado', async ({ page }, buttonName: string) => {
  const selector = PESSOA_BUTTON_SELECTORS[buttonName];
  if (!selector) {
    throw new Error(`Seletor não definido para o botão "${buttonName}".`);
  }
  await expect(page.locator(selector)).toBeDisabled();
});

/**
 * Verifica se uma mensagem de erro de validação está visível para um campo específico.
 * @param {string} errorMessage - A mensagem de erro exata esperada.
 * @param {string} fieldName - O nome do campo associado ao erro.
 */
Then('eu devo ver a mensagem de erro {string} para o campo {string}', async ({ page }, errorMessage: string, fieldName: string) => {
  const fieldConfig = PESSOA_FIELD_SELECTORS[fieldName];
  if (!fieldConfig) {
    throw new Error(`Seletor não definido para o campo "${fieldName}".`);
  }
  const fieldContainer = page.locator('.form-group', { has: page.locator(fieldConfig.selector) });
  await expect(fieldContainer.getByText(errorMessage, { exact: true })).toBeVisible();
});

/**
 * Verifica se a navegação para a página de detalhes da pessoa foi bem-sucedida.
 */
Then('eu devo estar na página de detalhes da pessoa', async ({ page }) => {
  await expect(page.locator('[data-cy="pessoaDetailsHeading"]')).toBeVisible();
});

/**
 * Na página de detalhes, verifica se um campo exibe o valor esperado.
 * @param {string} fieldLabel - O rótulo do campo de detalhe (ex: "Nome", "CPF").
 * @param {string} expectedValue - O valor esperado associado ao rótulo.
 */
Then('eu devo ver o detalhe {string} com o valor {string}', async ({ page }, fieldLabel: string, expectedValue: string) => {
  const detailTerm = page.locator(`dt`).filter({ hasText: new RegExp(`^${fieldLabel}$`) });
  const detailValue = detailTerm.locator('+ dd').first();
  await expect(detailValue).toHaveText(expectedValue);
});

/**
 * Verifica se a operação de salvamento foi bem-sucedida e houve redirecionamento para a lista.
 */
Then('a operação de salvamento de Pessoa é bem-sucedida e sou redirecionado para a lista', async ({ page }) => {
  await page.waitForResponse(
    resp => resp.url().includes('/api/pessoas') && (resp.status() === 200 || resp.status() === 201),
    { timeout: 10000 }
  );
  const refreshButton = page.getByRole('button', { name: 'Refresh List' });
  await expect(refreshButton).toBeEnabled({ timeout: 10000 });
  await page.waitForURL('**/pessoa', { timeout: 10000 });
});

/**
 * Verifica se a tabela de pessoas NÃO contém uma linha com o nome especificado.
 * @param {string} name - O nome que não deve estar presente na tabela.
 */
Then('a tabela de pessoas não deve conter uma linha com o nome {string}', async ({ page }, name: string) => {
  const nameCell = page.getByRole('cell', { name, exact: true });
  await expect(nameCell).not.toBeVisible();
});

/**
 * Verifica se a tabela de pessoas NÃO contém uma linha com o CPF gerado no contexto.
 */
Then('a tabela de pessoas não deve conter uma linha com o CPF gerado', async ({ page, ctx }) => {
  if (!ctx.generatedCpf) {
    throw new Error('O CPF gerado não foi encontrado no contexto do teste (ctx).');
  }
  await sortByHighestID(page);
  const targetRow = page.locator('tbody tr', { hasText: ctx.generatedCpf });
  await expect(targetRow).not.toBeVisible();
});