# ALGENRI — Teste Comercial Ponta a Ponta para Liberação de Vendas

## Objetivo
Validar que a ALGENRI consegue concluir uma venda real de forma operacional, mesmo com algumas automações ainda pendentes.

## Cenário de teste
Usar um cliente fictício ou o Projeto Piloto nº 1, sem depender da aprovação do template de WhatsApp da Meta.

## Etapas obrigatórias

### 1. Captação
- Preencher o formulário público de Contato.
- Confirmar que o lead é salvo em `Área Interna > Interessados`.
- Confirmar que o redirecionamento para o número comercial da ALGENRI funciona.
- Se a notificação automática da Meta ainda estiver pendente, registrar isso como dependência externa não bloqueadora.

### 2. Qualificação
- Converter/registrar o interessado como cliente e projeto.
- Registrar necessidade principal, responsável e dados de contato.

### 3. Briefing e diagnóstico
- Criar/enviar briefing aplicável.
- Confirmar recebimento e leitura das respostas.
- Gerar dossiê do projeto quando aplicável.

### 4. Proposta comercial
- Criar proposta vinculada ao cliente/projeto.
- Revisar escopo, exclusões, prazo, investimento e condições de pagamento.
- Gerar PDF.
- Enviar manualmente por e-mail/WhatsApp durante o lançamento.
- Registrar aprovação no sistema.

### 5. Contratação manual temporária
- Utilizar `docs/launch-contract-template.md` como base.
- Preencher dados da JM MIND E PERFORMANCE LTDA e do cliente.
- Vincular expressamente a proposta comercial aprovada.
- Gerar PDF fora do módulo, se necessário.
- Assinar por ferramenta externa ou assinatura convencional.
- Fazer upload do PDF assinado no módulo Contratos.
- Marcar como assinado somente depois do upload.

### 6. Cobrança/faturamento
- Faturadora: JM MIND E PERFORMANCE LTDA.
- CNAEs de tecnologia estão sendo avaliados/incluídos com o contador.
- Definir conta/PIX ou outro meio financeiro usado no lançamento.
- Emitir documento fiscal quando aplicável após regularização cadastral/fiscal.
- Para projetos, usar 50% na contratação e 50% na entrega apenas quando essa condição estiver expressamente prevista na proposta; condições diferentes prevalecem quando negociadas.
- Para mensalidades, usar vencimento e forma de cobrança previstos na proposta.

### 7. Início da execução
- Confirmar pagamento/condição inicial prevista.
- Confirmar contrato assinado.
- Alterar projeto para desenvolvimento quando aplicável.
- Iniciar execução usando o escopo aprovado como fonte de verdade.

## Critério de aprovação
O teste será considerado aprovado quando for possível percorrer as etapas de captação até início da execução sem perda de informação e sem depender de funcionalidade ainda não implementada.

## Dependências que podem permanecer após a liberação
- Template/notificação automática via WhatsApp Meta em análise.
- Geração automática de contrato.
- Assinatura eletrônica integrada.
- Refinamento final do PDF de propostas.
- Gestão avançada da execução.

Esses itens estão classificados como pós-lançamento ou melhoria incremental e não devem bloquear o primeiro faturamento, salvo falha operacional concreta durante o teste.
