# Prancheta Tática

Sistema web para treinadores de futebol e basquete criarem jogadas táticas animadas e
compartilharem com seus atletas.

**Disciplina:** Engenharia de Software — DCC/UFMG
**Professor:** Marco Tulio Valente
**Trabalho Prático 1 — 2026/2**

---

## Membros e papéis

| Nome completo | Papel |
|---|---|
| *Amanda Silveira Barbosa* | Fullstack |
| *Fabrício Cézar Silva Sobrinho* | Fullstack |
| *Juan Marques Junqueira* | Fullstack |

---

## Objetivo do sistema

Treinadores de times amadores e de base explicam jogadas em quadros brancos ou pranchetas físicas, e o registro se perde assim que o treino acaba. Quem faltou não tem acesso, e atletas com dificuldade de visualização espacial não conseguem reconstruir o movimento a partir de um desenho estático com setas. A Prancheta Tática online surge pra permitir que o treinador posicione jogadores e bola sobre a quadra, desenhe as setas de movimentação e passe, e defina a ordem em que cada movimento acontece. As jogadas ficam salvas e o treinador escolhe quais publicar para o time, que acessa por uma chave compartilhada, sem necessidade de cadastro.

---

## Tecnologias

| Camada | Tecnologia |
|---|---|
| Frontend | React 18, TypeScript, Vite, React Router, Tailwind CSS |
| Renderização | SVG nativo (editor e animação) |
| Backend | Python 3.12, FastAPI, Uvicorn |
| ORM / Validação | SQLAlchemy, Pydantic |
| Banco de dados | SQLite |
| Controle de versão | Git + GitHub |
| Agentes de IA | Antigravity, Claude |

**Justificativa da stack:** o formato JSON da cena é a estrutura central do sistema e
atravessa toda a aplicação. No backend, ele é definido como um modelo Pydantic, que valida
automaticamente toda cena recebida e rejeita payloads malformados antes da persistência.
Esse mesmo modelo gera a especificação OpenAPI da API, permitindo que o frontend seja
desenvolvido em paralelo com o contrato sempre atualizado. O React foi mantido no frontend
porque o editor de jogadas é uma interface interativa de manipulação direta, com arraste de
peças e animação em SVG, para a qual a renderização declarativa orientada a estado é
adequada.

---

## Histórias de usuário

1. **Como treinador**, quero criar um time informando nome e modalidade do esporte e receber duas chaves de acesso, uma minha e uma para distribuir aos atletas, para começar a usar o sistema sem precisar criar conta.

2. **Como treinador**, quero posicionar jogadores dos dois times e a bola sobre a quadra
   arrastando as peças, para montar a situação inicial da jogada.

3. **Como treinador**, quero desenhar setas de movimentação e de passe entre as peças e
   definir a ordem de execução de cada uma, para representar a sequência da jogada.

4. **Como treinador**, quero salvar a jogada com título e descrição e escolher se ela está
   publicada ou em rascunho, para só liberar ao time o que já está pronto.

5. **Como atleta**, quero entrar no sistema colando a chave do meu time e ver a lista de
   jogadas publicadas, para consultar as táticas fora do treino.

6. **Como atleta**, quero assistir à animação da jogada com controles de play, pause e
   reinício, para entender a movimentação que um desenho estático não deixa clara.


---

## Cena da jogada

A cena tem a quadra (`futebol` ou `basquete`), as peças (`id`, `tipo`, `x`, `y`) e as ações
(`id`, `tipo`, `origem`, `destino`, `ordem`). O destino pode ser o `id` de uma peça ou um ponto
livre `{ "x", "y" }`. Os tipos de ação seguem a convenção de prancheta:

| Tipo | Desenho | Animação |
|---|---|---|
| `movimentacao` | linha contínua | a peça de origem se desloca |
| `passe` | linha tracejada | a bola vai da origem ao destino |
| `bloqueio` | linha contínua terminando em barra | a peça se desloca e para no bloqueio |
| `drible` | linha ondulada | a peça se desloca levando a bola |

A `ordem` indica o **instante** da ação: ações com a mesma ordem acontecem ao mesmo tempo, e os
instantes rodam em ordem crescente. Na animação, cada instante dura 1 s. O backend rejeita
cenas em que uma peça faz mais de uma ação no mesmo instante, ou em que mais de uma ação move
a bola no mesmo instante (passe, drible ou movimentação da própria bola).

