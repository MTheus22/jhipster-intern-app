import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'formatCpf',
})
export class FormatCpfPipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    if (!value) {
      return '';
    }

    // Remove todos os caracteres não numéricos
    const cleanValue = value.replace(/\D/g, '');

    // Se não tem 11 dígitos, retorna o valor original
    if (cleanValue.length !== 11) {
      return value;
    }

    // Aplica a formatação: xxx.xxx.xxx-xx
    return cleanValue.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }
}
