const { chromium } = require('playwright');

/**
 * Script para limpeza de dados de pessoas criadas durante testes E2E
 * 
 * Uso:
 * node cleanup-pessoas.js --dry                    # Modo dry-run (apenas simula)
 * node cleanup-pessoas.js --minId=100             # Remove pessoas com ID >= 100
 * node cleanup-pessoas.js --minId=100 --verbose   # Com logs detalhados
 * node cleanup-pessoas.js --minId=100 --dry       # Simula remoção de pessoas com ID >= 100
 */
async function cleanupPessoas() {
  const args = process.argv.slice(2);
  const isDryRun = args.includes('--dry');
  const verbose = args.includes('--verbose') || isDryRun;
  
  // Procura pelo argumento --minId
  const minIdArg = args.find(arg => arg.startsWith('--minId='));
  const minId = minIdArg ? parseInt(minIdArg.split('=')[1]) : 1000; // Default para 1000 se não especificado

  const baseUrl = 'http://localhost:8080';
  
  console.log('🧹 Script de Limpeza de Pessoas');
  console.log('================================');
  console.log(`Modo: ${isDryRun ? '🔍 DRY-RUN (simulação)' : '🗑️  EXECUÇÃO REAL'}`);
  console.log(`Filtro: ID >= ${minId}`);
  console.log(`Verbose: ${verbose}`);
  console.log('');

  if (!isDryRun) {
    console.log('⚠️  ATENÇÃO: Este script irá DELETAR dados reais!');
    console.log('   Para testar primeiro, use: node cleanup-pessoas.js --dry');
    console.log('');
  }

  const browser = await chromium.launch({ 
    headless: true, // Sempre headless para performance
    slowMo: verbose ? 500 : 0
  });
  
  try {
    const context = await browser.newContext();
    const page = await context.newPage();

    // Login (assumindo que há um usuário admin/admin)
    console.log('🔐 Fazendo login...');
    await page.goto(`${baseUrl}/login`);
    await page.fill('#username', 'admin');
    await page.fill('#password', 'admin');
    await page.click('button[type="submit"]');
    
    // Aguarda o redirecionamento após login
    await page.waitForURL(/.*\/(?!login).*/);
    console.log('✅ Login realizado com sucesso');

    // Navega para a página de pessoas para estabelecer a sessão
    await page.goto(`${baseUrl}/pessoa`);
    await page.waitForTimeout(2000); // Aguarda para sessão se estabelecer

    // Busca pessoas via API diretamente
    console.log('� Buscando pessoas via API...');
    
    // Obtém o token CSRF
    const cookies = await page.context().cookies();
    console.log(`🍪 ${cookies.length} cookies encontrados`);
    
    const csrfCookie = cookies.find(cookie => cookie.name === 'XSRF-TOKEN');
    if (!csrfCookie) {
      console.log('❌ Cookie XSRF-TOKEN não encontrado. Cookies disponíveis:');
      cookies.forEach(cookie => console.log(`   - ${cookie.name}: ${cookie.value.substring(0, 20)}...`));
      throw new Error('Cookie XSRF-TOKEN não encontrado.');
    }
    const csrfToken = csrfCookie.value;
    console.log(`🔐 Token CSRF obtido: ${csrfToken.substring(0, 20)}...`);

    // Busca todas as pessoas via API (com paginação)
    let allPessoas = [];
    let page_number = 0;
    const page_size = 100; // Busca em lotes de 100
    
    while (true) {
      console.log(`📄 Carregando página ${page_number + 1} da API...`);
      
      const response = await page.request.get(`${baseUrl}/api/pessoas?page=${page_number}&size=${page_size}&sort=id,asc`, {
        headers: { 'X-XSRF-TOKEN': csrfToken }
      });
      
      if (!response.ok()) {
        throw new Error(`Erro na API: ${response.status()}`);
      }
      
      const data = await response.json();
      const pessoas = data.content || data; // Suporta tanto paginação quanto lista simples
      
      if (pessoas.length === 0) {
        break; // Não há mais páginas
      }
      
      allPessoas.push(...pessoas);
      
      if (verbose) {
        console.log(`   📊 ${pessoas.length} pessoas encontradas nesta página`);
      }
      
      // Se não há próxima página ou se é uma resposta não paginada
      if (!data.content || data.last || pessoas.length < page_size) {
        break;
      }
      
      page_number++;
    }

    console.log(`✅ Total de pessoas encontradas: ${allPessoas.length}`);

    // Filtra pessoas que devem ser deletadas
    const pessoasParaDeletar = allPessoas.filter(pessoa => pessoa.id >= minId);
    
    console.log('');
    console.log('📊 Relatório de Análise:');
    console.log(`   Total de pessoas no sistema: ${allPessoas.length}`);
    console.log(`   Pessoas com ID >= ${minId}: ${pessoasParaDeletar.length}`);
    console.log(`   Pessoas que permanecerão: ${allPessoas.length - pessoasParaDeletar.length}`);

    if (pessoasParaDeletar.length === 0) {
      console.log('');
      console.log('✅ Nenhuma pessoa encontrada para deletar com os critérios especificados.');
      return;
    }

    console.log('');
    console.log('🎯 Pessoas que serão deletadas:');
    pessoasParaDeletar.forEach(pessoa => {
      const documento = pessoa.cpf || pessoa.cnpj || 'N/A';
      console.log(`   • ID: ${pessoa.id} | ${pessoa.nome || 'N/A'} | Doc: ${documento}`);
    });

    if (isDryRun) {
      console.log('');
      console.log('🔍 DRY-RUN: Simulação concluída. Nenhuma pessoa foi deletada.');
      console.log('   Para executar a deleção real, remova o parâmetro --dry');
      return;
    }

    // Confirmação de segurança
    console.log('');
    console.log('⚠️  EXECUTANDO DELEÇÃO:');
    console.log(`   Deletando ${pessoasParaDeletar.length} pessoas via API...`);
    
    let deletedCount = 0;
    let errorCount = 0;

    for (const pessoa of pessoasParaDeletar) {
      try {
        if (verbose) {
          console.log(`   🗑️  Deletando pessoa ID ${pessoa.id}: ${pessoa.nome || 'N/A'}...`);
        }
        
        const deleteResponse = await page.request.delete(`${baseUrl}/api/pessoas/${pessoa.id}`, {
          headers: { 'X-XSRF-TOKEN': csrfToken }
        });
        
        if (deleteResponse.ok()) {
          deletedCount++;
          if (verbose) {
            console.log(`     ✅ Pessoa ID ${pessoa.id} deletada com sucesso`);
          }
        } else {
          errorCount++;
          console.log(`     ❌ Erro ao deletar pessoa ID ${pessoa.id}: Status ${deleteResponse.status()}`);
        }
        
        // Pequena pausa para não sobrecarregar a API
        await page.waitForTimeout(100);
        
      } catch (error) {
        errorCount++;
        console.log(`     ❌ Erro ao deletar pessoa ID ${pessoa.id}: ${error.message}`);
      }
    }

    console.log('');
    console.log('📊 Relatório Final:');
    console.log(`   ✅ Pessoas deletadas com sucesso: ${deletedCount}`);
    console.log(`   ❌ Erros durante deleção: ${errorCount}`);
    console.log(`   📋 Total processadas: ${deletedCount + errorCount}`);

  } catch (error) {
    console.error('❌ Erro durante execução:', error);
  } finally {
    await browser.close();
    console.log('');
    console.log('🏁 Script finalizado.');
  }
}

// Executa o script se foi chamado diretamente
if (require.main === module) {
  cleanupPessoas().catch(console.error);
}

module.exports = { cleanupPessoas };
