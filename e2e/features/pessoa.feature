@pessoas
Feature: Gerenciamento de Pessoas
  Como um administrador do sistema
  Eu quero poder criar, visualizar, editar e excluir registros de Pessoas
  Para manter os dados dos usuários atualizados e corretos

  Background: Usuário autenticado na lista de Pessoas
    Given que eu estou na tela de login
    When eu faço login com as credenciais "admin" e "admin"
    And eu navego para a lista de "Pessoa"

  # ----------------------------------------------------------------
  # CENÁRIOS DE CRIAÇÃO (HAPPY PATH)
  # Estes cenários testam a UI de criação, portanto usam "When".
  # ----------------------------------------------------------------

  @create
  Scenario: Criar uma nova pessoa física com sucesso
    When eu clico no botão "Create a new Pessoa"
    And eu preencho o formulário de pessoa com os seguintes dados:
      | campo       | valor                 |
      | Nome        | Ana Silva             |
      | Tipo Pessoa | PF                    |
      | Cpf         | um CPF válido e único |
    And eu clico no botão "Save"
    Then a operação de salvamento de Pessoa é bem-sucedida e sou redirecionado para a lista
    Then eu devo ver a mensagem de sucesso "A new pessoa is created with identifier"
    And a tabela de pessoas deve conter uma linha com o nome "Ana Silva" e o CPF gerado

  @create
  Scenario: Criar uma nova pessoa jurídica com sucesso
    When eu clico no botão "Create a new Pessoa"
    And eu preencho o formulário de pessoa com os seguintes dados:
      | campo       | valor                  |
      | Nome        | Empresa Fantasia XYZ   |
      | Tipo Pessoa | PJ                     |
      | Cnpj        | um CNPJ válido e único |
    And eu clico no botão "Save"
    Then eu devo ver a mensagem de sucesso "A new pessoa is created with identifier"
    And a tabela de pessoas deve conter uma linha com o nome "Empresa Fantasia XYZ" e o CNPJ gerado

  # ----------------------------------------------------------------
  # CENÁRIOS DE VALIDAÇÃO (UNHAPPY PATHS)
  # ----------------------------------------------------------------

  @validation
  Scenario: Tentar criar uma pessoa sem o campo "Nome"
    When eu clico no botão "Create a new Pessoa"
    And eu preencho o formulário de pessoa com os seguintes dados:
      | campo       | valor                 |
      | Tipo Pessoa | PF                    |
      | Cpf         | um CPF válido e único |
    Then o botão "Save" deve estar desabilitado
    When eu clico no campo "Nome"
    And eu clico no campo "Cpf"
    Then eu devo ver a mensagem de erro "This field is required." para o campo "Nome"

  # ----------------------------------------------------------------
  # CENÁRIOS DE CONSULTA, EDIÇÃO E EXCLUSÃO
  # Estes cenários usam "Given" para preparar o estado do sistema.
  # ----------------------------------------------------------------

  @view
  Scenario: Visualizar os detalhes de uma pessoa existente
    Given que uma pessoa com os seguintes dados já existe no sistema:
      | campo       | valor                      |
      | Nome        | Bruno para Visualização    |
      | Tipo Pessoa | PF                         |
      | Cpf         | um CPF válido e único      |
      | Nome Mae    | Maria da Visualização      |
    When eu clico no botão de visualização na linha que contém o CPF gerado
    Then eu devo estar na página de detalhes da pessoa
    And eu devo ver o detalhe "Nome" com o valor "Bruno para Visualização"
    And eu devo ver o detalhe "Nome Mae" com o valor "Maria da Visualização"

  @edit
  Scenario: Editar uma pessoa existente com sucesso
    Given que uma pessoa com os seguintes dados já existe no sistema:
      | campo       | valor                |
      | Nome        | Carlos a ser Editado |
      | Tipo Pessoa | PF                   |
      | Cpf         | um CPF válido e único|
    When eu clico no botão de edição na linha que contém o CPF gerado
    And eu preencho o campo "Nome" com o valor "Carlos Editado com Sucesso"
    And eu clico no botão "Save"
    Then eu devo ver a mensagem de sucesso "A pessoa is updated with identifier"
    And a tabela de pessoas deve conter uma linha com o nome "Carlos Editado com Sucesso" e o CPF gerado

  @delete
  Scenario: Excluir uma pessoa existente com sucesso
    Given que uma pessoa com os seguintes dados já existe no sistema:
      | campo       | valor                |
      | Nome        | Joana a ser Excluída |
      | Tipo Pessoa | PF                   |
      | Cpf         | um CPF válido e único|
    When eu clico no botão de exclusão na linha que contém o CPF gerado
    And eu clico no botão de confirmação "Delete" no modal
    Then eu devo ver a mensagem de sucesso "A pessoa is deleted with identifier"
    And a tabela de pessoas não deve conter uma linha com o CPF gerado