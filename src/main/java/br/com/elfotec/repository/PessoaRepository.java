package br.com.elfotec.repository;

import br.com.elfotec.domain.Pessoa;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * Spring Data SQL repository for the Pessoa entity.
 */
@SuppressWarnings("unused")
@Repository
public interface PessoaRepository extends JpaRepository<Pessoa, Long> {
    /**
     * Busca todas as pessoas ativas (não excluídas logicamente).
     * @param pageable informações de paginação
     * @return página de pessoas ativas
     */
    @Query("SELECT p FROM Pessoa p WHERE p.dataExclusao IS NULL")
    Page<Pessoa> findAllActive(Pageable pageable);

    /**
     * Busca pessoa ativa por ID (não excluída logicamente).
     * @param id o ID da pessoa
     * @return optional da pessoa se estiver ativa
     */
    @Query("SELECT p FROM Pessoa p WHERE p.id = :id AND p.dataExclusao IS NULL")
    Optional<Pessoa> findActiveById(@Param("id") Long id);
}
