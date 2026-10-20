# PMD - Jogo casual de adivinhacao semantica

**Status:** rascunho de descoberta do produto; requer respostas adicionais e aprovacao.

## Visao do produto

Criar um jogo casual de palavras para amigos e familia, com partidas ilimitadas e palpites guiados por proximidade semantica. A experiencia deve ser simples de iniciar, priorizar computador e nao exigir conta no MVP.

## Pesquisa e referencias

### Padroes observados

- **Tentativas com feedback por letra:** Wordle oferece seis chances para acertar uma palavra de cinco letras. A cada tentativa, o feedback reduz a incerteza sobre letras e posicoes. A rodada curta e a regra facil de explicar ajudam a tornar a partida acessivel a novos jogadores.
- **Associacao por categorias:** Connections apresenta um conjunto de palavras que devem ser agrupadas por relacoes comuns. Esse formato mostra como ambiguidades e interpretacoes alternativas podem ser parte do desafio, mas tambem precisam ser cuidadosamente calibradas.
- **Proximidade semantica:** Contexto oferece desafio diario, partidas ilimitadas e jogos anteriores. Esse modelo e a referencia mais proxima da direcao escolhida: explorar palpites e usar proximidade de significado para orientar a proxima tentativa.
- **Planejamento antes da implementacao:** o codelab do Google recomenda separar o PRD (experiencia e requisitos do produto) da especificacao tecnica, identificar casos extremos durante a descoberta e validar a interface no navegador antes da implementacao final.

### Implicacoes para este jogo

1. O feedback semantico precisa ser compreensivel e consistente. Uma indicacao de proximidade pode orientar, mas nao deve parecer arbitraria nem prometer que palavras relacionadas por um unico sentido terao sempre o mesmo comportamento.
2. O repertorio em portugues brasileiro e uma decisao central do produto: definir quais palavras podem ser palpites e quais podem ser respostas, incluindo flexoes, plurais, regionalismos e termos raros. O VOLP da Academia Brasileira de Letras e uma referencia lexical possivel, nao uma decisao automatica sobre o que e divertido ou adequado para o jogo.
3. Se o resultado usar tempo, a regra deve deixar claro quando a contagem comeca e termina. Tempo nao deve penalizar pausas ou acessibilidade, a menos que isso seja uma escolha deliberada do produto.
4. Acessibilidade deve entrar nos requisitos: operacao por teclado, feedback que nao dependa somente de cor e controles confortaveis. A WCAG 2.2 estabelece, entre outros criterios, que a cor nao seja o unico meio de transmitir informacao e define tamanho minimo de alvo de 24 por 24 CSS pixels, com excecoes.
5. O codelab recomenda manter o PRD focado no que a pessoa usuaria faz e percebe; arquitetura, armazenamento e bibliotecas ficam para uma especificacao tecnica posterior.

### Fontes consultadas

- [Google Codelabs: Além do vibe coding para a Web - começar com um plano](https://codelabs.developers.google.com/codelabs/beyond-vibe-coding-for-the-web?hl=pt-br#2)
- [Google Codelabs: design no navegador](https://codelabs.developers.google.com/codelabs/beyond-vibe-coding-for-the-web?hl=pt-br#3)
- [Google Codelabs: escrever uma especificacao](https://codelabs.developers.google.com/codelabs/beyond-vibe-coding-for-the-web?hl=pt-br#4)
- [Wordle - New York Times Games](https://www.nytimes.com/games/wordle/index.html)
- [Connections - New York Times Games](https://www.nytimes.com/games/connections)
- [Contexto](https://contexto.me/)
- [Academia Brasileira de Letras - Busca no vocabulario](https://www.academia.org.br/nossa-lingua/busca-no-vocabulario)
- [W3C WCAG 2.2 - Uso de cor](https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html)
- [W3C WCAG 2.2 - Teclado](https://www.w3.org/WAI/WCAG22/Understanding/keyboard.html)
- [W3C WCAG 2.2 - Tamanho minimo de alvo](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html)

## Decisoes ja informadas

- **Publico:** amigos e familia.
- **Mecanica principal:** palpites orientados por proximidade semantica, no estilo quente/frio.
- **Disponibilidade:** partidas ilimitadas, sem limitar o jogo a um desafio diario.
- **Idioma:** portugues brasileiro.
- **Acentuacao:** aceitar/normalizar acentos para facilitar a digitacao; os detalhes da regra ainda precisam ser confirmados.
- **Competicao:** duelos e ranking ficam para depois do MVP, apesar de terem sido considerados inicialmente.
- **Resultado da partida:** considerar quantidade de palpites e tempo; a formula e o papel exato do tempo ainda estao em aberto.
- **Conteudo ao terminar:** revelar a resposta, sem definicao, exemplo ou curiosidade no MVP.
- **Dispositivo prioritario:** computador.
- **Contas:** nao exigir conta no MVP.

## Escopo inicial proposto

Uma partida individual, iniciada sem cadastro, em que a pessoa envia palpites de palavras em portugues brasileiro e recebe uma indicacao de proximidade semantica em relacao a uma palavra-alvo. O jogo deve permitir iniciar outra partida sem espera por um novo dia. Ao concluir, revela a resposta e apresenta um resultado baseado em palpites e tempo, depois de definidas as regras exatas.

Esta descricao e um resumo das respostas, nao uma especificacao completa. A experiencia web e uma inferencia a confirmar, nao uma decisao explicita ainda.

## Fora do MVP por enquanto

- Duelo em tempo real, ranking e comparacao competitiva entre amigos.
- Cadastro de usuario.
- Desafio diario como unico modo de jogo.
- Definicoes, exemplos de uso ou curiosidades lexicais ao final da rodada.

## Questoes em aberto para fechar o PRD

1. **Feedback semantico:** mostrar uma posicao/ranking numerico, uma escala visual quente-frio, ou ambos? O jogador ve apenas o progresso relativo dos proprios palpites ou tambem uma lista de palpites ordenada?
2. **Fim da rodada:** a pessoa joga ate acertar, tem um limite de palpites, pode pedir dicas, ou pode desistir? O que acontece numa rodada nao resolvida?
3. **Regra de tempo:** o cronometro e necessario para vencer ou serve apenas como estatistica? Deve haver modo sem cronometro?
4. **Dicionario:** aceitar conjugacoes, plurais, nomes proprios, palavras regionais e estrangeirismos? Que palavras devem ser excluidas por serem ofensivas, raras ou pouco familiares?
5. **Palavra-alvo:** como manter variedade e dificuldade justa entre rodadas ilimitadas? Categorias ou niveis de dificuldade fazem parte da primeira versao?
6. **Progresso local:** guardar recordes no mesmo navegador ou cada partida deve ser descartavel? O que acontece se a pagina for fechada durante uma rodada?
7. **Compartilhamento:** embora o duelo tenha sido adiado, compartilhar um resultado sem revelar a palavra faz parte do MVP?
8. **Acessibilidade e uso:** o jogo deve funcionar tambem em celular, e deve oferecer preferencia para alto contraste ou modo para daltonismo desde a primeira versao?

## Criterios de produto a definir

Antes de aprovar o PRD, especificar regras testaveis para validacao de palpites, calculo e apresentacao da proximidade, vitoria/derrota, cronometro, persistencia da partida, resposta a palavras invalidas e comportamento responsivo/acessivel. Estes sao requisitos de experiencia; a solucao tecnica deve ser tratada em documento separado.