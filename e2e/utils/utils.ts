/**
 * Aplica máscara de formatação ao CPF (xxx.xxx.xxx-xx).
 * @param {string} cpf - CPF sem formatação (apenas números).
 * @returns {string} - CPF formatado com máscara.
 */
export async function formatCpf(cpf: string): Promise<string> {
  const cleanCpf = cpf.replace(/\D/g, '');
  
  if (cleanCpf.length !== 11) {
    throw new Error(`CPF deve ter 11 dígitos. Recebido: ${cpf} (${cleanCpf.length} dígitos)`);
  }
  
  return cleanCpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}