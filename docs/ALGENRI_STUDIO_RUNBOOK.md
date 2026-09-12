# ALGENRI Studio — Runbook de operação e retomada

Atualizado em setembro de 2026.

## Estado atual

O Studio está em estado seguro de pausa. A arquitetura principal está implementada e organizada em módulos independentes. Não é necessário reabrir este histórico de desenvolvimento para retomar o produto.

### Capacidades implementadas

- projetos persistidos em Firestore;
- briefing, storyboard e aprovação por cena;
- continuidade cinematográfica e encadeamento por frame;
- Bíblia Visual estruturada;
- Biblioteca Criativa para assets, personagens, ambientes, presets de marca e templates;
- Biblioteca de Vozes e direção de voz por projeto/cena;
- adaptadores de voz preparados para ElevenLabs e MiniMax;
- roteamento multimotor com política versionada, score e justificativa;
- Runway e Kie.ai como rotas executáveis de vídeo quando configuradas;
- estimativa/dry run antes de geração paga;
- produção por cena e versionamento;
- composição controlada de marca/texto;
- preflight antes da montagem final;
- render final assíncrono e MP4 privado;
- entrega por variantes 9:16, 16:9, 1:1 e 4:5;
- SRT/VTT derivados do storyboard;
- configuração de trilha, ducking e fades;
- dashboard comercial, custos e valor faturável;
- portal externo de aprovação por token;
- governança e trilha de auditoria de roteamento;
- duplicação de projetos como modelo.

## Fluxo operacional recomendado

1. Criar ou duplicar um projeto.
2. Preencher briefing e definir custo/qualidade como prioridade.
3. Configurar continuidade e Bíblia Visual antes do storyboard final.
4. Selecionar perfil de voz e direção de voz, quando aplicável.
5. Aprovar storyboard completo.
6. Calcular roteamento; revisar motor, score, custo e justificativa.
7. Só então confirmar geração paga cena a cena.
8. Aprovar versões ativas.
9. Configurar composição e executar preflight.
10. Renderizar o master final.
11. Configurar entrega, legendas e variantes.
12. Ativar portal do cliente somente quando a peça estiver pronta para revisão externa.
13. Registrar aprovação e arquivar custo real.

## Princípios obrigatórios

- Arquitetura antes de consumir créditos.
- Validar barato antes de renderizar caro.
- Nenhuma regeneração paga automática.
- Reprovação de uma cena não deve invalidar cenas aprovadas.
- Assets de personagem e primeiro frame são conceitos distintos.
- Continuidade estrita deve preservar identidade, ambiente, figurino e regras bloqueadas.
- Prompts, provedores, scores e custos relevantes devem permanecer auditáveis.
- O portal do cliente nunca deve expor custos internos, secrets ou notas internas.

## Autorização

Rotas internas devem exigir usuário interno ALGENRI e validar ownership do projeto. O helper preferencial é:

`lib/studio/project-auth.ts` → `requireStudioProjectOwner()`

Novas rotas de projeto devem reutilizar esse helper em vez de duplicar a checagem manualmente.

## Geração paga

Durante a pausa atual, não executar testes de geração apenas para validar interface ou arquitetura. APIs pagas devem ser usadas somente quando houver uma produção real ou uma validação que exija output do provedor.

A validação ponta a ponta completa continua sendo a etapa de fechamento funcional futura: briefing → storyboard → Bíblia Visual → roteamento → cenas → voz → composição → preflight → render → entrega.

## Retomada futura

Ao retomar o Studio:

1. confirmar build da `main`;
2. revisar secrets no ambiente de produção;
3. verificar saldo/configuração dos provedores desejados;
4. selecionar um projeto real de baixo risco;
5. executar um dry run de roteamento;
6. só depois liberar uma geração paga curta e controlada;
7. registrar o resultado no Playbook/Aprendizados.

## Backlog não bloqueante

Itens que podem evoluir depois sem impedir o uso da arquitetura atual:

- mais adaptadores de vídeo/imagem;
- geração efetiva de voz no pipeline do projeto;
- sincronização automática de duração da cena com áudio final;
- renderização automática das variantes sociais;
- upload visual completo para Biblioteca Criativa;
- métricas comerciais avançadas e margem por cliente;
- regras adicionais de auditoria e retenção;
- benchmark automático de provedores;
- validação real ponta a ponta com consumo controlado de créditos.
