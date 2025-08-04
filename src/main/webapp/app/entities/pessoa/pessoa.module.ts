import { NgModule } from '@angular/core';
import { SharedModule } from 'app/shared/shared.module';
import { PessoaComponent } from './list/pessoa.component';
import { PessoaDetailComponent } from './detail/pessoa-detail.component';
import { PessoaUpdateComponent } from './update/pessoa-update.component';
import { PessoaDeleteDialogComponent } from './delete/pessoa-delete-dialog.component';
import { PessoaRoutingModule } from './route/pessoa-routing.module';
import { FormatCpfPipe } from 'app/shared/format/format-cpf.pipe';

@NgModule({
  imports: [SharedModule, PessoaRoutingModule],
  declarations: [PessoaComponent, PessoaDetailComponent, PessoaUpdateComponent, PessoaDeleteDialogComponent],
  entryComponents: [PessoaDeleteDialogComponent],
  providers: [FormatCpfPipe],
})
export class PessoaModule {}
