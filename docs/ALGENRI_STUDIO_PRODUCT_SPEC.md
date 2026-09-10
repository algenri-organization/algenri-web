# ALGENRI Studio — Especificação de Produto

## 1. Papel do Studio

O ALGENRI Studio é a central interna de produção multimodal da ALGENRI. Ele pertence ao ALGENRI Lab, mas tem função operacional própria: planejar, gerar, revisar, versionar e organizar ativos criativos com IA.

O Studio **não é o módulo de Marketing**. Marketing define estratégia, calendário, campanhas, distribuição e métricas. O Studio recebe uma demanda criativa e a transforma em um ativo pronto para uso: vídeo, imagem, avatar, voz, roteiro, keyframe ou variação de formato.

## 2. Princípio central: agnóstico de fornecedor

A ALGENRI não deve ficar presa a um único motor. O Studio terá uma camada de provedores para selecionar o serviço mais adequado por tarefa, custo, qualidade, velocidade e disponibilidade.

Provedores priorizados na primeira fase:
- Runway: geração e edição de vídeo/imagem, cenas e movimentos cinematográficos.
- HeyGen: avatares, presenters, voz e recursos associados, quando tecnicamente adequados.
- Kie.ai: camada adicional de acesso a motores criativos e alternativas de custo/qualidade.
- Outros provedores: poderão ser adicionados após benchmark, sem alterar a lógica central do Studio.

As chaves/API secrets nunca devem ser gravadas no código-fonte. Devem usar variáveis de ambiente e rotas server-side.

## 3. Fluxo de produção

1. Criar projeto no Studio.
2. Definir objetivo, formato, duração, público e destino da peça.
3. Construir conceito e roteiro.
4. Dividir em cenas/storyboard.
5. Definir assets de referência, identidade, personagem/avatar, vestimenta e cenário quando aplicável.
6. Definir voz, emoção, velocidade e pronúncias especiais.
7. Escolher motor por etapa, com estimativa de custo/créditos antes da geração.
8. Gerar primeiro keyframe/prova de conceito quando possível antes de gastar créditos com vídeo completo.
9. Gerar cenas/segmentos.
10. Revisar tecnicamente e visualmente.
11. Regerar somente a cena problemática, evitando refazer o vídeo inteiro.
12. Consolidar versão final e registrar histórico, custos e aprendizados.

## 4. Guardrails de custo e créditos

O Studio deve impedir o padrão de tentativa-e-erro caro.

Diretrizes:
- exibir estimativa de custo/créditos antes da execução;
- exigir confirmação para operações de custo relevante;
- preferir preview, still/keyframe ou trecho curto antes da geração completa;
- registrar custo por geração, cena, versão, projeto e provedor;
- permitir teto de orçamento por projeto;
- alertar quando o saldo conhecido do provedor estiver baixo;
- nunca disparar regenerações automáticas pagas sem regra explícita;
- preservar outputs anteriores e permitir comparar versões.

## 5. Projeto multimodal

Cada projeto deve poder conter:
- briefing criativo;
- roteiro e CTA;
- storyboard/cenas;
- prompts base e prompts específicos por provedor;
- imagens/keyframes;
- avatar/personagem autorizado;
- referências de vestimenta e cenário;
- voz/narração;
- dicionário de pronúncia;
- gerações e versões;
- aprovação/reprovação por cena;
- arquivos finais;
- custos/créditos;
- observações e aprendizados.

## 6. Vídeo cinematográfico

Para vídeos cinematográficos, o sistema deve privilegiar uma produção por cenas e não um único prompt monolítico.

Cada cena deve armazenar:
- objetivo narrativo;
- duração prevista;
- enquadramento e movimento de câmera;
- ambiente/cenário;
- personagem/avatar quando houver;
- ação;
- iluminação;
- elementos permitidos/proibidos;
- texto em tela;
- locução;
- prompt técnico;
- motor/modelo selecionado;
- seed/referências quando disponíveis;
- status de revisão.

## 7. Avatar e identidade

