# Testes automatizados

Este documento descreve como executar e manter a bateria automatizada de testes do Jogo de Palavras.

## Requisitos

- Node.js 20 ou superior.
- npm, incluído na instalação do Node.js.

O projeto usa o executor de testes nativo do Node.js (`node:test`) e asserções nativas (`node:assert/strict`); não é necessário instalar dependências de teste.

## Executar localmente

Na raiz do projeto, execute:

```powershell
npm test
```

O comando definido no `package.json` executa `node --test`, que descobre e roda os arquivos `*.test.js` dentro de `tests/`. O servidor dos testes de API é iniciado em uma porta local aleatória e encerrado ao final de cada teste.

Para executar somente uma parte da suíte:

```powershell
node --test tests/game-engine.test.js
node --test tests/server.test.js
```

## O que é verificado

### Motor do jogo (`tests/game-engine.test.js`)

- Normalização de maiúsculas, espaços e acentos da língua portuguesa.
- Cálculo de pontuação, faixa e rótulo de proximidade semântica.
- Rejeição de palavras fora do vocabulário e de alvos que não podem ser resposta.
- Criação de rodadas com alvo explícito ou aleatório.
- Ocultação da resposta antes da vitória e revelação após o acerto.
- Validação de formato, palavra desconhecida e palpite repetido, sem alterar a rodada em caso de erro.
- Bloqueio de palpites depois que a rodada termina.

### API e conteúdo estático (`tests/server.test.js`)

- Criação e consulta de rodadas, com a resposta mantida oculta.
- Conclusão de rodada e bloqueio de novos palpites após a vitória.
- Entrega da página inicial.
- Respostas para rodada inexistente, método não permitido, formato inválido, JSON malformado, corpo acima do limite, palavra desconhecida e palpite duplicado.
- Códigos HTTP e códigos de erro estruturados para esses casos.

## Integração contínua

O workflow `.github/workflows/test.yml` executa `npm test` em cada push e pull request para `main` ou `master`. A execução usa Node.js 20, sem instalar dependências externas. Um resultado com falhas interrompe o workflow e fica visível nos checks do GitHub.

## Como interpretar o resultado

- `# tests`: total de testes executados.
- `# pass`: cenários aprovados.
- `# fail`: cenários que não corresponderam ao comportamento esperado; consulte a mensagem e a localização impressas pelo Node.js.
- `# skipped` ou `# todo`: testes explicitamente ignorados ou marcados como pendentes.

A suíte é aprovada quando o comando termina com código de saída `0` e `# fail` igual a `0`. Execute novamente `npm test` depois de alterar o motor, a API ou as respostas que eles entregam.

## Adicionar ou alterar testes

1. Inclua o cenário no arquivo existente correspondente ao comportamento do motor ou da API.
2. Escreva o teste usando `test()` e valide resultados com `assert/strict`.
3. Prefira entradas e resultados determinísticos; nos testes de alvo aleatório, valide que o alvo pertence ao vocabulário permitido.
4. Execute o arquivo alterado e, antes de concluir, execute `npm test` para verificar a suíte inteira.
