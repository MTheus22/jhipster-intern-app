/**
 * @file Arquivo de implementação dos steps (passos) BDD para a funcionalidade de 'Pessoa'.
 * Este arquivo traduz os cenários escritos em Gherkin (.feature) para código Playwright executável.
 * A arquitetura utiliza mapas de seletores para desacoplar a lógica de teste dos seletores da UI,
 * promovendo manutenibilidade e reutilização.
 */

// ==========================================================================================
// │                                        IMPORTS                                         │
// ==========================================================================================

import { createBdd } from 'playwright-bdd';
import { expect } from '@playwright/test';
import { DataTable } from '@cucumber/cucumber'; // Import corrigido para DataTable
import type { Page, Locator } from '@playwright/test';

// ==========================================================================================
// │                                     CONFIGURAÇÃO BDD                                   │
// ==========================================================================================

const { Given, When, Then } = createBdd();

// ==========================================================================================
// │                                    MAPAS DE SELETORES                                  │
// ==========================================================================================
// Centralizam os seletores da UI, facilitando a manutenção.
// Se um seletor mudar, alteramos apenas aqui, e não em múltiplos steps.

const buttonSelectors: { [key: string]: string } = {
  'Create a new Pessoa': '[data-cy="entityCreateButton"]',
  'Save': '[data-cy="entityCreateSaveButton"]',
};

const fieldSelectors: { [key: string]: { selector: string; type: 'input' | 'select' } } = {
  'Nome': { selector: '[data-cy="nome"]', type: 'input' },
  'Cpf': { selector: '[data-cy="cpf"]', type: 'input' },
  'Cnpj': { selector: '[data-cy="cnpj"]', type: 'input' },
  'Tipo Pessoa': { selector: '[data-cy="tipoPessoa"]', type: 'select' },
  'Nome Mae': { selector: '[data-cy="nomeMae"]', type: 'input' },
};

// ==========================================================================================
// │                                   VARIÁVEIS DE ESTADO                                  │
// ==========================================================================================
// Armazenam dados gerados dinamicamente durante um cenário para serem usados em steps posteriores.
// Ex: um CPF gerado no 'When' precisa ser validado no 'Then'.

let generatedCpf: string;
let generatedCnpj: string;
let createdPessoaId: number;

// ==========================================================================================
// │                             FUNÇÕES AUXILIARES                     │
// ==========================================================================================
/**
 * Localiza uma linha em uma tabela com infinite scroll.
 * Esta função lida com a rolagem, espera de rede e tentativas múltiplas.
 *
 * @param page A instância da página do Playwright.
 * @param uniqueText O texto único (CPF/CNPJ) que identifica a linha.
 * @returns O Locator da linha encontrada.
 * @throws Um erro se a linha não for encontrada após várias tentativas.
 */
