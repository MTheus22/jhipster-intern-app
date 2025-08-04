# 📋 Relatório de Alterações - Documentação para QA/Tester

## 🎯 Resumo Executivo

Este documento detalha as alterações implementadas no projeto **Internapp** (JHipster 7.6.0) para orientar a equipe de QA sobre **riscos** e **mudanças comportamentais** que podem impactar os testes existentes.

---

## 📊 Issues Implementadas

### **Issue #1: Simplificação da Listagem de Pessoas**

**Mudança:** Interface de listagem reduzida de 20 para 5 colunas essenciais.

**Impacto nos Testes:**
| Antes | Depois |
|-------|---------|
| 20 colunas visíveis | 5 colunas (ID, Nome, Data Nascimento, CPF, Estado Civil) |
| Scroll horizontal necessário | Interface compacta |
| Todos os campos da entidade exibidos | Apenas campos essenciais |

**Risco:** Testes E2E que verificam colunas específicas podem falhar.

---

### **Issue #2: Formatação de CPF com Máscara**

**Mudança:** Implementação de formatação automática `xxx.xxx.xxx-xx` com validação.

**Comportamentos Alterados:**

- **Input:** Aceita apenas números, formata automaticamente
- **Display:** CPF sempre exibido formatado (123.456.789-01)
- **Validação:** Máximo 11 dígitos numéricos
- **Rejeição:** Caracteres não numéricos são bloqueados

**Risco:** Testes que inserem CPF com formatação manual podem falhar.

---

### **Issue #3: Campo DDI na Entidade PessoaContato**

**Mudança:** Nova coluna `telefone_ddi VARCHAR(4)` adicionada.

**Alterações de Schema:**

```sql
-- Nova coluna adicionada
ALTER TABLE pessoa_contato ADD COLUMN telefone_ddi VARCHAR(4) NULL;
```

**Mudanças na API:**

- Endpoints `/api/pessoa-contatos` incluem campo `telefoneDdi`
- Formulários têm novo campo obrigatório
- Validação de máximo 4 caracteres

**Risco:** Payloads de teste sem campo DDI podem causar falhas de validação.

---

### **Issue #4: Exclusão Lógica (Soft Delete) - ⚠️ MUDANÇA CRÍTICA**

**Mudança:** Substituição completa do delete físico por exclusão lógica.

#### **💥 Comportamento Completamente Alterado:**

| Operação         | Antes (Delete Físico)      | Depois (Soft Delete)                     |
| ---------------- | -------------------------- | ---------------------------------------- |
| **DELETE**       | Registro removido do banco | Registro mantido com `data_exclusao`     |
| **Listagem**     | Retorna todos registros    | Retorna apenas `data_exclusao IS NULL`   |
| **Busca por ID** | 404 se não existe          | 404 se não existe **OU** se foi excluído |
| **Contagem**     | Conta registros físicos    | Conta apenas registros ativos            |

#### **Schema Alterado:**

```sql
-- Nova coluna de auditoria
ALTER TABLE pessoa ADD COLUMN data_exclusao TIMESTAMP WITH TIME ZONE NULL;
CREATE INDEX idx_pessoa_data_exclusao ON pessoa(data_exclusao);
```

#### **API Alterada:**

- `GET /api/pessoas` → Retorna apenas pessoas ativas
- `GET /api/pessoas/{id}` → 404 para pessoas excluídas
- `DELETE /api/pessoas/{id}` → Marca como excluído, não remove

---

## ⚠️ Riscos Críticos para Testes Existentes

### **🚨 Testes de Exclusão**

- **Problema:** Testes assumem que registros são removidos fisicamente
- **Realidade:** Registros permanecem no banco com timestamp
- **Impacto:** Validações de "registro não existe" falharão

### **🚨 Contadores e Listagens**

- **Problema:** Testes contam registros totais no banco
- **Realidade:** Listagens mostram apenas registros ativos
- **Impacto:** Assertivas de quantidade estarão incorretas

### **🚨 Queries Diretas no Banco**

- **Problema:** Queries SQL não filtram `data_exclusao IS NULL`
- **Realidade:** Registros excluídos ainda existem fisicamente
- **Impacto:** Validações de banco retornarão mais registros que esperado

