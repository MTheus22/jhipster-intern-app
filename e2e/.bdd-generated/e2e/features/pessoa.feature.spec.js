// Generated from: e2e/features/pessoa.feature
import { test } from "playwright-bdd";

test.describe('Gerenciamento de Pessoas', () => {

  test.beforeEach('Background: Usuário autenticado na lista de Pessoas', async ({ Given, page, When, And }) => {
    await Given('que eu estou na tela de login', null, { page }); 
    await When('eu faço login com as credenciais "admin" e "admin"', null, { page }); 
    await And('eu navego para a lista de "Pessoa"', null, { page }); 
  });
  
  test('Criar uma nova pessoa física com sucesso', async ({ When, page, And, Then }) => { 
    await When('eu clico no botão "Create a new Pessoa"', null, { page }); 
    await And('eu preencho o formulário de pessoa com os seguintes dados:', {"dataTable":{"rows":[{"cells":[{"value":"campo"},{"value":"valor"}]},{"cells":[{"value":"Nome"},{"value":"Ana Silva"}]},{"cells":[{"value":"Tipo Pessoa"},{"value":"PF"}]},{"cells":[{"value":"Cpf"},{"value":"um CPF válido e único"}]}]}}, { page }); 
    await And('eu clico no botão "Save"', null, { page }); 
    await Then('eu devo ver a mensagem de sucesso "A new Pessoa is created with identifier"', null, { page }); 
    await And('a tabela de pessoas deve conter uma linha com o nome "Ana Silva" e o CPF gerado', null, { page }); 
  });

});

// == technical section ==

test.use({
  $test: ({}, use) => use(test),
  $uri: ({}, use) => use('e2e/features/pessoa.feature'),
  $bddFileData: ({}, use) => use(bddFileData),
});

const bddFileData = [ // bdd-data-start
  {"pwTestLine":12,"pickleLine":8,"tags":[],"steps":[{"pwStepLine":7,"gherkinStepLine":4,"keywordType":"Context","textWithKeyword":"Given que eu estou na tela de login","isBg":true,"stepMatchArguments":[]},{"pwStepLine":8,"gherkinStepLine":5,"keywordType":"Action","textWithKeyword":"When eu faço login com as credenciais \"admin\" e \"admin\"","isBg":true,"stepMatchArguments":[{"group":{"start":33,"value":"\"admin\"","children":[{"start":34,"value":"admin","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"},{"group":{"start":43,"value":"\"admin\"","children":[{"start":44,"value":"admin","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]},{"pwStepLine":9,"gherkinStepLine":6,"keywordType":"Action","textWithKeyword":"And eu navego para a lista de \"Pessoa\"","isBg":true,"stepMatchArguments":[{"group":{"start":26,"value":"\"Pessoa\"","children":[{"start":27,"value":"Pessoa","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]},{"pwStepLine":13,"gherkinStepLine":9,"keywordType":"Action","textWithKeyword":"When eu clico no botão \"Create a new Pessoa\"","stepMatchArguments":[{"group":{"start":18,"value":"\"Create a new Pessoa\"","children":[{"start":19,"value":"Create a new Pessoa","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]},{"pwStepLine":14,"gherkinStepLine":10,"keywordType":"Action","textWithKeyword":"And eu preencho o formulário de pessoa com os seguintes dados:","stepMatchArguments":[]},{"pwStepLine":15,"gherkinStepLine":15,"keywordType":"Action","textWithKeyword":"And eu clico no botão \"Save\"","stepMatchArguments":[{"group":{"start":18,"value":"\"Save\"","children":[{"start":19,"value":"Save","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]},{"pwStepLine":16,"gherkinStepLine":16,"keywordType":"Outcome","textWithKeyword":"Then eu devo ver a mensagem de sucesso \"A new Pessoa is created with identifier\"","stepMatchArguments":[{"group":{"start":34,"value":"\"A new Pessoa is created with identifier\"","children":[{"start":35,"value":"A new Pessoa is created with identifier","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]},{"pwStepLine":17,"gherkinStepLine":17,"keywordType":"Outcome","textWithKeyword":"And a tabela de pessoas deve conter uma linha com o nome \"Ana Silva\" e o CPF gerado","stepMatchArguments":[{"group":{"start":53,"value":"\"Ana Silva\"","children":[{"start":54,"value":"Ana Silva","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]}]},
]; // bdd-data-end