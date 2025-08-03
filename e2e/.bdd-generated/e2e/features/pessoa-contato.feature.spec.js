// Generated from: e2e/features/pessoa-contato.feature
import { test } from "../../../steps/fixtures.ts";

test.describe('Gerenciamento de Contatos de Pessoas', () => {

  test.beforeEach('Background: Usuário autenticado e pessoa de teste existente', async ({ Given, page, When, And }) => {
    await Given('que eu estou na tela de login', null, { page }); 
    await When('eu faço login com as credenciais "admin" e "admin"', null, { page }); 
    await And('que uma pessoa com o nome "Pessoa de Teste" e um CPF único já existe no sistema', null, { page }); 
    await And('eu navego para a lista de "Pessoa Contato"', null, { page }); 
  });
  
  test('Criar um novo contato do tipo telefone para uma pessoa', { tag: ['@pessoascontato', '@create'] }, async ({ When, page, And, Then }) => { 
    await When('eu clico no botão "Create a new Pessoa Contato"', null, { page }); 
    await And('eu preencho o formulário de contato de pessoa com os seguintes dados:', {"dataTable":{"rows":[{"cells":[{"value":"campo"},{"value":"valor"}]},{"cells":[{"value":"Descricao"},{"value":"Telefone Principal"}]},{"cells":[{"value":"Telefone Numero Completo"},{"value":"+55 (11) 98765-4321"}]},{"cells":[{"value":"Contato"},{"value":"o id da pessoa \"Pessoa de Teste\""}]}]}}, { page }); 
    await And('eu marco o checkbox "Preferido"', null, { page }); 
    await And('eu marco o checkbox "Possui Whatsapp"', null, { page }); 
    await And('eu clico no botão "Save"', null, { page }); 
    await Then('eu devo ver a mensagem de sucesso "A new Pessoa Contato is created with identifier"', null, { page }); 
    await And('a tabela de contatos de pessoa deve conter uma linha com a descrição "Telefone Principal"', null, { page }); 
  });

});

// == technical section ==

test.use({
  $test: ({}, use) => use(test),
  $uri: ({}, use) => use('e2e/features/pessoa-contato.feature'),
  $bddFileData: ({}, use) => use(bddFileData),
});

const bddFileData = [ // bdd-data-start
  {"pwTestLine":13,"pickleLine":19,"tags":["@pessoascontato","@create"],"steps":[{"pwStepLine":7,"gherkinStepLine":8,"keywordType":"Context","textWithKeyword":"Given que eu estou na tela de login","isBg":true,"stepMatchArguments":[]},{"pwStepLine":8,"gherkinStepLine":9,"keywordType":"Action","textWithKeyword":"When eu faço login com as credenciais \"admin\" e \"admin\"","isBg":true,"stepMatchArguments":[{"group":{"start":33,"value":"\"admin\"","children":[{"start":34,"value":"admin","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"},{"group":{"start":43,"value":"\"admin\"","children":[{"start":44,"value":"admin","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]},{"pwStepLine":9,"gherkinStepLine":11,"keywordType":"Action","textWithKeyword":"And que uma pessoa com o nome \"Pessoa de Teste\" e um CPF único já existe no sistema","isBg":true,"stepMatchArguments":[{"group":{"start":26,"value":"\"Pessoa de Teste\"","children":[{"start":27,"value":"Pessoa de Teste","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]},{"pwStepLine":10,"gherkinStepLine":12,"keywordType":"Action","textWithKeyword":"And eu navego para a lista de \"Pessoa Contato\"","isBg":true,"stepMatchArguments":[{"group":{"start":26,"value":"\"Pessoa Contato\"","children":[{"start":27,"value":"Pessoa Contato","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]},{"pwStepLine":14,"gherkinStepLine":20,"keywordType":"Action","textWithKeyword":"When eu clico no botão \"Create a new Pessoa Contato\"","stepMatchArguments":[{"group":{"start":18,"value":"\"Create a new Pessoa Contato\"","children":[{"start":19,"value":"Create a new Pessoa Contato","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]},{"pwStepLine":15,"gherkinStepLine":21,"keywordType":"Action","textWithKeyword":"And eu preencho o formulário de contato de pessoa com os seguintes dados:","stepMatchArguments":[]},{"pwStepLine":16,"gherkinStepLine":27,"keywordType":"Action","textWithKeyword":"And eu marco o checkbox \"Preferido\"","stepMatchArguments":[{"group":{"start":20,"value":"\"Preferido\"","children":[{"start":21,"value":"Preferido","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]},{"pwStepLine":17,"gherkinStepLine":28,"keywordType":"Action","textWithKeyword":"And eu marco o checkbox \"Possui Whatsapp\"","stepMatchArguments":[{"group":{"start":20,"value":"\"Possui Whatsapp\"","children":[{"start":21,"value":"Possui Whatsapp","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]},{"pwStepLine":18,"gherkinStepLine":29,"keywordType":"Action","textWithKeyword":"And eu clico no botão \"Save\"","stepMatchArguments":[{"group":{"start":18,"value":"\"Save\"","children":[{"start":19,"value":"Save","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]},{"pwStepLine":19,"gherkinStepLine":30,"keywordType":"Outcome","textWithKeyword":"Then eu devo ver a mensagem de sucesso \"A new Pessoa Contato is created with identifier\"","stepMatchArguments":[{"group":{"start":34,"value":"\"A new Pessoa Contato is created with identifier\"","children":[{"start":35,"value":"A new Pessoa Contato is created with identifier","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]},{"pwStepLine":20,"gherkinStepLine":31,"keywordType":"Outcome","textWithKeyword":"And a tabela de contatos de pessoa deve conter uma linha com a descrição \"Telefone Principal\"","stepMatchArguments":[{"group":{"start":69,"value":"\"Telefone Principal\"","children":[{"start":70,"value":"Telefone Principal","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]}]},
]; // bdd-data-end