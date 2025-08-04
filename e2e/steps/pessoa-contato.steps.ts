/**
 * @file Arquivo de implementação dos steps (passos) BDD para a entidade de 'Pessoa Contato'.
 * Este arquivo traduz os cenários escritos em Gherkin (.feature) para código Playwright executável.
 * A arquitetura utiliza mapas de seletores para desacoplar a lógica de teste dos seletores da UI
 */

// --- IMPORTS ---
import { expect } from '@playwright/test';
import { DataTable } from '@cucumber/cucumber';
// Garante que nossos steps terão acesso ao contexto (ctx) das fixtures customizadas.
import { Given, When, Then } from './fixtures';
import { sortByHighestID } from '../utils/table-helpers';

// --- MAPAS DE SELETORES ---
// Centralizam os seletores da UI para reutilização e fácil manutenção.

export const PESSOA_CONTATO_BUTTON_SELECTORS: { [key: string]: string } = {
  'Create a new Pessoa Contato': '[data-cy="entityCreateButton"]',
};

export const PESSOA_CONTATO_FIELD_SELECTORS: { [key: string]: { selector: string; type: 'input' | 'select' | 'datetime' | 'checkbox' } } = {
  'Descricao': { selector: '[data-cy="descricao"]', type: 'input' },
  'Contato Digital Ident': { selector: '[data-cy="contatoDigitalIdent"]', type: 'input' },
  'Telefone Numero Completo': { selector: '[data-cy="telefoneNumeroCompleto"]', type: 'input' },
  'Telefone Ddd': { selector: '[data-cy="telefoneDdd"]', type: 'input' },
  'Telefone Numero': { selector: '[data-cy="telefoneNumero"]', type: 'input' },
  'Data Registro': { selector: '[data-cy="dataRegistro"]', type: 'datetime' },
  'Data Importacao': { selector: '[data-cy="dataImportacao"]', type: 'datetime' },
  'Data Exclusao': { selector: '[data-cy="dataExclusao"]', type: 'datetime' },
  'Contato': { selector: '[data-cy="contato"]', type: 'select' },
  'Preferido': { selector: '[data-cy="preferido"]', type: 'checkbox' },
  'Receber Propagandas': { selector: '[data-cy="receberPropagandas"]', type: 'checkbox' },
  'Receber Confirmacoes': { selector: '[data-cy="receberConfirmacoes"]', type: 'checkbox' },
  'Possui Whatsapp': { selector: '[data-cy="possuiWhatsapp"]', type: 'checkbox' },
};

// --- FUNÇÕES AUXILIARES ---

/**
 * Gera uma descrição única e aleatória para evitar conflitos em testes.
 * @returns {string} - Uma string com timestamp e hash aleatório.
 */
function generateUniqueDescription(): string {
  const timestamp = Date.now().toString(36);
  const randomHash = Math.random().toString(36).substring(2, 8);
  return `Desc_${timestamp}_${randomHash}`;
}

// --- STEPS: GIVEN (DADO) ---
// Configura o estado inicial do sistema antes da ação do usuário.

/**
 * Cria uma nova entidade 'Pessoa' via API para servir como pré-requisito para testes de contato.
 * Armazena o ID da pessoa criada no contexto para uso posterior.
 * @param {string} nome - O nome da pessoa a ser criada.
 */
Given('que uma pessoa com o nome {string} e um CPF único já existe no sistema', async ({ page, ctx }, nome: string) => {
  const pessoaData = {
    nome: nome,
    cpf: Math.floor(10000000000 + Math.random() * 90000000000).toString(),
    tipoPessoa: 'PF',
    dataRegistro: new Date().toISOString(),
  };

  // Armazena o CPF gerado no contexto para possível uso futuro
  ctx.generatedCpf = pessoaData.cpf;

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
});

/**
 * Cria uma nova entidade 'Pessoa Contato' via API para servir como pré-requisito para testes de edição.
 * Armazena o ID do contato criado no contexto para uso posterior.
 * @param {string} descricao - A descrição do contato a ser criado.
 */
