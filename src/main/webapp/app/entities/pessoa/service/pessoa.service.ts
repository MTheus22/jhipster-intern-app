import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import dayjs from 'dayjs/esm';

import { isPresent } from 'app/core/util/operators';
import { DATE_FORMAT } from 'app/config/input.constants';
import { ApplicationConfigService } from 'app/core/config/application-config.service';
import { createRequestOption } from 'app/core/request/request-util';
import { IPessoa, getPessoaIdentifier } from '../pessoa.model';

export type EntityResponseType = HttpResponse<IPessoa>;
export type EntityArrayResponseType = HttpResponse<IPessoa[]>;

@Injectable({ providedIn: 'root' })
export class PessoaService {
  protected resourceUrl = this.applicationConfigService.getEndpointFor('api/pessoas');

  constructor(protected http: HttpClient, protected applicationConfigService: ApplicationConfigService) {}

  create(pessoa: IPessoa): Observable<EntityResponseType> {
    const copy = this.convertDateFromClient(pessoa);
    return this.http
      .post<IPessoa>(this.resourceUrl, copy, { observe: 'response' })
      .pipe(map((res: EntityResponseType) => this.convertDateFromServer(res)));
  }

  update(pessoa: IPessoa): Observable<EntityResponseType> {
    const copy = this.convertDateFromClient(pessoa);
    return this.http
      .put<IPessoa>(`${this.resourceUrl}/${getPessoaIdentifier(pessoa) as number}`, copy, { observe: 'response' })
      .pipe(map((res: EntityResponseType) => this.convertDateFromServer(res)));
  }

  partialUpdate(pessoa: IPessoa): Observable<EntityResponseType> {
    const copy = this.convertDateFromClient(pessoa);
    return this.http
      .patch<IPessoa>(`${this.resourceUrl}/${getPessoaIdentifier(pessoa) as number}`, copy, { observe: 'response' })
      .pipe(map((res: EntityResponseType) => this.convertDateFromServer(res)));
  }

  find(id: number): Observable<EntityResponseType> {
    return this.http
      .get<IPessoa>(`${this.resourceUrl}/${id}`, { observe: 'response' })
      .pipe(map((res: EntityResponseType) => this.convertDateFromServer(res)));
  }

  query(req?: any): Observable<EntityArrayResponseType> {
    const options = createRequestOption(req);
    return this.http
      .get<IPessoa[]>(this.resourceUrl, { params: options, observe: 'response' })
      .pipe(map((res: EntityArrayResponseType) => this.convertDateArrayFromServer(res)));
  }

  delete(id: number): Observable<HttpResponse<{}>> {
    return this.http.delete(`${this.resourceUrl}/${id}`, { observe: 'response' });
  }

  addPessoaToCollectionIfMissing(pessoaCollection: IPessoa[], ...pessoasToCheck: (IPessoa | null | undefined)[]): IPessoa[] {
    const pessoas: IPessoa[] = pessoasToCheck.filter(isPresent);
    if (pessoas.length > 0) {
      const pessoaCollectionIdentifiers = pessoaCollection.map(pessoaItem => getPessoaIdentifier(pessoaItem)!);
      const pessoasToAdd = pessoas.filter(pessoaItem => {
        const pessoaIdentifier = getPessoaIdentifier(pessoaItem);
        if (pessoaIdentifier == null || pessoaCollectionIdentifiers.includes(pessoaIdentifier)) {
          return false;
        }
        pessoaCollectionIdentifiers.push(pessoaIdentifier);
        return true;
      });
      return [...pessoasToAdd, ...pessoaCollection];
    }
    return pessoaCollection;
  }

  protected convertDateFromClient(pessoa: IPessoa): IPessoa {
    return Object.assign({}, pessoa, {
      dataRegistro: pessoa.dataRegistro?.isValid() ? pessoa.dataRegistro.toJSON() : undefined,
      dataNascimento: pessoa.dataNascimento?.isValid() ? pessoa.dataNascimento.format(DATE_FORMAT) : undefined,
      dataExclusao: pessoa.dataExclusao?.isValid() ? pessoa.dataExclusao.toJSON() : undefined,
    });
  }

  protected convertDateFromServer(res: EntityResponseType): EntityResponseType {
    if (res.body) {
      res.body.dataRegistro = res.body.dataRegistro ? dayjs(res.body.dataRegistro) : undefined;
      res.body.dataNascimento = res.body.dataNascimento ? dayjs(res.body.dataNascimento) : undefined;
      res.body.dataExclusao = res.body.dataExclusao ? dayjs(res.body.dataExclusao) : undefined;
    }
    return res;
  }

  protected convertDateArrayFromServer(res: EntityArrayResponseType): EntityArrayResponseType {
    if (res.body) {
      res.body.forEach((pessoa: IPessoa) => {
        pessoa.dataRegistro = pessoa.dataRegistro ? dayjs(pessoa.dataRegistro) : undefined;
        pessoa.dataNascimento = pessoa.dataNascimento ? dayjs(pessoa.dataNascimento) : undefined;
        pessoa.dataExclusao = pessoa.dataExclusao ? dayjs(pessoa.dataExclusao) : undefined;
      });
    }
    return res;
  }
}