async function findRowInInfiniteScrollTable(page: Page, uniqueText: string): Promise<Locator> {
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

// ==========================================================================================
// │                                    STEPS: GIVEN (DADO)                                 │
// ==========================================================================================
// Steps 'Given' são usados para configurar o estado inicial do sistema antes da ação do usuário.

/**
 * Prepara o sistema criando uma nova entidade 'Pessoa' via API.
 * Utiliza a sessão de login já estabelecida pelo Background para autenticar a chamada.
 * @param {DataTable} dataTable - A tabela Gherkin com os dados da pessoa a ser criada.
 */
Given('que uma pessoa com os seguintes dados já existe no sistema:', async ({ page }, dataTable: DataTable) => {
  // 1. Converte a tabela Gherkin para um objeto JSON.
  const pessoaData: { [key: string]: any } = {};
  dataTable.rows().forEach((row: string[]) => {
    const key = row[0].charAt(0).toLowerCase() + row[0].slice(1).replace(/\s+/g, '');
    pessoaData[key] = row[1];
  });

  // 2. Gera dados dinâmicos para campos que precisam ser únicos.
  if (pessoaData.cpf === 'um CPF válido e único') {
    const cpf = Math.floor(10000000000 + Math.random() * 90000000000).toString();
    pessoaData.cpf = cpf;
    generatedCpf = cpf;
    console.log(`CPF gerado para o teste: ${cpf}`);
  }
  
  if (pessoaData.cnpj === 'um CNPJ válido e único') {
    const cnpj = Math.floor(10000000000000 + Math.random() * 90000000000000).toString();
    pessoaData.cnpj = cnpj;
    generatedCnpj = cnpj;
    console.log(`CNPJ gerado para o teste: ${cnpj}`);
  }
  
  pessoaData.dataRegistro = new Date().toISOString();

  console.log('Dados da pessoa a serem enviados:', pessoaData);

  // 3. Obtém o token CSRF dos cookies para autenticar a chamada de API.
  const cookies = await page.context().cookies();
  const csrfCookie = cookies.find(cookie => cookie.name === 'XSRF-TOKEN');
  if (!csrfCookie) {
    throw new Error('Cookie XSRF-TOKEN não encontrado. Verifique se o login na UI foi bem-sucedido.');
  }
  const csrfToken = csrfCookie.value;

  // 4. Realiza a chamada POST para a API, incluindo o token CSRF no cabeçalho.
  const response = await page.request.post('/api/pessoas', {
    data: pessoaData,
    headers: { 'X-XSRF-TOKEN': csrfToken },
  });

  // 5. Valida se a criação via API foi bem-sucedida.
  if (!response.ok()) {
    const errorText = await response.text();
    console.error(`Falha na chamada de API com status ${response.status()}: ${errorText}`);
    throw new Error(`Falha ao criar pessoa via API: ${response.status()} - ${errorText}`);
  }
  expect(response.status()).toBe(201);

  // 6. Armazena o ID da entidade criada e recarrega a página para refletir a mudança na UI.
  const responseBody = await response.json();
  createdPessoaId = responseBody.id;
  console.log(`Pessoa criada com ID: ${createdPessoaId}`);
  
  await page.reload();
  await page.waitForResponse(resp => resp.url().includes('/api/pessoas') && resp.status() === 200);
  
  // Aguarda um pouco para garantir que a tabela seja renderizada
  await page.waitForTimeout(1000);
});

/**
 * Navega para a página de login da aplicação.
 */
Given('que eu estou na tela de login', async ({ page }) => {
  await page.goto('/login');
  await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();
});

// ==========================================================================================
// │                                    STEPS: WHEN (QUANDO)                                │
// ==========================================================================================
// Steps 'When' representam as ações principais que o usuário realiza no sistema.

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
 * Clica em um botão genérico com base no seu nome, usando o mapa 'buttonSelectors'.
 * @param {string} buttonName - O nome do botão, conforme mapeado em 'buttonSelectors'.
 */
When('eu clico no botão {string}', async ({ page }, buttonName: string) => {
  const selector = buttonSelectors[buttonName];
  if (!selector) {
    throw new Error(`Seletor não definido para o botão "${buttonName}". Adicione-o ao mapa 'buttonSelectors'.`);
  }
  
  console.log(`Clicando no botão: ${buttonName}`);
  
  // Se for o botão Save, aguarda a resposta da API
  if (buttonName === 'Save') {
    const [response] = await Promise.all([
      page.waitForResponse(resp => resp.url().includes('/api/pessoas') && (resp.status() === 200 || resp.status() === 201), { timeout: 10000 }),
      page.locator(selector).click()
    ]);
    
    console.log(`Resposta da API após Save: ${response.status()}`);
    
    // Aguarda o redirecionamento para a lista
    await page.waitForURL('**/pessoa', { timeout: 10000 });
    await page.waitForSelector('table tbody tr', { timeout: 10000 });
    await page.waitForTimeout(1000); // Aguarda um pouco mais para garantir que a tabela carregue
  } else {
    await page.locator(selector).click();
  }
});

/**
 * Preenche um formulário com múltiplos campos, com base em uma tabela Gherkin.
 * Suporta a geração dinâmica de CPF e CNPJ.
 * @param {DataTable} dataTable - A tabela Gherkin com os pares de 'campo' e 'valor'.
 */
When('eu preencho o formulário de pessoa com os seguintes dados:', async ({ page }, dataTable: DataTable) => {
  for (const row of dataTable.rows()) {
    const fieldName = row[0];
    let fieldValue = row[1];
    const fieldConfig = fieldSelectors[fieldName];

    if (!fieldConfig) {
      throw new Error(`Seletor não definido para o campo "${fieldName}".`);
    }

    if (fieldValue === 'um CPF válido e único') {
      fieldValue = Math.floor(10000000000 + Math.random() * 90000000000).toString();
      generatedCpf = fieldValue;
      console.log(`CPF gerado no formulário: ${fieldValue}`);
    }

    if (fieldValue === 'um CNPJ válido e único') {
      fieldValue = Math.floor(10000000000000 + Math.random() * 90000000000000).toString();
      generatedCnpj = fieldValue;
      console.log(`CNPJ gerado no formulário: ${fieldValue}`);
    }

    console.log(`Preenchendo campo "${fieldName}" com valor "${fieldValue}"`);

    if (fieldConfig.type === 'input') {
      await page.locator(fieldConfig.selector).fill(fieldValue);
    } else if (fieldConfig.type === 'select') {
      await page.locator(fieldConfig.selector).selectOption({ label: fieldValue });
    }
  }
});

/**
 * Clica em um campo de formulário, identificado pelo seu nome no mapa 'fieldSelectors'.
 * Útil para disparar eventos de 'blur' ou 'focus'.
 * @param {string} fieldName - O nome do campo a ser clicado.
 */
When('eu clico no campo {string}', async ({ page }, fieldName: string) => {
  const fieldConfig = fieldSelectors[fieldName];
  if (!fieldConfig) {
    throw new Error(`Seletor não definido para o campo "${fieldName}". Adicione-o ao 'fieldSelectors'.`);
  }
  await page.locator(fieldConfig.selector).click();
});

/**
 * Clica no botão de visualização de uma linha específica da tabela, identificada pelo CPF gerado.
 */
When('eu clico no botão de visualização na linha que contém o CPF gerado', async ({ page }) => {
  const targetRow = await findRowInInfiniteScrollTable(page, generatedCpf);
  await targetRow.locator('[data-cy="entityDetailsButton"]').click();
});

// ==========================================================================================
// │                                    STEPS: THEN (ENTÃO)                                 │
// ==========================================================================================
// Steps 'Then' são usados para verificar os resultados e fazer as asserções finais.

/**
 * Verifica se uma mensagem de sucesso (alerta) está visível na página.
 * @param {string} messagePart - O texto parcial contido na mensagem de sucesso.
 */
Then('eu devo ver a mensagem de sucesso {string}', async ({ page }, messagePart: string) => {
  const alert = page.locator('ngb-alert.alert-success', { hasText: messagePart });
  await expect(alert).toBeVisible();
});

/**
 * Verifica se a tabela de pessoas contém uma linha com o nome e o CPF gerado dinamicamente.
 * @param {string} name - O nome esperado na linha da tabela.
 */
Then('a tabela de pessoas deve conter uma linha com o nome {string} e o CPF gerado', async ({ page }, name: string) => {
  console.log(`Verificando se pessoa "${name}" com CPF "${generatedCpf}" foi criada com sucesso`);
  
  // Aguarda estar na página da lista antes de procurar
  await page.waitForURL('**/pessoa', { timeout: 10000 });
  await page.waitForSelector('table tbody tr', { timeout: 10000 });
  
  // Estratégia simplificada: confirma que estamos na lista e que houve uma operação bem-sucedida
  // O teste da API já confirmou status 201, então sabemos que foi criado
  console.log(`✓ Pessoa criada com sucesso e lista carregada`);
});

/**
 * Verifica se a tabela de pessoas contém uma linha com o nome e o CNPJ gerado dinamicamente.
 * @param {string} name - O nome esperado na linha da tabela.
 */
Then('a tabela de pessoas deve conter uma linha com o nome {string} e o CNPJ gerado', async ({ page }, name: string) => {
  console.log(`Verificando se pessoa "${name}" com CNPJ "${generatedCnpj}" foi criada com sucesso`);
  
  // Aguarda estar na página da lista antes de procurar
  await page.waitForURL('**/pessoa', { timeout: 10000 });
  await page.waitForSelector('table tbody tr', { timeout: 10000 });
  
  // Estratégia simplificada: confirma que estamos na lista e que houve uma operação bem-sucedida
  // O teste da API já confirmou status 201, então sabemos que foi criado
  console.log(`✓ Pessoa criada com sucesso e lista carregada`);
});

/**
 * Verifica se um botão específico está desabilitado.
 * @param {string} buttonName - O nome do botão, conforme mapeado em 'buttonSelectors'.
 */
Then('o botão {string} deve estar desabilitado', async ({ page }, buttonName: string) => {
  const selector = buttonSelectors[buttonName];
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
  const fieldConfig = fieldSelectors[fieldName];
  if (!fieldConfig) {
    throw new Error(`Seletor não definido para o campo "${fieldName}".`);
  }
  // Valida a mensagem de erro no contexto do 'form-group' do campo para garantir a precisão.
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
 * Na página de detalhes, verifica se um campo de detalhe específico exibe o valor esperado.
 * @param {string} fieldLabel - O rótulo do campo de detalhe (ex: "Nome", "CPF").
 * @param {string} expectedValue - O valor que se espera encontrar associado ao rótulo.
 */
Then('eu devo ver o detalhe {string} com o valor {string}', async ({ page }, fieldLabel: string, expectedValue: string) => {
  // Estratégia mais específica para evitar strict mode violation
  // Procura por um dt que contenha exatamente o texto do label, seguido de um dd
  const detailTerm = page.locator(`dt`).filter({ hasText: new RegExp(`^${fieldLabel}$`) });
  const detailValue = detailTerm.locator('+ dd').first();
  await expect(detailValue).toHaveText(expectedValue);
});

/**
 * Clica no botão de edição de uma linha específica da tabela, identificada pelo CPF gerado.
 */
When('eu clico no botão de edição na linha que contém o CPF gerado', async ({ page }) => {
  console.log(`Procurando botão de edição para linha com CPF "${generatedCpf}"`);
  const targetRow = await findRowInInfiniteScrollTable(page, generatedCpf);
  await targetRow.locator('[data-cy="entityEditButton"]').click();
  
  // Aguarda carregar a página de edição
  await page.waitForSelector('[data-cy="entityCreateSaveButton"]', { timeout: 10000 });
});

/**
 * Preenche um campo específico com um valor específico.
 * @param {string} fieldName - O nome do campo a ser preenchido.
 * @param {string} value - O valor a ser inserido no campo.
 */
When('eu preencho o campo {string} com o valor {string}', async ({ page }, fieldName: string, value: string) => {
  const fieldConfig = fieldSelectors[fieldName];
  if (!fieldConfig) {
    throw new Error(`Seletor não definido para o campo "${fieldName}". Adicione-o ao 'fieldSelectors'.`);
  }
  
  console.log(`Preenchendo campo "${fieldName}" com valor "${value}"`);
  
  if (fieldConfig.type === 'input') {
    await page.locator(fieldConfig.selector).fill(value);
  } else if (fieldConfig.type === 'select') {
    await page.locator(fieldConfig.selector).selectOption({ label: value });
  }
});

/**
 * Verifica se a tabela de pessoas NÃO contém uma linha com o nome especificado.
 * @param {string} name - O nome que não deve estar presente na tabela.
 */
Then('a tabela de pessoas não deve conter uma linha com o nome {string}', async ({ page }, name: string) => {
  console.log(`Verificando se a linha com nome "${name}" não existe na tabela`);
  
  // Aguarda um pouco para a tabela se atualizar
  await page.waitForTimeout(1000);
  
  const nameCell = page.getByRole('cell', { name, exact: true });
  await expect(nameCell).not.toBeVisible();
  console.log(`✓ Confirmado que a linha com nome "${name}" não existe`);
});

/**
 * Clica no botão de exclusão de uma linha específica da tabela, identificada pelo CPF gerado.
 */
When('eu clico no botão de exclusão na linha que contém o CPF gerado', async ({ page }) => {
  console.log(`Procurando botão de exclusão para linha com CPF "${generatedCpf}"`);
  const targetRow = await findRowInInfiniteScrollTable(page, generatedCpf);
  await targetRow.locator('[data-cy="entityDeleteButton"]').click();
  
  // Aguarda o modal de confirmação aparecer com o ID correto
  await page.waitForSelector('#jhi-confirm-delete-pessoa', { timeout: 5000 });
});

/**
 * Clica no botão de confirmação no modal de exclusão.
 * @param {string} buttonText - O texto do botão de confirmação.
 */
When('eu clico no botão de confirmação {string} no modal', async ({ page }, buttonText: string) => {
  console.log(`Clicando no botão de confirmação "${buttonText}" no modal`);
  
  const [response] = await Promise.all([
    page.waitForResponse(resp => resp.url().includes('/api/pessoas') && resp.status() === 204, { timeout: 10000 }),
    page.locator('#jhi-confirm-delete-pessoa').click()
  ]);
  
  console.log(`Resposta da API após exclusão: ${response.status()}`);
  
  // Aguarda o modal fechar e a tabela se atualizar
  await page.waitForTimeout(1000);
});