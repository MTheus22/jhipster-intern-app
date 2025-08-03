import { expect } from '@playwright/test';

import { Given, When, Then } from './fixtures';

// Importa os mapas de seletores que foram EXPORTADOS dos arquivos específicos
import { PESSOA_BUTTON_SELECTORS } from './pessoa.steps';
import { pessoaContatoButtonSelectors } from './pessoa-contato.steps';

// Combina todos os mapas de botões em um único mapa 'mestre'
const allButtonSelectors = {
  ...PESSOA_BUTTON_SELECTORS,
  ...pessoaContatoButtonSelectors,
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
  await page.locator('input[name="username"]').fill(username);
  await page.locator('input[name="password"]').fill(password);
  await page.locator('button[type="submit"]').click();
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
  const selector = allButtonSelectors[buttonName];
  if (!selector) {
    throw new Error(`Seletor não definido para o botão "${buttonName}" nos mapas combinados.`);
  }
  await page.locator(selector).click();
});

/**
 * Verifica se uma mensagem de sucesso (alerta) está visível na página.
 * @param {string} messagePart - O texto parcial contido na mensagem de sucesso.
 */
Then('eu devo ver a mensagem de sucesso {string}', async ({ page }, messagePart: string) => {
  const alert = page.locator('ngb-alert.alert-success', { hasText: messagePart });
  await expect(alert).toBeVisible();
});