Quando for utilizado avatar de pessoa real autorizada, a consistência é requisito. O Studio deve manter referências aprovadas de aparência, vestimenta, cenário, voz e identidade para evitar que a pessoa seja descaracterizada entre gerações.

O fluxo deve permitir também vídeos sem avatar, utilizando apenas voz/narração e cenas cinematográficas.

## 8. Voz e pronúncia

O Studio deve tratar voz como asset independente do vídeo. Deve ser possível manter:
- voz autorizada/selecionada;
- emoção;
- velocidade;
- pausas;
- dicção;
- pronúncias customizadas.

Palavras, siglas e marcas com pronúncia problemática devem ser armazenadas num dicionário reutilizável. Exemplo de necessidade já identificada: controlar a leitura de siglas em português em vez de aceitar a pronúncia automática incorreta do motor.

## 9. Biblioteca

A biblioteca do Studio/Lab deve armazenar ativos reutilizáveis:
- logos e identidades;
- imagens de referência;
- personagens e avatares autorizados;
- vozes;
- cenários;
- roupas/looks aprovados;
- prompts validados;
- templates de roteiro/storyboard;
- efeitos, estilos e referências;
- outputs aprovados.

## 10. Benchmark de provedores

Cada motor deve ser avaliado por:
- qualidade visual;
- aderência ao prompt;
- consistência de personagem;
- qualidade de movimento;
- voz/lip sync quando aplicável;
- velocidade;
- custo/créditos;
- estabilidade da API;
- possibilidade de edição por cena;
- direitos/licenciamento relevantes ao uso comercial.

O resultado do benchmark deve alimentar a recomendação do motor dentro do Studio.

## 11. Aprendizado, cursos e documentação

O desenvolvimento do Studio será acompanhado por aprendizado ativo das ferramentas. Cursos, aulas, tutoriais, documentação dos provedores e testes práticos devem ser convertidos em conhecimento operacional dentro do produto.

O ChatGPT será usado para:
- ajudar a selecionar materiais de estudo quando necessário;
- estudar e resumir aulas/documentação fornecidas pelo usuário;
- transformar conhecimento em checklists, templates, prompts e regras do Studio;
- identificar recursos subutilizados dos provedores;
- comparar o que o curso ensina com a documentação/API atual;
- incorporar técnicas validadas ao playbook interno.

O objetivo não é apenas assistir a cursos, mas transformar cada aprendizado em capacidade reutilizável da plataforma.

## 12. Arquitetura técnica inicial

Camadas previstas:
- Studio UI / projetos;
- serviço de projetos e assets;
- orquestrador de gerações;
- adaptadores por provedor;
- controle de custos/créditos;
- fila/status de jobs assíncronos;
- armazenamento de resultados e metadados;
- webhooks/polling de jobs dos provedores;
- biblioteca e versionamento;
- benchmark/playbook.

Interface conceitual de provedor:
- capabilities();
- estimate(request);
- generate(request);
- getStatus(jobId);
- cancel(jobId), quando suportado;
- normalizeResult();

## 13. Fases

### Fase 1 — Fundação
- shell do Studio;
- projetos;
- fluxo criativo;
- catálogo de provedores;
- custos/créditos;
- playbook/aprendizado.

### Fase 2 — Primeira integração real
- conectar um fluxo de vídeo real com Runway e/ou HeyGen;
- geração por cenas;
- histórico de jobs;
- preview e aprovação.

### Fase 3 — Multimotor
- Kie.ai e provedores adicionais;
- roteamento por capacidade/custo;
- benchmark comparativo.

### Fase 4 — Orquestração inteligente
- recomendação automática de motor;
- reutilização de assets e identidade;
- controle avançado de orçamento;
- montagem de pipelines multimodais completos.

## 14. Regra de escopo

ALGENRI Studio cria. Marketing planeja e distribui.

Uma campanha de Marketing pode originar uma solicitação ao Studio, mas calendário, aquisição, redes sociais, campanhas e métricas permanecem no módulo Marketing. O Studio não deve absorver essas responsabilidades.
