@pessoascontato
Feature: Gerenciamento de Contatos de Pessoas
  Como um administrador do sistema
  Eu quero poder criar, visualizar, editar e excluir os contatos de uma Pessoa
  Para manter as formas de contato dos usuários sempre atualizadas

  Background: Usuário autenticado e pessoa de teste existente
    Given que eu estou na tela de login
    When eu faço login com as credenciais "admin" e "admin"
    # Garante que temos uma pessoa para associar os contatos, criado via API
    And que uma pessoa com o nome "Pessoa de Teste" e um CPF único já existe no sistema
    And eu navego para a lista de "Pessoa Contato"

  # CENÁRIOS DE CRIAÇÃO

  @create
  Scenario: Criar um novo contato do tipo telefone para uma pessoa
    When eu clico no botão "Create a new Pessoa Contato"
    And eu preencho o formulário de contato de pessoa com os seguintes dados:
      | campo                  | valor                               |
      | Descricao              | Descrição Única e Randômica         |
      | Telefone Numero Completo | +55 (11) 98765-4321               |
      | Contato                | o id da pessoa "Pessoa de Teste"    |
    # Marca os checkboxes necessários
    And eu marco o checkbox "Preferido"
    And eu marco o checkbox "Possui Whatsapp"
    And eu clico no botão "Save"
    Then eu devo ver a mensagem de sucesso "A new pessoaContato is created with identifier"
    And a tabela de contatos de pessoa deve conter uma linha com a descrição gerada

  #  CENÁRIOS DE CONSULTA, EDIÇÃO E EXCLUSÃO

  @edit
  Scenario: Editar um contato de pessoa existente com sucesso
    Given que um contato de pessoa com a descrição "Contato a ser Editado" e um ID único já existe no sistema
    When eu clico no botão de edição na linha que contém a descrição "Contato a ser Editado" e o ID único
    And eu preencho o campo "Descricao" com o valor "Contato Editado com Sucesso"
    And eu clico no botão "Save"
    Then eu devo ver a mensagem de sucesso "A pessoaContato is updated with identifier"
    And a tabela de contatos de pessoa deve conter uma linha com o ID único a descrição "Contato Editado com Sucesso"

  @delete
  Scenario: Excluir um contato de pessoa existente com sucesso
    Given que um contato de pessoa com a descrição "Contato a ser Excluído" e um ID único já existe no sistema
    When eu clico no botão de exclusão na linha que contém a descrição "Contato a ser Excluído" e o ID único
    And eu clico no botão de confirmar deleção no modal para a entidade "pessoa-contatoes"
    Then eu devo ver a mensagem de sucesso "A pessoaContato is deleted with identifier"
    And a tabela de contatos de pessoa não deve conter uma linha com a descrição "Contato a ser Excluído" e o ID único

  # CENÁRIOS DE VALIDAÇÃO (UNHAPPY PATHS)

  @validation
  Scenario: Tentar criar um contato sem selecionar uma Pessoa
    When eu clico no botão "Create a new Pessoa Contato"
    And eu preencho o campo "Descricao" com o valor "Contato sem Pessoa"
    # O seletor "Contato" é deixado em branco de propósito
    Then o botão "Save" deve estar desabilitado