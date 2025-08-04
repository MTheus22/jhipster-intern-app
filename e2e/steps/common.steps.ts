import { expect } from '@playwright/test';

import { Given, When, Then } from './fixtures';

// Importa os mapas de seletores que foram EXPORTADOS dos arquivos específicos
import { PESSOA_BUTTON_SELECTORS, PESSOA_FIELD_SELECTORS } from './pessoa.steps';
import { PESSOA_CONTATO_BUTTON_SELECTORS, PESSOA_CONTATO_FIELD_SELECTORS } from './pessoa-contato.steps';

const LOGIN_SELECTORS: { [key: string]: string } = {
  username: 'input[name="username"]',
  password: 'input[name="password"]',
  submit: 'button[type="submit"]',
};

const COMMON_BUTTON_SELECTORS: { [key: string]: string } = {
  Save: '[data-cy="entityCreateSaveButton"]',
};

// Combina todos os mapas de botões em um único mapa 'mestre'
const ALL_BUTTON_SELECTORS = {
  ...PESSOA_BUTTON_SELECTORS,
  ...PESSOA_CONTATO_BUTTON_SELECTORS,
  ...COMMON_BUTTON_SELECTORS,
};

// Combina todos os mapas de campos em um único mapa 'mestre'
const ALL_FIELD_SELECTORS = {
  ...PESSOA_FIELD_SELECTORS,
  ...PESSOA_CONTATO_FIELD_SELECTORS,
};

/**
 * Navega para a página de login da aplicação.
 */
Given('que eu estou na tela de login', async ({ page }) => {
  await page.goto('/login');
  await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();
});

/**
 * Realiza o login na aplicação com as credenciais fornecidas.
 * @param {string} username - O nome de usuário.
 * @param {string} password - A senha.
 */
When('eu faço login com as credenciais {string} e {string}', async ({ page }, username, password) => {
  await page.locator(LOGIN_SELECTORS.username).fill(username);
  await page.locator(LOGIN_SELECTORS.password).fill(password);
  await page.locator(LOGIN_SELECTORS.submit).click();
  await expect(page.locator('#entity-menu')).toBeVisible(); // Confirma que o menu de entidades está visível após o login.
});

/**
 * Navega para uma lista de entidades específica através do menu principal.
 * @param {string} entityName - O nome da entidade para a qual navegar (ex: "Pessoa").
 */
When('eu navego para a lista de {string}', async ({ page }, entityName) => {
  await page.locator('#entity-menu').click();
  await page.getByRole('link', { name: entityName, exact: true }).click();
  const headingName = entityName.endsWith('s') ? entityName : `${entityName}s`;
  await expect(page.getByRole('heading', { name: headingName })).toBeVisible();
});

/**
 * Clica em um botão genérico com base no seu nome, usando o mapa de seletores do contexto atual.
 * @param {string} buttonName - O nome do botão, conforme mapeado em 'buttonSelectors'.
 */
When('eu clico no botão {string}', async ({ page }, buttonName: string) => {
  const selector = ALL_BUTTON_SELECTORS[buttonName];
  if (!selector) {
    throw new Error(`Seletor não definido para o botão "${buttonName}". Botões disponíveis: ${Object.keys(ALL_BUTTON_SELECTORS).join(', ')}`);
  }
  await page.locator(selector).click();
});

/**
 * Clica no botão de confirmação no modal de exclusão e espera a resposta da API.
 * @param {string} buttonText - O texto do botão de confirmação (ex: "Delete").
 * @param {string} entityPath - O caminho da API da entidade (ex: "pessoas", "pessoa-contatoes").
 */
When('eu clico no botão de confirmar deleção no modal para a entidade {string}', async ({ page }, entityPath: string) => {
  // Combina a espera pela resposta da API com a ação de clique para evitar race conditions.
  await Promise.all([
    page.waitForResponse(resp => resp.url().includes(`/api/${entityPath}`) && resp.status() === 204, { timeout: 10000 }),
    page.locator('[data-cy="entityConfirmDeleteButton"]').click(),
  ]);
});

/**
 * Step para preencher qualquer campo de formulário.
 * @param {string} fieldName - O nome do campo a ser preenchido.
 * @param {string} value - O valor a ser inserido no campo.
 */
When('eu preencho o campo {string} com o valor {string}', async ({ page }, fieldName: string, value: string) => {
  const fieldConfig = ALL_FIELD_SELECTORS[fieldName];
  if (!fieldConfig) {
    throw new Error(`Seletor não definido para o campo "${fieldName}". Campos disponíveis: ${Object.keys(ALL_FIELD_SELECTORS).join(', ')}`);
  }

  if (fieldConfig.type === 'input' || fieldConfig.type === 'datetime') {
    await page.locator(fieldConfig.selector).fill(value);
  } else if (fieldConfig.type === 'select') {
    await page.locator(fieldConfig.selector).selectOption({ label: value });
  } else {
    throw new Error(`Tipo de campo "${fieldConfig.type}" não suportado para o campo "${fieldName}".`);
  }
});

/**
 * Verifica se uma mensagem de sucesso (alerta) está visível na página.
 * @param {string} messagePart - O texto parcial contido na mensagem de sucesso.
 */
Then('eu devo ver a mensagem de sucesso {string}', async ({ page }, messagePart: string) => {
  const alert = page.locator('ngb-alert.alert-success', { hasText: messagePart });
  await expect(alert).toBeVisible();
});

/**
 * Verifica se um botão específico está desabilitado.
 * @param {string} buttonName - O nome do botão, conforme mapeado em `ALL_BUTTON_SELECTORS`.
 */
Then('o botão {string} deve estar desabilitado', async ({ page }, buttonName: string) => {
  const selector = ALL_BUTTON_SELECTORS[buttonName];
  if (!selector) {
    throw new Error(`Seletor não definido para o botão "${buttonName}".`);
  }
  await expect(page.locator(selector)).toBeDisabled();
});
