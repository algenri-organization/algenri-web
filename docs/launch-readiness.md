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
- Página de Evolução Digital com abordagem consultiva, sem preços públicos.
- Diagnóstico Digital ALGENRI.
- Formulário de contato com registro do lead.
- Área interna para acompanhamento de interessados.
- Clientes e Projetos.
- Briefings.
- Dossiês com geração por IA, revisão e avanço direto para proposta.
- Propostas Comerciais com IA, edição, versionamento e PDF funcional, embora ainda com refinamento visual pendente.
- Contratos operacionais gerados a partir de proposta aprovada, com visualização, impressão/salvamento em PDF, upload do assinado e avanço do projeto.
- Política de Privacidade/LGPD publicada e vinculada ao consentimento.
- Faturadora de lançamento definida: JM MIND E PERFORMANCE LTDA.
- Roteiro de teste comercial ponta a ponta documentado em `docs/launch-commercial-test.md`.
- Estratégia financeira de lançamento definida com C6 Bank como provedor principal e Cora como alternativa operacional/reserva.
- E-mail comercial `contato@algenri.com.br` ativo como alias do Google Workspace, com recebimento externo e envio como remetente validados.
- Autenticação do e-mail validada em mensagem real recebida no Outlook/Hotmail: SPF=pass, DKIM=pass e DMARC=pass.
- Captação de lead em produção validada: formulário salva, lead aparece na Área Interna e WhatsApp comercial abre corretamente.
- Fluxo comercial fictício validado até contrato, incluindo criação, salvamento e upload do PDF assinado; cobrança permanece operacional/manual no lançamento.
- Deployment de produção validado após os ajustes de SEO/social e responsividade mobile.
- Domínio `algenri.com.br` validado em produção com HTTPS ativo, sem alerta de certificado, e redirecionamento automático de HTTP para HTTPS.

### Pode operar manualmente no lançamento
- Envio da proposta ao cliente por WhatsApp/e-mail utilizando o PDF gerado.
- Negociação e aceite comercial.
- Assinatura do contrato por ferramenta externa ou assinatura convencional.
- Upload do contrato assinado na ALGENRI.
- Cobrança/pagamento via PIX, transferência, boleto ou link de pagamento, sem necessidade de checkout integrado no lançamento.

## Estratégia financeira de lançamento
A JM MIND E PERFORMANCE LTDA será a empresa faturadora da ALGENRI no lançamento.

### Provedor principal
C6 Bank, utilizando os meios já disponíveis na conta PJ para cobrança operacional do lançamento.

### Alternativa/reserva
Cora, mantida como opção complementar para cobranças e contingência operacional.

Meios de recebimento previstos:
- PIX empresarial;
- transferência bancária;
- boleto bancário;
- link de pagamento;
- cartão de crédito quando disponível pelo provedor contratado.

Evoluções financeiras pós-lançamento:
- cobrança recorrente automatizada;
- cartão de crédito com parcelamento do valor global do contrato em número de parcelas equivalente aos meses contratados, quando comercial e tecnicamente adequado;
- PIX Automático para mensalidades e contratos recorrentes;
- conciliação de pagamentos com clientes/projetos;
- registro de cobrança, vencimento, pagamento e inadimplência dentro da Área Interna;
- integração futura com emissão fiscal e/ou provedor financeiro escolhido.

A evolução futura da camada financeira deve considerar taxas, antecipação, parcelamento, recorrência, PIX Automático, boleto, API e integração com a plataforma ALGENRI.

## Dependências externas em andamento
- Template de WhatsApp da Meta em análise. Não bloquear a sequência de lançamento enquanto a aprovação estiver pendente.
- Cadastro/ajuste de CNAEs da JM MIND em andamento com o contador.

## Bloqueadores reais antes da liberação

### P0 — obrigatório
- [x] Validar ponta a ponta a captação de lead em produção: formulário salva, WhatsApp abre corretamente e lead aparece na área interna.
- [x] Confirmar o número oficial de WhatsApp configurado para o contato comercial: +55 42 99127-4684.
- [x] Confirmar que o e-mail contato@algenri.com.br está ativo e sendo monitorado; recebimento externo validado em 06/09/2026.
- [x] Criar e publicar Política de Privacidade/LGPD, pois o site coleta nome, empresa, WhatsApp, e-mail e consentimento.
- [x] Inserir link para Política de Privacidade junto ao consentimento e no rodapé.
- [x] Definir o processo financeiro mínimo de lançamento: PIX, transferência, boleto e link de pagamento, com cartão quando disponível pelo provedor escolhido.
- [x] Definir a empresa faturadora do lançamento: JM MIND E PERFORMANCE LTDA.
- [x] Definir modelo contratual operacional para as primeiras vendas.
- [x] Fazer teste comercial completo com cliente fictício/piloto: lead → briefing/dossiê → proposta → contrato → cobrança operacional/manual → projeto apto a seguir para desenvolvimento. Validados também salvamento e upload do PDF assinado.

**P0 concluído: não há bloqueador funcional interno para iniciar vendas.**

### P1 — recomendado antes ou logo após o lançamento
- [x] Revisar posicionamento comercial e preços de lançamento; página pública sem preços e abordagem consultiva mantida.
- [x] Criar respostas padrão de primeiro atendimento no WhatsApp — `docs/launch-whatsapp-responses.md`.
- [x] Criar checklist interno de qualificação do lead — `docs/launch-lead-qualification.md`.
- [x] Criar checklist de onboarding após fechamento — `docs/launch-onboarding.md`.
- [x] Confirmar domínio e SSL em produção: HTTPS ativo sem alerta de certificado e redirecionamento HTTP → HTTPS validado manualmente em produção.
- [x] Verificar e ajustar responsividade das páginas públicas em celular.
- [x] Selecionar provedor financeiro de lançamento: C6 Bank principal, Cora alternativa/reserva.
- [x] Revisar entregabilidade do e-mail comercial: envio como `contato@algenri.com.br` validado e autenticação confirmada em mensagem real com SPF=pass, DKIM=pass e DMARC=pass.

**P1 concluído: todos os itens recomendados para lançamento foram validados.**

### Ajustes rápidos de apresentação antes da abertura pública
- [x] Remover o link da Área Interna do rodapé público; o acesso interno continua disponível diretamente pela rota autenticada.

## Status final de lançamento
**ALGENRI liberada para vendas.**

O fluxo mínimo de aquisição, atendimento, diagnóstico, proposta, contrato, cobrança operacional e início de projeto está funcional. Os refinamentos restantes são pós-lançamento e não bloqueiam comercialização.

## Pós-lançamento
Todos os refinamentos não bloqueadores ficam na Issue #36 — Backlog pós-liberação para vendas.

## Diretriz
Não adicionar novas funcionalidades complexas antes da liberação, salvo quando forem classificadas como P0. O foco é faturamento inicial e validação real do processo comercial.
