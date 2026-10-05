# Sistema de Gestão de Doações FMP - API Back-end

API Back-end do Projeto Integrador, desenvolvida com Node.js e Express.
Fornece os dados do sistema de doações para o front-end.

## Integrantes do Grupo

- Davi Aravechia
- Eduardo Silva
- Lucas Alexandre Vieira Schutz
- Vitor

## Endpoints da API

| VERBO | ENDPOINT (URL)     | AÇÃO EXECUTADA                                  |
|-------|--------------------|-------------------------------------------------|
| GET   | /                  | Verifica se a API está a funcionar              |
| GET   | /api/doacoes       | Lista todas as doações registadas               |
| GET   | /api/doacoes/:id   | Busca uma doação por ID (retorna 404 se não existir) |
| POST  | /api/doacoes       | Cadastra uma nova doação (retorna 201 se criada)     |

### Exemplo de corpo do POST (JSON)

```json
{
  "doador": "Ana Costa",
  "item": "Agasalho",
  "quantidade": 3
}
