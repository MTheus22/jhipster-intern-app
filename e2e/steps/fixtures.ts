import { test as base, createBdd } from 'playwright-bdd';

// 1. Definimos o "contrato" do nosso contexto com TypeScript.
// Isso nos dará autocomplete e segurança de tipos ao usar o ctx.
// As propriedades são opcionais (?) porque nem todo cenário usará todas elas.
export type TestContext = {
  generatedCpf?: string;
  generatedCnpj?: string;
  createdPessoaId?: number;
  createdPessoaContatoId?: number;
};

// 2. Estendemos o 'test' base do playwright-bdd para incluir nossa fixture 'ctx'.
export const test = base.extend<{ ctx: TestContext }>({
  // Playwright irá executar esta função para cada cenário, criando um ctx limpo.
  ctx: async ({}, use) => {
    // Inicializa o contexto como um objeto vazio, mas o "trata" como TestContext.
    const ctx = {} as TestContext;
    // Disponibiliza o ctx para os steps.
    await use(ctx);
  },
});

// 3. Exportamos o Given, When e Then a partir do nosso 'test' customizado.
// A partir de agora, TODOS os arquivos de steps devem importar daqui.
export const { Given, When, Then } = createBdd(test);