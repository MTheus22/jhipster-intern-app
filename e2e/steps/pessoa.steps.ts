import { createBdd } from 'playwright-bdd';
import { expect } from '@playwright/test';

const { Given, When, Then } = createBdd();

const buttonSelectors: { [key: string]: string } = {
  'Create a new Pessoa': '[data-cy="entityCreateButton"]',
  'Save': '[data-cy="entityCreateSaveButton"]'
};

const fieldSelectors: { [key: string]: { selector: string; type: 'input' | 'select' } } = {
  'Nome': { selector: '[data-cy="nome"]', type: 'input' },
  'Cpf': { selector: '[data-cy="cpf"]', type: 'input' },
  'Tipo Pessoa': { selector: '[data-cy="tipoPessoa"]', type: 'select' },
};

let generatedCpf: string;

Given('que eu estou na tela de login', async ({ page }) => {
  await page.goto('/login');
  await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();
});

When('eu faço login com as credenciais {string} e {string}', async ({ page }, username, password) => {
  // 1. Preenche o campo de usuário
  await page.locator('input[name="username"]').fill(username);

  // 2. Preenche o campo de senha
  await page.locator('input[name="password"]').fill(password);

  // 3. Clica no botão de submeter o formulário
  await page.locator('button[type="submit"]').click();

  // 4. Verifica se o login teve sucesso, procurando por um elemento que só aparece para usuários logados
  await expect(page.locator('#entity-menu')).toBeVisible();
});

// Substitua o step de navegação pendente por este:
When('eu navego para a lista de {string}', async ({ page }, entityName) => {
  // 1. Clica no menu dropdown 'Entities' para abri-lo
  await page.locator('#entity-menu').click();

  // 2. Dentro do menu, clica no item que tem o texto que recebemos (ex: "Pessoa")
  await page.getByRole('link', { name: entityName, exact: true }).click();

  // 3. Verifica se a navegação foi bem-sucedida, procurando pelo título na nova página
  const headingName = entityName.endsWith('s') ? entityName : `${entityName}s`;
  await expect(page.getByRole('heading', { name: headingName })).toBeVisible();
});

When('eu clico no botão {string}', async ({ page }, buttonName: string) => {
  const selector = buttonSelectors[buttonName];
  if (!selector) {
    throw new Error(`Seletor não definido para o botão "${buttonName}". Por favor, adicione-o ao mapa 'buttonSelectors'.`);
  }
  await page.locator(selector).click();
});

When('eu preencho o formulário de pessoa com os seguintes dados:', async ({ page }, dataTable: DataTable) => {
  const rows = dataTable.rows();

  for (const row of rows) {
    const fieldName = row[0]; 
    let fieldValue = row[1]; 

    const fieldConfig = fieldSelectors[fieldName];
    if (!fieldConfig) {
      throw new Error(`Seletor não definido para o campo "${fieldName}".`);
    }

    // Lógica para gerar um CPF único dinamicamente
    if (fieldName === 'Cpf') {
      // Gera um número aleatório de 11 dígitos
      fieldValue = Math.floor(10000000000 + Math.random() * 90000000000).toString();
      generatedCpf = fieldValue;
    }

    // Preenche o campo de acordo com o seu tipo
    if (fieldConfig.type === 'input') {
      await page.locator(fieldConfig.selector).fill(fieldValue);
    } else if (fieldConfig.type === 'select') {
      await page.locator(fieldConfig.selector).selectOption({ label: fieldValue });
    }
  }
});

Then('eu devo ver a mensagem de sucesso {string}', async ({ page }, messagePart) => {
  // Usamos o seletor exato que você encontrou!
  const alert = page.locator('ngb-alert.alert-success', { hasText: messagePart });
  await expect(alert).toBeVisible();
});

Then('a tabela de pessoas deve conter uma linha com o nome {string} e o CPF gerado', async ({ page }, name) => {
  // Define o locator para a nossa linha-alvo.
  const targetRow = page.locator('[data-cy="entityTable"]', { hasText: generatedCpf });

  // Faremos um loop para rolar a página até encontrarmos nossa linha, ou até um limite de tentativas.
  for (let i = 0; i < 10; i++) { // Tenta até 10 vezes (para listas muito longas)
    if (await targetRow.count() > 0) {
      break; // Encontramos a linha, saia do loop!
    }
    // Se não encontrou, rola a roda do mouse para baixo para carregar mais itens.
    await page.mouse.wheel(0, 5000); // Rola 5000 pixels para baixo
    // Espera um pouco para a aplicação carregar os novos dados.
    await page.waitForTimeout(500);
  }

  // Agora, com a linha carregada e presente no DOM, fazemos nossas asserções finais.
  await expect(targetRow).toBeVisible();
  await expect(targetRow.getByRole('cell', { name })).toBeVisible();
});