Given('que um contato de pessoa com a descrição {string} e um ID único já existe no sistema', async ({ page, ctx }, descricao: string) => {
  if (!ctx.createdPessoaId) {
    throw new Error('O ID da pessoa de teste não foi encontrado no contexto. Verifique se o step do Background foi executado.');
  }

  const pessoaContatoData = {
    descricao: descricao,
    telefoneNumeroCompleto: '+55 (11) 12345-6789',
    preferido: false,
    receberPropagandas: false,
    receberConfirmacoes: false,
    possuiWhatsapp: false,
    dataRegistro: new Date().toISOString(),
    contato: {
      id: ctx.createdPessoaId
    }
  };

  const cookies = await page.context().cookies();
  const csrfCookie = cookies.find(cookie => cookie.name === 'XSRF-TOKEN');
  if (!csrfCookie) {
    throw new Error('Cookie XSRF-TOKEN não encontrado. Verifique se o login na UI foi bem-sucedido.');
  }
  const csrfToken = csrfCookie.value;

  const response = await page.request.post('/api/pessoa-contatoes', {
    data: pessoaContatoData,
    headers: { 'X-XSRF-TOKEN': csrfToken },
  });

  if (!response.ok()) {
    const errorText = await response.text();
    throw new Error(`Falha ao criar pessoa contato via API: ${response.status()} - ${errorText}`);
  }
  expect(response.status()).toBe(201);

  const responseBody = await response.json();
  ctx.createdPessoaContatoId = responseBody.id;
  
  // Recarrega a página para garantir que a UI reflita a criação via API.
  await page.reload();
  await page.waitForResponse(resp => resp.url().includes('/api/pessoa-contatoes') && resp.status() === 200);
});

// --- STEPS: WHEN (QUANDO) ---
// Representam as ações principais que o usuário realiza no sistema.

/**
 * Preenche um formulário de contato de pessoa com múltiplos campos, com base em uma tabela Gherkin.
 * Suporta geração dinâmica de descrições e associação com pessoa criada no contexto.
 * @param {object} fixtures - Contém a 'page' e o contexto 'ctx'.
 * @param {DataTable} dataTable - A tabela Gherkin com os pares de 'campo' e 'valor'.
 */
When('eu preencho o formulário de contato de pessoa com os seguintes dados:', async ({ page, ctx }, dataTable: DataTable) => {
  for (const row of dataTable.rows()) {
    const fieldName = row[0];
    let fieldValue = row[1];
    const fieldConfig = PESSOA_CONTATO_FIELD_SELECTORS[fieldName];

    if (!fieldConfig) {
      throw new Error(`Seletor não definido para o campo "${fieldName}".`);
    }

    // Lógica especial para descrição única e randômica
    if (fieldValue === 'Descrição Única e Randômica') {
      fieldValue = generateUniqueDescription();
      ctx.generatedDescription = fieldValue;
    }

    // Lógica especial para associar com a pessoa criada
    if (fieldName === 'Contato' && fieldValue.includes('o id da pessoa')) {
      if (!ctx.createdPessoaId) {
        throw new Error('O ID da pessoa de teste não foi encontrado no contexto. Verifique se o step do Background foi executado.');
      }
      
      // Seleciona a opção baseada no texto visível, que é o ID da pessoa
      await page.locator(fieldConfig.selector).selectOption({ label: ctx.createdPessoaId.toString() });
    } 
    // Tratamento para diferentes tipos de campos
    else if (fieldConfig.type === 'input') {
      await page.locator(fieldConfig.selector).fill(fieldValue);
    } else if (fieldConfig.type === 'select') {
      await page.locator(fieldConfig.selector).selectOption({ label: fieldValue });
    } else if (fieldConfig.type === 'datetime') {
      // Para campos datetime-local, usar formato ISO sem 'Z'
      const dateValue = fieldValue === 'current datetime' ? 
        new Date().toISOString().slice(0, 16) : fieldValue;
      await page.locator(fieldConfig.selector).fill(dateValue);
    }
  }
});

/**
 * Clica no botão de edição da linha da tabela que contém a descrição e ID específicos.
 * @param {string} descricao - A descrição do contato a ser editado.
 */
When('eu clico no botão de edição na linha que contém a descrição {string} e o ID único', async ({ page, ctx }, descricao: string) => {
  if (!ctx.createdPessoaContatoId) {
    throw new Error('O ID do contato de teste não foi encontrado no contexto. Verifique se o step Given foi executado.');
  }
  
  await sortByHighestID(page);
  const targetRow = page.locator('tbody tr', { 
    hasText: descricao 
  }).filter({ 
    hasText: ctx.createdPessoaContatoId.toString() 
  });
  
  await targetRow.locator('[data-cy="entityEditButton"]').click();
  await expect(page.locator('[data-cy="entityCreateSaveButton"]')).toBeVisible({ timeout: 10000 });
});


