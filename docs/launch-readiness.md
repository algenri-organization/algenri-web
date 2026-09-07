# ALGENRI — Prontidão para Vendas

## Objetivo
Liberar a ALGENRI para comercialização o mais rápido possível, sem bloquear o lançamento por refinamentos que podem ser feitos depois.

## Critério de liberação
A ALGENRI será considerada liberada para vendas quando for possível:
1. apresentar claramente os serviços;
2. receber e registrar um interessado;
3. entrar em contato com o interessado;
4. realizar diagnóstico/briefing;
5. criar e entregar proposta comercial;
6. formalizar a contratação de maneira operacional, mesmo que parte do processo ainda seja manual;
7. receber pagamento/faturar por meio operacional definido;
8. iniciar a execução do projeto.

## Estado atual

### Pronto para venda
- Site institucional com posicionamento e soluções.
- Página de planos de evolução.
- Diagnóstico Digital ALGENRI.
- Formulário de contato com registro do lead.
- Área interna para acompanhamento de interessados.
- Clientes e Projetos.
- Briefings.
- Dossiês.
- Propostas Comerciais com IA, edição, versionamento e PDF funcional, embora ainda com refinamento visual pendente.
- Contratos V1 para registro operacional e armazenamento do PDF assinado.
- Política de Privacidade/LGPD publicada e vinculada ao consentimento.
- Faturadora de lançamento definida: JM MIND E PERFORMANCE LTDA.
- Modelo contratual manual temporário documentado em `docs/launch-contract-template.md`.
- Roteiro de teste comercial ponta a ponta documentado em `docs/launch-commercial-test.md`.

### Pode operar manualmente no lançamento
- Envio da proposta ao cliente por WhatsApp/e-mail utilizando o PDF gerado.
- Negociação e aceite comercial.
- Preparação do contrato fora do sistema enquanto o gerador automático não estiver pronto.
- Assinatura do contrato por ferramenta externa ou assinatura convencional.
- Upload do contrato assinado na ALGENRI.
- Cobrança/pagamento via meio financeiro definido pela empresa, sem necessidade de checkout integrado no lançamento.

## Dependências externas em andamento
- Template de WhatsApp da Meta em análise. Não bloquear a sequência de lançamento enquanto a aprovação estiver pendente.
- Cadastro/ajuste de CNAEs da JM MIND em andamento com o contador.

## Bloqueadores reais antes da liberação

### P0 — obrigatório
- [ ] Validar ponta a ponta a captação de lead em produção: formulário salva, WhatsApp abre corretamente e lead aparece na área interna.
- [x] Confirmar o número oficial de WhatsApp configurado para o contato comercial: +55 42 99127-4684.
- [ ] Confirmar que o e-mail contato@algenri.com.br está ativo e sendo monitorado.
- [x] Criar e publicar Política de Privacidade/LGPD, pois o site coleta nome, empresa, WhatsApp, e-mail e consentimento.
- [x] Inserir link para Política de Privacidade junto ao consentimento e no rodapé.
- [ ] Definir o processo financeiro mínimo de lançamento: conta/PIX ou outro meio de recebimento, regra de cobrança e emissão de documento fiscal quando aplicável.
- [x] Definir a empresa faturadora do lançamento: JM MIND E PERFORMANCE LTDA.
- [x] Definir o modelo contratual/manual que será usado nas primeiras vendas até a evolução do módulo de contratos.
- [ ] Fazer um teste comercial completo com um cliente fictício ou piloto: lead → proposta → contrato → pagamento/cobrança → projeto em desenvolvimento.

### P1 — recomendado antes ou logo após o lançamento
- [ ] Revisar textos comerciais e preços definitivos dos planos.
- [ ] Criar respostas padrão de primeiro atendimento no WhatsApp.
- [ ] Criar checklist interno de qualificação do lead.
- [ ] Criar checklist de onboarding após fechamento.
- [ ] Confirmar domínio, SSL, favicon, metadados e compartilhamento social.
- [ ] Verificar responsividade das páginas públicas em celular.

## Pós-lançamento
Todos os refinamentos não bloqueadores ficam na Issue #36 — Backlog pós-liberação para vendas.

## Diretriz
Não adicionar novas funcionalidades complexas antes da liberação, salvo quando forem classificadas como P0. O foco é faturamento inicial e validação real do processo comercial.
