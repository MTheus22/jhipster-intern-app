/**
 * @file Configuração das fixtures customizadas do Playwright para testes BDD.
 *
 * Este arquivo estende o executor de teste base do `playwright-bdd` para injetar um
 * contexto de cenário (`ctx`) compartilhado. Este contexto permite que os steps (Given, When, Then)
 * troquem informações de estado, como IDs gerados ou valores dinâmicos, de forma
 * isolada para cada cenário de teste.
 */

import { test as base, createBdd } from 'playwright-bdd';

/**
 * Define a estrutura do objeto de contexto (`ctx`) compartilhado entre os steps de um cenário.
 * As propriedades são opcionais, pois nem todo cenário precisará de todas elas.
 */
export type TestContext = {
  generatedCpf?: string;
  generatedCnpj?: string;
  generatedDescription?: string;
  createdPessoaId?: number;
  createdPessoaContatoId?: number;
};

/**
 * Estende o `test` base do Playwright para incluir a fixture `ctx`.
 * A fixture `ctx` é inicializada como um objeto vazio para cada cenário, garantindo
 * o isolamento completo entre os testes.
 */
export const test = base.extend<{ ctx: TestContext }>({
  ctx: async ({}, use) => {
    // Inicializa um objeto de contexto vazio que adere ao tipo `TestContext`.
    // Este objeto será preenchido e lido pelos steps durante a execução do cenário.
    const ctx = {} as TestContext;
    await use(ctx);
  },
});

/**
 * Exporta as funções `Given`, `When`, e `Then` customizadas, que são vinculadas
 * ao nosso `test` estendido. Todos os arquivos de steps devem importar estas
 * funções para ter acesso à fixture `ctx`.
 */
export const { Given, When, Then } = createBdd(test);
