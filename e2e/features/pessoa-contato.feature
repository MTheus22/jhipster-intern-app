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

  # ----------------------------------------------------------------
  # CENÁRIOS DE CRIAÇÃO (HAPPY PATH)
  # ----------------------------------------------------------------

  @create
  Scenario: Criar um novo contato do tipo telefone para uma pessoa
    When eu clico no botão "Create a new Pessoa Contato"
    And eu preencho o formulário de contato de pessoa com os seguintes dados:
      | campo                  | valor                               |
      | Descricao              | Telefone Principal                  |
      | Telefone Numero Completo | +55 (11) 98765-4321               |
      | Contato                | o id da pessoa "Pessoa de Teste"    |
    # Marca os checkboxes necessários
    And eu marco o checkbox "Preferido"
    And eu marco o checkbox "Possui Whatsapp"
    And eu clico no botão "Save"
    Then eu devo ver a mensagem de sucesso "A new Pessoa Contato is created with identifier"
    And a tabela de contatos de pessoa deve conter uma linha com a descrição "Telefone Principal"

#   @create
#   Scenario: Criar um novo contato do tipo email para uma pessoa
#     When eu clico no botão "Create a new Pessoa Contato"
#     And eu preencho o formulário de contato de pessoa com os seguintes dados:
#       | campo               | valor                               |
#       | Descricao           | Email Profissional                  |
#       | Contato Digital Ident | teste.profissional@email.com        |
#       | Contato             | o id da pessoa "Pessoa de Teste"    |
#     # Marca os checkboxes necessários
#     And eu marco o checkbox "Receber Confirmacoes"
#     And eu clico no botão "Save"
#     Then eu devo ver a mensagem de sucesso "A new Pessoa Contato is created with identifier"
#     And a tabela de contatos de pessoa deve conter uma linha com a descrição "Email Profissional"

#   # ----------------------------------------------------------------
#   # CENÁRIOS DE VALIDAÇÃO (UNHAPPY PATHS)
#   # ----------------------------------------------------------------

#   @validation
#   Scenario: Tentar criar um contato sem selecionar uma Pessoa
#     When eu clico no botão "Create a new Pessoa Contato"
#     And eu preencho o campo "Descricao" com o valor "Contato sem Pessoa"
#     # O seletor "Contato" é deixado em branco de propósito
#     Then o botão "Save" deve estar desabilitado
#     When eu clico no seletor "Contato"
#     And eu clico no campo "Descricao"
#     Then eu devo ver a mensagem de erro "This field is required." para o campo "Contato"

#   # ----------------------------------------------------------------
#   # CENÁRIOS DE CONSULTA, EDIÇÃO E EXCLUSÃO
#   # ----------------------------------------------------------------

#   @view
#   Scenario: Visualizar os detalhes de um contato existente
#     Given que um contato de pessoa com a descrição "Contato para Detalhes" para "Pessoa de Teste" já existe no sistema
#     When eu clico no botão de visualização na linha que contém a descrição "Contato para Detalhes"
#     Then eu devo estar na página de detalhes do contato de pessoa
#     And eu devo ver o detalhe "Descricao" com o valor "Contato para Detalhes"

#   @edit
#   Scenario: Editar um contato de pessoa existente com sucesso
#     Given que um contato de pessoa com a descrição "Contato a ser Editado" para "Pessoa de Teste" já existe no sistema
#     When eu clico no botão de edição na linha que contém a descrição "Contato a ser Editado"
#     And eu preencho o campo "Descricao" com o valor "Contato Editado com Sucesso"
#     And eu clico no botão "Save"
#     Then eu devo ver a mensagem de sucesso "A Pessoa Contato is updated with identifier"
#     And a tabela de contatos de pessoa deve conter uma linha com a descrição "Contato Editado com Sucesso"
#     And a tabela de contatos de pessoa não deve conter uma linha com a descrição "Contato a ser Editado"

#   @delete
#   Scenario: Excluir um contato de pessoa existente com sucesso
#     Given que um contato de pessoa com a descrição "Contato a ser Excluído" para "Pessoa de Teste" já existe no sistema
#     When eu clico no botão de exclusão na linha que contém a descrição "Contato a ser Excluído"
#     And eu clico no botão de confirmação "Delete" no modal
#     Then eu devo ver a mensagem de sucesso "A Pessoa Contato is deleted with identifier"
#     And a tabela de contatos de pessoa não deve conter uma linha com a descrição "Contato a ser Excluído"