No basquete a bola tem **posse**: a peça da bola pode ter o campo opcional `posse` com o `id` do
jogador que está com ela (sem o campo, ou `null`, a bola está solta em `x`, `y`). A bola acompanha
quem tem a posse em qualquer deslocamento, só quem tem a posse passa ou dribla, e o passe entrega a
posse ao jogador em cuja área de identificação a ponta da seta cai.

O atleta busca a cena de uma jogada publicada em
`GET /teams/{team_id}/plays/published/{play_id}`, com o header `X-Chave-Atleta`.
`GET /plays/{play_id}` é exclusiva do treinador (header `X-Chave-Treinador`).

---

## Diagramas UML (documentação preliminar)

Rascunhados com apoio de IA a partir do schema e dos endpoints já implementados, e revisados
manualmente antes de entrar no README.

### Diagrama de classes

`Team` e `Play` são entidades persistidas (SQLAlchemy). `Cena`, `Peça`, `Ação` e `PontoDestino`
são o schema Pydantic embutido em `Play.cena_json` — não têm tabela própria.

```mermaid
classDiagram
    class Team {
      +int id
      +string nome
      +string modalidade
      +string chave_treinador
      +string chave_atleta
      +datetime created_at
    }

    class Play {
      +int id
      +int team_id
      +string titulo
      +string descricao
      +string status
      +datetime created_at
      +datetime updated_at
    }

    class Cena {
      +string quadra
      +string visualizacao
      +Peca[] pecas
      +Acao[] acoes
    }

    class Peca {
      +string id
      +string tipo
      +float x
      +float y
      +string posse
    }

    class Acao {
      +string id
      +string tipo
      +string origem
      +int ordem
    }

    class PontoDestino {
      +float x
      +float y
    }

    Team "1" --> "*" Play : possui
    Play "1" *-- "1" Cena : cena_json
    Cena "1" *-- "*" Peca : pecas
    Cena "1" *-- "*" Acao : acoes
    Acao ..> Peca : origem (por id)
    Acao "1" --> "0..1" PontoDestino : destino (quando não é peça)
```

### Diagrama de sequência

Dois fluxos que atravessam os três módulos: o treinador criando o time e salvando uma jogada,
e o atleta acessando com a chave e assistindo a uma jogada publicada.

```mermaid
sequenceDiagram
    actor Treinador
    participant Frontend as Frontend (React)
    participant API as Backend (FastAPI)
    participant DB as Banco (SQLite)

    Treinador->>Frontend: Preenche nome + modalidade
    Frontend->>API: POST /teams
    API->>DB: INSERT Team (gera chave_treinador, chave_atleta)
    DB-->>API: Team criado
    API-->>Frontend: 201 Team (chaves)
    Frontend-->>Treinador: Mostra as chaves e salva chave_treinador no localStorage

    Treinador->>Frontend: Monta peças e setas na quadra
    Treinador->>Frontend: Clica "Salvar jogada"
    Frontend->>API: POST /teams/{id}/plays (header X-Chave-Treinador, body: cena)
    API->>DB: Valida chave_treinador do time
    API->>DB: INSERT Play (cena_json)
    DB-->>API: Play criada
    API-->>Frontend: 201 Play
    Frontend-->>Treinador: Confirma jogada salva
```

```mermaid
sequenceDiagram
    actor Atleta
    participant Frontend as Frontend (React)
    participant API as Backend (FastAPI)
    participant DB as Banco (SQLite)

    Atleta->>Frontend: Cola a chave_atleta
    Frontend->>API: GET /teams/access/{chave_atleta}
    API->>DB: Busca Team por chave_atleta
    DB-->>API: Team
    API-->>Frontend: 200 dados do time
    Frontend-->>Atleta: Salva a chave no localStorage e mostra a lista

    Frontend->>API: GET /teams/{id}/plays/published (header X-Chave-Atleta)
    API->>DB: Busca Plays publicadas do time
    DB-->>API: Lista de jogadas
    API-->>Frontend: 200 lista

    Atleta->>Frontend: Seleciona uma jogada
    Frontend->>API: GET /teams/{id}/plays/published/{play_id} (header X-Chave-Atleta)
    API->>DB: Busca Play publicada e valida a chave
    DB-->>API: Play (cena_json)
    API-->>Frontend: 200 Play
    Frontend-->>Atleta: Anima a jogada (play/pause/reiniciar)
```

---

## Executando o projeto

```bash
# Backend
[A ser preenchido]

# Frontend
[A ser preenchido]
```