### **🚨 Testes de Performance**

- **Problema:** Volume de dados assumido pode estar incorreto
- **Realidade:** Banco acumula registros excluídos historicamente
- **Impacto:** Testes de performance podem ter resultados diferentes

---

## � Exemplos de Impacto nos Testes

### **Cenário: Exclusão de Pessoa**

#### **❌ Teste Antigo (Falhará):**

```gherkin
Quando eu excluo a pessoa ID 123
Então a pessoa não deve existir no banco
E SELECT COUNT(*) FROM pessoa WHERE id = 123 deve retornar 0
```

#### **✅ Comportamento Real Atual:**

```gherkin
Quando eu excluo a pessoa ID 123
Então a pessoa tem data_exclusao preenchida no banco
E SELECT COUNT(*) FROM pessoa WHERE id = 123 retorna 1
Mas GET /api/pessoas/123 retorna 404
E a pessoa NÃO aparece na listagem
```

### **Cenário: Contagem de Registros**

#### **❌ Assertiva Antiga (Incorreta):**

```java
// Conta TODOS os registros físicos
assertEquals(5, pessoaRepository.findAll().size());
```

#### **✅ Assertiva Nova (Correta):**

```java
// Conta apenas registros ATIVOS
assertEquals(3, pessoaRepository.findAllActive().size());
assertEquals(3, pessoaService.findAll().getTotalElements());
// Nota: Banco pode ter 5 registros, mas só 3 ativos
```

---

## 🛠️ Detalhes Técnicos para Validação

### **Queries de Verificação no Banco:**

```sql
-- Verificar soft delete funcionando
SELECT id, nome, data_exclusao,
       CASE WHEN data_exclusao IS NULL THEN 'ATIVO' ELSE 'EXCLUÍDO' END as status
FROM pessoa;

-- Contagem de ativos vs total
SELECT
    COUNT(*) as total_registros,
    COUNT(CASE WHEN data_exclusao IS NULL THEN 1 END) as registros_ativos,
    COUNT(CASE WHEN data_exclusao IS NOT NULL THEN 1 END) as registros_excluidos
FROM pessoa;
```

### **Endpoints de API Alterados:**

- `GET /api/pessoas` → Filtra automaticamente excluídos
- `GET /api/pessoas/{id}` → 404 se excluído logicamente
- `DELETE /api/pessoas/{id}` → Não remove, apenas marca timestamp

---

## 📋 Checklist de Validação de Riscos

### **Funcionalidades Preservadas:**

- ✅ Criação de pessoas funciona normalmente
- ✅ Edição de pessoas ativas inalterada
- ✅ Formatação CPF mantida na listagem
- ✅ Listagem simplificada (5 colunas) preservada
- ✅ Campo DDI em PessoaContato funcional

### **Mudanças que Requerem Atenção:**

- ⚠️ **Contadores de registros** podem estar incorretos
- ⚠️ **Testes de exclusão** assumindo delete físico falharão
- ⚠️ **Validações de banco** procurando registros removidos falharão
- ⚠️ **Testes de performance** podem ter volume de dados diferente
- ⚠️ **Queries SQL diretas** não filtram registros excluídos

---

## 🔧 Configuração de Ambiente

### **Acesso ao Banco H2:**

- **URL:** `http://localhost:8080/h2-console`
- **JDBC:** `jdbc:h2:file:./target/h2db/db/internapp`
- **User:** `internapp` | **Password:** (vazio)

### **Validações de Schema:**

```sql
-- Confirmar novas colunas criadas
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name IN ('PESSOA', 'PESSOA_CONTATO')
AND column_name IN ('DATA_EXCLUSAO', 'TELEFONE_DDI');

-- Confirmar índices criados
SELECT index_name, table_name, column_name
FROM information_schema.indexes
WHERE index_name = 'IDX_PESSOA_DATA_EXCLUSAO';
```

---

**📅 Documento atualizado:** 04/08/2025  
**🎯 Prioridade:** **CRÍTICA** - Mudança comportamental fundamental  
**⚠️ Ação Requerida:** Revisão obrigatória de todos os testes relacionados a exclusão de dados