/**
 * Marca (seleciona) um checkbox específico identificado pelo nome.
 * @param {string} checkboxName - O nome do checkbox, conforme mapeado em PESSOA_CONTATO_FIELD_SELECTORS.
 */
When('eu marco o checkbox {string}', async ({ page }, checkboxName: string) => {
  const fieldConfig = PESSOA_CONTATO_FIELD_SELECTORS[checkboxName];
  if (!fieldConfig || fieldConfig.type !== 'checkbox') {
    throw new Error(`Seletor de checkbox não definido para "${checkboxName}".`);
  }
  await page.locator(fieldConfig.selector).check();
});

/**
 * Clica no botão de exclusão da linha da tabela que contém a descrição e ID específicos.
 * @param {string} descricao - A descrição do contato a ser excluído.
 */
When('eu clico no botão de exclusão na linha que contém a descrição {string} e o ID único', async ({ page, ctx }, descricao: string) => {
  if (!ctx.createdPessoaContatoId) {
    throw new Error('O ID do contato de teste não foi encontrado no contexto. Verifique se o step Given foi executado.');
  }
  
  await sortByHighestID(page);
  const targetRow = page.locator('tbody tr', { 
    hasText: descricao 
  }).filter({ 
    hasText: ctx.createdPessoaContatoId.toString() 
  });
  
  await targetRow.locator('[data-cy="entityDeleteButton"]').click();
  await expect(page.locator('#jhi-delete-pessoaContato-heading')).toBeVisible();
});


// --- STEPS: THEN (ENTÃO) ---
// Verificam os resultados e fazem as asserções finais.

/**
 * Verifica se a tabela de contatos de pessoa contém uma linha com a descrição especificada.
 * @param {string} description - A descrição esperada na linha da tabela.
 */
Then('a tabela de contatos de pessoa deve conter uma linha com a descrição {string}', async ({ page, ctx }, description: string) => {
  // Se a descrição for "Telefone Principal", use a descrição gerada no contexto
  const searchDescription = description === 'Telefone Principal' && ctx.generatedDescription ? 
    ctx.generatedDescription : description;
  
  await sortByHighestID(page);
  const targetRow = page.locator('tbody tr', { hasText: searchDescription });
  await expect(targetRow.getByRole('cell', { name: searchDescription })).toBeVisible();
});

/**
 * Verifica se a tabela de contatos de pessoa contém uma linha com a descrição gerada no contexto.
 */
Then('a tabela de contatos de pessoa deve conter uma linha com a descrição gerada', async ({ page, ctx }) => {
  if (!ctx.generatedDescription) {
    throw new Error('A descrição gerada não foi encontrada no contexto do teste (ctx).');
  }
  await sortByHighestID(page);
  const targetRow = page.locator('tbody tr', { hasText: ctx.generatedDescription });
  await expect(targetRow.getByRole('cell', { name: ctx.generatedDescription })).toBeVisible();
});


/**
 * Verifica se a tabela de contatos de pessoa contém uma linha com o ID único e a descrição especificada.
 * @param {string} description - A descrição esperada na linha da tabela.
 */
Then('a tabela de contatos de pessoa deve conter uma linha com o ID único e a descrição {string}', async ({ page, ctx }, description: string) => {
  if (!ctx.createdPessoaContatoId) {
    throw new Error('O ID do contato de teste não foi encontrado no contexto. Verifique se o step Given foi executado.');
  }
  
  await sortByHighestID(page);
  const targetRow = page.locator('tbody tr', { 
    hasText: description 
  }).filter({ 
    hasText: ctx.createdPessoaContatoId.toString() 
  });
  
  await expect(targetRow.getByRole('cell', { name: description })).toBeVisible();
});

/**
 * Verifica se a tabela de contatos de pessoa NÃO contém uma linha com a descrição e ID únicos especificados.
 * @param {string} description - A descrição que não deve estar presente na tabela.
 */
Then('a tabela de contatos de pessoa não deve conter uma linha com a descrição {string} e o ID único', async ({ page, ctx }, description: string) => {
  if (!ctx.createdPessoaContatoId) {
    throw new Error('O ID do contato de teste não foi encontrado no contexto. Verifique se o step Given foi executado.');
  }
  
  await sortByHighestID(page);
  const targetRow = page.locator('tbody tr', { 
    hasText: description 
  }).filter({ 
    hasText: ctx.createdPessoaContatoId.toString() 
  });
  
  await expect(targetRow).not.toBeVisible();
});
